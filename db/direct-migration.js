require('dotenv').config();
const fs = require('fs');
const { Client } = require('pg');

// Read the SQL file
const sql = fs.readFileSync('./sql-for-editor.sql', 'utf8');

// Use the direct connection string for non-pooling connections
const connectionString = process.env.POSTGRES_URL || 'postgres://postgres.vjhrmizwqhmafkxbmfwa:opR70XVU1mnVcgOP@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require';

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
    
    console.log('Executing SQL...');
    await client.query(sql);
    
    console.log('SQL execution completed successfully!');
  } catch (error) {
    console.error('Error executing SQL:', error);
    
    // If the error is related to batch statements, try to split the SQL
    if (error.message && error.message.includes('cannot run multiple')) {
      console.log('Attempting to run SQL as separate statements...');
      const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        try {
          console.log(`Executing statement ${i + 1} of ${statements.length}...`);
          await client.query(statement + ';');
          console.log(`Statement ${i + 1} executed successfully.`);
        } catch (stmtError) {
          console.error(`Error executing statement ${i + 1}:`, stmtError);
        }
      }
    }
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

runMigration().catch(console.error); 