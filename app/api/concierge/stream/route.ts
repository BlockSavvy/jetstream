import { NextRequest } from 'next/server';
import { getInferenceClient, Message } from '@/app/lib/ai/AIInferenceClient';
import { createClient } from '@/lib/supabase';

// Helper function to handle streaming
function streamResponse(
  response: ReadableStream,
  controller: ReadableStreamDefaultController,
  encoder = new TextEncoder()
) {
  return {
    onStart: () => {
      // Send start marker
      const startMessage = { type: 'start' };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(startMessage)}\n\n`));
    },
    onToken: (token: string) => {
      // Send each token
      const tokenMessage = { type: 'token', content: token };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(tokenMessage)}\n\n`));
    },
    onComplete: (fullResponse: string) => {
      // Send complete message
      const completeMessage = { type: 'complete', content: fullResponse };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(completeMessage)}\n\n`));
      controller.close();
    },
    onError: (error: Error) => {
      // Send error message
      const errorMessage = { type: 'error', error: error.message };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorMessage)}\n\n`));
      controller.close();
    }
  };
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  // Create a streaming response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Parse the request body
        const { messages, userId, contextData, interactionType } = await request.json();

        // Validate input
        if (!messages || !Array.isArray(messages)) {
          const errorMessage = { type: 'error', error: 'Invalid messages format' };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorMessage)}\n\n`));
          controller.close();
          return;
        }

        // Optional: Store conversation in database if userId is provided
        if (userId) {
          try {
            const supabase = createClient();
            
            // Check if conversation exists - avoiding .single() to prevent 406 errors
            const { data: existingConversations, error: queryError } = await supabase
              .from('concierge_conversations')
              .select('id, messages')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(1);
            
            if (queryError) {
              console.error('Supabase query error:', queryError);
              // Continue with API call even if database operation fails
            } else if (existingConversations && existingConversations.length > 0) {
              // Update existing conversation
              const existingConversation = existingConversations[0];
              const { error: updateError } = await supabase
                .from('concierge_conversations')
                .update({ 
                  messages: messages,
                  interaction_type: interactionType || 'text',
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingConversation.id);
                
              if (updateError) {
                console.error('Error updating conversation:', updateError);
              }
            } else {
              // Create new conversation
              const { error: insertError } = await supabase
                .from('concierge_conversations')
                .insert({
                  user_id: userId,
                  messages: messages,
                  interaction_type: interactionType || 'text',
                  created_at: new Date().toISOString()
                });
                
              if (insertError) {
                console.error('Error creating conversation:', insertError);
              }
            }
          } catch (dbError) {
            console.error('Error storing conversation:', dbError);
            // Continue even if DB operation fails
          }
        }

        // Get the AI inference client
        const client = getInferenceClient();

        // Add contextual system message if provided
        let processedMessages = [...messages];
        if (contextData && processedMessages.length > 0 && processedMessages[0].role === 'system') {
          // Enhance system message with context
          const enhancedSystemContent = `${processedMessages[0].content}\n\nUser Context: ${JSON.stringify(contextData)}`;
          processedMessages[0] = {
            ...processedMessages[0],
            content: enhancedSystemContent
          };
        }

        // Stream completion from the AI model
        await client.streamCompletion(
          processedMessages,
          streamResponse(stream, controller, encoder)
        );
      } catch (error) {
        console.error('Error in streaming concierge API:', error);
        const errorMessage = { type: 'error', error: 'Internal server error' };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorMessage)}\n\n`));
        controller.close();
      }
    }
  });

  // Return the streaming response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    }
  });
}

// Handle CORS preflight request
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*',
    },
  });
} 