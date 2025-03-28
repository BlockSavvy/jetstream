import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// This is a development-only API endpoint for running SQL queries
export async function POST(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'This endpoint is only available in development mode' }, { status: 403 });
  }
  
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the SQL query from the request body
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'SQL query is required' }, { status: 400 });
    }
    
    // Run the query
    const { data, error } = await supabase.rpc('run_sql_query', { query });
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ 
      success: true, 
      data 
    }, { status: 200 });
  } catch (error) {
    console.error('Error running SQL query:', error);
    return NextResponse.json(
      { error: 'Failed to run SQL query', message: (error as Error).message },
      { status: 500 }
    );
  }
}

// SQL function to create in Supabase:
/*
-- Create function to run SQL queries (admin only)
CREATE OR REPLACE FUNCTION run_sql_query(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT json_agg(t) FROM (SELECT * FROM dblink('dbname=' || current_database(), query) AS t) AS t);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Create function to get table information
CREATE OR REPLACE FUNCTION get_table_info(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable boolean,
  column_default text,
  constraint_name text,
  constraint_type text,
  foreign_key_table text,
  foreign_key_column text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::text,
    c.data_type::text,
    c.is_nullable = 'YES' as is_nullable,
    c.column_default::text,
    tc.constraint_name::text,
    tc.constraint_type::text,
    ccu.table_name::text as foreign_key_table,
    ccu.column_name::text as foreign_key_column
  FROM 
    information_schema.columns c
  LEFT JOIN 
    information_schema.key_column_usage kcu
    ON c.column_name = kcu.column_name
    AND c.table_name = kcu.table_name
    AND c.table_schema = kcu.table_schema
  LEFT JOIN 
    information_schema.table_constraints tc
    ON kcu.constraint_name = tc.constraint_name
    AND kcu.table_schema = tc.table_schema
  LEFT JOIN 
    information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
    AND tc.table_schema = ccu.table_schema
  WHERE 
    c.table_name = table_name
    AND c.table_schema = 'public';
END;
$$;
*/ 