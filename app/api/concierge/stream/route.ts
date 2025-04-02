import { NextRequest } from 'next/server';
import { getInferenceClient, Message } from '@/app/lib/ai/AIInferenceClient';
import { createClient } from '@/lib/supabase';

// Format flight data for AI context
function formatFlightForContext(flight: any) {
  return {
    id: flight.id,
    departure: flight.departure,
    arrival: flight.arrival,
    date: new Date(flight.flight_date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }),
    time: new Date(flight.flight_date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    jet_type: flight.jet_type || 'Not specified',
    total_cost: flight.total_cost,
    formatted_cost: flight.total_cost ? 
      new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(flight.total_cost) : 
      'Not specified',
    share_amount: flight.share_amount || 'Not specified',
    status: flight.status || 'open'
  };
}

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
              // Create new conversation - use upsert to handle RLS better
              const { error: insertError } = await supabase
                .from('concierge_conversations')
                .upsert({
                  user_id: userId,
                  messages: messages,
                  interaction_type: interactionType || 'text',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
                
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
        
        // If no flights data is provided, fetch it directly
        let enhancedContextData = { ...contextData };
        
        if (userId && (!contextData?.recentFlights || contextData.recentFlights.length === 0)) {
          try {
            const supabase = createClient();
            
            // Get user's offers
            const { data: userOffers, error: userOffersError } = await supabase
              .from('jetshare_offers')
              .select('*')
              .eq('user_id', userId)
              .order('flight_date', { ascending: true })
              .limit(5);
              
            if (!userOffersError && userOffers) {
              enhancedContextData.userOffers = userOffers.map(formatFlightForContext);
            }
            
            // Get marketplace offers
            const { data: marketplaceOffers, error: marketplaceOffersError } = await supabase
              .from('jetshare_offers')
              .select('*')
              .eq('status', 'open')
              .order('flight_date', { ascending: true })
              .limit(10);
              
            if (!marketplaceOffersError && marketplaceOffers) {
              enhancedContextData.marketplaceOffers = marketplaceOffers.map(formatFlightForContext);
            }
          } catch (error) {
            console.error('Error fetching flight data:', error);
            // Continue without flight data if fetch fails
          }
        } else if (contextData?.recentFlights) {
          // Format the provided flight data
          enhancedContextData.recentFlights = contextData.recentFlights.map(formatFlightForContext);
        }

        // Add contextual system message if provided
        let processedMessages = [...messages];
        if (processedMessages.length > 0 && processedMessages[0].role === 'system') {
          // Format context data for better AI processing
          let contextString = '';
          
          if (enhancedContextData) {
            if (enhancedContextData.userId) {
              contextString += `\nUser ID: ${enhancedContextData.userId}`;
            }
            
            if (enhancedContextData.email) {
              contextString += `\nUser Email: ${enhancedContextData.email}`;
            }
            
            // Add explicit instruction about flights
            const hasFlights = (enhancedContextData.marketplaceOffers?.length > 0 || 
                              enhancedContextData.userOffers?.length > 0 || 
                              enhancedContextData.recentFlights?.length > 0);
            
            if (!hasFlights) {
              contextString += '\n\n==IMPORTANT INSTRUCTION==\nThere are NO available flights in the database currently. DO NOT make up or invent flights in your responses. If a user asks about flights, clearly state that there are no matching flights currently available in our listings.';
            } else {
              contextString += '\n\n==IMPORTANT INSTRUCTION==\nYou must ONLY reference the flights listed below. DO NOT make up or invent additional fictional flights.';
            }
            
            // Format marketplace offers
            if (enhancedContextData.marketplaceOffers?.length > 0) {
              contextString += '\n\n==CURRENT JETSHARE MARKETPLACE OFFERS==';
              enhancedContextData.marketplaceOffers.forEach((offer: any, index: number) => {
                contextString += `\n${index + 1}. ID: ${offer.id} | ${offer.departure} to ${offer.arrival} on ${offer.date} at ${offer.time}, ${offer.jet_type}, ${offer.formatted_cost}, Sharing: ${offer.share_amount}`;
              });
            } else {
              contextString += '\n\nThere are no marketplace offers currently available.';
            }
            
            // Format user's own offers
            if (enhancedContextData.userOffers?.length > 0) {
              contextString += '\n\n==USER\'S ACTIVE JETSHARE OFFERS==';
              enhancedContextData.userOffers.forEach((offer: any, index: number) => {
                contextString += `\n${index + 1}. ID: ${offer.id} | ${offer.departure} to ${offer.arrival} on ${offer.date} at ${offer.time}, ${offer.jet_type}, ${offer.formatted_cost}, Sharing: ${offer.share_amount}`;
              });
            } else {
              contextString += '\n\nThe user has no active offers.';
            }
            
            // Format user's recent flights if provided
            if (enhancedContextData.recentFlights?.length > 0) {
              contextString += '\n\n==RECENTLY VIEWED FLIGHT OPTIONS==';
              enhancedContextData.recentFlights.forEach((flight: any, index: number) => {
                contextString += `\n${index + 1}. ID: ${flight.id} | ${flight.departure} to ${flight.arrival} on ${flight.date} at ${flight.time}, ${flight.jet_type}, ${flight.formatted_cost}, Sharing: ${flight.share_amount}`;
              });
            } else {
              contextString += '\n\nNo recently viewed flights.';
            }
            
            // Add specific flight note if provided
            if (enhancedContextData.flightContextNote) {
              contextString += `\n\n==FLIGHT AVAILABILITY NOTE==\n${enhancedContextData.flightContextNote}`;
            }
          }
          
          // Enhance system message with context
          const enhancedSystemContent = `${processedMessages[0].content}${contextString ? `\n\n-----\nReal-time Context Data: ${contextString}\n-----` : ''}`;
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