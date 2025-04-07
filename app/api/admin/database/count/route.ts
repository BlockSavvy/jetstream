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

export async function GET() {
  try {
    const supabase = createClient();
    
    // Execute the query to get all table row counts
    const { data, error } = await supabase.rpc('run_sql', { query: TABLE_COUNT_QUERY });
    
    if (error) {
      console.error('Error fetching table counts:', error);
      return NextResponse.json({ error: 'Failed to fetch table counts' }, { status: 500 });
    }
    
    // Format the data for easier consumption
    const tableCountsMap: Record<string, number> = {};
    
    data.forEach((row: any) => {
      tableCountsMap[row.table_name] = parseInt(row.row_count);
    });
    
    return NextResponse.json({ 
      tables: tableCountsMap,
      total_tables: data.length,
      total_rows: Object.values(tableCountsMap).reduce((sum: number, count: number) => sum + count, 0)
    });
  } catch (error) {
    console.error('Error in table counts:', error);
    return NextResponse.json(
      { error: 'Failed to get table counts', details: (error as Error).message },
      { status: 500 }
    );
  }
} 