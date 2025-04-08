import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * API endpoint to execute SQL queries
 * Used by the admin database console
 */
export async function POST(request: Request) {
  try {
    // Extract SQL from request body
    const body = await request.json();
    const sql = body.sql;
    
    if (!sql) {
      return NextResponse.json(
        { error: 'No SQL query provided' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Create Supabase client
    const supabase = createClient();
    
    // Execute the SQL via the run_sql RPC function
    // This is using the SQL function we created that has security restrictions
    const { data, error } = await supabase.rpc('run_sql', { query: sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to execute SQL query' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    return NextResponse.json({ result: data || [], success: true }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error in SQL execution API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process SQL query' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
} 