// Minimal script to populate essential JetStream tables
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

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

async function main() {
  // Load environment variables from .env.local
  const env = loadEnvFile();
  
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('Supabase URL:', supabaseUrl ? supabaseUrl.substring(0, 10) + '...' : 'Not found');
  console.log('Supabase Key exists:', supabaseKey ? 'Yes' : 'No');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Required environment variables are missing.');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    process.exit(1);
  }

  console.log('\nConnecting to Supabase at:', supabaseUrl);

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('\nPopulating JetShare tables...\n');

  try {
    // 1. Populate JetShare Settings table with default settings
    console.log('Populating jetshare_settings...');
    await supabase.from('jetshare_settings').upsert([
      {
        id: 1,
        handling_fee_percentage: 7.5,
        min_share_amount_percentage: 10,
        max_share_amount_percentage: 90,
        platform_status: 'active'
      }
    ], { onConflict: 'id' });
    console.log('JetShare settings populated successfully.');
    
    // 2. Create sample jetshare offers
    console.log('\nCreating sample JetShare offers...');
    const { data: users } = await supabase.from('users').select('id').limit(10);
    
    if (!users || users.length === 0) {
      console.log('No users found in the database. Skipping jetshare_offers creation.');
    } else {
      // Generate 5 sample jetshare offers
      for (let i = 0; i < 5; i++) {
        const userId = users[Math.floor(Math.random() * users.length)].id;
        const departureLocations = ['New York', 'Los Angeles', 'Miami', 'Chicago', 'Dallas'];
        const arrivalLocations = ['Las Vegas', 'San Francisco', 'Boston', 'Seattle', 'Denver'];
        
        const departureIndex = Math.floor(Math.random() * departureLocations.length);
        let arrivalIndex;
        do {
          arrivalIndex = Math.floor(Math.random() * arrivalLocations.length);
        } while (arrivalIndex === departureIndex);
        
        const flightDate = new Date();
        flightDate.setDate(flightDate.getDate() + Math.floor(Math.random() * 30) + 1);
        
        const totalFlightCost = 15000 + Math.floor(Math.random() * 25000);
        const requestedShareAmount = totalFlightCost * (40 + Math.floor(Math.random() * 20)) / 100;
        
        const { data: offer, error } = await supabase.from('jetshare_offers').insert({
          id: uuidv4(),
          user_id: userId,
          flight_date: flightDate.toISOString(),
          departure_location: departureLocations[departureIndex],
          arrival_location: arrivalLocations[arrivalIndex],
          total_flight_cost: totalFlightCost,
          requested_share_amount: requestedShareAmount,
          status: 'open',
          created_at: new Date().toISOString()
        });
        
        if (error) {
          console.error(`Error creating offer ${i+1}:`, error);
        } else {
          console.log(`Created JetShare offer ${i+1}`);
        }
      }
    }
    
    console.log('\nJetShare data population completed successfully!');
    
  } catch (error) {
    console.error('Error populating JetShare data:', error);
  }
}

main(); 