#!/usr/bin/env tsx
/**
 * Database Inspection Script
 * 
 * This script connects to Supabase and:
 * 1. Lists all tables in the public schema
 * 2. Shows the structure of key tables
 * 3. Retrieves 5 sample user IDs
 * 
 * Usage:
 *   npx tsx scripts/db-inspect.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get a list of all tables in the public schema
 */
async function listTables() {
  console.log('=== Database Tables ===');
  
  try {
    // Query the information_schema to get a list of tables
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .not('table_name', 'like', 'pg_%');
    
    if (error) {
      throw new Error(`Failed to retrieve tables: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.log('No tables found in the public schema.');
      return [];
    }
    
    // Display the table names
    console.log('Tables in the public schema:');
    const tableNames = data.map(row => row.table_name);
    tableNames.sort().forEach(name => console.log(`- ${name}`));
    
    return tableNames;
  } catch (error) {
    console.error('Error listing tables:', error);
    
    // Fallback method - try to query some common tables directly
    console.log('\nTrying fallback method to detect common tables...');
    
    const commonTables = [
      'users', 'profiles', 'jets', 'flights', 'airports', 
      'jetshare_offers', 'jetshare_transactions', 'bookings'
    ];
    
    const existingTables = [];
    
    for (const table of commonTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          console.log(`- ${table} (exists, count: ${count})`);
          existingTables.push(table);
        }
      } catch (e) {
        // Table doesn't exist or not accessible
      }
    }
    
    return existingTables;
  }
}

/**
 * Get 5 sample user IDs from the users table
 */
async function getSampleUserIds() {
  console.log('\n=== Sample User IDs ===');
  
  try {
    // Query the users table to get 5 user IDs
    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .limit(5);
    
    if (error) {
      throw new Error(`Failed to retrieve user IDs: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.log('No users found in the database.');
      return [];
    }
    
    // Display the user IDs
    console.log('Sample user IDs:');
    data.forEach(user => console.log(`- ${user.id} (${user.email || 'No email'})`));
    
    return data.map(user => user.id);
  } catch (error) {
    console.error('Error retrieving user IDs:', error);
    
    // Try auth.users as an alternative
    try {
      console.log('\nTrying auth.users as an alternative...');
      
      const { data, error } = await supabase
        .from('auth.users')
        .select('id, email')
        .limit(5);
      
      if (!error && data && data.length > 0) {
        console.log('Sample user IDs from auth.users:');
        data.forEach(user => console.log(`- ${user.id} (${user.email || 'No email'})`));
        return data.map(user => user.id);
      }
    } catch (e) {
      // Auth users table not accessible
    }
    
    return [];
  }
}

/**
 * Get the structure of a table
 */
async function getTableStructure(tableName: string) {
  console.log(`\n=== Structure of ${tableName} ===`);
  
  try {
    // Query the information_schema to get column information
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);
    
    if (error) {
      throw new Error(`Failed to retrieve table structure: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.log(`No columns found for table ${tableName}.`);
      return;
    }
    
    // Display the column information
    console.log(`Columns in ${tableName}:`);
    data.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type})${col.is_nullable === 'YES' ? ' NULL' : ' NOT NULL'}`);
    });
  } catch (error) {
    console.error(`Error retrieving table structure for ${tableName}:`, error);
    
    // Fallback method - try to get a sample row to infer structure
    try {
      console.log('\nTrying to get a sample row to infer structure...');
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error && data && data.length > 0) {
        console.log(`Sample ${tableName} record structure (inferred):`);
        const sampleRow = data[0];
        Object.keys(sampleRow).forEach(key => {
          const valueType = typeof sampleRow[key];
          console.log(`- ${key} (${valueType})`);
        });
      }
    } catch (e) {
      console.error(`Could not infer structure for ${tableName}:`, e);
    }
  }
}

/**
 * Get the structure of jetshare_offers table
 */
