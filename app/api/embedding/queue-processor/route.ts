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

// Maximum number of retry attempts
const MAX_RETRIES = 5;

// Calculate backoff time based on attempt number (exponential backoff)
function calculateBackoffTime(attemptNumber: number): number {
  // Base delay of 5 minutes (in milliseconds)
  const baseDelay = 5 * 60 * 1000;
  // Exponential factor (2^attempt - 1) * baseDelay, capped at 24 hours
  return Math.min(Math.pow(2, attemptNumber - 1) * baseDelay, 24 * 60 * 60 * 1000);
}

// Log embedding operation to embedding_logs table
async function logEmbeddingOperation(
  supabase: any,
  {
    objectType,
    objectId,
    status,
    errorMessage = null,
    processingTime = null,
    tokenCount = null,
    provider = 'cohere',
    inputType = 'search_document'
  }: {
    objectType: string;
    objectId: string;
    status: 'success' | 'error';
    errorMessage?: string | null;
    processingTime?: number | null;
    tokenCount?: number | null;
    provider?: string;
    inputType?: string;
  }
) {
  try {
    // Check if embedding_logs table exists and has the necessary columns
    const { data: columnsData, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'embedding_logs' });
    
    if (columnsError) {
      console.error('Error checking embedding_logs table schema:', columnsError);
      return false;
    }
    
    // Map of column names that should exist
    const columnsMap = {
      provider: false,
      input_type: false,
      success: false,
      error_message: false,
      processing_time_ms: false,
      object_type: false,
      object_id: false,
      character_count: false
    };
    
    // Check which columns exist
    columnsData.forEach((col: { column_name: string }) => {
      if (columnsMap.hasOwnProperty(col.column_name)) {
        columnsMap[col.column_name as keyof typeof columnsMap] = true;
      }
    });
    
    // Insert record with available columns only
    const insertData: Record<string, any> = {};
    
    if (columnsMap.provider) insertData.provider = provider;
    if (columnsMap.input_type) insertData.input_type = inputType;
    if (columnsMap.success) insertData.success = status === 'success';
    if (columnsMap.error_message && errorMessage) insertData.error_message = errorMessage;
    if (columnsMap.processing_time_ms && processingTime) insertData.processing_time_ms = processingTime;
    if (columnsMap.object_type) insertData.object_type = objectType;
    if (columnsMap.object_id) insertData.object_id = objectId;
    if (columnsMap.character_count && tokenCount) insertData.character_count = tokenCount;
    
    const { error: logError } = await supabase
      .from('embedding_logs')
      .insert([insertData]);
    
    if (logError) {
      console.error('Error logging embedding operation:', logError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in logEmbeddingOperation:', error);
    return false;
  }
}

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
    // Parse request body
    const body = await request.json();
    const { batchSize = 10, immediate = false, source = 'scheduler' } = body;
    
    // Connect to Supabase
    const supabase = createClient();
    
    // Track processed items for reporting
    const processedResults: Array<{
      id: string;
      objectId: string;
      objectType: string;
      status: string;
      processingTime: number;
      provider: string;
    }> = [];
    
    // Processing functions
    const startTime = Date.now();
    
    // Get pending items from the queue with exponential backoff consideration
    const now = new Date();
    
    const { data: queueItems, error: queueError } = await supabase
      .from('embedding_queue')
      .select('*')
      .or(`status.eq.pending,and(status.eq.failed,attempts.lt.${MAX_RETRIES})`)
      .or(`last_attempted_at.is.null,last_attempted_at.lt."${new Date(now.getTime() - 60000).toISOString()}"`)
      .order('priority', { ascending: false }) // Higher priority first
      .order('created_at', { ascending: true }) // Then oldest first
      .limit(batchSize);
    
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
    
    // Filter items that need backoff (failed items that haven't waited long enough)
    const eligibleItems = queueItems.filter(item => {
      if (item.status !== 'failed' || item.attempts === 0) {
        return true; // New or pending items are always eligible
      }
      
      // Calculate next attempt time with exponential backoff
      if (!item.last_attempted_at) {
        return true;
      }
      
      const lastAttempt = new Date(item.last_attempted_at);
      const backoffMs = calculateBackoffTime(item.attempts);
      const nextAttemptTime = new Date(lastAttempt.getTime() + backoffMs);
      
      // If current time is past the next attempt time, it's eligible
      return now >= nextAttemptTime;
    });
    
    console.log(`${eligibleItems.length} of ${queueItems.length} items eligible for processing after backoff`);
    
    // Process each eligible queue item
    const results = await Promise.all(eligibleItems.map(async (item) => {
      const itemStartTime = Date.now();
      
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
        // Use the unified index-entity endpoint
        const response = await fetch(`${request.headers.get('origin') || 'https://jetstream.aiya.sh'}/api/embedding/index-entity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: item.object_type,
            id: item.object_id
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to index entity: ${response.status} - ${errorText}`);
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
          
        // Calculate processing time
        const processingTime = Date.now() - itemStartTime;
        
        // Log processing result
        console.log(`Processing result for ${item.id}:`, {
          success: true,
          objectType: item.object_type,
          objectId: item.object_id,
          processingTime
        });

        // Update stats
        processedResults.push({
          id: item.id,
          objectId: item.object_id,
          objectType: item.object_type,
          status: 'success',
          processingTime,
          provider: 'unified'
        });
        
        // Log to embedding_logs for history
        try {
          await supabase.from('embedding_logs').insert({
            object_id: item.object_id,
            object_type: item.object_type,
            input_type: item.object_type,
            success: true,
            processing_time_ms: processingTime,
            provider: 'unified'
          });
        } catch (logError) {
          console.warn('Failed to log embedding operation (non-critical):', logError);
        }
        
        return { 
          id: item.id, 
          object_id: item.object_id,
          object_type: item.object_type,
          success: true,
          processing_time_ms: processingTime,
          provider: 'unified'
        };
      } catch (error) {
        console.error(`Error processing queue item ${item.id}:`, error);
        
        // Calculate processing time even for errors
        const processingTime = Date.now() - itemStartTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Update with error
        await supabase
          .from('embedding_queue')
          .update({
            status: 'failed',
            error_message: errorMessage
          })
          .eq('id', item.id);
        
        // Log error to embedding_logs
        await logEmbeddingOperation(supabase, {
          objectType: item.object_type,
          objectId: item.object_id,
          status: 'error',
          errorMessage,
          processingTime
        });
          
        // Log error
        return { 
          id: item.id, 
          object_id: item.object_id,
          object_type: item.object_type,
          success: false,
          error: errorMessage,
          processing_time_ms: processingTime,
          attempt: item.attempts + 1,
          next_attempt_after_ms: calculateBackoffTime(item.attempts + 1)
        };
      }
    }));
    
    // Calculate success rate
    const successCount = results.filter(r => r.success).length;
    const totalProcessingTime = Date.now() - startTime;
    
    return NextResponse.json({
      message: `Processed ${results.length} queue items`,
      success_count: successCount,
      failure_count: results.length - successCount,
      success_rate: successCount / results.length,
      total_processing_time_ms: totalProcessingTime,
      average_item_processing_time_ms: totalProcessingTime / results.length,
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