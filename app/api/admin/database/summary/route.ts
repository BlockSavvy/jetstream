import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createClient();
    
    // First fetch tables
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.error('Error fetching tables:', tableError);
      return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 });
    }
    
    // Then fetch columns
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_schema', 'public');
    
    if (columnError) {
      console.error('Error fetching columns:', columnError);
      return NextResponse.json({ error: 'Failed to fetch columns' }, { status: 500 });
    }
    
    // Then fetch constraints for relationships
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select('*')
      .eq('constraint_schema', 'public')
      .in('constraint_type', ['PRIMARY KEY', 'FOREIGN KEY']);
    
    if (constraintError) {
      console.error('Error fetching constraints:', constraintError);
      return NextResponse.json({ error: 'Failed to fetch constraints' }, { status: 500 });
    }
    
    // Fetch all foreign key relationships in a single query
    const fkQuery = `
      SELECT
        tc.table_name,
        kcu.column_name AS foreign_column,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column,
        tc.constraint_name
      FROM
        information_schema.table_constraints AS tc
      JOIN
        information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN
        information_schema.constraint_column_usage AS ccu
        ON tc.constraint_name = ccu.constraint_name
      WHERE
        tc.constraint_type = 'FOREIGN KEY'
        AND tc.constraint_schema = 'public'
    `;
    
    const { data: fkRelationships, error: fkError } = await supabase.rpc('run_sql', { query: fkQuery });
    
    if (fkError) {
      console.error('Error fetching FK relationships:', fkError);
      // Continue anyway, just won't have full relationship data
    }
    
    // Process the data to create table summaries
    const summaries = tables.map((table: any) => {
      const tableColumns = columns.filter((col: any) => col.table_name === table.table_name);
      const tableConstraints = constraints.filter((con: any) => con.table_name === table.table_name);
      
      // Detect primary keys
      const primaryKeys = tableConstraints
        .filter((con: any) => con.constraint_type === 'PRIMARY KEY')
        .map((con: any) => con.constraint_name);
      
      // Get relationships for this table
      const relationships = fkRelationships 
        ? fkRelationships
            .filter((fk: any) => fk.table_name === table.table_name)
            .map((fk: any) => 
              `${fk.table_name}.${fk.foreign_column} → ${fk.referenced_table}.${fk.referenced_column}`
            )
        : [];
      
      // Create a description of the table based on its columns
      let description = `Contains ${tableColumns.length} columns`;
      if (primaryKeys.length > 0) {
        description += ` with primary key(s): ${primaryKeys.join(', ')}`;
      }
      
      // Get key column types
      const keyColumnTypes = tableColumns
        .filter((col: any) => {
          const colName = col.column_name.toLowerCase();
          return colName.includes('id') || colName.includes('name') || colName.includes('key');
        })
        .map((col: any) => `${col.column_name} (${col.data_type})`);
      
      if (keyColumnTypes.length > 0) {
        description += `. Key columns: ${keyColumnTypes.join(', ')}`;
      }
      
      return {
        name: table.table_name,
        description,
        column_count: tableColumns.length,
        relations: relationships,
        table_type: table.table_type
      };
    });
    
    return NextResponse.json({ 
      summaries,
      count: summaries.length,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in database summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate database summary', details: (error as Error).message },
      { status: 500 }
    );
  }
} 