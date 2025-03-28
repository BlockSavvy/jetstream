require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Required environment variables are missing.');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupJetShareDB() {
  try {
    console.log('=============================================');
    console.log('JetShare Database Setup & Seeding Tool');
    console.log('=============================================');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'seeds', 'jetshare_schema_and_data.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Executing JetShare SQL...');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      
      // Try to execute the SQL in smaller chunks if the query is too large
      console.log('Trying to execute in smaller chunks...');
      
      const statements = sql.split(';').filter(s => s.trim());
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim();
        if (stmt) {
          console.log(`Executing statement ${i + 1} of ${statements.length}...`);
          
          try {
            const { error: stmtError } = await supabase.rpc('exec_sql', { sql_query: stmt + ';' });
            
            if (stmtError) {
              console.error(`Error executing statement ${i + 1}:`, stmtError);
              console.log('Statement:', stmt);
              console.log('Continuing with next statement...');
            }
          } catch (e) {
            console.error(`Exception executing statement ${i + 1}:`, e);
            console.log('Continuing with next statement...');
          }
        }
      }
    }
    
    console.log('JetShare database setup completed.');
    
  } catch (error) {
    console.error('Unexpected error during JetShare database setup:', error);
  }
}

setupJetShareDB(); 