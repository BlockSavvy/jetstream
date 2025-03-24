require('dotenv').config({ path: '.env.local' });
const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
console.log('Loading environment variables...');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupCrewData() {
  try {
    console.log('Starting setup process for Pilots & Crew Specialization feature...');
    console.log(`Using Supabase URL: ${supabaseUrl}`);
    
    // 1. Run the SQL migration script
    console.log('Running SQL migration for crew tables...');
    const migrationFile = path.join(__dirname, '../db/migrations/001_pilots_crew_tables.sql');
    const migration = fs.readFileSync(migrationFile, 'utf8');
    
    // Check if _db_migrations table exists, if not, create it
    try {
      const { data: tablesData, error: tablesError } = await supabase
        .rpc('exec_sql', { 
          sql_query: `
            CREATE TABLE IF NOT EXISTS _db_migrations (
              id SERIAL PRIMARY KEY,
              name TEXT UNIQUE NOT NULL,
              sql TEXT NOT NULL,
              executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
          `
        });
      
      if (tablesError) {
        console.error('Error creating migrations table:', tablesError);
      }
    } catch (tableCreateError) {
      console.error('Error creating migrations table:', tableCreateError);
    }
    
    // Record the migration
    const { error: migrationError } = await supabase.from('_db_migrations').insert({
      name: '001_pilots_crew_tables',
      sql: migration,
      executed_at: new Date().toISOString()
    });
    
    if (migrationError) {
      console.error('Error recording migration:', migrationError);
      
      // Check if it's a duplicate error, which we can ignore
      if (!migrationError.message.includes('duplicate key value')) {
        console.error('Migration recording failed, but will attempt to execute SQL anyway.');
      } else {
        console.log('Migration already recorded, continuing with execution.');
      }
    }
    
    // Execute the migration directly
    console.log('Executing migration SQL...');
    
    try {
      // Split the migration into individual statements
      const statements = migration.split(';').filter(stmt => stmt.trim() !== '');
      
      for (const statement of statements) {
        console.log(`Executing statement: ${statement.substring(0, 50)}...`);
        const { error: sqlError } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (sqlError) {
          console.error('Error executing SQL statement:', sqlError);
          console.error('Statement:', statement);
          // Continue with other statements
        }
      }
      
      console.log('Migration SQL execution completed');
    } catch (execError) {
      console.error('Error during SQL execution:', execError);
      return;
    }
    
    // 2. Run the crew seed script
    console.log('Running seed script for crew data...');
    try {
      // Import and execute the seed module directly
      require('../db/seeds/002_crew_data.js');
      
      console.log('Seed script started, check logs for completion status');
    } catch (seedError) {
      console.error('Error running seed script:', seedError);
    }
    
    console.log('Setup process initiated successfully');
    
  } catch (error) {
    console.error('Error in setup process:', error);
  }
}

// Run the setup function
setupCrewData(); 