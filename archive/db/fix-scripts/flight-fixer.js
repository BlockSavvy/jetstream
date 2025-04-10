const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixFlightsTable() {
  try {
    console.log('Starting comprehensive flights table fix...');
    
    // Step 1: Check for existing jets
    console.log('Checking jets table...');
    const { data: jets, error: jetsError } = await supabase
      .from('jets')
      .select('id, model, manufacturer, category, tail_number, capacity, hourly_rate')
      .limit(30);
    
    if (jetsError || !jets || jets.length === 0) {
      console.error('Error fetching jets:', jetsError?.message || 'No jets found');
      return;
    }
    
    console.log(`Found ${jets.length} jets for flight creation`);
    
    // Step 2: Create airports if needed
    console.log('Checking airports table...');
    const airportCodes = [
      'KTEB', 'KLAX', 'KLAS', 'KSFO', 'KBOS', 'KDFW', 'KORD', 
      'KMIA', 'KDEN', 'KJFK', 'KSAN', 'KHOU', 'KPHL', 'KSEA'
    ];
    
    // Handle airport data if needed
    const { data: airports, error: airportsError } = await supabase
      .from('airports')
      .select('code')
      .in('code', airportCodes);
      
    if (airportsError || !airports || airports.length === 0) {
      console.log('No airports found or error. We may need to create airports...');
      // For now, we'll just use strings for airport codes in flight data
    } else {
      console.log(`Found ${airports.length} airports.`);
    }
    
    // Step 3: Drop and recreate flights table with proper schema
    console.log('Attempting to fix flights table schema...');
    
    try {
      // Try dropping the flights table if it exists
      await supabase.rpc('exec_sql', {
        sql_query: `DROP TABLE IF EXISTS flights CASCADE;`
      });
      console.log('Successfully dropped flights table.');
      
      // Create the correct flights table schema
      await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE TABLE flights (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            jet_id UUID REFERENCES jets(id) ON DELETE CASCADE,
            origin_airport TEXT NOT NULL,
            destination_airport TEXT NOT NULL,
            departure_time TIMESTAMPTZ NOT NULL,
            arrival_time TIMESTAMPTZ NOT NULL,
            available_seats INTEGER NOT NULL,
            base_price DECIMAL(10, 2) NOT NULL,
            status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'boarding', 'in_air', 'completed', 'cancelled')),
            specialized_event BOOLEAN DEFAULT FALSE,
            crew_id UUID,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `
      });
      console.log('Successfully created flights table with proper schema.');
    } catch (schemaError) {
      console.log('Error with exec_sql function:', schemaError.message);
      console.log('Falling back to direct insert approach...');
    }
    
    // Step 4: Generate flight data
    console.log('Generating flights data...');
    
    const flightsToInsert = [];
    const flightRoutes = [
      { origin: 'KTEB', destination: 'KLAX', name: 'New York to Los Angeles' },
      { origin: 'KMIA', destination: 'KLAS', name: 'Miami to Las Vegas' },
      { origin: 'KSFO', destination: 'KORD', name: 'San Francisco to Chicago' },
      { origin: 'KBOS', destination: 'KDFW', name: 'Boston to Dallas' },
      { origin: 'KIAD', destination: 'KSEA', name: 'Washington DC to Seattle' },
      { origin: 'KDEN', destination: 'KATL', name: 'Denver to Atlanta' },
      { origin: 'KHOU', destination: 'KPHX', name: 'Houston to Phoenix' },
      { origin: 'KORD', destination: 'KTEB', name: 'Chicago to New York' },
      { origin: 'KLAX', destination: 'KDEN', name: 'Los Angeles to Denver' },
      { origin: 'KLAS', destination: 'KMIA', name: 'Las Vegas to Miami' },
      { origin: 'KJFK', destination: 'KSFO', name: 'New York to San Francisco' },
      { origin: 'KSAN', destination: 'KORD', name: 'San Diego to Chicago' },
      { origin: 'KPHL', destination: 'KLAS', name: 'Philadelphia to Las Vegas' },
      { origin: 'KSEA', destination: 'KBOS', name: 'Seattle to Boston' },
      { origin: 'KATL', destination: 'KTEB', name: 'Atlanta to New York' }
    ];
    
    // Create 25 flights with varied data
    for (let i = 0; i < 25; i++) {
      // Randomly select a jet and destination pair
      const jet = jets[Math.floor(Math.random() * jets.length)];
      const route = flightRoutes[Math.floor(Math.random() * flightRoutes.length)];
      
      // Generate departure and arrival times (ranging from today to 30 days in future)
      const departureDate = new Date();
      departureDate.setDate(departureDate.getDate() + Math.floor(Math.random() * 30) + 1);
      departureDate.setHours(Math.floor(Math.random() * 14) + 6); // 6 AM to 8 PM departure
      departureDate.setMinutes(Math.random() < 0.5 ? 0 : 30); // Set minutes to either 0 or 30
      
      const flightHours = 1 + Math.floor(Math.random() * 6); // Flight between 1-6 hours
      const arrivalDate = new Date(departureDate);
      arrivalDate.setHours(arrivalDate.getHours() + flightHours);
      
      // Set price based on jet category and flight duration
      let basePrice;
      if (jet.category === 'very_light' || jet.category === 'light') {
        basePrice = 2000 + (flightHours * 500) + Math.floor(Math.random() * 1000);
      } else if (jet.category === 'midsize' || jet.category === 'super_midsize') {
        basePrice = 4000 + (flightHours * 1000) + Math.floor(Math.random() * 2000);
      } else if (jet.category === 'heavy') {
        basePrice = 8000 + (flightHours * 1500) + Math.floor(Math.random() * 3000);
      } else if (jet.category === 'ultra_large') {
        basePrice = 15000 + (flightHours * 2500) + Math.floor(Math.random() * 5000);
      } else {
        basePrice = 5000 + (flightHours * 1000) + Math.floor(Math.random() * 2000);
      }
      
      // Available seats (never more than capacity)
      const maxSeats = jet.capacity || 10;
      const availableSeats = 1 + Math.floor(Math.random() * (maxSeats - 1));
      
      // Generate flight status (mostly scheduled, some boarding/in_air)
      const statusOptions = ['scheduled', 'scheduled', 'scheduled', 'scheduled', 'boarding', 'in_air'];
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      
      // Create the flight object
      flightsToInsert.push({
        jet_id: jet.id,
        origin_airport: route.origin,
        destination_airport: route.destination,
        departure_time: departureDate.toISOString(),
        arrival_time: arrivalDate.toISOString(),
        available_seats: availableSeats,
        base_price: Math.round(basePrice),
        status: status,
        specialized_event: Math.random() < 0.3, // 30% chance
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    // Step 5: Insert flights in batches to avoid payload limits
    console.log('Inserting flights in batches...');
    
    const batchSize = 5;
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < flightsToInsert.length; i += batchSize) {
      const batch = flightsToInsert.slice(i, i + batchSize);
      
      try {
        const { data: insertedFlights, error: insertError } = await supabase
          .from('flights')
          .insert(batch);
        
        if (insertError) {
          console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError.message);
          
          // Try inserting individually if batch fails
          console.log('Attempting individual inserts for batch...');
          for (const flight of batch) {
            try {
              // If specialized_event is causing issues, try without it
              if (insertError.message.includes('specialized_event')) {
                delete flight.specialized_event;
              }
              
              const { error: singleInsertError } = await supabase
                .from('flights')
                .insert(flight);
              
              if (singleInsertError) {
                console.error('Error inserting individual flight:', singleInsertError.message);
                failureCount++;
              } else {
                successCount++;
              }
            } catch (singleError) {
              console.error('Exception inserting individual flight:', singleError.message);
              failureCount++;
            }
          }
        } else {
          successCount += batch.length;
          console.log(`Successfully inserted batch ${i / batchSize + 1}`);
        }
      } catch (batchError) {
        console.error(`Exception in batch ${i / batchSize + 1}:`, batchError.message);
        failureCount += batch.length;
      }
    }
    
    console.log(`Flights insertion complete. Success: ${successCount}, Failed: ${failureCount}`);
    
    // Step 6: Verify flights were created
    try {
      const { data: flightsCount, error: countError } = await supabase
        .from('flights')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Error counting flights:', countError.message);
      } else {
        console.log(`Total flights in database: ${flightsCount.count}`);
      }
    } catch (verifyError) {
      console.error('Error verifying flights count:', verifyError.message);
    }
    
    console.log('Flight table fix completed!');
    
  } catch (error) {
    console.error('Unexpected error during flights fix:', error.message);
  }
}

fixFlightsTable().catch(err => {
  console.error('Fatal error:', err);
}); 