import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// Query to get table counts using dynamic SQL
const TABLE_COUNT_QUERY = `
  SELECT 
    table_name::text, 
    pg_estimate_rows('"' || table_name || '"')::integer as row_count
  FROM 
    information_schema.tables
  WHERE 
    table_schema = 'public'
    AND table_type = 'BASE TABLE'
  ORDER BY 
    table_name
`;

// Alternative query if pg_estimate_rows isn't available
const ALTERNATIVE_COUNT_QUERY = `
  SELECT 
    table_name::text, 
    n_live_tup::integer as row_count
  FROM 
    pg_stat_user_tables
  ORDER BY 
    table_name
`;

export async function GET() {
  try {
    const supabase = createClient();
    
    // First try to use the RPC function if available
    let tableData;
    let error;
    
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('table_row_counts');
      tableData = rpcData;
      error = rpcError;
    } catch (rpcFailure) {
      console.log('RPC function table_row_counts not available, falling back to SQL', rpcFailure);
      error = rpcFailure;
    }
    
    // If RPC fails, try to use run_sql RPC function
    if (error) {
      try {
        const { data: sqlData, error: sqlError } = await supabase.rpc('run_sql', { query: TABLE_COUNT_QUERY });
        tableData = sqlData;
        error = sqlError;
      } catch (sqlFailure) {
        console.log('RPC function run_sql not available, trying alternative SQL', sqlFailure);
        error = sqlFailure;
      }
    }
    
    // If run_sql also fails, try direct SQL execution as a last resort
    if (error) {
      try {
        // Try both queries, starting with the main one
        let { data: directData, error: directError } = await supabase.from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_type', 'BASE TABLE');
        
        if (directError || !directData) {
          throw directError || new Error('No data returned from tables query');
        }
        
        // If we can access table names, use the slowest but most reliable method:
        // query each table for count(*) individually
        const tableCountsMap: Record<string, number> = {};
        
        // For each table, count the rows
        for (const table of directData) {
          const tableName = table.table_name;
          try {
            const { count, error: countError } = await supabase
              .from(tableName)
              .select('*', { count: 'exact', head: true });
            
            if (!countError) {
              tableCountsMap[tableName] = count || 0;
            } else {
              console.warn(`Error counting table ${tableName}:`, countError);
              tableCountsMap[tableName] = 0;
            }
          } catch (tableError) {
            console.warn(`Error accessing table ${tableName}:`, tableError);
            tableCountsMap[tableName] = 0;
          }
        }
        
        return NextResponse.json({ 
          tables: tableCountsMap,
          total_tables: Object.keys(tableCountsMap).length,
          total_rows: Object.values(tableCountsMap).reduce((sum, count) => sum + count, 0),
          method: 'direct-count'
        });
      } catch (directFailure) {
        console.error('All methods failed for table counts:', directFailure);
        return NextResponse.json(
          { error: 'All table count methods failed', details: 'Database schema access issue' },
          { status: 500 }
        );
      }
    }
    
    // Format the data for easier consumption
    const tableCountsMap: Record<string, number> = {};
    
    tableData.forEach((row: any) => {
      tableCountsMap[row.table_name] = parseInt(row.row_count);
    });
    
    return NextResponse.json({ 
      tables: tableCountsMap,
      total_tables: tableData.length,
      total_rows: Object.values(tableCountsMap).reduce((sum: number, count: number) => sum + count, 0),
      method: error ? 'run-sql' : 'rpc'
    });
  } catch (error) {
    console.error('Error in table counts:', error);
    return NextResponse.json(
      { error: 'Failed to get table counts', details: (error as Error).message },
      { status: 500 }
    );
  }
} 