require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Required environment variables are missing.');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    process.exit(1);
  }

  console.log('Testing connection to Supabase at:', supabaseUrl);

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Try a simple query to check the connection
    const { data, error } = await supabase.from('jetshare_settings').select('*').limit(1);
    
    if (error) throw error;
    
    console.log('Connection successful!');
    console.log('Sample data:', data);
    
    // Check for tables in the database
    const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', { 
      sql_query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `
    });
    
    if (tablesError) {
      console.error('Error fetching tables:', tablesError.message);
    } else {
      console.log('\nExisting tables in the database:');
      console.log(tables.map(row => row.table_name).join(', '));
    }
    
  } catch (error) {
    console.error('Connection failed:', error.message);
    
    // Try a different approach if first one fails
    try {
      console.log('\nTrying alternative connection test...');
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: 'SELECT current_database(), current_schema(), current_user;' 
      });
      
      if (error) throw error;
      
      console.log('Alternative connection test successful!');
      console.log('Database info:', data[0]);
      
    } catch (altError) {
      console.error('Alternative connection test also failed:', altError.message);
    }
  }
}

testConnection().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
}); 