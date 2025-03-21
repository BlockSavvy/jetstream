require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    // Get all migration files in order
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (migrationFiles.length === 0) {
      console.log('No migration files found.');
      return;
    }
    
    for (const migrationFile of migrationFiles) {
      console.log(`Executing migration: ${migrationFile}`);
      
      const filePath = path.join(migrationsDir, migrationFile);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Split SQL into statements (very basic implementation)
      const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        if (statement) {
          console.log(`Executing statement ${i + 1} of ${statements.length}...`);
          
          try {
            // Execute the SQL statement directly
            const { data, error } = await supabase.from('_migrations').select('*').limit(0).maybeSingle();
            
            if (error) {
              // If _migrations table doesn't exist yet, that's expected
              console.log('Note: _migrations table not found, continuing...');
            }
            
            // Use raw query execution if available
            const { error: execError } = await supabase.rpc('exec_sql', { sql: statement + ';' });
            
            if (execError) {
              console.error(`Error executing statement: ${statement}`);
              console.error(execError);
              throw execError;
            }
          } catch (statementError) {
            console.error(`Error executing statement in ${migrationFile}:`, statementError);
            throw statementError;
          }
        }
      }
      
      console.log(`Migration ${migrationFile} completed successfully!`);
    }
    
    console.log('All migrations completed successfully!');
    
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations(); 