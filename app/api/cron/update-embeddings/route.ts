import { NextResponse } from 'next/server';

/**
 * Vercel Cron Job: Update Embeddings
 * Runs every 15 minutes to process the embedding queue
 */
export async function GET(request: Request) {
  console.log(`[${new Date().toISOString()}] Cron job: update-embeddings triggered`);
  
  try {
    // Get the base URL from the request or use a default
    const baseUrl = request.headers.get('x-forwarded-host') 
      ? `https://${request.headers.get('x-forwarded-host')}`
      : 'https://jetstream.aiya.sh';
    
    // Call the queue processor to process pending embeddings
    const processorResponse = await fetch(`${baseUrl}/api/embedding/queue-processor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        source: 'cron',
        batchSize: 25 // Process 25 items per job
      }),
    });
    
    if (!processorResponse.ok) {
      const errorText = await processorResponse.text();
      throw new Error(`Queue processor failed: ${processorResponse.status} - ${errorText}`);
    }
    
    const result = await processorResponse.json();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      cron_job: 'update-embeddings',
      processor_result: result
    });
  } catch (error) {
    console.error('Error in embedding cron job:', error);
    
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      cron_job: 'update-embeddings',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 