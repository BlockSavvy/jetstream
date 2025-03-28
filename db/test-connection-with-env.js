// Load environment variables directly
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
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local.');
    process.exit(1);
  }

  console.log('\nTesting connection to Supabase at:', supabaseUrl);

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Try calling the exec_sql function
    console.log('Executing simple SQL query...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: "SELECT * FROM jetshare_settings LIMIT 1;"
    });

    if (error) {
      console.log('Connection failed:', error.message);
      
      // Try a direct query as a fallback
      console.log('\nTrying direct query...');
      const { data: directData, error: directError } = await supabase
        .from('jetshare_settings')
        .select('*')
        .limit(1);
        
      if (directError) {
        console.error('Direct query failed:', directError.message);
        process.exit(1);
      } else {
        console.log('Direct query successful!');
        console.log('Sample data:', directData);
      }
    } else {
      console.log('Connection successful!');
      console.log('Sample data:', data);
    }
  } catch (error) {
    console.error('Error testing connection:', error);
    process.exit(1);
  }
}

main(); 