import { NextRequest } from 'next/server';
import { getInferenceClient, Message } from '@/app/lib/ai/AIInferenceClient';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { 
      messages, 
      userId, 
      contextData,
      interactionType = 'text' // Add interactionType with default value
    } = await request.json();

    // Validate input
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
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

    // Get completion from the AI model
    const result = await client.getCompletion(processedMessages);

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
              messages: [...messages, { role: 'assistant', content: result.content }],
              interaction_type: interactionType,
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
              messages: [...messages, { role: 'assistant', content: result.content }],
              interaction_type: interactionType,
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

    // Return the AI response
    return new Response(
      JSON.stringify({
        content: result.content,
        functionCall: result.functionCall
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in concierge API:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Streaming API endpoint
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