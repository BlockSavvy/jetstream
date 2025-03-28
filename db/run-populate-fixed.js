// Script to populate empty tables in the JetStream database (fixed version)
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

async function populateTables() {
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

  console.log('\nPopulating empty tables (fixed version)...');
  
  try {
    // Execute individual insert operations using the REST API
    
    // Flights doesn't have crew_id column according to schema check
    console.log('\nPopulating flights table...');
    await populateFlights(supabase);
    
    // Populate bookings after flights
    console.log('\nPopulating bookings table...');
    await populateBookings(supabase);
    
    // Create ratings after flights and bookings
    console.log('\nPopulating ratings table...');
    await populateRatings(supabase);
    
    // Create payments after bookings
    console.log('\nPopulating payments table...');
    await populatePayments(supabase);
    
    // Create JetShare transactions
    console.log('\nPopulating jetshare_transactions table...');
    await populateJetShareTransactions(supabase);
    
    console.log('\nAll tables populated successfully using REST API!');
  } catch (error) {
    console.error('Error during population:', error.message);
  }
}

async function populateFlights(supabase) {
  // Fetch jets and airports
  const { data: jets, error: jetsError } = await supabase
    .from('jets')
    .select('id')
    .limit(10);
  
  if (jetsError || !jets || jets.length === 0) {
    console.error('Could not fetch jets:', jetsError?.message || 'No jets found');
    return;
  }
  
  const { data: airports, error: airportsError } = await supabase
    .from('airports')
    .select('code')
    .limit(10);
  
  if (airportsError || !airports || airports.length === 0) {
    console.error('Could not fetch airports:', airportsError?.message || 'No airports found');
    return;
  }
  
  // Create flights
  for (let i = 0; i < 10; i++) {
    const jet = jets[Math.floor(Math.random() * jets.length)];
    const originAirport = airports[Math.floor(Math.random() * airports.length)];
    
    // Ensure different destination
    let destinationAirport;
    do {
      destinationAirport = airports[Math.floor(Math.random() * airports.length)];
    } while (destinationAirport.code === originAirport.code);
    
    // Set times
    const departureTime = new Date();
    departureTime.setDate(departureTime.getDate() + Math.floor(Math.random() * 30));
    
    const arrivalTime = new Date(departureTime);
    arrivalTime.setHours(arrivalTime.getHours() + 2 + Math.floor(Math.random() * 8));
    
    // Set price and capacity
    const basePrice = 5000 + Math.floor(Math.random() * 25000);
    const availableSeats = 4 + Math.floor(Math.random() * 12);
    
    // Create flight
    const { data: flight, error: flightError } = await supabase
      .from('flights')
      .insert({
        jet_id: jet.id,
        origin_airport: originAirport.code,
        destination_airport: destinationAirport.code,
        departure_time: departureTime.toISOString(),
        arrival_time: arrivalTime.toISOString(),
        available_seats: availableSeats,
        base_price: basePrice,
        status: 'scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (flightError) {
      console.error(`Error creating flight:`, flightError.message);
      
      // Log the attempted data structure
      console.log('Attempted flight data structure:', {
        jet_id: jet.id,
        origin_airport: originAirport.code,
        destination_airport: destinationAirport.code,
        departure_time: departureTime.toISOString(),
        arrival_time: arrivalTime.toISOString(),
        available_seats: availableSeats,
        base_price: basePrice,
        status: 'scheduled'
      });
    } else {
      console.log(`Created flight ${i+1}/10 with ID: ${flight.id}`);
    }
  }
}

async function populateBookings(supabase) {
  // Fetch flights and users
  const { data: flights, error: flightsError } = await supabase
    .from('flights')
    .select('id, base_price')
    .limit(10);
  
  if (flightsError || !flights || flights.length === 0) {
    console.error('Could not fetch flights:', flightsError?.message || 'No flights found');
    return;
  }
  
  const { data: travelers, error: travelersError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_type', 'traveler')
    .limit(10);
  
  if (travelersError || !travelers || travelers.length === 0) {
    console.error('Could not fetch travelers:', travelersError?.message || 'No travelers found');
    return;
  }
  
  // Create bookings
  let bookingsCreated = 0;
  
  for (const flight of flights) {
    const numBookings = 1 + Math.floor(Math.random() * 3);
    
    for (let j = 0; j < numBookings; j++) {
      const traveler = travelers[Math.floor(Math.random() * travelers.length)];
      const seatsBooked = 1 + Math.floor(Math.random() * 2);
      const totalPrice = flight.base_price * seatsBooked;
      
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: traveler.id,
          flight_id: flight.id,
          seats_booked: seatsBooked,
          booking_status: 'confirmed',
          total_price: totalPrice,
          payment_status: 'paid',
          ticket_code: 'TKT-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (bookingError) {
        console.error('Error creating booking:', bookingError.message);
        
        // Log the attempted data structure
        console.log('Attempted booking data structure:', {
          user_id: traveler.id,
          flight_id: flight.id,
          seats_booked: seatsBooked,
          booking_status: 'confirmed',
          total_price: totalPrice,
          payment_status: 'paid',
          ticket_code: 'TKT-' + Math.random().toString(36).substring(2, 10).toUpperCase()
        });
      } else {
        bookingsCreated++;
        console.log(`Created booking ${bookingsCreated} for flight ${flight.id}`);
      }
    }
  }
}

async function populateRatings(supabase) {
  // Fetch profiles and flights
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_type', 'traveler')
    .limit(10);
  
  if (profilesError || !profiles || profiles.length === 0) {
    console.error('Could not fetch profiles:', profilesError?.message || 'No profiles found');
    return;
  }
  
  const { data: flights, error: flightsError } = await supabase
    .from('flights')
    .select('id')
    .limit(5);
  
  if (flightsError || !flights || flights.length === 0) {
    console.error('Could not fetch flights:', flightsError?.message || 'No flights found');
    return;
  }
  
  const comments = [
    'Excellent service and communication!',
    'Very professional and punctual.',
    'Great experience, would recommend.',
    'Friendly and accommodating.',
    'Outstanding experience from start to finish.'
  ];
  
  // Create ratings
  let ratingsCreated = 0;
  
  for (let i = 0; i < 10; i++) {
    // Get two different profiles
    const fromIndex = Math.floor(Math.random() * profiles.length);
    let toIndex;
    do {
      toIndex = Math.floor(Math.random() * profiles.length);
    } while (toIndex === fromIndex);
    
    const flight = flights[Math.floor(Math.random() * flights.length)];
    const rating = 4 + Math.floor(Math.random() * 2); // 4 or 5
    const comment = comments[Math.floor(Math.random() * comments.length)];
    
    const { data, error } = await supabase
      .from('ratings')
      .insert({
        from_user_id: profiles[fromIndex].id,
        to_user_id: profiles[toIndex].id,
        flight_id: flight.id,
        rating: rating,
        comment: comment,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000)).toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating rating:', error.message);
      
      // Log the attempted data structure
      console.log('Attempted rating data structure:', {
        from_user_id: profiles[fromIndex].id,
        to_user_id: profiles[toIndex].id,
        flight_id: flight.id,
        rating: rating,
        comment: comment
      });
    } else {
      ratingsCreated++;
      console.log(`Created rating ${ratingsCreated}/10`);
    }
  }
}

