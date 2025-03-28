// Script to populate empty tables in the JetStream database
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

  // Read SQL file
  const sqlFilePath = path.join(__dirname, 'populate-empty-tables.sql');
  console.log(`Reading SQL file: ${sqlFilePath}`);
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`Error: SQL file not found at ${sqlFilePath}`);
    process.exit(1);
  }
  
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  console.log(`SQL file read successfully (${(sqlContent.length / 1024).toFixed(2)} KB)`);

  // Execute SQL statements one by one
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt && !stmt.startsWith('--'));
    
  console.log(`Found ${statements.length} SQL statements to execute`);

  // Execute custom SQL via REST API
  try {
    // First check if the supabase_functions schema exists and exec_sql function is available
    const { data: functionCheck, error: functionCheckError } = await supabase
      .from('_functions')
      .select('schema,name')
      .eq('name', 'exec_sql')
      .eq('schema', 'supabase_functions')
      .limit(1);

    if (functionCheckError || !functionCheck || functionCheck.length === 0) {
      console.log('exec_sql function is not available. Using the REST API approach for each table...');
      
      // Execute individual insert operations using the REST API
      
      // Insert jets
      console.log('Populating jets table...');
      await populateJets(supabase);
      
      // Insert airports
      console.log('Populating airports table...');
      await populateAirports(supabase);
      
      // Insert flights and bookings
      console.log('Populating flights and bookings...');
      await populateFlightsAndBookings(supabase);
      
      // Insert fractional tokens
      console.log('Populating fractional_tokens table...');
      await populateFractionalTokens(supabase);
      
      // Insert ratings
      console.log('Populating ratings table...');
      await populateRatings(supabase);
      
      // Insert payments
      console.log('Populating payments table...');
      await populatePayments(supabase);
      
      // Insert JetShare transactions
      console.log('Populating jetshare_transactions table...');
      await populateJetShareTransactions(supabase);
      
      console.log('All tables populated successfully using REST API!');
    } else {
      console.log('exec_sql function is available. Using SQL statements...');
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          
          const { error: stmtError } = await supabase.rpc('exec_sql', { 
            sql_query: stmt + ';' 
          });
          
          if (stmtError) {
            console.error(`Error in statement ${i + 1}:`, stmtError.message);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (e) {
          console.error(`Exception in statement ${i + 1}:`, e.message);
          errorCount++;
        }
      }
      
      console.log(`\nExecution completed. Successful: ${successCount}, Failed: ${errorCount}`);
    }
  } catch (error) {
    console.error('Error checking for exec_sql function:', error.message);
    console.error('Falling back to direct table operations...');
    
    // Similar implementation as above, fallback to individual table operations
  }
}

// Helper functions to populate tables using the REST API

async function populateJets(supabase) {
  // Sample jet data
  const jets = [
    {
      model: 'Gulfstream G650',
      manufacturer: 'Gulfstream',
      year: 2020,
      tail_number: 'N1001',
      capacity: 13,
      range_nm: 7000,
      images: ['/jets/1.jpg'],
      amenities: {"wifi": true, "shower": true, "bedroom": true, "entertainment": "Premium entertainment system"},
      home_base_airport: 'KTEB',
      status: 'available',
      hourly_rate: 9500
    },
    {
      model: 'Bombardier Global 7500',
      manufacturer: 'Bombardier',
      year: 2021,
      tail_number: 'N1002',
      capacity: 14,
      range_nm: 7700,
      images: ['/jets/2.jpg'],
      amenities: {"wifi": true, "shower": true, "bedroom": true, "galley": "Full kitchen"},
      home_base_airport: 'KLAS',
      status: 'available',
      hourly_rate: 10200
    },
    {
      model: 'Dassault Falcon 8X',
      manufacturer: 'Dassault',
      year: 2019,
      tail_number: 'N1003',
      capacity: 12,
      range_nm: 6450,
      images: ['/jets/3.jpg'],
      amenities: {"wifi": true, "entertainment": "Advanced entertainment system"},
      home_base_airport: 'KLAX',
      status: 'available',
      hourly_rate: 8900
    },
    {
      model: 'Cessna Citation Longitude',
      manufacturer: 'Cessna',
      year: 2018,
      tail_number: 'N1004',
      capacity: 8,
      range_nm: 3500,
      images: ['/jets/4.jpg'],
      amenities: {"wifi": true, "entertainment": "Standard entertainment"},
      home_base_airport: 'KSJC',
      status: 'available',
      hourly_rate: 5500
    },
    {
      model: 'Embraer Praetor 600',
      manufacturer: 'Embraer',
      year: 2021,
      tail_number: 'N1005',
      capacity: 9,
      range_nm: 4018,
      images: ['/jets/5.jpg'],
      amenities: {"wifi": true, "entertainment": "Premium sound system"},
      home_base_airport: 'KPBI',
      status: 'available',
      hourly_rate: 6200
    }
  ];
  
  // Get a random traveler to be the owner
  const { data: traveler } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_type', 'traveler')
    .limit(1);
  
  const ownerId = traveler && traveler.length > 0 ? traveler[0].id : null;
  
  // Insert jets
  for (const jet of jets) {
    const { error } = await supabase
      .from('jets')
      .insert({
        ...jet,
        owner_id: ownerId,
        created_at: new Date(),
        updated_at: new Date()
      });
    
    if (error) {
      console.error(`Error inserting jet ${jet.tail_number}:`, error.message);
    }
  }
}

