// Script to check the schema of database tables
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Helper to read environment variables from .env.local
function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const env = {};
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const match = trimmedLine.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          env[key] = value;
        }
      }
    }
    
    return env;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return {};
  }
}

const client = new Client({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: 5432,
  database: process.env.POSTGRES_DATABASE,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    console.log('Checking flights table schema:');
    const flightSchema = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'flights';
    `);
    console.log('Flights table columns:', flightSchema.rows);
    
    console.log('\nChecking for existing flights:');
    const flights = await client.query('SELECT COUNT(*) FROM flights;');
    console.log('Number of flights in database:', flights.rows[0].count);
    
    console.log('\nChecking jets table schema:');
    const jetsSchema = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'jets';
    `);
    console.log('Jets table columns:', jetsSchema.rows);
    
    console.log('\nChecking for existing jets:');
    const jets = await client.query('SELECT COUNT(*) FROM jets;');
    console.log('Number of jets in database:', jets.rows[0].count);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
    console.log('Connection closed');
  }
}

async function checkSchema() {
  // Load environment variables from .env.local
  const envFilePath = path.join(__dirname, '..', '.env.local');
  const env = loadEnvFile(envFilePath);
  
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Environment variables loaded from:', envFilePath);
  console.log('Supabase URL:', supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : 'Not found');
  console.log('Supabase Key exists:', supabaseKey ? 'Yes' : 'No');

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Required environment variables are missing.');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
  }

  console.log('\nConnecting to Supabase at:', supabaseUrl);

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Tables to check
  const tables = [
    'profiles', 
    'jets', 
    'airports', 
    'flights', 
    'bookings', 
    'fractional_tokens', 
    'ratings', 
    'payments', 
    'pilots_crews', 
    'crew_reviews', 
    'specialized_flights', 
    'custom_itinerary_requests', 
    'jetshare_settings', 
    'jetshare_offers', 
    'jetshare_transactions'
  ];

  console.log('\nChecking database schema...');
  
  // Use information_schema to get table columns
  for (const table of tables) {
    try {
      // First check if the table exists at all
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log(`\nTable '${table}' error: ${countError.message}`);
        continue;
      }
      
      console.log(`\nTable '${table}' exists with ${count} rows.`);

      // Try to get a single row to check the structure
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`Error fetching from '${table}': ${error.message}`);
        continue;
      }
      
      if (data && data.length > 0) {
        console.log(`Columns in '${table}':`);
        const columns = Object.keys(data[0]);
        columns.sort();
        
        // Print columns in a nicely formatted way
        const columnChunks = [];
        for (let i = 0; i < columns.length; i += 3) {
          columnChunks.push(columns.slice(i, i + 3).join(', '));
        }
        
        columnChunks.forEach(chunk => console.log(`  ${chunk}`));
      } else {
        console.log(`No data found in '${table}' to check columns.`);
        
        // Try to check the schema directly with a special query
        try {
          const { data: columnData, error: columnError } = await supabase
            .from('information_schema.columns')
            .select('column_name')
            .eq('table_name', table)
            .eq('table_schema', 'public');
          
          if (columnError) {
            console.log(`Error retrieving schema for '${table}': ${columnError.message}`);
          } else if (columnData && columnData.length > 0) {
            console.log(`Columns in '${table}' from schema:`);
            const schemaColumns = columnData.map(c => c.column_name).sort();
            
            // Print columns in a nicely formatted way
            const columnChunks = [];
            for (let i = 0; i < schemaColumns.length; i += 3) {
              columnChunks.push(schemaColumns.slice(i, i + 3).join(', '));
            }
            
            columnChunks.forEach(chunk => console.log(`  ${chunk}`));
          } else {
            console.log(`No schema information found for '${table}'.`);
          }
        } catch (schemaError) {
          console.log(`Error accessing schema information for '${table}': ${schemaError.message}`);
        }
      }
    } catch (error) {
      console.error(`Error checking '${table}':`, error.message);
    }
  }
}

main();
checkSchema().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
}); 