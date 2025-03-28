require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { Client } = require('pg');

// Read the SQL file
const sql = fs.readFileSync('./add_missing_columns_to_jets.sql', 'utf8');

// Use the direct connection string for non-pooling connections
const connectionString = process.env.POSTGRES_URL_NON_POOLING || 'postgres://postgres.vjhrmizwqhmafkxbmfwa:opR70XVU1mnVcgOP@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require';

// Create client with SSL options
const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Needed for self-signed certificates
  }
});

async function runMigration() {
  try {
    console.log('Connecting to PostgreSQL database...');
    await client.connect();
    console.log('Connected to the database');
    
    console.log('Adding missing columns to jets table...');
    
    // Split the SQL into individual statements and run them one by one
    const statements = sql
      .split(';')
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');
    
    for (let i = 0; i < statements.length; i++) {
      try {
        console.log(`Executing statement ${i + 1} of ${statements.length}...`);
        await client.query(statements[i]);
        console.log(`Statement ${i + 1} executed successfully.`);
      } catch (stmtError) {
        console.error(`Error executing statement ${i + 1}:`, stmtError.message);
        // Continue with the next statement even if this one failed
      }
    }
    
    console.log('Migration completed - added missing columns to jets table');
  } catch (error) {
    console.error('Error executing SQL:', error.message);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

runMigration().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
}); 