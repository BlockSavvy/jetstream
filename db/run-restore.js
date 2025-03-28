require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Helper to read SQL files and concatenate them
function readSqlFiles() {
  const sqlFiles = [
    'restore-jetstream-1-schema.sql',
    'restore-jetstream-2-crew-tables.sql',
    'restore-jetstream-3-jetshare-tables.sql',
    'restore-jetstream-4-rls-policies.sql',
    'restore-jetstream-5-triggers.sql',
    'restore-jetstream-6-seed-data.sql'
  ];
  
  let combinedSql = '-- Combined JetStream Restoration SQL\n\n';
  
  for (const file of sqlFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      combinedSql += `\n-- Begin File: ${file}\n${sqlContent}\n-- End File: ${file}\n\n`;
    } else {
      console.warn(`Warning: File ${file} not found, skipping.`);
    }
  }
  
  return combinedSql;
}

// Initialize Supabase client with service role key
async function runRestoration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Required environment variables are missing.');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    process.exit(1);
  }

  console.log('Connecting to Supabase:', supabaseUrl);

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Read all SQL files
  console.log('Reading SQL files...');
  const combinedSql = readSqlFiles();
  
  // Write to a temporary file for debugging if needed
  const tempFilePath = path.join(__dirname, 'combined-restore.sql');
  fs.writeFileSync(tempFilePath, combinedSql);
  console.log(`Combined SQL written to ${tempFilePath} for reference`);

  // Execute SQL
  console.log('Executing SQL restoration...');
  try {
    // First try executing as a single batch
    const { error } = await supabase.rpc('exec_sql', { sql_query: combinedSql });
    
    if (error) {
      console.error('Error executing combined SQL:', error.message);
      console.log('Attempting to execute SQL statements individually...');
      
      // Split SQL and execute statements one by one
      const statements = combinedSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--'));
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          const { error: stmtError } = await supabase.rpc('exec_sql', { 
            sql_query: stmt + ';' 
          });
          
          if (stmtError) {
            console.error(`Error in statement ${i + 1}:`, stmtError.message);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (e) {
          console.error(`Exception in statement ${i + 1}:`, e.message);
          errorCount++;
        }
      }
      
      console.log(`\nExecution completed. Successful: ${successCount}, Failed: ${errorCount}`);
    } else {
      console.log('SQL restoration completed successfully!');
    }
  } catch (error) {
    console.error('Unexpected error during SQL execution:', error.message);
  }
}

runRestoration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
}); 