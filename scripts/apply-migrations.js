#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Get environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Environment variables NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Get migrations directory
const migrationsDir = path.join(__dirname, '..', 'migrations');

async function applyMigrations() {
  console.log('Starting migration process...');
  
  try {
    // Read migration files
    const files = fs.readdirSync(migrationsDir).filter(file => file.endsWith('.sql'));
    
    if (files.length === 0) {
      console.log('No migration files found');
      return;
    }
    
    console.log(`Found ${files.length} migration files to process`);
    
    // Process each migration file
    for (const file of files) {
      console.log(`Processing migration file: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Execute the SQL
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.error(`Error applying migration ${file}:`, error);
      } else {
        console.log(`Successfully applied migration: ${file}`);
      }
    }
    
    console.log('Migration process completed successfully');
  } catch (error) {
    console.error('Error during migration process:', error);
    process.exit(1);
  }
}

// Run the migration function
applyMigrations(); 