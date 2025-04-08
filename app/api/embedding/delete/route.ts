import { NextResponse } from 'next/server';
import * as pineconeService from '@/lib/services/pinecone';

/**
 * API endpoint for deleting records from Pinecone
 * This allows browser clients to delete from Pinecone without using the Node.js SDK directly
 */
export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { id, namespace } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }
    
    // Get the Pinecone index
    const index = await pineconeService.getPineconeIndex();
    
    // Delete the record
    if (namespace) {
      await index.deleteOne(id, { namespace });
    } else {
      await index.deleteOne(id);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting record from Pinecone:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete record',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 