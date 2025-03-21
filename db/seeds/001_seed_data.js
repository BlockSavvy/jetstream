require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { faker } = require('@faker-js/faker');
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Constants for seed data
const USER_COUNT = 50;
const JET_COUNT = 25;
const FLIGHT_COUNT = 100;
const TOKEN_COUNT = 40;

// Private jet manufacturers and models
const jetManufacturers = [
  { name: 'Gulfstream', models: ['G650', 'G550', 'G700', 'G600', 'G450'] },
  { name: 'Bombardier', models: ['Global 7500', 'Global 6000', 'Challenger 350', 'Global 8000', 'Challenger 650'] },
  { name: 'Dassault', models: ['Falcon 7X', 'Falcon 8X', 'Falcon 900LX', 'Falcon 2000LXS', 'Falcon 6X'] },
  { name: 'Cessna', models: ['Citation Longitude', 'Citation Latitude', 'Citation X+', 'Citation Sovereign+', 'Citation CJ4'] },
  { name: 'Embraer', models: ['Praetor 600', 'Phenom 300E', 'Legacy 650E', 'Praetor 500', 'Lineage 1000E'] },
  { name: 'Airbus', models: ['ACJ319neo', 'ACJ320neo', 'ACJ350 XWB', 'ACH130', 'ACH145'] },
  { name: 'Boeing', models: ['BBJ 737', 'BBJ 787', 'BBJ 777X', 'BBJ MAX', 'BBJ 747-8'] },
];

// Jet amenities options
const jetAmenities = [
  { wifi: true, satellite_phone: true, entertainment_system: true, full_kitchen: true, sleeping_quarters: true, shower: true, conference_room: true },
  { wifi: true, satellite_phone: true, entertainment_system: true, full_kitchen: true, sleeping_quarters: false, shower: false, conference_room: false },
  { wifi: true, satellite_phone: true, entertainment_system: true, full_kitchen: false, sleeping_quarters: true, shower: false, bar: true },
  { wifi: true, satellite_phone: false, entertainment_system: true, bar: true, sleeping_quarters: false, shower: false, conference_room: false },
  { wifi: true, satellite_phone: true, entertainment_system: false, full_kitchen: false, sleeping_quarters: false, shower: false, bar: true },
];

