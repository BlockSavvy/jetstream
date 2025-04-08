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

// Define types for schema response
interface SchemaResponse {
  tables: Array<{
    name: string;
    columns: Array<{
      name: string;
      type: string;
      primary_key: boolean;
      nullable?: boolean;
      default_value?: string | null;
      foreign_key?: { table: string; column: string } | null;
    }>;
  }>;
  relationships: Array<{
    source_table: string;
    source_column: string;
    target_table: string;
    target_column: string;
    constraint_name: string;
  }>;
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
    
    // Use a direct SQL query instead of trying to access information_schema
    // This is more reliable for getting table names
    const { data: tablesData, error: tablesError } = await supabase.rpc('run_sql', {
      query: `
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
        AND tablename != 'schema_migrations'
      `
    });
    
    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      
      // Fallback to hardcoded tables if SQL RPC fails
      const fallbackTables = [
        'profiles', 'jets', 'flights', 'bookings', 'airports', 
        'payments', 'fractional_tokens', 'ratings', 'jetshare_offers',
        'pilots_crews', 'embedding_logs', 'simulation_logs'
      ];
      
      // Return a minimal schema for visualization
      const fallbackSchema = createMinimalSchema(fallbackTables);
      return NextResponse.json(fallbackSchema, { headers: corsHeaders });
    }
    
    // Extract table names from the result
    const tables = Array.isArray(tablesData) 
      ? tablesData.map((row: any) => row.tablename)
      : [];
    
    if (tables.length === 0) {
      console.warn('No tables found, using fallback data');
      
      // Fallback to hardcoded tables if no tables were found
      const fallbackTables = [
        'profiles', 'jets', 'flights', 'bookings', 'airports', 
        'payments', 'fractional_tokens', 'ratings', 'jetshare_offers'
      ];
      
      // Return a minimal schema for visualization
      const fallbackSchema = createMinimalSchema(fallbackTables);
      return NextResponse.json(fallbackSchema, { headers: corsHeaders });
    }
    
    // Create schema structure with basic table info
    // This is better than failing completely if we can't get detailed info
    const simpleSchema: SchemaResponse = {
      tables: tables.map((tableName: string) => ({
        name: tableName,
        columns: [{ name: 'id', type: 'uuid', primary_key: true }]
      })),
      relationships: []
    };
    
    // Try to get column information for each table
    try {
      // Create promises for each table's column query
      const columnPromises = tables.map(async (tableName: string) => {
        const { data: columnsData, error: columnsError } = await supabase.rpc('run_sql', {
          query: `
            SELECT 
              column_name, 
              data_type, 
              is_nullable = 'YES' as is_nullable,
              column_default,
              column_name = 'id' OR column_name LIKE '%_id' as is_potential_key
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = '${tableName}'
          `
        });
        
        if (columnsError || !columnsData) {
          console.error(`Error fetching columns for ${tableName}:`, columnsError);
          // Return basic column data if query fails
          return { 
            tableName, 
            columns: [{ 
              name: 'id', 
              type: 'uuid', 
              primary_key: true,
              nullable: false,
              default_value: null
            }] 
          };
        }
        
        // Process columns
        const columns = columnsData.map((col: any) => ({
          name: col.column_name,
          type: col.data_type,
          primary_key: col.column_name === 'id',
          nullable: col.is_nullable,
          default_value: col.column_default,
          foreign_key: col.is_potential_key && col.column_name !== 'id' ? {
            table: col.column_name.replace('_id', ''),
            column: 'id'
          } : null
        }));
        
        return { tableName, columns };
      });
      
      // Wait for all column queries to complete
      const columnsResults = await Promise.all(columnPromises);
      
      // Update the schema with detailed column info
      columnsResults.forEach(result => {
        const tableIndex = simpleSchema.tables.findIndex(t => t.name === result.tableName);
        if (tableIndex >= 0) {
          simpleSchema.tables[tableIndex].columns = result.columns;
        }
      });
      
      // Try to infer relationships from column names
      const inferredRelationships: Array<{
        source_table: string;
        source_column: string;
        target_table: string;
        target_column: string;
        constraint_name: string;
      }> = [];
      
      // Common relationship patterns to check for
      const relationshipPatterns = [
        // Standard _id suffix (e.g., user_id -> users)
        { 
          suffix: '_id', 
          transform: (name: string) => name.replace('_id', '') 
        },
        // Singular to plural (e.g., jet_id -> jets)
        { 
          suffix: '_id', 
          transform: (name: string) => `${name.replace('_id', '')}s` 
        },
        // UUID pattern (e.g., user_uuid -> users)
        { 
          suffix: '_uuid', 
          transform: (name: string) => name.replace('_uuid', '') 
        },
        // Code pattern (e.g., airport_code -> airports)
        { 
          suffix: '_code', 
          transform: (name: string) => name.replace('_code', 's') 
        },
        // Known specific relations in JetStream
        { 
          suffix: '_airport', 
          transform: () => 'airports' 
        }
      ];

      // Add common JetStream relationships explicitly
      const knownRelationships = [
        { source: 'flights', source_col: 'jet_id', target: 'jets', target_col: 'id' },
        { source: 'flights', source_col: 'origin_airport', target: 'airports', target_col: 'code' },
        { source: 'flights', source_col: 'destination_airport', target: 'airports', target_col: 'code' },
        { source: 'bookings', source_col: 'flight_id', target: 'flights', target_col: 'id' },
        { source: 'bookings', source_col: 'user_id', target: 'profiles', target_col: 'id' },
        { source: 'jets', source_col: 'owner_id', target: 'profiles', target_col: 'id' },
        { source: 'fractional_tokens', source_col: 'jet_id', target: 'jets', target_col: 'id' },
        { source: 'fractional_tokens', source_col: 'owner_id', target: 'profiles', target_col: 'id' },
        { source: 'payments', source_col: 'booking_id', target: 'bookings', target_col: 'id' },
        { source: 'payments', source_col: 'user_id', target: 'profiles', target_col: 'id' },
        { source: 'ratings', source_col: 'from_user_id', target: 'profiles', target_col: 'id' },
        { source: 'ratings', source_col: 'to_user_id', target: 'profiles', target_col: 'id' },
        { source: 'ratings', source_col: 'flight_id', target: 'flights', target_col: 'id' },
        { source: 'jetshare_offers', source_col: 'creator_id', target: 'profiles', target_col: 'id' },
        { source: 'jetshare_offers', source_col: 'jet_id', target: 'jets', target_col: 'id' }
      ];

      // First, add all known relationships if the tables exist
      knownRelationships.forEach(rel => {
        if (simpleSchema.tables.some(t => t.name === rel.source) && 
            simpleSchema.tables.some(t => t.name === rel.target)) {
          inferredRelationships.push({
            constraint_name: `known_fk_${rel.source}_${rel.source_col}`,
            source_table: rel.source,
            source_column: rel.source_col,
            target_table: rel.target,
            target_column: rel.target_col
          });
        }
      });

      // Then look for pattern-based relationships
      for (const table of simpleSchema.tables) {
        for (const column of table.columns) {
          // Skip primary keys
          if (column.primary_key) continue;
          
          // Check for each relationship pattern
          for (const pattern of relationshipPatterns) {
            if (column.name.endsWith(pattern.suffix)) {
              const potentialTargetTable = pattern.transform(column.name);
              
              // Check if this table exists in our schema
              if (simpleSchema.tables.some(t => t.name === potentialTargetTable)) {
                // Avoid duplicates - check if we already have this relationship
                const alreadyExists = inferredRelationships.some(
                  rel => rel.source_table === table.name && 
                         rel.source_column === column.name &&
                         rel.target_table === potentialTargetTable
                );
                
                if (!alreadyExists) {
                  inferredRelationships.push({
                    constraint_name: `inferred_fk_${table.name}_${column.name}`,
                    source_table: table.name,
                    source_column: column.name,
                    target_table: potentialTargetTable,
                    target_column: 'id'
                  });
                }
                
                // Break since we found a match
                break;
              }
            }
          }
        }
      }
      
      // Add the inferred relationships to the schema
      simpleSchema.relationships = inferredRelationships;
    } catch (error) {
      console.error('Error getting detailed schema info:', error);
      // We'll return the simple schema we already have
    }
    
    return NextResponse.json(simpleSchema, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in schema API:', error);
    
    // Fallback to a minimal schema with common tables
    const fallbackTables = [
      'profiles', 'jets', 'flights', 'bookings', 'airports', 
      'payments', 'fractional_tokens', 'ratings', 'jetshare_offers'
    ];
    
    const fallbackSchema = createMinimalSchema(fallbackTables);
    return NextResponse.json(fallbackSchema, { headers: corsHeaders });
  }
}

