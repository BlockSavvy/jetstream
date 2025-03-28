// Script to discover table schemas through trial inserts
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

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
    console.error('Error loading .env file:', error);
    return {};
  }
}

async function main() {
  // Load environment variables from .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  const env = loadEnvFile(envPath);
  
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('Environment variables loaded from:', envPath);
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

  // 1. Try to discover ratings table schema through example insert
  console.log('\nAttempting to discover ratings table schema...');
  
  // Possible columns for ratings table
  const ratingsCols = [
    'id',
    'profile_id',
    'booking_id',   
    'flight_id',    
    'rating',       
    'comment',
    'created_at',
    'user_id'
  ];
  
  // Try a simple insert with a valid profile id
  const { data: profile } = await supabase.from('profiles').select('id').limit(1);
  const { data: flight } = await supabase.from('flights').select('id').limit(1);
  
  if (profile && profile.length > 0 && flight && flight.length > 0) {
    const profileId = profile[0].id;
    const flightId = flight[0].id;
    
    try {
      const { data, error } = await supabase.from('ratings').insert({
        id: uuidv4(),
        profile_id: profileId,
        flight_id: flightId,
        rating: 5,
        comment: "Test rating to discover schema",
        created_at: new Date().toISOString()
      }).select();
      
      if (error) {
        console.log('Error inserting into ratings:', error.message);
        console.log('This suggests we\'re missing required fields or using incorrect field names.');
      } else {
        console.log('Successfully inserted into ratings!');
        console.log('Discovered ratings columns:', Object.keys(data[0]));
      }
    } catch (e) {
      console.log('Exception when inserting into ratings:', e.message);
    }
  }
  
  // 2. Try to discover jetshare_transactions table schema
  console.log('\nAttempting to discover jetshare_transactions table schema...');
  
  // Possible columns for jetshare_transactions table
  const transactionCols = [
    'id',
    'offer_id',
    'payer_user_id',
    'recipient_user_id',
    'amount',
    'handling_fee',
    'fee_percentage',
    'payment_method',
    'payment_status',
    'transaction_date',
    'created_at'
  ];
  
  // Get a valid offer id
  const { data: offer } = await supabase.from('jetshare_offers').select('id, user_id').limit(1);
  
  if (offer && offer.length > 0) {
    const offerId = offer[0].id;
    const userId = offer[0].user_id || (profile && profile.length > 0 ? profile[0].id : null);
    
    if (userId) {
      try {
        const { data, error } = await supabase.from('jetshare_transactions').insert({
          id: uuidv4(),
          offer_id: offerId,
          payer_user_id: userId,
          recipient_user_id: userId,
          amount: 1000,
          fee_percentage: 7.5,  // Try this instead of handling_fee
          payment_method: 'fiat',
          payment_status: 'completed',
          transaction_date: new Date().toISOString()
        }).select();
        
        if (error) {
          console.log('Error inserting into jetshare_transactions:', error.message);
          console.log('This suggests we\'re missing required fields or using incorrect field names.');
          
          // Try another variation
          try {
            const { data, error } = await supabase.from('jetshare_transactions').insert({
              id: uuidv4(),
              offer_id: offerId,
              payer_id: userId,           // Different field name
              recipient_id: userId,       // Different field name
              amount: 1000,
              commission: 75,             // Different field name
              payment_type: 'fiat',       // Different field name
              status: 'completed',        // Different field name
              created_at: new Date().toISOString()
            }).select();
            
            if (error) {
              console.log('Second attempt error:', error.message);
            } else {
              console.log('Successfully inserted into jetshare_transactions on second attempt!');
              console.log('Discovered jetshare_transactions columns:', Object.keys(data[0]));
            }
          } catch (e) {
            console.log('Exception on second attempt:', e.message);
          }
        } else {
          console.log('Successfully inserted into jetshare_transactions!');
          console.log('Discovered jetshare_transactions columns:', Object.keys(data[0]));
        }
      } catch (e) {
        console.log('Exception when inserting into jetshare_transactions:', e.message);
      }
    } else {
      console.log('Could not find valid user ID for transaction test.');
    }
  } else {
    console.log('Could not find any jetshare offers for transaction test.');
  }
  
  console.log('\nSchema discovery attempts completed.');
}

main(); 