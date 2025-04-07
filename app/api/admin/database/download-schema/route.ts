import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * API endpoint to download database schema
 * Returns a schema file compatible with Liam ERD
 */
export async function GET(request: Request) {
  try {
    // Get Supabase client
    const supabase = createClient();
    
    // Fetch tables
    const { data: tablesRaw, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      return NextResponse.json(
        { error: 'Failed to fetch database tables' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Filter system tables
    const tables = tablesRaw
      .filter((t: any) => !t.table_name.startsWith('pg_') && t.table_name !== 'schema_migrations')
      .map((t: any) => t.table_name);
    
    // Fetch columns for these tables
    const { data: columnsRaw, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_schema', 'public')
      .in('table_name', tables);
    
    if (columnsError) {
      console.error('Error fetching columns:', columnsError);
      return NextResponse.json(
        { error: 'Failed to fetch table columns' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Fetch foreign key constraints
    const { data: foreignKeysRaw, error: fkError } = await supabase.rpc('get_foreign_keys');
    
    if (fkError) {
      console.error('Error fetching foreign keys:', fkError);
      return NextResponse.json(
        { error: 'Failed to fetch foreign key constraints' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Create the schema in Liam ERD format
    const liamSchema = {
      format: 'liamond',
      version: '1.0',
      tables: tables.map((tableName: string) => {
        const tableColumns = columnsRaw.filter((col: any) => col.table_name === tableName);
        
        return {
          name: tableName,
          columns: tableColumns.map((col: any) => {
            // Check if this column is a primary key
            const isPrimaryKey = col.is_identity === 'YES' || col.column_name === 'id';
            
            // Find foreign keys for this column
            const foreignKey = foreignKeysRaw?.find(
              (fk: any) => fk.source_table === tableName && fk.source_column === col.column_name
            );
            
            return {
              name: col.column_name,
              type: col.data_type,
              primary_key: isPrimaryKey,
              foreign_key: foreignKey ? {
                table: foreignKey.target_table,
                column: foreignKey.target_column
              } : null,
              nullable: col.is_nullable === 'YES',
              default_value: col.column_default
            };
          })
        };
      }),
      relationships: (foreignKeysRaw || []).map((fk: any) => ({
        source_table: fk.source_table,
        source_column: fk.source_column,
        target_table: fk.target_table,
        target_column: fk.target_column,
        constraint_name: fk.constraint_name
      }))
    };
    
    // Create downloadable schema file
    const schemaJson = JSON.stringify(liamSchema, null, 2);
    
    // Return as a downloadable JSON file
    return new NextResponse(schemaJson, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="jetstream-schema.json"'
      }
    });
  } catch (error) {
    console.error('Error generating schema file:', error);
    return NextResponse.json(
      { error: 'Failed to generate schema file' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
} 