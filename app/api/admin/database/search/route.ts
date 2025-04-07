import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import * as embeddingService from '@/lib/services/embeddings';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Types for database schema
interface TableInfo {
  table_name: string;
  [key: string]: any;
}

interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  [key: string]: any;
}

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
    const queryEmbedding = await embeddingService.encode(query);
    
    // Get Supabase client
    const supabase = createClient();
    
    // First fetch tables and columns from information schema
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.error('Error fetching tables:', tableError);
      return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 });
    }
    
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_schema', 'public');
    
    if (columnError) {
      console.error('Error fetching columns:', columnError);
      return NextResponse.json({ error: 'Failed to fetch columns' }, { status: 500 });
    }
    
    // Prepare data for embedding and similarity calculation
    const items = [];
    
    // Add tables with descriptions
    for (const table of tables) {
      // Filter columns for this table
      const tableColumns = columns.filter((col: any) => col.table_name === table.table_name);
      
      // Create a descriptive text for this table
      const tableDescription = `Table "${table.table_name}" with columns: ${
        tableColumns.map((col: any) => col.column_name).join(', ')
      }`;
      
      items.push({
        type: 'table',
        name: table.table_name,
        text: tableDescription,
      });
    }
    
    // Add columns with their tables
    for (const column of columns) {
      const columnDescription = 
        `Column "${column.column_name}" of type ${column.data_type} in table "${column.table_name}"`;
      
      items.push({
        type: 'column',
        name: `${column.table_name}.${column.column_name}`,
        text: columnDescription,
      });
    }
    
    // Generate embeddings for all items
    const textsToEmbed = items.map(item => item.text);
    const embeddings = await embeddingService.batchEncode(textsToEmbed);
    
    // Calculate similarity scores
    const results = items.map((item, index) => {
      const similarity = embeddingService.calculateSimilarity(queryEmbedding, embeddings[index]);
      return {
        ...item,
        score: similarity
      };
    });
    
    // Sort by similarity and get top results
    const sortedResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    
    return NextResponse.json({ 
      results: sortedResults,
      count: sortedResults.length,
      query
    });
  } catch (error) {
    console.error('Error in database search:', error);
    return NextResponse.json(
      { error: 'Failed to search database', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
} 