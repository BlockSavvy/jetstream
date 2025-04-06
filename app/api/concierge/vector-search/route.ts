import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import * as embeddings from '@/lib/services/embeddings';

/**
 * Vector search endpoint for retrieving relevant data based on semantic similarity
 */
export async function POST(request: Request) {
  try {
    // Parse request
    const { 
      query, 
      tables = ['airports', 'flights', 'jets', 'jetshare_offers'],
      includeHistorical = false
    } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    
    // Generate embedding for the query using our embeddings service
    const embedding = await embeddings.encode(query);
    
    // Initialize Supabase client
    const supabase = createClient();
    
    // Execute parallel vector searches across tables
    const searchPromises = tables.map(async (tableName: string) => {
      try {
        // Handle JetShare offers differently based on includeHistorical flag
        if (tableName === 'jetshare_offers') {
          // For JetShare offers, use the specialized function that can filter by status
          const status = includeHistorical ? null : 'open';
          
          const { data, error } = await supabase.rpc(
            'match_jetshare_offers',
            { 
              query_embedding: embedding, 
              match_threshold: 0.65, 
              match_count: 10,
              status_filter: status
            }
          );
          
          if (error) {
            console.error(`Error searching ${tableName}:`, error);
            return { table: tableName, results: [], error: error.message };
          }
          
          return { table: tableName, results: data || [] };
        } else {
          // For other tables, use standard vector search
          const { data, error } = await supabase.rpc(
            `match_${tableName}`,
            { 
              query_embedding: embedding, 
              match_threshold: 0.65, 
              match_count: 5 
            }
          );
          
          if (error) {
            console.error(`Error searching ${tableName}:`, error);
            return { table: tableName, results: [], error: error.message };
          }
          
          return { table: tableName, results: data || [] };
        }
      } catch (err) {
        console.error(`Error processing ${tableName}:`, err);
        return { table: tableName, results: [], error: (err as Error).message };
      }
    });
    
    const searchResults = await Promise.all(searchPromises);
    
    // Enhanced result logging for debugging
    console.log(`Vector search for "${query}" (includeHistorical: ${includeHistorical})`);
    searchResults.forEach(({ table, results }) => {
      console.log(`- ${table}: ${results.length} results`);
    });
    
    // Format results for AI consumption
    const formattedResults = searchResults.reduce((acc, { table, results, error }) => {
      if (error) {
        console.error(`Search error for ${table}:`, error);
        return acc;
      }
      
      if (results.length > 0) {
        acc[table] = results;
      }
      
      return acc;
    }, {} as Record<string, any[]>);
    
    // For very short/ambiguous queries against jetshare_offers,
    // fall back to text search as a supplement if vector search returned nothing
    if (query.length < 5 && 
        tables.includes('jetshare_offers') && 
        (!formattedResults.jetshare_offers || formattedResults.jetshare_offers.length === 0)) {
      try {
        // Use text search as fallback
        const { data: textResults, error: textError } = await supabase.rpc(
          'search_jetshare_offers',
          {
            search_query: query.replace(/\s+/g, ' & '),
            limit_count: 5,
            include_historical: includeHistorical
          }
        );
        
        if (!textError && textResults && textResults.length > 0) {
          console.log(`Added ${textResults.length} results from text search fallback`);
          formattedResults.jetshare_offers = textResults;
        }
      } catch (textSearchError) {
        console.error('Text search fallback error:', textSearchError);
      }
    }
    
    return NextResponse.json({ 
      results: formattedResults,
      query,
      includeHistorical,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Vector search error:', error);
    return NextResponse.json(
      { error: 'Failed to process vector search', details: (error as Error).message },
      { status: 500 }
    );
  }
} 