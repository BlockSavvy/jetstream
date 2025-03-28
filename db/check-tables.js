// Script to check all tables and their row counts
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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
    console.error('Error loading .env file:', error);
    return {};
  }
}

async function main() {
  // Load environment variables from .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  const env = loadEnvFile(envPath);
  
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('Environment variables loaded from:', envPath);
  console.log('Supabase URL:', supabaseUrl ? supabaseUrl.substring(0, 10) + '...' : 'Not found');
  console.log('Supabase Key exists:', supabaseKey ? 'Yes' : 'No');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Required environment variables are missing.');
    process.exit(1);
  }

  console.log('\nConnecting to Supabase at:', supabaseUrl);

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Query to get all table names in the public schema
  const { data: tables, error: tablesError } = await supabase
    .from('pg_tables')
    .select('tablename')
    .eq('schemaname', 'public');

  if (tablesError) {
    console.error('Error fetching tables:', tablesError);
    return;
  }

  console.log('\nDatabase Tables and Row Counts:');
  console.log('-----------------------------');

  // Check each table's row count
  for (const table of tables) {
    try {
      const { data, count, error } = await supabase
        .from(table.tablename)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`- ${table.tablename}: Error getting count - ${error.message}`);
      } else {
        console.log(`- ${table.tablename}: ${count} rows`);
      }
    } catch (e) {
      console.log(`- ${table.tablename}: Error - ${e.message}`);
    }
  }
}

main(); 