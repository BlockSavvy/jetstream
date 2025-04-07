import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// Define types for database schema objects
interface TableInfo {
  table_name: string;
  [key: string]: any;
}

interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  is_identity: string;
  column_default: string | null;
  [key: string]: any;
}

interface ForeignKeyInfo {
  constraint_name: string;
  source_table: string;
  source_column: string;
  target_table: string;
  target_column: string;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * API endpoint to fetch database schema
 * Returns a schema compatible with Liam ERD
 */
export async function GET(_request: Request) {
  try {
    // Create Supabase client
    const supabase = createClient();
    
    // Fetch tables, this includes view tables also
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
    
    // Filter out system tables
    const tables = (tablesRaw as TableInfo[])
      .filter((t) => !t.table_name.startsWith('pg_') && t.table_name !== 'schema_migrations')
      .map((t) => t.table_name);
    
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
    
    // Process data into Liam ERD compatible format
    const liamSchema = {
      tables: tables.map((tableName: string) => {
        const tableColumns = (columnsRaw as ColumnInfo[]).filter((col) => col.table_name === tableName);
        
        return {
          name: tableName,
          columns: tableColumns.map((col: ColumnInfo) => {
            // Check if this column is a primary key
            const isPrimaryKey = col.is_identity === 'YES' || col.column_name === 'id';
            
            // Find foreign keys for this column
            const foreignKey = (foreignKeysRaw as ForeignKeyInfo[]).find(
              (fk) => fk.source_table === tableName && fk.source_column === col.column_name
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
      relationships: (foreignKeysRaw as ForeignKeyInfo[]).map((fk) => ({
        source_table: fk.source_table,
        source_column: fk.source_column,
        target_table: fk.target_table,
        target_column: fk.target_column,
        constraint_name: fk.constraint_name
      }))
    };
    
    return NextResponse.json(liamSchema, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in schema API:', error);
    return NextResponse.json(
      { error: 'Failed to generate schema' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
} 