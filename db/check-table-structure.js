// Script to check the structure of ratings and jetshare_transactions tables
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

  try {
    // Check ratings table structure
    console.log('\nChecking structure of ratings table:');
    
    const { data: ratingsData, error: ratingsError } = await supabase
      .from('ratings')
      .select('*')
      .limit(1);
    
    if (ratingsError) {
      console.error('Error fetching ratings:', ratingsError);
    } else {
      // Get column names from the returned data
      if (ratingsData && ratingsData.length > 0) {
        const columns = Object.keys(ratingsData[0]);
        console.log('Ratings columns:', columns);
      } else {
        // If no data, attempt to get schema directly
        const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'ratings' });
        if (error) {
          console.error('Error fetching ratings schema:', error);

          // Try an alternative approach - make a dummy insert and catch the error to see columns
          try {
            await supabase.from('ratings').insert({dummy: 'value'});
          } catch (e) {
            console.log('Ratings error message:', e.message);
          }
        } else {
          console.log('Ratings columns:', data);
        }
      }
    }
    
    // Check jetshare_transactions table structure
    console.log('\nChecking structure of jetshare_transactions table:');
    
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('jetshare_transactions')
      .select('*')
      .limit(1);
    
    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
    } else {
      // Get column names from the returned data
      if (transactionsData && transactionsData.length > 0) {
        const columns = Object.keys(transactionsData[0]);
        console.log('Transactions columns:', columns);
      } else {
        // If no data, attempt to get schema directly
        const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'jetshare_transactions' });
        if (error) {
          console.error('Error fetching transactions schema:', error);
          
          // Try an alternative approach - make a dummy insert and catch the error to see columns
          try {
            await supabase.from('jetshare_transactions').insert({dummy: 'value'});
          } catch (e) {
            console.log('Transactions error message:', e.message);
          }
        } else {
          console.log('Transactions columns:', data);
        }
      }
    }

  } catch (error) {
    console.error('Error checking table structure:', error);
  }
}

main(); 