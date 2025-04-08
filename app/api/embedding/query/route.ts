import { NextResponse } from 'next/server';
import * as pineconeService from '@/lib/services/pinecone';

/**
 * API endpoint for querying Pinecone
 * This allows browser clients to query Pinecone without using the Node.js SDK directly
 */
export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { vector, filter, topK = 10, includeMetadata = true, namespace } = body;
    
    if (!vector || !vector.length) {
      return NextResponse.json(
        { error: 'Missing required field: vector' },
        { status: 400 }
      );
    }
    
    // Get the Pinecone index
    const index = await pineconeService.getPineconeIndex();
    
    // Build the query options
    const queryOptions: any = {
      vector,
      topK,
      includeMetadata
    };
    
    // Add optional parameters
    if (filter) {
      queryOptions.filter = filter;
    }
    
    if (namespace) {
      queryOptions.namespace = namespace;
    }
    
    // Query Pinecone
    const results = await index.query(queryOptions);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error querying Pinecone:', error);
    return NextResponse.json(
      { 
        error: 'Failed to query Pinecone',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 