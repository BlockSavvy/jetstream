// Direct database restoration using Supabase client
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Helper to read environment variables from .env.local
function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
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
    console.error(`Error reading file ${filePath}:`, error.message);
    return {};
  }
}

async function runDatabaseCheck() {
  // Load environment variables from .env.local
  const envFilePath = path.join(__dirname, '..', '.env.local');
  const env = loadEnvFile(envFilePath);
  
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Environment variables loaded from:', envFilePath);
  console.log('Supabase URL:', supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : 'Not found');
  console.log('Supabase Key exists:', supabaseKey ? 'Yes' : 'No');

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Required environment variables are missing.');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
  }

  console.log('\nConnecting to Supabase at:', supabaseUrl);

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Check for existing tables
    const existingTables = {};
    
    // Check JetStream core tables
    for (const table of ['profiles', 'jets', 'airports', 'flights', 'bookings', 'fractional_tokens', 'ratings', 'payments']) {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      existingTables[table] = { exists: !error, count: count || 0 };
    }
    
    // Check crew tables
    for (const table of ['pilots_crews', 'crew_reviews', 'specialized_flights', 'custom_itinerary_requests']) {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      existingTables[table] = { exists: !error, count: count || 0 };
    }
    
    // Check JetShare tables
    for (const table of ['jetshare_settings', 'jetshare_offers', 'jetshare_transactions']) {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      existingTables[table] = { exists: !error, count: count || 0 };
    }
    
    console.log('\nDatabase Table Status:');
    console.log('=====================================================');
    console.log('Table                    | Exists | Row Count');
    console.log('-------------------------|--------|----------');
    
    for (const [table, info] of Object.entries(existingTables)) {
      const paddedTable = table.padEnd(25, ' ');
      const paddedExists = info.exists ? 'Yes'.padEnd(8, ' ') : 'No'.padEnd(8, ' ');
      console.log(`${paddedTable}| ${paddedExists}| ${info.count}`);
    }
    
    console.log('=====================================================');
    
    // Determine which tables need to be populated
    const missingTables = Object.entries(existingTables)
      .filter(([_, info]) => !info.exists)
      .map(([table]) => table);
      
    const emptyTables = Object.entries(existingTables)
      .filter(([_, info]) => info.exists && info.count === 0)
      .map(([table]) => table);
      
    if (missingTables.length > 0) {
      console.log('\nMissing tables that need to be created:', missingTables.join(', '));
    }
    
    if (emptyTables.length > 0) {
      console.log('\nEmpty tables that need to be populated:', emptyTables.join(', '));
    }
    
    if (missingTables.length === 0 && emptyTables.length === 0) {
      console.log('\nAll tables exist and have data. No restoration needed.');
    } else {
      console.log('\nRestoration is needed. Please run the SQL scripts to properly set up the database.');
      console.log('You can use the SQL Editor in the Supabase dashboard to execute the SQL scripts in the db folder.');
    }
    
    // Check JetShare data
    console.log('\nJetShare Data:');
    
    const { data: settings, error: settingsError } = await supabase.from('jetshare_settings').select('*');
    if (settingsError) {
      console.log('JetShare Settings: Could not retrieve (table may not exist)');
    } else {
      console.log('JetShare Settings:', settings);
    }
    
    const { data: offers, error: offersError } = await supabase.from('jetshare_offers').select('*').limit(5);
    if (offersError) {
      console.log('JetShare Offers: Could not retrieve (table may not exist)');
    } else {
      console.log(`JetShare Offers (showing ${offers.length} of ${existingTables['jetshare_offers']?.count || 0}):`, offers);
    }
    
  } catch (error) {
    console.error('Error checking database:', error.message);
  }
}

runDatabaseCheck().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
}); 