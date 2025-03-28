// Script to try minimal inserts to determine required fields
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

  try {
    // 1. Try ratings with just ID and value
    console.log('\nAttempting minimal ratings insert...');
    
    const { data: flight } = await supabase.from('flights').select('id').limit(1);
    
    if (flight && flight.length > 0) {
      const flightId = flight[0].id;
      
      try {
        const { data, error } = await supabase.from('ratings').insert({
          id: uuidv4(),
          rating: 5
        }).select();
        
        if (error) {
          console.log('Basic ratings insert error:', error.message);
          
          // Try with user_id and flight_id
          try {
            const { data, error } = await supabase.from('ratings').insert({
              id: uuidv4(),
              user_id: 'some-user-id',
              flight_id: flightId,
              rating: 5
            }).select();
            
            if (error) {
              console.log('Ratings with user_id error:', error.message);
              
              // Try with id, flight_id and rating only
              try {
                const { data, error } = await supabase.from('ratings').insert({
                  id: uuidv4(),
                  flight_id: flightId,
                  rating: 5
                }).select();
                
                if (error) {
                  console.log('Ratings with just flight_id error:', error.message);
                } else {
                  console.log('Success! Ratings minimal required fields:', Object.keys(data[0]));
                }
              } catch (e) {
                console.log('Exception on third ratings attempt:', e.message);
              }
            } else {
              console.log('Success! Ratings required fields:', Object.keys(data[0]));
            }
          } catch (e) {
            console.log('Exception on second ratings attempt:', e.message);
          }
        } else {
          console.log('Success! Basic ratings required fields:', Object.keys(data[0]));
        }
      } catch (e) {
        console.log('Exception on first ratings attempt:', e.message);
      }
    }
    
    // 2. Try minimal jetshare_transactions insert
    console.log('\nAttempting minimal jetshare_transactions insert...');
    
    const { data: offer } = await supabase.from('jetshare_offers').select('id').limit(1);
    
    if (offer && offer.length > 0) {
      const offerId = offer[0].id;
      
      try {
        const { data, error } = await supabase.from('jetshare_transactions').insert({
          id: uuidv4()
        }).select();
        
        if (error) {
          console.log('Basic transactions insert error:', error.message);
          
          // Try with just offer_id
          try {
            const { data, error } = await supabase.from('jetshare_transactions').insert({
              id: uuidv4(),
              offer_id: offerId
            }).select();
            
            if (error) {
              console.log('Transactions with offer_id error:', error.message);
              
              // Try with amount
              try {
                const { data, error } = await supabase.from('jetshare_transactions').insert({
                  id: uuidv4(),
                  offer_id: offerId,
                  amount: 1000
                }).select();
                
                if (error) {
                  console.log('Transactions with amount error:', error.message);
                  
                  // One more try with basic fields
                  try {
                    const { data, error } = await supabase.from('jetshare_transactions').insert({
                      id: uuidv4(),
                      offer_id: offerId,
                      amount: 1000,
                      created_at: new Date().toISOString()
                    }).select();
                    
                    if (error) {
                      console.log('Transactions with created_at error:', error.message);
                    } else {
                      console.log('Success! Transactions minimal fields:', Object.keys(data[0]));
                    }
                  } catch (e) {
                    console.log('Exception on fourth transactions attempt:', e.message);
                  }
                } else {
                  console.log('Success! Transactions minimal required fields:', Object.keys(data[0]));
                }
              } catch (e) {
                console.log('Exception on third transactions attempt:', e.message);
              }
            } else {
              console.log('Success! Transactions required fields:', Object.keys(data[0]));
            }
          } catch (e) {
            console.log('Exception on second transactions attempt:', e.message);
          }
        } else {
          console.log('Success! Basic transactions required fields:', Object.keys(data[0]));
        }
      } catch (e) {
        console.log('Exception on first transactions attempt:', e.message);
      }
    }
    
    console.log('\nMinimal insert attempts completed.');
  } catch (error) {
    console.error('Error in minimal inserts:', error);
  }
}

main(); 