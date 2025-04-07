import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Embeds an entity immediately or queues it for embedding
 * This function will attempt direct embedding first, then fall back to queuing if that fails
 * 
 * @param supabase - Supabase client instance
 * @param objectType - Type of entity (jetshare_offer, flight, user, crew)
 * @param objectId - UUID of the entity to embed
 * @param priority - Priority level (1-10, higher is more important)
 * @param baseUrl - Base URL for API calls
 * @returns Object with success status and details
 */
export async function embedEntity(
  supabase: SupabaseClient,
  objectType: 'jetshare_offer' | 'flight' | 'user' | 'crew',
  objectId: string,
  priority: number = 3,
  baseUrl: string = 'https://jetstream.aiya.sh'
): Promise<{
  success: boolean;
  method: 'direct' | 'queued' | 'skipped';
  queueId?: string;
  error?: string;
}> {
  try {
    // 1. Check if already in queue to avoid duplicates
    const { data: existingQueueItem, error: queueCheckError } = await supabase
      .from('embedding_queue')
      .select('id, status')
      .eq('object_id', objectId)
      .eq('object_type', objectType)
      .in('status', ['pending', 'processing'])
      .maybeSingle();
    
    if (!queueCheckError && existingQueueItem) {
      console.log(`Entity ${objectType}:${objectId} already in embedding queue with status ${existingQueueItem.status}`);
      return { 
        success: true, 
        method: 'skipped',
        queueId: existingQueueItem.id 
      };
    }
    
    // 2. Try direct indexing first for immediate visibility
    try {
      const startTime = Date.now();
      
      // Use the unified index-entity endpoint
      const endpoint = `${baseUrl}/api/embedding/index-entity`;
      
      // Make API call to the unified indexing endpoint
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: objectType,
          id: objectId
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Embedding API returned ${response.status}: ${await response.text()}`);
      }
      
      console.log(`Successfully indexed ${objectType}:${objectId} with embeddings`);
      
      // The logging is now handled directly in the index-entity endpoint
      
      return { success: true, method: 'direct' };
    } catch (directIndexError) {
      console.warn(`Direct indexing failed for ${objectType}:${objectId}, falling back to queue:`, directIndexError);
      
      // 3. Add to embedding queue as fallback
      const { data: queueItem, error: queueError } = await supabase
        .from('embedding_queue')
        .insert([{
          object_id: objectId,
          object_type: objectType,
          status: 'pending',
          priority,
          attempts: 0,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (queueError) {
        console.error('Failed to add to embedding queue:', queueError);
        throw queueError;
      }
      
      console.log(`Added ${objectType}:${objectId} to embedding queue for processing`);
      
      // 4. Trigger the processor to start working (fire and forget)
      try {
        await fetch(`${baseUrl}/api/embedding/queue-processor`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ source: 'embed-entity', immediate: true }),
        });
      } catch (processorError) {
        console.warn('Failed to trigger embedding processor (non-critical):', processorError);
        // Continue anyway - the queue will be processed by the scheduled job
      }
      
      return { 
        success: true, 
        method: 'queued',
        queueId: queueItem.id
      };
    }
  } catch (error) {
    console.error(`Error embedding entity ${objectType}:${objectId}:`, error);
    
    // Attempt to add to queue as last resort
    try {
      const { data: queueItem, error: queueError } = await supabase
        .from('embedding_queue')
        .insert([{
          object_id: objectId,
          object_type: objectType,
          status: 'pending',
          priority: priority - 1, // Slightly lower priority as it's a retry
          attempts: 0,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (queueError) {
        throw queueError;
      }
      
      return { 
        success: true, 
        method: 'queued',
        queueId: queueItem.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } catch (finalError) {
      return { 
        success: false, 
        method: 'queued',
        error: `Failed to embed or queue entity: ${finalError instanceof Error ? finalError.message : 'Unknown error'}`
      };
    }
  }
} 