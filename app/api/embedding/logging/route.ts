import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

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

// Add column types interfaces for type safety
interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: boolean;
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
    
    // Connect to Supabase - must await the client
    const supabase = await createClient();
    
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
    
    // Connect to Supabase - must await the client
    const supabase = await createClient();
    
    try {
      // First check if embedding_logs table exists
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'embedding_logs');
      
      if (tablesError) {
        console.error('Error checking tables:', tablesError);
        return NextResponse.json(
          { 
            totalRequests: 0,
            successRate: 0,
            providerUsage: { cohere: 0, openai: 0, unknown: 0 },
            fallbackRate: 0,
            error: 'Table check failed'
          },
          { headers: corsHeaders }
        );
      }
      
      // If embedding_logs table doesn't exist yet, return empty stats
      if (!tables || tables.length === 0) {
        console.log('The embedding_logs table does not exist yet');
        return NextResponse.json(
          { 
            totalRequests: 0,
            successRate: 0,
            providerUsage: { cohere: 0, openai: 0, unknown: 0 },
            fallbackRate: 0,
            note: 'No embedding logs table exists yet'
          },
          { headers: corsHeaders }
        );
      }
      
      // Get columns to adapt query
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_schema', 'public')
        .eq('table_name', 'embedding_logs');
        
      if (columnsError) {
        console.error('Error checking table schema:', columnsError);
        return NextResponse.json(
          { 
            totalRequests: 0,
            successRate: 0,
            providerUsage: { cohere: 0, openai: 0, unknown: 0 },
            fallbackRate: 0,
            error: 'Schema check failed'
          },
          { headers: corsHeaders }
        );
      }
      
      // Check which columns exist to adapt our query
      const columnNames = columns.map(col => col.column_name);
      const hasProviderColumn = columnNames.includes('provider');
      const hasEmbeddingModelColumn = columnNames.includes('embedding_model');
      const hasSuccessColumn = columnNames.includes('success');
      
      // Fetch logs using the right column names
      let query = supabase
        .from('embedding_logs')
        .select('*')
        .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
      
      const { data: logs, error: logsError } = await query;
      
      if (logsError) {
        console.error('Error fetching embedding logs:', logsError);
        return NextResponse.json(
          { 
            totalRequests: 0,
            successRate: 0,
            providerUsage: { cohere: 0, openai: 0, unknown: 0 },
            fallbackRate: 0,
            error: 'Failed to fetch logs'
          },
          { headers: corsHeaders }
        );
      }
      
      // Calculate stats
      const totalRequests = logs?.length || 0;
      let successCount = 0;
      let cohereCount = 0;
      let openaiCount = 0;
      
      if (logs && logs.length > 0) {
        // Count success based on 'success' column if exists
        if (hasSuccessColumn) {
          successCount = logs.filter(l => l.success).length;
        } else {
          successCount = logs.filter(l => !l.error_message).length;
        }
        
        // Count provider usage based on available columns
        if (hasProviderColumn) {
          cohereCount = logs.filter(l => l.provider?.toLowerCase().includes('cohere')).length;
          openaiCount = logs.filter(l => l.provider?.toLowerCase().includes('openai')).length;
        } else if (hasEmbeddingModelColumn) {
          cohereCount = logs.filter(l => l.embedding_model?.toLowerCase().includes('cohere')).length;
          openaiCount = logs.filter(l => l.embedding_model?.toLowerCase().includes('openai')).length;
        }
      }
      
      const stats = {
        totalRequests,
        successRate: totalRequests > 0 ? successCount / totalRequests : 0,
        providerUsage: {
          cohere: cohereCount,
          openai: openaiCount,
          unknown: totalRequests - (cohereCount + openaiCount)
        },
        fallbackRate: cohereCount > 0 ? openaiCount / cohereCount : 0
      };
      
      return NextResponse.json(stats, { headers: corsHeaders });
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      return NextResponse.json(
        { 
          totalRequests: 0,
          successRate: 0,
          providerUsage: { cohere: 0, openai: 0, unknown: 0 },
          fallbackRate: 0,
          error: 'Database operation failed',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error('Error in embedding statistics API:', error);
    return NextResponse.json(
      { 
        totalRequests: 0,
        successRate: 0,
        providerUsage: { cohere: 0, openai: 0, unknown: 0 },
        fallbackRate: 0,
        error: 'Error fetching embedding statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
} 