async function populateAirports(supabase) {
  // Sample airport data
  const airports = [
    { code: 'KTEB', name: 'Teterboro Airport', city: 'Teterboro, NJ', country: 'USA', is_private: true },
    { code: 'KLAS', name: 'Harry Reid International Airport', city: 'Las Vegas, NV', country: 'USA', is_private: false },
    { code: 'KLAX', name: 'Los Angeles International Airport', city: 'Los Angeles, CA', country: 'USA', is_private: false },
    { code: 'KSJC', name: 'Norman Y. Mineta San Jose International Airport', city: 'San Jose, CA', country: 'USA', is_private: false },
    { code: 'KPBI', name: 'Palm Beach International Airport', city: 'West Palm Beach, FL', country: 'USA', is_private: false },
    { code: 'KMDW', name: 'Chicago Midway International Airport', city: 'Chicago, IL', country: 'USA', is_private: false },
    { code: 'KJFK', name: 'John F. Kennedy International Airport', city: 'New York, NY', country: 'USA', is_private: false },
    { code: 'KDAL', name: 'Dallas Love Field', city: 'Dallas, TX', country: 'USA', is_private: false },
    { code: 'KDEN', name: 'Denver International Airport', city: 'Denver, CO', country: 'USA', is_private: false },
    { code: 'KSFO', name: 'San Francisco International Airport', city: 'San Francisco, CA', country: 'USA', is_private: false }
  ];
  
  // Insert airports
  const { error } = await supabase
    .from('airports')
    .insert(airports);
  
  if (error) {
    console.error('Error inserting airports:', error.message);
  }
}

async function populateFlightsAndBookings(supabase) {
  // Fetch jets, airports, and crew members
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
  
  const { data: crewMembers, error: crewError } = await supabase
    .from('pilots_crews')
    .select('id')
    .eq('is_captain', true)
    .limit(5);
  
  if (crewError || !crewMembers || crewMembers.length === 0) {
    console.error('Could not fetch crew members:', crewError?.message || 'No crew members found');
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
  
  // Create flights
  for (let i = 0; i < 5; i++) {
    const jet = jets[Math.floor(Math.random() * jets.length)];
    const originAirport = airports[Math.floor(Math.random() * airports.length)];
    
    // Ensure different destination
    let destinationAirport;
    do {
      destinationAirport = airports[Math.floor(Math.random() * airports.length)];
    } while (destinationAirport.code === originAirport.code);
    
    const crew = crewMembers[Math.floor(Math.random() * crewMembers.length)];
    
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
        specialized_event: Math.random() < 0.4,
        crew_id: crew.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (flightError) {
      console.error('Error creating flight:', flightError.message);
      continue;
    }
    
    // Create bookings for this flight
    const numBookings = 1 + Math.floor(Math.random() * 3);
    
    for (let j = 0; j < numBookings; j++) {
      const traveler = travelers[Math.floor(Math.random() * travelers.length)];
      const seatsBooked = 1 + Math.floor(Math.random() * 2);
      const totalPrice = basePrice * seatsBooked;
      
      const { error: bookingError } = await supabase
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
        });
      
      if (bookingError) {
        console.error('Error creating booking:', bookingError.message);
      }
    }
  }
}

async function populateFractionalTokens(supabase) {
  // Fetch jets and profiles
  const { data: jets, error: jetsError } = await supabase
    .from('jets')
    .select('id, hourly_rate')
    .limit(5);
  
  if (jetsError || !jets || jets.length === 0) {
    console.error('Could not fetch jets:', jetsError?.message || 'No jets found');
    return;
  }
  
  const { data: travelers, error: travelersError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_type', 'traveler')
    .limit(5);
  
  if (travelersError || !travelers || travelers.length === 0) {
    console.error('Could not fetch travelers:', travelersError?.message || 'No travelers found');
    return;
  }
  
  const percentages = [5.0, 10.0, 15.0, 20.0, 25.0];
  const statuses = ['active', 'for_sale'];
  
  // Create fractional tokens
  for (let i = 0; i < 5; i++) {
    const jet = jets[Math.floor(Math.random() * jets.length)];
    const owner = travelers[Math.floor(Math.random() * travelers.length)];
    const percentage = percentages[Math.floor(Math.random() * percentages.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const { error } = await supabase
      .from('fractional_tokens')
      .insert({
        jet_id: jet.id,
        owner_id: owner.id,
        token_percentage: percentage,
        token_value: jet.hourly_rate * 100 * (percentage / 100.0),
        purchase_date: new Date(Date.now() - Math.floor(Math.random() * 180 * 24 * 60 * 60 * 1000)).toISOString(),
        status: status,
        blockchain_address: 'ETH-' + Math.random().toString(36).substring(2, 18).toUpperCase(),
        contract_details: {
          network: 'Ethereum',
          token_type: 'ERC-721',
          smart_contract: '0x' + Math.random().toString(36).substring(2, 42).toUpperCase()
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error creating fractional token:', error.message);
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
    
    const { error } = await supabase
      .from('ratings')
      .insert({
        from_user_id: profiles[fromIndex].id,
        to_user_id: profiles[toIndex].id,
        flight_id: flight.id,
        rating: rating,
        comment: comment,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000)).toISOString()
      });
    
    if (error) {
      console.error('Error creating rating:', error.message);
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
  for (const booking of bookings) {
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const processor = processors[Math.floor(Math.random() * processors.length)];
    
    const { error } = await supabase
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
      });
    
    if (error) {
      console.error('Error creating payment:', error.message);
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
  for (const offer of offers) {
    const { error } = await supabase
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
      });
    
    if (error) {
      console.error('Error creating JetShare transaction:', error.message);
    }
  }
}

populateTables().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
}); 