// Major airports with private terminals
const airports = [
  { code: 'KJFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'USA', is_private: false },
  { code: 'KLAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'USA', is_private: false },
  { code: 'KPBI', name: 'Palm Beach International Airport', city: 'Palm Beach', country: 'USA', is_private: false },
  { code: 'KMIA', name: 'Miami International Airport', city: 'Miami', country: 'USA', is_private: false },
  { code: 'KLAS', name: 'Harry Reid International Airport', city: 'Las Vegas', country: 'USA', is_private: false },
  { code: 'KSFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'USA', is_private: false },
  { code: 'EGLL', name: 'London Heathrow Airport', city: 'London', country: 'UK', is_private: false },
  { code: 'LFPB', name: 'Paris–Le Bourget Airport', city: 'Paris', country: 'France', is_private: true },
  { code: 'EGGW', name: 'London Luton Airport', city: 'London', country: 'UK', is_private: false },
  { code: 'KSDL', name: 'Scottsdale Airport', city: 'Scottsdale', country: 'USA', is_private: true },
  { code: 'KTEB', name: 'Teterboro Airport', city: 'Teterboro', country: 'USA', is_private: true },
  { code: 'KVAN', name: 'Van Nuys Airport', city: 'Los Angeles', country: 'USA', is_private: true },
  { code: 'KHPN', name: 'Westchester County Airport', city: 'White Plains', country: 'USA', is_private: false },
  { code: 'EDDM', name: 'Munich Airport', city: 'Munich', country: 'Germany', is_private: false },
  { code: 'EDDB', name: 'Berlin Brandenburg Airport', city: 'Berlin', country: 'Germany', is_private: false },
  { code: 'RJTT', name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan', is_private: false },
  { code: 'VHHH', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'China', is_private: false },
  { code: 'YSSY', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia', is_private: false },
  { code: 'OMDB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE', is_private: false },
  { code: 'VIDP', name: 'Indira Gandhi International Airport', city: 'New Delhi', country: 'India', is_private: false },
];

// Generate a random profile
const generateProfile = (userId) => {
  const userType = faker.helpers.arrayElement(['traveler', 'owner', 'traveler']); // More travelers than owners
  return {
    id: userId,
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    avatar_url: faker.image.avatar(),
    bio: faker.lorem.paragraph(),
    preferences: JSON.stringify({
      preferred_destinations: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => 
        faker.location.city()),
      preferred_amenities: faker.helpers.arrayElements(
        ['wifi', 'full_kitchen', 'sleeping_quarters', 'conference_room', 'entertainment_system', 'bar', 'shower'],
        faker.number.int({ min: 1, max: 5 })
      ),
      travel_purpose: faker.helpers.arrayElements(
        ['business', 'leisure', 'family', 'emergency', 'relocation'],
        faker.number.int({ min: 1, max: 3 })
      ),
      preferred_booking_window: faker.helpers.arrayElement(['last_minute', '1_week', '2_weeks', '1_month', 'flexible']),
      max_price_per_hour: faker.number.int({ min: 2000, max: 10000 }),
    }),
    user_type: userType,
    verification_status: faker.helpers.arrayElement(['pending', 'verified', 'verified', 'verified']), // Most users verified
    created_at: faker.date.past(),
    updated_at: faker.date.recent(),
  };
};

// Generate a random jet
const generateJet = (ownerId) => {
  const manufacturer = faker.helpers.arrayElement(jetManufacturers);
  const model = faker.helpers.arrayElement(manufacturer.models);
  const capacity = faker.number.int({ min: 4, max: 18 });
  
  // Generate realistic tail number
  const tailNumber = `N${faker.number.int({ min: 100, max: 999 })}${faker.string.alpha({ count: 2, casing: 'upper' })}`;
  
  // Jet range in nautical miles
  const range = faker.number.int({ min: 1000, max: 8000 });
  
  // Random hourly rate based on jet size/model
  let hourlyRate;
  if (capacity <= 6) {
    hourlyRate = faker.number.int({ min: 2500, max: 5000 });
  } else if (capacity <= 10) {
    hourlyRate = faker.number.int({ min: 5000, max: 8000 });
  } else {
    hourlyRate = faker.number.int({ min: 8000, max: 15000 });
  }
  
  return {
    id: uuidv4(),
    owner_id: ownerId,
    model,
    manufacturer: manufacturer.name,
    year: faker.number.int({ min: 2010, max: 2023 }),
    tail_number: tailNumber,
    capacity,
    range_nm: range,
    images: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => 
      `https://source.unsplash.com/random/800x600/?private,jet,${faker.number.int({ min: 1, max: 100 })}`
    ),
    amenities: JSON.stringify(faker.helpers.arrayElement(jetAmenities)),
    home_base_airport: faker.helpers.arrayElement(airports).code,
    status: faker.helpers.weightedArrayElement([
      { weight: 80, value: 'available' },
      { weight: 15, value: 'maintenance' },
      { weight: 5, value: 'unavailable' },
    ]),
    hourly_rate: hourlyRate,
    created_at: faker.date.past(),
    updated_at: faker.date.recent(),
  };
};

// Generate a random flight
const generateFlight = (jetId, jetCapacity) => {
  // Pick random origin and destination airports
  const originAirport = faker.helpers.arrayElement(airports).code;
  let destinationAirport;
  do {
    destinationAirport = faker.helpers.arrayElement(airports).code;
  } while (destinationAirport === originAirport);
  
  // Generate realistic departure and arrival times
  const departureTime = faker.date.future();
  
  // Calculate flight duration based on distance (random for seed data)
  const flightDurationHours = faker.number.int({ min: 1, max: 10 });
  const arrivalTime = new Date(departureTime);
  arrivalTime.setHours(arrivalTime.getHours() + flightDurationHours);
  
  // Calculate base price based on duration and jet capacity
  const basePrice = flightDurationHours * faker.number.int({ min: 1000, max: 3000 });
  
  // Most flights are still in scheduled status
  const status = faker.helpers.weightedArrayElement([
    { weight: 80, value: 'scheduled' },
    { weight: 10, value: 'boarding' },
    { weight: 5, value: 'in_air' },
    { weight: 5, value: 'completed' },
  ]);
  
  return {
    id: uuidv4(),
    jet_id: jetId,
    origin_airport: originAirport,
    destination_airport: destinationAirport,
    departure_time: departureTime,
    arrival_time: arrivalTime,
    available_seats: faker.number.int({ min: 1, max: jetCapacity }),
    base_price: basePrice,
    status,
    created_at: faker.date.past(),
    updated_at: faker.date.recent(),
  };
};

// Generate a fractional token
const generateToken = (jetId, ownerId) => {
  // Generate realistic token percentage and value
  const percentage = faker.helpers.arrayElement([2.5, 5, 10, 12.5, 20, 25]);
  
  // Token value would be based on jet value and percentage
  const baseJetValue = faker.number.int({ min: 5000000, max: 70000000 });
  const tokenValue = (baseJetValue * percentage) / 100;
  
  return {
    id: uuidv4(),
    jet_id: jetId,
    owner_id: ownerId,
    token_percentage: percentage,
    token_value: tokenValue,
    purchase_date: faker.date.past(),
    status: faker.helpers.weightedArrayElement([
      { weight: 80, value: 'active' },
      { weight: 15, value: 'for_sale' },
      { weight: 5, value: 'transferred' },
    ]),
    blockchain_address: `0x${faker.string.hexadecimal({ length: 40 }).substring(2)}`,
    contract_details: JSON.stringify({
      network: faker.helpers.arrayElement(['Ethereum', 'Polygon', 'Solana']),
      smart_contract: `0x${faker.string.hexadecimal({ length: 40 }).substring(2)}`,
      token_id: faker.number.int({ min: 1, max: 10000 }),
      token_standard: faker.helpers.arrayElement(['ERC-721', 'ERC-1155']),
    }),
    created_at: faker.date.past(),
    updated_at: faker.date.recent(),
  };
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    
    // 1. Create test users with auth.users and profiles
    console.log(`Creating ${USER_COUNT} test users and profiles...`);
    
    const userIds = [];
    for (let i = 0; i < USER_COUNT; i++) {
      // Create a random email and password
      const email = faker.internet.email();
      const password = 'Password123!'; // Simple password for all test users
      
      // Create user in auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
      });
      
      if (authError) {
        console.error('Error creating auth user:', authError);
        continue;
      }
      
      userIds.push(authUser.user.id);
      
      // Create profile for the user
      const profile = generateProfile(authUser.user.id);
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profile]);
        
      if (profileError) {
        console.error('Error creating profile:', profileError);
      }
    }
    
    // 2. Seed airports table
    console.log(`Creating ${airports.length} airports...`);
    const { error: airportsError } = await supabase
      .from('airports')
      .insert(airports.map(airport => ({
        ...airport,
        location: airport.location || null,
      })));
      
    if (airportsError) {
      console.error('Error seeding airports:', airportsError);
    }
    
    // 3. Create jets owned by users with "owner" type
    console.log(`Creating ${JET_COUNT} jets...`);
    
    // Get owner users
    const { data: ownerUsers, error: ownerError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_type', 'owner');
      
    if (ownerError) {
      console.error('Error fetching owner users:', ownerError);
      return;
    }
    
    const ownerIds = ownerUsers.map(user => user.id);
    const jets = [];
    
    for (let i = 0; i < JET_COUNT; i++) {
      const ownerId = faker.helpers.arrayElement(ownerIds);
      jets.push(generateJet(ownerId));
    }
    
    const { error: jetsError } = await supabase
      .from('jets')
      .insert(jets);
      
    if (jetsError) {
      console.error('Error creating jets:', jetsError);
    }
    
    // 4. Create flights for jets
    console.log(`Creating ${FLIGHT_COUNT} flights...`);
    
    const { data: allJets, error: fetchJetsError } = await supabase
      .from('jets')
      .select('id, capacity');
      
    if (fetchJetsError) {
      console.error('Error fetching jets:', fetchJetsError);
      return;
    }
    
    const flights = [];
    for (let i = 0; i < FLIGHT_COUNT; i++) {
      const jet = faker.helpers.arrayElement(allJets);
      flights.push(generateFlight(jet.id, jet.capacity));
    }
    
    const { error: flightsError } = await supabase
      .from('flights')
      .insert(flights);
      
    if (flightsError) {
      console.error('Error creating flights:', flightsError);
    }
    
    // 5. Create fractional tokens
    console.log(`Creating ${TOKEN_COUNT} fractional tokens...`);
    
    const tokens = [];
    for (let i = 0; i < TOKEN_COUNT; i++) {
      const jet = faker.helpers.arrayElement(allJets);
      // Tokens can be owned by any user type
      const ownerId = faker.helpers.arrayElement(userIds);
      tokens.push(generateToken(jet.id, ownerId));
    }
    
    const { error: tokensError } = await supabase
      .from('fractional_tokens')
      .insert(tokens);
      
    if (tokensError) {
      console.error('Error creating tokens:', tokensError);
    }
    
    // 6. Create some bookings
    console.log('Creating bookings for some flights...');
    
    const { data: availableFlights, error: fetchFlightsError } = await supabase
      .from('flights')
      .select('id, base_price, available_seats')
      .in('status', ['scheduled', 'boarding'])
      .gt('available_seats', 0);
      
    if (fetchFlightsError) {
      console.error('Error fetching flights:', fetchFlightsError);
      return;
    }
    
    // Get traveler users
    const { data: travelerUsers, error: travelerError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_type', 'traveler');
      
    if (travelerError) {
      console.error('Error fetching traveler users:', travelerError);
      return;
    }
    
    const travelerIds = travelerUsers.map(user => user.id);
    const bookings = [];
    
    // Create bookings for about 40% of flights
    const bookingFlights = faker.helpers.arrayElements(availableFlights, Math.floor(availableFlights.length * 0.4));
    
    for (const flight of bookingFlights) {
      const seatsToBook = faker.number.int({ min: 1, max: Math.min(flight.available_seats, 4) });
      const travelerId = faker.helpers.arrayElement(travelerIds);
      
      const totalPrice = flight.base_price * seatsToBook;
      const bookingStatus = faker.helpers.arrayElement(['confirmed', 'confirmed', 'confirmed', 'pending']);
      const paymentStatus = bookingStatus === 'confirmed' ? 
        faker.helpers.arrayElement(['paid', 'paid', 'paid', 'pending']) : 'pending';
      
      bookings.push({
        id: uuidv4(),
        user_id: travelerId,
        flight_id: flight.id,
        seats_booked: seatsToBook,
        booking_status: bookingStatus,
        total_price: totalPrice,
        payment_status: paymentStatus,
        payment_id: paymentStatus === 'paid' ? `pi_${faker.string.alphanumeric(24)}` : null,
        ticket_code: bookingStatus === 'confirmed' ? `JS-${faker.string.alphanumeric(8).toUpperCase()}` : null,
        special_requests: faker.helpers.arrayElement([
          'Vegan meal',
          'Extra luggage space',
          'Pet accommodation',
          'Wheelchair access',
          'Birthday celebration',
          'Business meeting setup',
          null, null, null
        ]),
        created_at: faker.date.recent(),
        updated_at: faker.date.recent(),
      });
    }
    
    if (bookings.length > 0) {
      const { error: bookingsError } = await supabase
        .from('bookings')
        .insert(bookings);
        
      if (bookingsError) {
        console.error('Error creating bookings:', bookingsError);
      } else {
        console.log(`Created ${bookings.length} bookings`);
      }
    }
    
    // 7. Create payments for "paid" bookings
    const paidBookingsQuery = await supabase
      .from('bookings')
      .select('id, user_id, total_price')
      .eq('payment_status', 'paid');
      
    if (paidBookingsQuery.error) {
      console.error('Error fetching paid bookings:', paidBookingsQuery.error);
    } else if (paidBookingsQuery.data && paidBookingsQuery.data.length > 0) {
      console.log(`Creating payments for ${paidBookingsQuery.data.length} paid bookings...`);
      
      const payments = paidBookingsQuery.data.map(booking => ({
        id: uuidv4(),
        booking_id: booking.id,
        user_id: booking.user_id,
        amount: booking.total_price,
        currency: 'USD',
        payment_method: faker.helpers.arrayElement(['credit_card', 'crypto', 'bank_transfer']),
        payment_status: 'completed',
        transaction_id: `txn_${faker.string.alphanumeric(24)}`,
        payment_details: JSON.stringify({
          processor: faker.helpers.arrayElement(['Stripe', 'PayPal', 'Coinbase']),
          last_four: faker.helpers.arrayElement(['credit_card', 'bank_transfer'].includes) ? 
            faker.finance.creditCardNumber('####') : null,
          payment_date: faker.date.recent(),
        }),
        created_at: faker.date.recent(),
        updated_at: faker.date.recent(),
      }));
      
      const { error: paymentsError } = await supabase
        .from('payments')
        .insert(payments);
        
      if (paymentsError) {
        console.error('Error creating payments:', paymentsError);
      }
    }
    
    // 8. Create some ratings
    console.log('Creating user ratings...');
    
    const { data: completedFlights, error: completedFlightsError } = await supabase
      .from('flights')
      .select('id')
      .eq('status', 'completed');
      
    if (completedFlightsError) {
      console.error('Error fetching completed flights:', completedFlightsError);
    } else if (completedFlights && completedFlights.length > 0) {
      const ratings = [];
      
      // Generate 1-3 ratings for each completed flight
      for (const flight of completedFlights) {
        const ratingCount = faker.number.int({ min: 1, max: 3 });
        
        for (let i = 0; i < ratingCount; i++) {
          const fromUserId = faker.helpers.arrayElement(travelerIds);
          let toUserId;
          
          // Ratings can be for either another traveler or an owner
          const rateOwner = faker.datatype.boolean();
          
          if (rateOwner) {
            toUserId = faker.helpers.arrayElement(ownerIds);
          } else {
            // Make sure we don't rate ourselves
            do {
              toUserId = faker.helpers.arrayElement(travelerIds);
            } while (toUserId === fromUserId);
          }
          
          ratings.push({
            id: uuidv4(),
            from_user_id: fromUserId,
            to_user_id: toUserId,
            flight_id: flight.id,
            rating: faker.number.int({ min: 3, max: 5 }), // Mostly positive ratings
            comment: faker.helpers.arrayElement([
              'Great experience!',
              'Very professional service.',
              'Excellent flight, would book again.',
              'The amenities were top-notch.',
              'Smooth flight and friendly crew.',
              'Punctual departure and arrival.',
              'Outstanding luxury experience.',
              null,
            ]),
            created_at: faker.date.recent(),
          });
        }
      }
      
      if (ratings.length > 0) {
        const { error: ratingsError } = await supabase
          .from('ratings')
          .insert(ratings);
          
        if (ratingsError) {
          console.error('Error creating ratings:', ratingsError);
        } else {
          console.log(`Created ${ratings.length} ratings`);
        }
      }
    }
    
    console.log('Database seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

// Run the seeding function
seedDatabase(); 