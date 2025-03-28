// Script to check all tables and their row counts using information_schema
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Helper to read environment variables from .env.local in the project root
function loadEnvFile() {
  try {
    // Always look for .env.local in the project root, not in the current directory
    const projectRoot = path.resolve(__dirname, '..');
    const envPath = path.join(projectRoot, '.env.local');
    
    console.log('Looking for environment variables at:', envPath);
    
    const content = fs.readFileSync(envPath, 'utf8');
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
  const env = loadEnvFile();
  
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  
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

  try {
    // Try directly listing tables we're interested in
    const tables = [
      'users', 
      'profiles',
      'jets',
      'flights',
      'bookings',
      'crew',
      'ratings',
      'jetshare_offers',
      'jetshare_transactions',
      'jetshare_settings'
    ];

    console.log('\nChecking specific tables:');
    console.log('------------------------');

    for (const tableName of tables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`- ${tableName}: Error - ${error.message}`);
        } else {
          console.log(`- ${tableName}: ${count} rows`);
        }
      } catch (e) {
        console.log(`- ${tableName}: Error - ${e.message}`);
      }
    }
  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

main(); 