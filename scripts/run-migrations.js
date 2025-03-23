#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Setup readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\x1b[36m%s\x1b[0m', '🚀 JetStream Database Migration Tool');
console.log('\x1b[33m%s\x1b[0m', '==================================');

const migrationsDir = path.join(__dirname, '..', 'migrations');

// Check if migrations directory exists
if (!fs.existsSync(migrationsDir)) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Migrations directory not found!');
  console.log('Creating migrations directory...');
  fs.mkdirSync(migrationsDir, { recursive: true });
  
  // Create placeholder SQL files if they don't exist
  const profilesSqlPath = path.join(migrationsDir, 'profiles.sql');
  const travelPrefsSqlPath = path.join(migrationsDir, 'travel_preferences.sql');
  
  if (!fs.existsSync(profilesSqlPath)) {
    console.log('Creating profiles.sql...');
    fs.writeFileSync(profilesSqlPath, '-- Profiles table migration');
  }
  
  if (!fs.existsSync(travelPrefsSqlPath)) {
    console.log('Creating travel_preferences.sql...');
    fs.writeFileSync(travelPrefsSqlPath, '-- Travel preferences table migration');
  }
  
  console.log('\x1b[32m%s\x1b[0m', '✅ Migration files created.');
  console.log('\x1b[33m%s\x1b[0m', 'Please add SQL migration commands to these files and run this tool again.');
  process.exit(0);
}

// List all SQL files in the migrations directory
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .map(file => path.join(migrationsDir, file));

if (migrationFiles.length === 0) {
  console.error('\x1b[31m%s\x1b[0m', '❌ No SQL migration files found in the migrations directory!');
  process.exit(1);
}

console.log('\x1b[36m%s\x1b[0m', 'Found migration files:');
migrationFiles.forEach((file, index) => {
  console.log(`${index + 1}. ${path.basename(file)}`);
});

// Two ways to run migrations:
console.log('\n\x1b[33m%s\x1b[0m', 'Migration Options:');
console.log('1. Manual SQL execution (recommended)');
console.log('2. Supabase CLI (requires local setup)');

rl.question('\nSelect option (1-2): ', (answer) => {
  if (answer === '1') {
    // Manual SQL execution guide
    console.log('\n\x1b[36m%s\x1b[0m', '📋 Manual SQL Execution Steps:');
    console.log('\x1b[33m%s\x1b[0m', '-----------------------------');
    console.log('1. Go to your Supabase dashboard: https://app.supabase.io');
    console.log('2. Open your project');
    console.log('3. Go to the SQL Editor tab');
    console.log('4. Copy and paste the following SQL commands:');
    
    migrationFiles.forEach(file => {
      console.log('\n\x1b[32m%s\x1b[0m', `-- ${path.basename(file)} --`);
      console.log(fs.readFileSync(file, 'utf8'));
    });
    
    console.log('\n\x1b[36m%s\x1b[0m', '5. Run the SQL commands');
    console.log('\x1b[32m%s\x1b[0m', '✅ Migrations will be applied after executing these SQL commands in the Supabase dashboard.');
    rl.close();
  } else if (answer === '2') {
    // Check if Supabase CLI is installed
    try {
      execSync('supabase -v', { stdio: 'ignore' });
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', '❌ Supabase CLI not found! Please install it first:');
      console.log('npm install -g supabase');
      rl.close();
      process.exit(1);
    }
    
    console.log('\x1b[33m%s\x1b[0m', 'This option requires Supabase CLI login and project setup.');
    
    rl.question('Enter your Supabase project reference ID: ', (projectRef) => {
      rl.question('Enter your Supabase database password: ', (dbPassword) => {
        console.log('\n\x1b[36m%s\x1b[0m', '🔄 Running migrations with Supabase CLI...');
        
        try {
          migrationFiles.forEach(file => {
            console.log(`Running ${path.basename(file)}...`);
            const sql = fs.readFileSync(file, 'utf8');
            
            // Create a temporary file with the SQL content
            const tempFile = path.join(__dirname, `temp_${Date.now()}.sql`);
            fs.writeFileSync(tempFile, sql);
            
            // Run the SQL using Supabase CLI
            execSync(`supabase db execute --project-ref ${projectRef} -f ${tempFile}`, {
              stdio: 'inherit',
              env: {
                ...process.env,
                SUPABASE_DB_PASSWORD: dbPassword
              }
            });
            
            // Delete the temporary file
            fs.unlinkSync(tempFile);
          });
          
          console.log('\n\x1b[32m%s\x1b[0m', '✅ Migrations completed successfully!');
        } catch (error) {
          console.error('\x1b[31m%s\x1b[0m', '❌ Migration failed:');
          console.error(error.message);
        }
        
        rl.close();
      });
    });
  } else {
    console.error('\x1b[31m%s\x1b[0m', '❌ Invalid option!');
    rl.close();
    process.exit(1);
  }
}); 