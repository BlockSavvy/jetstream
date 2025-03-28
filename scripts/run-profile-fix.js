const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load SQL file
const sqlFilePath = path.join(__dirname, '..', 'migrations', 'jetshare-profile-fix.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

async function runMigration() {
  // Create Supabase client with admin service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase URL or key not defined in environment variables');
    process.exit(1);
  }
  
  console.log('Connecting to Supabase:', supabaseUrl);
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  console.log('Running JetShare profiles table fix migration...');
  
  try {
    // Execute SQL directly
    const { data, error } = await supabase.rpc('pgmigrate', { query: sqlContent });
    
    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
    
    console.log('Migration completed successfully!');
    console.log('Results:', data);
    process.exit(0);
  } catch (err) {
    console.error('Error executing migration:', err);
    process.exit(1);
  }
}

runMigration().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
}); 