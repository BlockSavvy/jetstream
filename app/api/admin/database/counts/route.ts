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
 * Uses RPC first, then falls back to direct COUNT(*) queries
 */
export async function GET(_request: Request) {
  try {
    // Create Supabase client
    const supabase = createClient();
    let tableCounts: Record<string, number> = {};
    let rpcSucceeded = false;

    // Try RPC method first
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('table_row_counts');
      
      if (rpcError) throw rpcError; // Trigger fallback if RPC errors

      if (rpcData) {
        rpcData.forEach((item: any) => {
          // Only use RPC count if it's not -1 (indicating estimate)
          if (item.row_count !== -1) {
            tableCounts[item.table_name] = parseInt(item.row_count);
          }
        });
        rpcSucceeded = true;
        console.log('Fetched counts via RPC for some tables:', Object.keys(tableCounts).length);
      } else {
        throw new Error('RPC returned no data');
      }
    } catch (rpcError) {
      console.warn('RPC method table_row_counts failed or returned estimates, falling back to direct queries:', rpcError);
      rpcSucceeded = false; // Ensure fallback runs
    }

    // If RPC failed or gave estimates for some tables, use direct queries as fallback
    try {
      // Get all table names first
      const { data: tablesData, error: tablesError } = await supabase.rpc('run_sql', {
        query: `
          SELECT tablename 
          FROM pg_tables 
          WHERE schemaname = 'public'
          AND tablename NOT LIKE 'pg_%'
          AND tablename != 'schema_migrations'
        `
      });

      if (tablesError || !tablesData) {
        console.error('Failed to fetch table names for count fallback:', tablesError);
        // If even table names fail, return whatever we got from RPC (might be empty)
        return NextResponse.json({ counts: tableCounts }, { headers: corsHeaders });
      }

      const tableNames = tablesData.map((row: any) => row.tablename);

      // Fetch counts for tables not covered accurately by RPC
      const countPromises = tableNames.map(async (tableName: string) => {
        // If we already have a valid count from RPC, skip direct query
        if (tableCounts[tableName] !== undefined) {
          return null; 
        }
        
        // Otherwise, perform a direct count
        try {
          const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (countError) {
            console.error(`Error getting direct count for ${tableName}:`, countError);
            return { tableName, count: 0 }; // Assign 0 on error
          }
          
          return { tableName, count: count ?? 0 };
        } catch (directCountError) {
          console.error(`Exception during direct count for ${tableName}:`, directCountError);
          return { tableName, count: 0 }; // Assign 0 on exception
        }
      });

      // Wait for all count queries to complete
      const directCountsResults = await Promise.all(countPromises);

      // Add the direct counts to our results object
      directCountsResults.forEach(result => {
        if (result) {
          tableCounts[result.tableName] = result.count;
        }
      });

    } catch (fallbackError) {
      console.error('Error during direct count fallback:', fallbackError);
      // Return whatever we managed to get from RPC or initial state
      return NextResponse.json({ counts: tableCounts }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({ counts: tableCounts }, { headers: corsHeaders });
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