async function populatePayments(supabase) {
  // Fetch bookings with user_id
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, user_id, total_price, created_at, updated_at')
    .eq('payment_status', 'paid')
    .limit(10);
  
  if (bookingsError || !bookings || bookings.length === 0) {
    console.error('Could not fetch bookings:', bookingsError?.message || 'No bookings found');
    return;
  }
  
  const paymentMethods = ['credit_card', 'crypto', 'bank_transfer'];
  const processors = ['Stripe', 'Coinbase Commerce'];
  
  // Create payments
  let paymentsCreated = 0;
  
  for (const booking of bookings) {
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const processor = processors[Math.floor(Math.random() * processors.length)];
    
    const { data, error } = await supabase
      .from('payments')
      .insert({
        booking_id: booking.id,
        user_id: booking.user_id,
        amount: booking.total_price,
        currency: 'USD',
        payment_method: paymentMethod,
        payment_status: 'completed',
        transaction_id: 'TXN-' + Math.random().toString(36).substring(2, 12).toUpperCase(),
        payment_details: {
          processor: processor,
          card_last4: paymentMethod === 'credit_card' ? Math.floor(1000 + Math.random() * 9000).toString() : null
        },
        created_at: new Date(new Date(booking.created_at).getTime() + Math.floor(Math.random() * 2 * 60 * 60 * 1000)).toISOString(),
        updated_at: new Date(new Date(booking.updated_at).getTime() + Math.floor(Math.random() * 3 * 60 * 60 * 1000)).toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating payment:', error.message);
      
      // Log the attempted data structure
      console.log('Attempted payment data structure:', {
        booking_id: booking.id,
        user_id: booking.user_id,
        amount: booking.total_price,
        currency: 'USD',
        payment_method: paymentMethod,
        payment_status: 'completed',
        payment_details: {
          processor: processor,
          card_last4: paymentMethod === 'credit_card' ? Math.floor(1000 + Math.random() * 9000).toString() : null
        }
      });
    } else {
      paymentsCreated++;
      console.log(`Created payment ${paymentsCreated}/${bookings.length}`);
    }
  }
}

async function populateJetShareTransactions(supabase) {
  // Fetch JetShare offers that have been accepted or completed
  const { data: offers, error: offersError } = await supabase
    .from('jetshare_offers')
    .select('id, user_id, matched_user_id, requested_share_amount, created_at')
    .in('status', ['accepted', 'completed'])
    .not('matched_user_id', 'is', null)
    .limit(10);
  
  if (offersError || !offers || offers.length === 0) {
    console.error('Could not fetch JetShare offers:', offersError?.message || 'No offers found');
    return;
  }
  
  // Create transactions
  let transactionsCreated = 0;
  
  for (const offer of offers) {
    const { data, error } = await supabase
      .from('jetshare_transactions')
      .insert({
        offer_id: offer.id,
        payer_user_id: offer.matched_user_id,
        recipient_user_id: offer.user_id,
        amount: offer.requested_share_amount,
        handling_fee: offer.requested_share_amount * 0.075,
        payment_method: Math.random() < 0.7 ? 'fiat' : 'crypto',
        payment_status: Math.random() < 0.8 ? 'completed' : 'pending',
        transaction_date: new Date(new Date(offer.created_at).getTime() + Math.floor(Math.random() * 24 * 60 * 60 * 1000)).toISOString(),
        transaction_reference: 'JSTXN-' + Math.random().toString(36).substring(2, 12).toUpperCase(),
        receipt_url: Math.random() < 0.7 ? '/receipts/' + Math.random().toString(36).substring(2, 10).toUpperCase() + '.pdf' : null
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating JetShare transaction:', error.message);
      
      // Log the attempted data structure
      console.log('Attempted transaction data structure:', {
        offer_id: offer.id,
        payer_user_id: offer.matched_user_id,
        recipient_user_id: offer.user_id,
        amount: offer.requested_share_amount,
        handling_fee: offer.requested_share_amount * 0.075,
        payment_method: Math.random() < 0.7 ? 'fiat' : 'crypto',
        payment_status: Math.random() < 0.8 ? 'completed' : 'pending',
        transaction_reference: 'JSTXN-' + Math.random().toString(36).substring(2, 12).toUpperCase()
      });
    } else {
      transactionsCreated++;
      console.log(`Created JetShare transaction ${transactionsCreated}/${offers.length}`);
    }
  }
}

populateTables().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
}); 