async function getJetshareOffersStructure() {
  console.log('\n=== JetShare Offers Structure ===');
  
  try {
    // Get a sample row from jetshare_offers
    const { data, error } = await supabase
      .from('jetshare_offers')
      .select('*')
      .limit(1);
    
    if (error) {
      throw new Error(`Failed to retrieve jetshare_offers sample: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.log('No records found in jetshare_offers.');
      return;
    }
    
    // Display the structure
    console.log('JetShare Offers fields:');
    const sampleOffer = data[0];
    Object.keys(sampleOffer).forEach(key => {
      const value = sampleOffer[key];
      const valueType = typeof value;
      console.log(`- ${key}: ${valueType}${value === null ? ' (NULL)' : ''}`);
    });
  } catch (error) {
    console.error('Error retrieving jetshare_offers structure:', error);
  }
}

/**
 * Get all airports for reference
 */
async function getAirports() {
  console.log('\n=== Airports ===');
  
  try {
    const { data, error } = await supabase
      .from('airports')
      .select('code, name, city, country')
      .limit(10);
    
    if (error) {
      throw new Error(`Failed to retrieve airports: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.log('No airports found.');
      return;
    }
    
    console.log('Sample airports:');
    data.forEach(airport => {
      console.log(`- ${airport.code}: ${airport.name} (${airport.city}, ${airport.country})`);
    });
  } catch (error) {
    console.error('Error retrieving airports:', error);
  }
}

/**
 * Get the constraints for the jetshare_offers table
 */
async function getJetshareOffersConstraints() {
  console.log('\n=== JetShare Offers Constraints ===');
  
  try {
    // Try to get enum types for status
    const { data: enums, error: enumError } = await supabase.rpc(
      'get_enum_values',
      { enum_name: 'jetshare_offers_status' }
    );
    
    if (enumError) {
      console.error(`Failed to get enum values: ${enumError.message}`);
    } else if (enums && enums.length > 0) {
      console.log('Status enum values:');
      enums.forEach((value: string) => console.log(`- ${value}`));
    }
    
    // Try an alternative approach - get values directly
    try {
      console.log('\nTrying direct query for constraints...');
      
      const { data: checkData, error: checkError } = await supabase
        .from('information_schema.check_constraints')
        .select('constraint_name, check_clause')
        .like('constraint_name', '%jetshare_offers%');
      
      if (!checkError && checkData && checkData.length > 0) {
        console.log('\nCheck constraints:');
        checkData.forEach(constraint => {
          console.log(`- ${constraint.constraint_name}: ${constraint.check_clause}`);
        });
      }
    } catch (e) {
      console.error('Error getting check constraints:', e);
    }
    
    // Try to insert with different status values
    console.log('\nTesting status values by inserting test records...');
    
    const testStatuses = ['pending', 'active', 'completed', 'cancelled', 'published', 'draft', 'archived'];
    const results: Record<string, boolean> = {};
    
    for (const status of testStatuses) {
      try {
        const testId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        
        const { error } = await supabase
          .from('jetshare_offers')
          .insert([
            {
              id: testId,
              user_id: '26209e07-7600-4df6-ab1e-4b338f760aff', // Use a valid user ID
              departure_location: 'KDEN',
              arrival_location: 'KLAX',
              flight_date: new Date().toISOString().split('T')[0],
              total_flight_cost: 20000,
              available_seats: 4,
              requested_share_amount: 5000,
              status: status,
              aircraft_model: 'Test Aircraft',
              total_seats: 6,
              tickets_generated: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);
          
        if (error) {
          results[status] = false;
          console.log(`- Status '${status}': ❌ (${error.message})`);
          
          // Delete in case it was actually inserted
          await supabase
            .from('jetshare_offers')
            .delete()
            .eq('id', testId);
        } else {
          results[status] = true;
          console.log(`- Status '${status}': ✅`);
          
          // Delete after successful test
          await supabase
            .from('jetshare_offers')
            .delete()
            .eq('id', testId);
        }
      } catch (e) {
        results[status] = false;
        console.error(`Error testing status '${status}':`, e);
      }
    }
    
    console.log('\nValid status values:');
    Object.entries(results)
      .filter(([_, valid]) => valid)
      .forEach(([status]) => console.log(`- ${status}`));
  } catch (error) {
    console.error('Error retrieving jetshare_offers constraints:', error);
  }
}

/**
 * Get the table definition from pg_get_tabledef
 */
async function getTableDefinition(tableName: string) {
  console.log(`\n=== Table Definition for ${tableName} ===`);
  
  try {
    // Try using pg_get_tabledef to get the CREATE TABLE statement
    const { data, error } = await supabase.rpc(
      'pg_get_tabledef',
      { tablename: tableName }
    );
    
    if (error) {
      console.error(`Failed to get table definition: ${error.message}`);
    } else if (data) {
      console.log(data);
    }
  } catch (error) {
    console.error(`Error retrieving table definition for ${tableName}:`, error);
    
    // Direct approach - use raw SQL to examine constraint
    try {
      const { data, error } = await supabase.rpc(
        'custom_sql', 
        { 
          query: `
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            JOIN pg_namespace n ON t.relnamespace = n.oid
            WHERE n.nspname = 'public'
            AND t.relname = '${tableName}'
            AND contype = 'c'
          `
        }
      );
      
      if (error) {
        console.error(`Failed to get constraints via SQL: ${error.message}`);
      } else if (data) {
        console.log('Constraints from raw SQL query:');
        console.log(data);
      }
    } catch (e) {
      console.error('Error executing raw SQL:', e);
    }
  }
}

/**
 * Try inserting with common status values
 */
async function testStatusValues() {
  console.log('\n=== Testing Common Status Values ===');
  
  // Try these common status values
  const statusValues = [
    'open', 'closed', 'confirmed', 'pending', 'completed', 'canceled',
    'active', 'inactive', 'approved', 'rejected', 'new', 'processing',
    'available', 'unavailable', 'booked', 'reserved'
  ];
  
  // Test each status value
  for (const status of statusValues) {
    try {
      const testId = uuidv4(); // Use the UUID generator to create a valid UUID
      
      const { error } = await supabase
        .from('jetshare_offers')
        .insert([
          {
            id: testId,
            user_id: '26209e07-7600-4df6-ab1e-4b338f760aff',
            departure_location: 'KDEN',
            arrival_location: 'KLAX',
            flight_date: new Date().toISOString().split('T')[0],
            total_flight_cost: 20000,
            available_seats: 4,
            requested_share_amount: 5000,
            status: status,
            aircraft_model: 'Test Aircraft',
            total_seats: 6,
            tickets_generated: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
        
      if (error) {
        console.log(`Status '${status}': ❌ (${error.message})`);
      } else {
        console.log(`Status '${status}': ✅`);
        
        // Delete successful test entry
        await supabase
          .from('jetshare_offers')
          .delete()
          .eq('id', testId);
      }
    } catch (e) {
      console.error(`Error testing status '${status}':`, e);
    }
  }
}

/**
 * Set embedding to NULL for all jetshare_offers to trigger the embedding worker
 */
async function nullifyJetshareOffersEmbeddings() {
  console.log('\n=== Nullifying Embeddings ===');
  
  try {
    // Check if the embedding column exists
    const { data: columnData, error: columnError } = await supabase
      .from('jetshare_offers')
      .select('embedding')
      .limit(1);
    
    if (columnError) {
      console.error(`Error checking embedding column: ${columnError.message}`);
      
      // Try to add the column if it doesn't exist
      try {
        // Try with RPC for direct SQL
        const { error: alterError } = await supabase.rpc(
          'execute_sql',
          { 
            sql: 'ALTER TABLE jetshare_offers ADD COLUMN IF NOT EXISTS embedding vector(1536);' 
          }
        );
        
        if (alterError) {
          console.error(`Failed to add embedding column: ${alterError.message}`);
        } else {
          console.log('Added embedding column to jetshare_offers table');
        }
      } catch (e) {
        console.error('Error attempting to add column:', e);
      }
    } else {
      console.log('Embedding column exists in jetshare_offers table');
    }
    
    // Set all embeddings to NULL
    const { data, error } = await supabase
      .from('jetshare_offers')
      .update({ embedding: null })
      .is('embedding', null)
      .not('id', 'is', null);
    
    if (error) {
      console.error(`Error nullifying embeddings: ${error.message}`);
    } else {
      console.log('Successfully nullified embeddings for all jetshare_offers');
    }
  } catch (error) {
    console.error('Error in nullifyJetshareOffersEmbeddings:', error);
  }
}

/**
 * Main function to run all inspections
 */
async function inspectDatabase() {
  try {
    // Print connection info
    console.log('Connected to Supabase at:', supabaseUrl);
    
    // List all tables
    const tables = await listTables();
    
    // Get user IDs
    const userIds = await getSampleUserIds();
    
    // Get structure of key tables
    if (tables.includes('users')) {
      await getTableStructure('users');
    }
    
    if (tables.includes('jetshare_offers')) {
      await getTableStructure('jetshare_offers');
      await getJetshareOffersStructure();
      await getJetshareOffersConstraints();
      await getTableDefinition('jetshare_offers');
      await testStatusValues();
      await nullifyJetshareOffersEmbeddings();
    }
    
    if (tables.includes('airports')) {
      await getAirports();
    }
    
    console.log('\nDatabase inspection completed successfully!');
  } catch (error) {
    console.error('Database inspection failed:', error);
  }
}

// Run the inspection
inspectDatabase()
  .then(() => {
    console.log('Script execution completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  }); 