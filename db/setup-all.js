// Master script to set up and populate the JetStream database
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');

// Helper to read environment variables from .env.local in the project root
function loadEnvFile() {
  try {
    // Always look for .env.local in the project root, not in the current directory
    const projectRoot = path.resolve(__dirname, '..');
    const envPath = path.join(projectRoot, '.env.local');
    
    console.log('Looking for environment variables at:', envPath);
    
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    const env = {};
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const match = trimmedLine.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          env[key] = value;
        }
      }
    }
    return env;
  } catch (error) {
    console.error('Error loading .env file:', error);
    return {};
  }
}

// Helper function to run a script and return a promise
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`\nRunning script: ${scriptPath}`);
    
    // Set up environment variables
    const env = loadEnvFile();
    
    // Create a copy of the current process.env
    const childEnv = { ...process.env };
    
    // Add our loaded env variables
    if (env.NEXT_PUBLIC_SUPABASE_URL) {
      childEnv.NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
    }
    if (env.SUPABASE_SERVICE_ROLE_KEY) {
      childEnv.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
    }
    
    // Run the script with our environment variables
    const childProcess = spawn('node', [scriptPath], { 
      stdio: 'inherit',
      env: childEnv
    });
    
    childProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Script ${scriptPath} exited with code ${code}`));
      } else {
        resolve();
      }
    });
    
    childProcess.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  console.log('=== JetStream Database Setup ===');
  
  try {
    // 1. Check connection to Supabase
    console.log('\n=== Step 1: Testing connection to Supabase ===');
    await runScript(path.join(__dirname, 'test-connection-with-env.js'));
    
    // 2. Check existing tables and their row counts
    console.log('\n=== Step 2: Checking existing tables ===');
    await runScript(path.join(__dirname, 'check-tables-info-schema.js'));
    
    // 3. Populate JetShare settings
    console.log('\n=== Step 3: Populating JetShare settings ===');
    await runScript(path.join(__dirname, 'populate-minimal.js'));
    
    // 4. Populate ratings and JetShare transactions
    console.log('\n=== Step 4: Populating ratings and JetShare transactions ===');
    await runScript(path.join(__dirname, 'populate-correct-schema.js'));
    
    // 5. Verify final state
    console.log('\n=== Step 5: Verifying final database state ===');
    await runScript(path.join(__dirname, 'check-tables-info-schema.js'));
    
    console.log('\n=== JetStream Database Setup Complete! ===');
    console.log('All tables have been populated with sample data.');
    console.log('You can now run the application with:');
    console.log('  npm run dev');
  } catch (error) {
    console.error('\n=== Error during setup ===');
    console.error(error);
    process.exit(1);
  }
}

main(); 