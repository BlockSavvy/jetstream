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
      
      // Execute the SQL
      const { error } = await supabase.rpc('pgbouncer_exec', { query: sql });
      
      if (error) {
        console.error(`Error running migration ${migrationFile}:`, error);
        throw error;
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