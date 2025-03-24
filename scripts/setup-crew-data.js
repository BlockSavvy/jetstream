require('dotenv').config();
const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupCrewData() {
  try {
    console.log('Starting setup process for Pilots & Crew Specialization feature...');
    
    // 1. Run the SQL migration script
    console.log('Running SQL migration for crew tables...');
    const migrationFile = path.join(__dirname, '../db/migrations/001_pilots_crew_tables.sql');
    const migration = fs.readFileSync(migrationFile, 'utf8');
    
    const { error: migrationError } = await supabase.from('_db_migrations').insert({
      name: '001_pilots_crew_tables',
      sql: migration,
      executed_at: new Date().toISOString()
    });
    
    if (migrationError) {
      console.error('Error recording migration:', migrationError);
    }
    
    // Execute the migration directly
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql_query: migration });
    
    if (sqlError) {
      console.error('Error executing migration SQL:', sqlError);
      return;
    }
    
    console.log('Migration completed successfully');
    
    // 2. Run the crew seed script
    console.log('Running seed script for crew data...');
    try {
      // Import and execute the seed function from the seed file
      const seedFile = require('../db/seeds/002_crew_data.js');
      
      console.log('Seed script completed successfully');
    } catch (seedError) {
      console.error('Error running seed script:', seedError);
    }
    
    console.log('Setup process completed successfully');
    
  } catch (error) {
    console.error('Error in setup process:', error);
  }
}

// Run the setup function
setupCrewData(); 