import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Create the embedding_logs table if it doesn't exist
// Run this one time in your Supabase SQL editor:
/*
CREATE TABLE IF NOT EXISTS embedding_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  provider VARCHAR NOT NULL,
  input_type VARCHAR,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  character_count INTEGER,
  processing_time_ms INTEGER,
  endpoint VARCHAR,
  object_type VARCHAR,
  object_id UUID
);

CREATE INDEX embedding_logs_provider_idx ON embedding_logs(provider);
CREATE INDEX embedding_logs_timestamp_idx ON embedding_logs(timestamp);
CREATE INDEX embedding_logs_success_idx ON embedding_logs(success);
*/

interface EmbeddingLogEntry {
  provider: string;
  input_type?: string;
  success: boolean;
  error_message?: string;
  character_count?: number;
  processing_time_ms?: number;
  endpoint?: string;
  object_type?: string;
  object_id?: string;
}

/**
 * API endpoint to log embedding requests for tracking and analytics
 */
export async function POST(request: Request) {
  try {
    // Parse the request
    const logEntry: EmbeddingLogEntry = await request.json();
    
    if (!logEntry || !logEntry.provider || logEntry.success === undefined) {
      return NextResponse.json(
        { error: 'Invalid log entry. Provider and success status are required.' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Connect to Supabase
    const supabase = createClient();
    
    // Insert the log entry
    const { data, error } = await supabase
      .from('embedding_logs')
      .insert([
        {
          provider: logEntry.provider,
          input_type: logEntry.input_type || 'search_query',
          success: logEntry.success,
          error_message: logEntry.error_message || null,
          character_count: logEntry.character_count || null,
          processing_time_ms: logEntry.processing_time_ms || null,
          endpoint: logEntry.endpoint || null,
          object_type: logEntry.object_type || null,
          object_id: logEntry.object_id || null
        }
      ]);
    
    if (error) {
      console.error('Error logging embedding:', error);
      return NextResponse.json(
        { error: 'Failed to log embedding request' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    return NextResponse.json(
      { success: true, message: 'Embedding log recorded successfully' },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in embedding logging API:', error);
    return NextResponse.json(
      { 
        error: 'Error processing log request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * API to retrieve embedding log statistics
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    
    // Connect to Supabase
    const supabase = createClient();
    
    // Get total counts
    const { data: totalCounts, error: countError } = await supabase
      .from('embedding_logs')
      .select('provider, success', { count: 'exact' })
      .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
    
    if (countError) {
      console.error('Error fetching embedding logs:', countError);
      return NextResponse.json(
        { error: 'Failed to fetch embedding statistics' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Calculate provider usage and success rates
    const stats = {
      totalRequests: totalCounts?.length || 0,
      successRate: totalCounts ? totalCounts.filter(l => l.success).length / totalCounts.length : 0,
      providerUsage: {
        cohere: totalCounts ? totalCounts.filter(l => l.provider === 'cohere').length : 0,
        openai: totalCounts ? totalCounts.filter(l => l.provider === 'openai').length : 0
      },
      fallbackRate: totalCounts ? 
        totalCounts.filter(l => l.provider === 'openai').length / 
        (totalCounts.filter(l => l.provider === 'cohere').length || 1) : 0
    };
    
    return NextResponse.json(stats, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in embedding statistics API:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching embedding statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
} 