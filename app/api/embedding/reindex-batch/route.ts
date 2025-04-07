import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

/**
 * Batch reindex endpoint for embedding multiple objects
 * 
 * Used by the AI Concierge to fix inconsistencies between database records and vector index
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    const { object_type, object_ids } = await request.json();
    
    if (!object_type || !object_ids || !Array.isArray(object_ids) || object_ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. Must provide object_type and non-empty object_ids array' },
        { status: 400 }
      );
    }
    
    // Connect to Supabase
    const supabase = createClient();
    
    // Add each object to the embedding queue
    const queuePromises = object_ids.map(async (id) => {
      // Check if already in queue to avoid duplicates
      const { data: existing, error: checkError } = await supabase
        .from('embedding_queue')
        .select('id')
        .eq('object_id', id)
        .eq('object_type', object_type)
        .eq('status', 'pending')
        .maybeSingle();
      
      if (checkError) {
        console.error(`Error checking queue for ${object_type} ${id}:`, checkError);
        return { id, success: false, error: checkError.message };
      }
      
      // Skip if already in queue
      if (existing) {
        return { id, success: true, already_queued: true };
      }
      
      // Add to queue
      const { data, error } = await supabase
        .from('embedding_queue')
        .insert({
          object_id: id,
          object_type,
          status: 'pending',
          priority: 2, // Higher priority for reindexing
          attempts: 0,
          created_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.error(`Error queueing ${object_type} ${id} for embedding:`, error);
        return { id, success: false, error: error.message };
      }
      
      return { id, success: true, queue_id: data[0].id };
    });
    
    // Process all queue operations
    const results = await Promise.all(queuePromises);
    
    // Count successes and failures
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    // Trigger the embedding processor
    try {
      // Call the processor to start working on the queue
      fetch('/api/embedding/queue-processor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source: 'reindex-batch' }),
      });
    } catch (processorError) {
      console.warn('Failed to trigger embedding processor:', processorError);
      // Continue anyway, the processor will run on schedule
    }
    
    // Return results
    return NextResponse.json({
      success: true,
      total: object_ids.length,
      processed: successful,
      failed,
      results,
      message: `Successfully queued ${successful} of ${object_ids.length} ${object_type}s for reindexing`
    });
  } catch (error) {
    console.error('Error in reindex-batch:', error);
    return NextResponse.json(
      { error: 'Failed to process reindexing request', details: (error as Error).message },
      { status: 500 }
    );
  }
} 