// Helper function to create a minimal schema for visualization
function createMinimalSchema(tableNames: string[]): SchemaResponse {
  const mockTables = tableNames.map(name => ({
    name,
    columns: [
      { name: 'id', type: 'uuid', primary_key: true, nullable: false },
      { name: 'created_at', type: 'timestamp', primary_key: false, nullable: false },
      { name: 'updated_at', type: 'timestamp', primary_key: false, nullable: false }
    ]
  }));
  
  // Create some mock relationships
  const mockRelationships = [];
  
  if (tableNames.includes('profiles') && tableNames.includes('bookings')) {
    mockRelationships.push({
      source_table: 'bookings',
      source_column: 'user_id',
      target_table: 'profiles',
      target_column: 'id',
      constraint_name: 'mock_fk_bookings_profiles'
    });
  }
  
  if (tableNames.includes('flights') && tableNames.includes('bookings')) {
    mockRelationships.push({
      source_table: 'bookings',
      source_column: 'flight_id',
      target_table: 'flights',
      target_column: 'id',
      constraint_name: 'mock_fk_bookings_flights'
    });
  }
  
  if (tableNames.includes('jets') && tableNames.includes('flights')) {
    mockRelationships.push({
      source_table: 'flights',
      source_column: 'jet_id',
      target_table: 'jets',
      target_column: 'id',
      constraint_name: 'mock_fk_flights_jets'
    });
  }
  
  return {
    tables: mockTables,
    relationships: mockRelationships
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
} 