import { NextRequest, NextResponse } from 'next/server';
import { getInferenceClient, Message } from '@/app/lib/ai/AIInferenceClient';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { messages, userId, contextData } = await request.json();

    // Validate input
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Optional: Store conversation in database if userId is provided
    if (userId) {
      try {
        const supabase = createClient();
        
        // Check if conversation exists
        const { data: existingConversation } = await supabase
          .from('concierge_conversations')
          .select('id, messages')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (existingConversation) {
          // Update existing conversation
          await supabase
            .from('concierge_conversations')
            .update({ 
              messages: messages,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingConversation.id);
        } else {
          // Create new conversation
          await supabase
            .from('concierge_conversations')
            .insert({
              user_id: userId,
              messages: messages,
              created_at: new Date().toISOString()
            });
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

    // Get completion from the AI model
    const completion = await client.getCompletion(processedMessages);

    // Return the response
    return NextResponse.json({ completion });
  } catch (error) {
    console.error('Error in concierge API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Streaming API endpoint
export async function OPTIONS(request: NextRequest) {
  // Handle CORS preflight request
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*',
    },
  });
} 