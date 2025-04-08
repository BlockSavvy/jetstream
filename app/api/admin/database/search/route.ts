import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import * as embeddingService from '@/lib/services/embeddings';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Performs semantic search on database schema using embeddings
 */
export async function POST(request: Request) {
  try {
    // Parse request
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }
    
    // Generate embedding for the query
    console.log('Generating query embedding for:', query);
    const queryEmbedding = await embeddingService.encode(query);
    console.log('Query embedding generated, length:', queryEmbedding.length);
    
    // Get Supabase client
    const supabase = createClient();
    
    // Fetch table names using run_sql RPC
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
      console.error('Error fetching tables via RPC:', tablesError);
      return NextResponse.json({ error: 'Failed to fetch table names' }, { status: 500 });
    }
    
    const tableNames = tablesData.map((row: any) => row.tablename);
    
    if (tableNames.length === 0) {
      return NextResponse.json({ results: [], count: 0, query }, { headers: corsHeaders });
    }
    
    // Fetch column info for all tables using run_sql RPC
    const { data: columnsData, error: columnsError } = await supabase.rpc('run_sql', {
      query: `
        SELECT 
          table_name, 
          column_name, 
          data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = ANY(ARRAY[${tableNames.map((name: string) => `'${name}'`).join(',')}])
        ORDER BY table_name, ordinal_position;
      `
    });
    
    if (columnsError || !columnsData) {
      console.error('Error fetching columns via RPC:', columnsError);
      return NextResponse.json({ error: 'Failed to fetch column information' }, { status: 500 });
    }
    
    // Prepare data for embedding and similarity calculation
    const items = [];
    
    // Add tables with descriptions
    for (const tableName of tableNames) {
      // Filter columns for this table
      const tableColumns = columnsData.filter((col: any) => col.table_name === tableName);
      
      // Create a descriptive text for this table
      const tableDescription = `Table "${tableName}" with columns: ${ 
        tableColumns.map((col: any) => col.column_name).join(', ')
      }`;
      
      items.push({
        type: 'table',
        name: tableName,
        text: tableDescription,
      });
    }
    
    // Add columns with their tables
    for (const column of columnsData) {
      const columnDescription = 
        `Column "${column.column_name}" of type ${column.data_type} in table "${column.table_name}"`;
      
      items.push({
        type: 'column',
        name: `${column.table_name}.${column.column_name}`,
        text: columnDescription,
      });
    }
    
    // Generate embeddings for all items
    console.log(`Generating embeddings for ${items.length} schema items...`);
    const textsToEmbed = items.map(item => item.text);
    const embeddings = await embeddingService.batchEncode(textsToEmbed);
    console.log(`Generated ${embeddings.length} embeddings.`);
    
    // Calculate similarity scores
    console.log('Calculating similarity scores...');
    const results = items.map((item, index) => {
      if (!embeddings[index]) {
        console.warn(`Missing embedding for item ${index}: ${item.name}`);
        return { ...item, score: 0 };
      }
      const similarity = embeddingService.calculateSimilarity(queryEmbedding, embeddings[index]);
      return {
        ...item,
        score: similarity
      };
    });
    console.log('Similarity scores calculated.');
    
    // Sort by similarity and get top results
    const sortedResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    console.log('Top 10 results:', sortedResults.map(r => ({ name: r.name, score: r.score })));
    
    return NextResponse.json({ 
      results: sortedResults,
      count: sortedResults.length,
      query
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in database search:', error);
    return NextResponse.json(
      { error: 'Failed to search database', details: (error as Error).message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
} 