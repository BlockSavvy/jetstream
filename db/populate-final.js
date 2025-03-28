// Final script to populate remaining tables (ratings and jetshare_transactions)
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

  console.log('\nPopulating remaining tables...\n');

  try {
    // 1. Populate ratings table
    console.log('Populating ratings table...');
    
    // Get bookings for rating
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, flight_id')
      .limit(10);
    
    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
    } else if (bookings && bookings.length > 0) {
      // Get profile info for ratings
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else if (profile && profile.length > 0) {
        const profileId = profile[0].id;
        
        // Create 5 ratings
        for (let i = 0; i < 5; i++) {
          const booking = bookings[i % bookings.length];
          const rating = 3 + Math.floor(Math.random() * 3); // 3-5 star ratings
          const comments = [
            "Great flight, excellent service!",
            "Very comfortable journey, would book again.",
            "The pilot was professional and the flight was smooth.",
            "Excellent experience from start to finish.",
            "Really enjoyed the journey, highly recommended."
          ][i % 5];
          
          try {
            const { data: ratingData, error: ratingError } = await supabase
              .from('ratings')
              .insert({
                id: uuidv4(),
                profile_id: profileId,
                booking_id: booking.id,
                flight_id: booking.flight_id,
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
        console.log('No profiles found. Skipping ratings creation.');
      }
    } else {
      console.log('No bookings found. Skipping ratings creation.');
    }
    
    // 2. Populate JetShare Transactions
    console.log('\nPopulating jetshare_transactions table...');
    
    // Get profile for transactions
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(2);
    
    // Get JetShare offers
    const { data: offers, error: offersError } = await supabase
      .from('jetshare_offers')
      .select('id, user_id, requested_share_amount')
      .eq('status', 'open')
      .limit(5);
    
    if (offersError) {
      console.error('Error fetching offers:', offersError);
    } else if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    } else if (offers && offers.length > 0 && profiles && profiles.length > 0) {
      // Create 3 completed transactions
      for (let i = 0; i < 3; i++) {
        const offer = offers[i % offers.length];
        const recipientId = offer.user_id || profiles[0].id;
        const payerId = profiles[0].id === recipientId ? profiles[0].id : profiles[0].id;
        const amount = offer.requested_share_amount || 5000 + Math.floor(Math.random() * 10000);
        const handlingFee = Math.round(amount * 0.075 * 100) / 100; // 7.5% handling fee
        
        try {
          const { data: transactionData, error: transactionError } = await supabase
            .from('jetshare_transactions')
            .insert({
              id: uuidv4(),
              offer_id: offer.id,
              payer_user_id: payerId, 
              recipient_user_id: recipientId,
              amount: amount,
              handling_fee: handlingFee,
              payment_method: Math.random() > 0.5 ? 'fiat' : 'crypto',
              payment_status: 'completed',
              transaction_date: new Date().toISOString()
            });
          
          if (transactionError) {
            console.error(`Error creating transaction ${i+1}:`, transactionError);
          } else {
            console.log(`Created transaction ${i+1}`);
            
            // Update offer status to 'completed'
            const { data: updateData, error: updateError } = await supabase
              .from('jetshare_offers')
              .update({ status: 'completed', matched_user_id: payerId })
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