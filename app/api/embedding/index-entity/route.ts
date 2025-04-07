import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import * as pineconeService from '@/lib/services/pinecone';
import * as embeddingService from '@/lib/services/embeddings';
import { generateEntityText } from '@/lib/services/entity-text-generator';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle CORS preflight request
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Unified API for indexing any entity type with embeddings
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { type, id, forceRebuild = false } = body;

    // Validate request
    if (!type || !id) {
      return NextResponse.json(
        { error: 'Missing required fields: type and id' },
        { status: 400, headers: corsHeaders }
      );
    }

    const validTypes = ['jetshare_offer', 'flight', 'user', 'crew'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid entity type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize timing metrics for logging
    const startTime = Date.now();
    
    // Connect to services
    const supabase = createClient();
    
    // 1. Generate text representation of the entity
    console.log(`Generating text for ${type}:${id}`);
    const { text, metadata, recordId } = await generateEntityText(supabase, type, id);
    
    // 2. Generate embedding with primary provider (Cohere by default)
    let embedding;
    let provider = 'cohere';
    let success = false;
    let errorMessage = '';
    
    try {
      // Try with primary provider (Cohere)
      console.log(`Generating embedding with Cohere for ${type}:${id}`);
      embedding = await embeddingService.generateEmbedding(text);
      success = true;
    } catch (cohereError) {
      // Log the error
      console.error('Cohere embedding failed, trying OpenAI fallback:', cohereError);
      errorMessage = cohereError instanceof Error ? cohereError.message : 'Unknown error';
      
      // Fall back to OpenAI
      try {
        console.log(`Falling back to OpenAI for embedding ${type}:${id}`);
        embedding = await embeddingService.generateOpenAIEmbedding(text);
        provider = 'openai';
        success = true;
      } catch (openAIError) {
        console.error('OpenAI fallback embedding also failed:', openAIError);
        const finalError = openAIError instanceof Error ? openAIError.message : 'Unknown error';
        errorMessage += ` | OpenAI fallback error: ${finalError}`;
        
        return NextResponse.json(
          { error: `Failed to generate embeddings: ${errorMessage}` },
          { status: 500, headers: corsHeaders }
        );
      }
    }
    
    // 3. Store in Pinecone if embedding was successful
    if (success && embedding) {
      try {
        console.log(`Upserting to Pinecone: ${recordId}`);
        
        // Delete existing record first if forceRebuild is true
        if (forceRebuild) {
          await pineconeService.deleteRecord(recordId);
        }
        
        // Store in Pinecone
        await pineconeService.upsertRecord({
          id: recordId,
          embedding,
          metadata,
        });
      } catch (pineconeError) {
        console.error('Pinecone upsert failed:', pineconeError);
        
        // We'll still consider this a partial success since we generated the embedding
        // but log the error and return a warning
        errorMessage = pineconeError instanceof Error ? pineconeError.message : 'Unknown error';
        
        // Log the embedding operation
        const processingTime = Date.now() - startTime;
        try {
          await logEmbeddingOperation(supabase, {
            provider,
            objectType: type,
            objectId: id,
            success: false, // Mark as failure since Pinecone storage failed
            errorMessage: `Pinecone storage error: ${errorMessage}`,
            characterCount: text.length,
            processingTime
          });
        } catch (logError) {
          console.warn('Failed to log embedding operation:', logError);
        }
        
        return NextResponse.json({
          success: false,
          warning: 'Embedding generated but Pinecone storage failed',
          error: errorMessage
        }, { headers: corsHeaders });
      }
    }
    
    // 4. Log the embedding operation
    const processingTime = Date.now() - startTime;
    try {
      await logEmbeddingOperation(supabase, {
        provider,
        objectType: type,
        objectId: id,
        success,
        errorMessage: success ? '' : errorMessage,
        characterCount: text.length,
        processingTime
      });
    } catch (logError) {
      console.warn('Failed to log embedding operation (non-critical):', logError);
    }
    
    // 5. Return success response
    return NextResponse.json({
      success: true,
      provider,
      recordId,
      processingTime,
      characterCount: text.length,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in index-entity endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process entity for indexing', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Log embedding operation to the embedding_logs table
 */
async function logEmbeddingOperation(
  supabase: any,
  {
    provider,
    objectType,
    objectId,
    success,
    errorMessage = '',
    characterCount = 0,
    processingTime = 0,
    endpoint = 'index-entity'
  }: {
    provider: string;
    objectType: string;
    objectId: string;
    success: boolean;
    errorMessage?: string;
    characterCount?: number;
    processingTime?: number;
    endpoint?: string;
  }
) {
  try {
    await supabase.from('embedding_logs').insert({
      provider,
      input_type: objectType,
      object_type: objectType,
      object_id: objectId,
      success,
      error_message: errorMessage,
      character_count: characterCount,
      processing_time_ms: processingTime,
      endpoint
    });
  } catch (error) {
    console.warn('Failed to log embedding operation to database:', error);
    // Non-critical, so just log the warning
  }
} 