import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import * as embeddingService from '@/lib/services/embeddings';
import * as pineconeService from '@/lib/services/pinecone';
import { generateJetShareOfferText, generateFlightText, generateUserProfileText } from '@/lib/services/embeddings';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Create the embedding_queue table if it doesn't exist
// Run this one time in your Supabase SQL editor:
/*
CREATE TABLE IF NOT EXISTS embedding_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  object_id UUID NOT NULL,
  object_type VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending',
  error_message TEXT,
  attempts INT NOT NULL DEFAULT 0,
  last_attempted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX embedding_queue_status_idx ON embedding_queue(status);
CREATE INDEX embedding_queue_object_type_idx ON embedding_queue(object_type);
CREATE INDEX embedding_queue_created_at_idx ON embedding_queue(created_at);
*/

/**
 * API endpoint to process the embedding queue
 * This can be called manually or scheduled via a cron job
 */
export async function POST(request: Request) {
  try {
    // Set processing limit
    const MAX_PROCESSING_COUNT = 50;
    
    // Connect to Supabase
    const supabase = createClient();
    
    // Get pending items from the queue
    const { data: queueItems, error: queueError } = await supabase
      .from('embedding_queue')
      .select('*')
      .in('status', ['pending', 'failed'])
      .lt('attempts', 5) // Only retry up to 5 times
      .order('created_at', { ascending: true })
      .limit(MAX_PROCESSING_COUNT);
    
    if (queueError) {
      console.error('Error fetching embedding queue:', queueError);
      return NextResponse.json(
        { error: 'Failed to fetch embedding queue' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    if (!queueItems || queueItems.length === 0) {
      return NextResponse.json(
        { message: 'No items in the embedding queue', items_processed: 0 },
        { headers: corsHeaders }
      );
    }
    
    console.log(`Processing ${queueItems.length} items from the embedding queue`);
    
    // Process each queue item
    const results = await Promise.all(queueItems.map(async (item) => {
      // Update attempt count
      await supabase
        .from('embedding_queue')
        .update({
          attempts: item.attempts + 1,
          status: 'processing',
          last_attempted_at: new Date().toISOString()
        })
        .eq('id', item.id);
      
      try {
        // Fetch the object based on type
        let entity;
        let entityText = '';
        
        switch (item.object_type) {
          case 'jetshare_offer':
            const { data: offer } = await supabase
              .from('jetshare_offers')
              .select('*, jets:jet_id(*)')
              .eq('id', item.object_id)
              .single();
              
            entity = offer;
            if (entity) {
              entityText = generateJetShareOfferText(entity);
            }
            break;
            
          case 'flight':
            const { data: flight } = await supabase
              .from('flights')
              .select('*, jets:jet_id(*)')
              .eq('id', item.object_id)
              .single();
              
            entity = flight;
            if (entity) {
              entityText = generateFlightText(entity);
            }
            break;
            
          case 'user':
            const { data: user } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', item.object_id)
              .single();
              
            entity = user;
            if (entity) {
              entityText = generateUserProfileText(entity);
            }
            break;
            
          default:
            throw new Error(`Unsupported object type: ${item.object_type}`);
        }
        
        if (!entity) {
          throw new Error(`Entity not found: ${item.object_type} ${item.object_id}`);
        }
        
        // Generate embedding
        const embedding = await embeddingService.encode(entityText, 'cohere', 'search_document');
        
        // Prepare Pinecone record
        const namespace = pineconeService.getNamespace(item.object_type);
        const pineconeRecord = embeddingService.preparePineconeRecord(
          item.object_id,
          embedding,
          item.object_type,
          entity,
          entityText
        );
        
        // Upsert to Pinecone
        await pineconeService.upsertRecords([pineconeRecord]);
        
        // Store embedding in database if appropriate
        if (item.object_type === 'jetshare_offer') {
          await supabase
            .from('jetshare_offers')
            .update({
              embedding: embedding,
              embedding_updated_at: new Date().toISOString()
            })
            .eq('id', item.object_id);
        }
        
        // Mark as processed
        await supabase
          .from('embedding_queue')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            error_message: null
          })
          .eq('id', item.id);
          
        // Log success
        return { 
          id: item.id, 
          object_id: item.object_id,
          object_type: item.object_type,
          success: true 
        };
      } catch (error) {
        console.error(`Error processing queue item ${item.id}:`, error);
        
        // Update with error
        await supabase
          .from('embedding_queue')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', item.id);
          
        // Log error
        return { 
          id: item.id, 
          object_id: item.object_id,
          object_type: item.object_type,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }));
    
    // Calculate success rate
    const successCount = results.filter(r => r.success).length;
    
    return NextResponse.json({
      message: `Processed ${results.length} queue items`,
      success_count: successCount,
      failure_count: results.length - successCount,
      success_rate: successCount / results.length,
      results
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in queue processor:', error);
    return NextResponse.json(
      { 
        error: 'Error processing embedding queue',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
} 