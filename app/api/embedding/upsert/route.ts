import { NextResponse } from 'next/server';
import * as pineconeService from '@/lib/services/pinecone';

/**
 * API endpoint for upserting records to Pinecone
 * This allows browser clients to upsert to Pinecone without using the Node.js SDK directly
 */
export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { id, values, metadata, namespace } = body;
    
    if (!id || !values || !values.length) {
      return NextResponse.json(
        { error: 'Missing required fields: id and values' },
        { status: 400 }
      );
    }
    
    // Create the record for Pinecone
    const record = {
      id,
      values,
      metadata: metadata || {}
    };
    
    // Get the Pinecone index
    const index = await pineconeService.getPineconeIndex();
    
    // Upsert the record
    if (namespace) {
      await index.upsert([record], { namespace });
    } else {
      await index.upsert([record]);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error upserting record to Pinecone:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upsert record',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 