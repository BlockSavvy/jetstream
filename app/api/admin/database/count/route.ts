import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

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
    const supabase = await createClient();
    
    try {
      // First get a list of all tables in the public schema
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .order('table_name');
      
      if (tablesError) {
        console.error('Error fetching tables:', tablesError);
        return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 });
      }
      
      if (!tables || tables.length === 0) {
        return NextResponse.json({ tables: {}, count: 0 });
      }
      
      // Create a result object
      const result: Record<string, number> = {};
      
      // For each table, get the count
      for (const table of tables) {
        const tableName = table.table_name;
        try {
          // Use a simple count query for each table
          const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (countError) {
            console.warn(`Error counting rows in ${tableName}:`, countError);
            result[tableName] = -1; // Indicate error
          } else {
            result[tableName] = count || 0;
          }
        } catch (countError) {
          console.warn(`Exception counting rows in ${tableName}:`, countError);
          result[tableName] = -1; // Indicate error
        }
      }
      
      return NextResponse.json({ 
        tables: result, 
        count: Object.keys(result).length,
        generated_at: new Date().toISOString()
      });
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      return NextResponse.json(
        { 
          error: 'Database operation failed',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error getting table counts:', error);
    return NextResponse.json(
      { error: 'Failed to get table counts', details: (error as Error).message },
      { status: 500 }
    );
  }
} 