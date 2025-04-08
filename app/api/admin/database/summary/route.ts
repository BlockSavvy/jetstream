import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    try {
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
      
      // Instead of using a custom RPC function that might not exist, use a simpler approach
      // Get foreign key relationships by joining the constraint tables
      const { data: fkRelationships, error: fkError } = await supabase
        .from('information_schema.key_column_usage')
        .select(`
          table_name,
          column_name,
          constraint_name
        `)
        .eq('constraint_schema', 'public');
        
      if (fkError) {
        console.error('Error fetching FK relationships:', fkError);
        // Continue anyway, just won't have full relationship data
      }
      
      // Get reference columns for foreign keys
      const { data: refColumns, error: refError } = await supabase
        .from('information_schema.constraint_column_usage')
        .select(`
          table_name,
          column_name,
          constraint_name
        `)
        .eq('constraint_schema', 'public');
        
      if (refError) {
        console.error('Error fetching reference columns:', refError);
        // Continue anyway, just won't have full relationship data
      }
      
      // Create a mapping of constraints to their referenced tables/columns
      const relationshipMap = new Map();
      if (fkRelationships && refColumns) {
        // Process all key column usage entries
        fkRelationships.forEach((fk) => {
          // Find the matching reference column
          const ref = refColumns.find(r => r.constraint_name === fk.constraint_name);
          if (ref) {
            relationshipMap.set(fk.constraint_name, {
              source: { table: fk.table_name, column: fk.column_name },
              target: { table: ref.table_name, column: ref.column_name }
            });
          }
        });
      }
      
      // Process the data to create table summaries
      const summaries = tables.map((table: any) => {
        const tableColumns = columns.filter((col: any) => col.table_name === table.table_name);
        const tableConstraints = constraints.filter((con: any) => con.table_name === table.table_name);
        
        // Detect primary keys
        const primaryKeys = tableConstraints
          .filter((con: any) => con.constraint_type === 'PRIMARY KEY')
          .map((con: any) => con.constraint_name);
        
        // Get foreign key relations for this table
        const relationships: string[] = [];
        tableConstraints.forEach((constraint: any) => {
          if (constraint.constraint_type === 'FOREIGN KEY') {
            const relation = relationshipMap.get(constraint.constraint_name);
            if (relation) {
              relationships.push(
                `${relation.source.table}.${relation.source.column} → ${relation.target.table}.${relation.target.column}`
              );
            }
          }
        });
        
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
    console.error('Error in database summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate database summary', details: (error as Error).message },
      { status: 500 }
    );
  }
} 