import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import * as embeddingService from '@/lib/services/embeddings';
import * as pineconeService from '@/lib/services/pinecone';
import { generateJetShareOfferText } from '@/lib/services/embeddings';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * API endpoint to immediately index a JetShare offer
 * This ensures that new offers are searchable via vector search without waiting for batch updates
 */
export async function POST(request: Request) {
  try {
    // Parse the request
    const { offerId } = await request.json();
    
    if (!offerId) {
      return NextResponse.json(
        { error: 'Offer ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log(`Starting real-time embedding for JetShare offer ${offerId}`);
    
    // Fetch the offer details from Supabase
    const supabase = createClient();
    const { data: offer, error: offerError } = await supabase
      .from('jetshare_offers')
      .select('*, jets:jet_id(*)')
      .eq('id', offerId)
      .single();
    
    if (offerError || !offer) {
      console.error('Error fetching offer for embedding:', offerError?.message);
      return NextResponse.json(
        { 
          error: 'Failed to fetch offer',
          details: offerError?.message 
        },
        { status: 404, headers: corsHeaders }
      );
    }
    
    // Generate text representation of the offer
    const offerText = generateJetShareOfferText(offer);
    
    // Generate embedding for the offer
    const embedding = await embeddingService.encode(offerText, 'cohere', 'search_document');
    
    if (!embedding) {
      console.error('Failed to generate embedding for offer');
      return NextResponse.json(
        { error: 'Failed to generate embedding' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Prepare record for Pinecone
    const pineconeRecord = {
      id: offerId,
      values: embedding,
      metadata: {
        object_id: offerId,
        object_type: 'jetshare_offer',
        departure_location: offer.departure_location,
        arrival_location: offer.arrival_location,
        flight_date: offer.flight_date,
        departure_time: offer.departure_time,
        available_seats: String(offer.available_seats || 0),
        requested_share_amount: String(offer.requested_share_amount || 0),
        total_flight_cost: String(offer.total_flight_cost || 0),
        has_ai_matching: String(offer.ai_matching || false),
        input_text: offerText,
        created_at: offer.created_at,
      }
    };

    // Get the namespace for JetShare offers
    const namespace = pineconeService.getNamespace('jetshare_offer');
    
    // Upsert the record to Pinecone
    await pineconeService.upsertRecords([pineconeRecord]);
    
    // Also update the offer in Supabase to indicate it's been embedded
    await supabase
      .from('jetshare_offers')
      .update({
        embedding: embedding,
        embedding_updated_at: new Date().toISOString()
      })
      .eq('id', offerId);

    console.log(`Successfully embedded JetShare offer ${offerId}`);
    
    // Return success
    return NextResponse.json(
      { 
        success: true,
        message: 'Offer successfully indexed with embeddings',
        metadata: {
          offerId,
          textLength: offerText.length,
          embeddingDimensions: embedding.length,
          provider: 'cohere'
        }
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error indexing offer:', error);
    
    // Create an embedding queue entry for retry
    try {
      const { offerId } = await request.json();
      if (offerId) {
        const supabase = createClient();
        await supabase
          .from('embedding_queue')
          .insert([{
            object_id: offerId,
            object_type: 'jetshare_offer',
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            attempts: 1,
            created_at: new Date().toISOString()
          }]);
      }
    } catch (queueError) {
      console.error('Failed to add failed embedding to queue:', queueError);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to index offer',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
} 