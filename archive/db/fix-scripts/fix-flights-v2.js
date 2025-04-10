const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixFlightsTable() {
  try {
    console.log('Starting flights table population...');
    
    // Step 1: Fetch current information about the flights table schema
    console.log('Checking flights table schema...');
    
    // First, try inserting a dummy flight to see what error is returned
    const testFlight = {
      jet_id: '00000000-0000-0000-0000-000000000000', // Dummy ID
      origin_airport: 'Test Origin',
      destination_airport: 'Test Destination',
      departure_time: new Date().toISOString(),
      arrival_time: new Date().toISOString(),
      available_seats: 10,
      base_price: 1000
    };
    
    const { error: schemaTestError } = await supabase
      .from('flights')
      .insert(testFlight);
    
    if (schemaTestError) {
      console.log('Schema test error:', schemaTestError.message);
      
      // Check if it's a foreign key error or a column doesn't exist error
      if (schemaTestError.message.includes('foreign key constraint')) {
        console.log('Flights table exists with foreign key constraint. Need valid jet_id.');
      } else if (schemaTestError.message.includes('column') && schemaTestError.message.includes('does not exist')) {
        console.log('Missing column in flights table.');
      } else if (schemaTestError.message.includes('relation') && schemaTestError.message.includes('does not exist')) {
        console.log('Flights table does not exist. Creating flights table...');
        
        // Create the flights table with minimal schema
        const { error: createTableError } = await supabase.rpc('exec_sql', {
          sql_query: `
            CREATE TABLE IF NOT EXISTS flights (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              jet_id UUID REFERENCES jets(id) ON DELETE CASCADE,
              origin_airport TEXT NOT NULL,
              destination_airport TEXT NOT NULL,
              departure_time TIMESTAMPTZ NOT NULL,
              arrival_time TIMESTAMPTZ NOT NULL,
              available_seats INTEGER NOT NULL,
              base_price DECIMAL(10, 2) NOT NULL,
              status TEXT NOT NULL DEFAULT 'scheduled',
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
              updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
          `
        });
        
        if (createTableError) {
          if (createTableError.message.includes('function') && createTableError.message.includes('does not exist')) {
            console.log('Cannot create table: exec_sql function not available.');
            // We'll instead try to work with whatever schema is available
          } else {
            console.error('Error creating flights table:', createTableError.message);
            return; // Exit if we can't create the table
          }
        }
      }
    } else {
      console.log('Test flight inserted successfully. Deleting test entry...');
      // Delete the test flight if it was inserted
      await supabase
        .from('flights')
        .delete()
        .eq('id', testFlight.id);
    }
    
    // Step 2: Fetch jets to use for flight creation
    console.log('Fetching jets for flight population...');
    const { data: jets, error: jetsError } = await supabase
      .from('jets')
      .select('id, model, manufacturer')
      .limit(10);
    
    if (jetsError || !jets || jets.length === 0) {
      console.error('Error fetching jets:', jetsError?.message || 'No jets found');
      return;
    }
    
    console.log(`Found ${jets.length} jets for flight creation`);
    
    // Step 3: Create flights
    console.log('Creating flights...');
    
    const destinations = [
      { origin: 'New York (KTEB)', destination: 'Los Angeles (KLAX)' },
      { origin: 'Miami (KMIA)', destination: 'Las Vegas (KLAS)' },
      { origin: 'San Francisco (KSFO)', destination: 'Chicago (KORD)' },
      { origin: 'Boston (KBOS)', destination: 'Dallas (KDFW)' },
      { origin: 'Washington DC (KIAD)', destination: 'Seattle (KSEA)' },
      { origin: 'Denver (KDEN)', destination: 'Atlanta (KATL)' },
      { origin: 'Houston (KHOU)', destination: 'Phoenix (KPHX)' },
      { origin: 'Chicago (KORD)', destination: 'New York (KTEB)' },
      { origin: 'Los Angeles (KLAX)', destination: 'Denver (KDEN)' },
      { origin: 'Las Vegas (KLAS)', destination: 'Miami (KMIA)' },
    ];
    
    // Insert flights one by one to handle potential schema differences
    let successCount = 0;
    
    for (let i = 0; i < 15; i++) {
      // Randomly select a jet and destination pair
      const jet = jets[Math.floor(Math.random() * jets.length)];
      const route = destinations[Math.floor(Math.random() * destinations.length)];
      
      // Generate departure and arrival times
      const departureDate = new Date();
      departureDate.setDate(departureDate.getDate() + Math.floor(Math.random() * 14) + 1); // 1-15 days in future
      const arrivalDate = new Date(departureDate);
      arrivalDate.setHours(arrivalDate.getHours() + 2 + Math.floor(Math.random() * 4)); // 2-6 hours flight time
      
      // Generate random price and seats
      const basePrice = 2000 + Math.floor(Math.random() * 8000);
      const availableSeats = 4 + Math.floor(Math.random() * 12);
      
      // Create flight object - Use minimal fields that should be common to all versions
      const flight = {
        jet_id: jet.id,
        origin_airport: route.origin,
        destination_airport: route.destination,
        departure_time: departureDate.toISOString(),
        arrival_time: arrivalDate.toISOString(),
        available_seats: availableSeats,
        base_price: basePrice,
        status: 'scheduled'
      };
      
      // Try to insert the flight
      const { error: insertError } = await supabase
        .from('flights')
        .insert(flight);
      
      if (insertError) {
        console.error(`Error inserting flight ${i+1}:`, insertError.message);
        
        // If the error mentions specific columns, try to adapt
        if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
          const missingColumnMatch = insertError.message.match(/column "(.*)" of relation/);
          if (missingColumnMatch && missingColumnMatch[1]) {
            const missingColumn = missingColumnMatch[1];
            console.log(`Missing column detected: ${missingColumn}. Removing from flight object.`);
            delete flight[missingColumn];
            
            // Try again without the missing column
            const { error: retryError } = await supabase
              .from('flights')
              .insert(flight);
            
            if (retryError) {
              console.error(`Still error after removing ${missingColumn}:`, retryError.message);
            } else {
              console.log(`Successfully inserted flight ${i+1} after removing ${missingColumn}`);
              successCount++;
            }
          }
        }
      } else {
        console.log(`Successfully inserted flight ${i+1}`);
        successCount++;
      }
    }
    
    console.log(`Successfully inserted ${successCount} out of 15 flights`);
    
    // Step 4: Verify flights were created
    const { data: flightsCount, error: countError } = await supabase
      .from('flights')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting flights:', countError.message);
    } else {
      console.log(`Total flights in database: ${flightsCount.count}`);
    }
    
    console.log('Flight table population completed!');
    
  } catch (error) {
    console.error('Unexpected error during flights fix:', error.message);
  }
}

fixFlightsTable().catch(err => {
  console.error('Fatal error:', err);
}); 