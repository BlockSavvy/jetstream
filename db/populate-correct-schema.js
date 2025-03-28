// Final script to correctly populate ratings and transactions tables
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

  console.log('\nPopulating tables with correct schema...\n');

  try {
    // 1. Get necessary IDs for ratings
    console.log('Populating ratings table...');
    
    const { data: flight } = await supabase.from('flights').select('id').limit(10);
    const { data: profile } = await supabase.from('profiles').select('id').limit(1);
    
    if (flight && flight.length > 0 && profile && profile.length > 0) {
      const profileId = profile[0].id;
      
      // Create 5 ratings using the correct schema
      for (let i = 0; i < 5; i++) {
        const flightId = flight[i % flight.length].id;
        const rating = 3 + Math.floor(Math.random() * 3); // 3-5 star ratings
        const comments = [
          "Great flight, excellent service!",
          "Very comfortable journey, would book again.",
          "The pilot was professional and the flight was smooth.",
          "Excellent experience from start to finish.",
          "Really enjoyed the journey, highly recommended."
        ][i % 5];
        
        // Based on the discover-schema.js results, we need to use from_user_id and to_user_id
        try {
          const { data: ratingData, error: ratingError } = await supabase
            .from('ratings')
            .insert({
              id: uuidv4(),
              from_user_id: profileId,  // Using profile ID as the user ID
              to_user_id: profileId,    // Using the same ID as recipient for simplicity
              flight_id: flightId,
              rating: rating,
              comment: comments,
              created_at: new Date().toISOString()
            });
          
          if (ratingError) {
            console.error(`Error creating rating ${i+1}:`, ratingError);
          } else {
            console.log(`Created rating ${i+1}`);
          }
        } catch (e) {
          console.error(`Error creating rating ${i+1}:`, e);
        }
      }
    } else {
      console.log('Unable to get flight or profile data. Skipping ratings creation.');
    }
    
    // 2. Populate JetShare Transactions with correct schema
    console.log('\nPopulating jetshare_transactions table...');
    
    // Get JetShare offers
    const { data: offers } = await supabase
      .from('jetshare_offers')
      .select('id, user_id, requested_share_amount')
      .eq('status', 'open')
      .limit(5);
    
    if (offers && offers.length > 0 && profile && profile.length > 0) {
      const profileId = profile[0].id;
      
      // Create 3 transactions
      for (let i = 0; i < 3; i++) {
        const offer = offers[i % offers.length];
        const amount = offer.requested_share_amount || 5000 + Math.floor(Math.random() * 10000);
        
        // Based on the discover-schema.js results, we should use these field names
        try {
          const { data: transactionData, error: transactionError } = await supabase
            .from('jetshare_transactions')
            .insert({
              id: uuidv4(),
              offer_id: offer.id,
              payer_user_id: profileId,
              recipient_user_id: offer.user_id || profileId,
              amount: amount,
              payment_status: 'completed',
              transaction_date: new Date().toISOString(),
              payment_details: JSON.stringify({
                method: Math.random() > 0.5 ? 'fiat' : 'crypto',
                processor: Math.random() > 0.5 ? 'stripe' : 'coinbase'
              }),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          if (transactionError) {
            console.error(`Error creating transaction ${i+1}:`, transactionError);
          } else {
            console.log(`Created transaction ${i+1}`);
            
            // Update offer status to 'completed'
            const { data: updateData, error: updateError } = await supabase
              .from('jetshare_offers')
              .update({ status: 'completed', matched_user_id: profileId })
              .eq('id', offer.id);
            
            if (updateError) {
              console.error(`Error updating offer ${offer.id}:`, updateError);
            } else {
              console.log(`Updated offer ${offer.id} to completed`);
            }
          }
        } catch (e) {
          console.error(`Error creating transaction ${i+1}:`, e);
        }
      }
    } else {
      console.log('No offers or profiles found. Skipping transactions creation.');
    }
    
    console.log('\nData population completed successfully!');
    
  } catch (error) {
    console.error('Error populating data:', error);
  }
}

main(); 