import { NextRequest, NextResponse } from 'next/server';
import { getPineconeClient } from '@/lib/services/pinecone';
import { getCohereEmbeddings } from '@/lib/services/embeddings';
import { CohereEmbeddings } from '@langchain/cohere';

/**
 * Test endpoint to verify that Pinecone and Cohere are working correctly
 */
export async function GET(req: NextRequest) {
  try {
    const indexName = process.env.PINECONE_INDEX_NAME || 'jetstream';
    
    // Get the Pinecone client
    const pinecone = await getPineconeClient();
    
    // Correctly await the client, then call listIndexes
    const indexList = await pinecone.listIndexes();
    
    if (!indexList?.indexes?.length) {
      return NextResponse.json({ 
        error: 'No indexes found in Pinecone account' 
      }, { status: 404 });
    }
    
    // Correctly retrieve the index after awaiting the client
    const index = pinecone.index(indexName);
    
    // Get stats about the index
    const stats = await index.describeIndexStats();
    
    // Test Cohere embeddings
    let cohereEmbeddings: CohereEmbeddings;
    let embeddings: number[] = [];
    
    try {
      cohereEmbeddings = getCohereEmbeddings();
      const result = await cohereEmbeddings.embedDocuments([
        'Testing Cohere embeddings for JetStream AI matching service'
      ]);
      embeddings = result[0];
      console.log(`Successfully generated embeddings of length: ${embeddings.length}`);
    } catch (cohereError) {
      console.error('Error with Cohere embeddings:', cohereError);
      return NextResponse.json({
        pineconeStatus: 'Success',
        cohereStatus: 'Error',
        pineconeIndices: indexList,
        indexStats: stats,
        cohereError
      });
    }
    
    // Test Pinecone upsert with Cohere embeddings
    const testVector = {
      id: `test-vector-${Date.now()}`,
      values: embeddings,
      metadata: {
        text: 'This is a test vector to verify Pinecone and Cohere integration',
        type: 'test'
      }
    };
    
    try {
      await index.upsert([testVector]);
      console.log('Successfully upserted test vector to Pinecone');
    } catch (upsertError) {
      console.error('Error upserting to Pinecone:', upsertError);
      return NextResponse.json({
        pineconeStatus: 'Connected but upsert failed',
        cohereStatus: 'Success',
        pineconeIndices: indexList,
        indexStats: stats,
        embeddingLength: embeddings.length,
        upsertError
      });
    }
    
    // Test Pinecone query with the same embedding
    try {
      const queryResult = await index.query({
        vector: embeddings,
        topK: 1,
        includeMetadata: true
      });
      console.log('Query result:', queryResult);
      
      return NextResponse.json({
        status: 'Success',
        pineconeIndices: indexList,
        indexStats: stats,
        embeddingLength: embeddings.length,
        queryResult
      });
    } catch (queryError) {
      console.error('Error querying Pinecone:', queryError);
      return NextResponse.json({
        pineconeStatus: 'Connected but query failed',
        cohereStatus: 'Success',
        pineconeIndices: indexList,
        indexStats: stats,
        embeddingLength: embeddings.length,
        queryError
      });
    }
    
  } catch (error: any) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 