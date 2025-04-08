import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * API endpoint to fetch table row counts
 */
export async function GET(_request: Request) {
  try {
    // Create Supabase client
    const supabase = createClient();
    
    // Try RPC method first
    let tableData;
    let error;
    
    try {
      const response = await supabase.rpc('table_row_counts');
      tableData = response.data;
      error = response.error;
      
      if (error) throw error;
    } catch (rpcError) {
      console.error('RPC method failed, trying direct query', rpcError);
      
      // If RPC fails, use a direct query
      const { data, error: queryError } = await supabase.from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE');
      
      if (queryError) {
        throw queryError;
      }
      
      // Get counts for each table
      tableData = [];
      
      // Use Promise.all to fetch counts in parallel
      const countPromises = data.map(async (table: { table_name: string }) => {
        const { data: countData, error: countError } = await supabase
          .from(table.table_name)
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          console.error(`Error getting count for ${table.table_name}:`, countError);
          return { table_name: table.table_name, row_count: 0 };
        }
        
        return { 
          table_name: table.table_name, 
          row_count: countData?.length !== undefined ? countData.length : 0 
        };
      });
      
      tableData = await Promise.all(countPromises);
    }
    
    // Format the data into a more usable structure
    const counts: Record<string, number> = {};
    tableData.forEach((item: any) => {
      counts[item.table_name] = parseInt(item.row_count);
    });
    
    return NextResponse.json({ counts }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in counts API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table counts' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
} 