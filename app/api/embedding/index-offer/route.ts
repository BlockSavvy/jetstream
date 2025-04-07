import { NextResponse } from 'next/server';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Legacy API for indexing a JetShare offer with embeddings
 * Forwards to the unified index-entity endpoint
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { offerId, id } = body;
    
    // Validate request
    if (!offerId && !id) {
      return NextResponse.json(
        { error: 'Missing required field: offerId or id' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Determine the offer ID
    const objectId = offerId || id;
    
    // Forward to the unified endpoint
    const origin = request.headers.get('origin') || 'https://jetstream.aiya.sh';
    const forwardResponse = await fetch(`${origin}/api/embedding/index-entity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'jetshare_offer',
        id: objectId
      }),
    });
    
    // Return the same response
    const data = await forwardResponse.json();
    
    return NextResponse.json(data, { 
      status: forwardResponse.status,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Error in index-offer endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to index offer', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500, headers: corsHeaders }
    );
  }
} 