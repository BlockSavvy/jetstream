import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import * as embeddings from '@/lib/services/embeddings';

/**
 * Database query function that allows the AI to safely query specific database tables
 */
export async function POST(request: Request) {
  try {
    // Authenticate request using Supabase
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const { 
      table_name, 
      query_fields = ['*'], 
      filters = {}, 
      limit = 10,
      semantic_query = '' // Add support for semantic search
    } = await request.json();
    
    // Validate required fields
    if (!table_name) {
      return NextResponse.json(
        { error: 'table_name is required' },
        { status: 400 }
      );
    }
    
    // Validate table name against allowed tables to prevent SQL injection
    const allowedTables = ['airports', 'flights', 'jets', 'jetshare_offers', 'amenities'];
    if (!allowedTables.includes(table_name)) {
      return NextResponse.json(
        { error: `Table '${table_name}' is not accessible` },
        { status: 403 }
      );
    }
    
    // If a semantic query is provided, use vector search
    if (semantic_query && typeof semantic_query === 'string' && semantic_query.trim().length > 0) {
      try {
        // Generate embedding for the query using our embedding service
        const embedding = await embeddings.encode(semantic_query);
        
        // Determine if we should filter for specific status in jetshare_offers
        const status = table_name === 'jetshare_offers' && filters.status ? 
          filters.status : 
          (table_name === 'jetshare_offers' ? 'open' : null);
        
        // Use the appropriate RPC function for vector search
        const rpcFunction = `match_${table_name}`;
        const rpcParams: any = { 
          query_embedding: embedding, 
          match_threshold: 0.65, 
          match_count: Math.min(limit, 50)
        };
        
        // Add status filter for jetshare_offers
        if (table_name === 'jetshare_offers' && status) {
          rpcParams.status_filter = status;
        }
        
        const { data: vectorResults, error: vectorError } = await supabase.rpc(
          rpcFunction,
          rpcParams
        );
        
        if (vectorError) {
          console.error(`Vector search error for ${table_name}:`, vectorError);
          // Fall back to regular query if vector search fails
        } else if (vectorResults && vectorResults.length > 0) {
          // Log the successful vector query
          console.log(`AI performed semantic vector query on ${table_name} table:`, {
            query: semantic_query,
            results: vectorResults.length
          });
          
          return NextResponse.json({
            results: vectorResults,
            count: vectorResults.length,
            table: table_name,
            search_type: 'semantic'
          });
        }
        // If vector search returns no results, fall back to regular query
      } catch (vectorError) {
        console.error('Vector search error:', vectorError);
        // Fall back to regular query if vector search fails
      }
    }
    
    // Start building the regular query (fallback if semantic search doesn't work or isn't specified)
    let query = supabase
      .from(table_name)
      .select(Array.isArray(query_fields) ? query_fields.join(',') : '*');
    
    // Apply filters if provided
    if (filters && typeof filters === 'object') {
      Object.entries(filters).forEach(([field, value]) => {
        // Handle different types of filters
        if (typeof value === 'string' && value.includes('%')) {
          // Handle LIKE queries for string patterns
          query = query.ilike(field, value);
        } else if (Array.isArray(value)) {
          // Handle IN queries for arrays
          query = query.in(field, value);
        } else if (typeof value === 'object' && value !== null) {
          // Handle range queries for objects with gt, lt, etc.
          Object.entries(value).forEach(([op, val]) => {
            switch (op) {
              case 'gt':
                query = query.gt(field, val);
                break;
              case 'gte':
                query = query.gte(field, val);
                break;
              case 'lt':
                query = query.lt(field, val);
                break;
              case 'lte':
                query = query.lte(field, val);
                break;
              case 'not':
                query = query.neq(field, val);
                break;
              default:
                // Ignore unsupported operators
                break;
            }
          });
        } else {
          // Handle exact match
          query = query.eq(field, value);
        }
      });
    }
    
    // Apply limit
    query = query.limit(Math.min(limit, 50)); // Cap at 50 to prevent excessive data retrieval
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'Failed to query database', details: error.message },
        { status: 500 }
      );
    }
    
    // Log the successful query for tracking
    console.log(`AI performed query on ${table_name} table for user ${user.id}:`, {
      fields: query_fields,
      filters,
      results: data.length
    });
    
    // Return the query results
    return NextResponse.json({
      results: data,
      count: data.length,
      table: table_name,
      search_type: 'exact'
    });
  } catch (error) {
    console.error('Error in query-database function:', error);
    return NextResponse.json(
      { error: 'Failed to process database query', details: (error as Error).message },
      { status: 500 }
    );
  }
} 