const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixFlightsTable() {
  try {
    console.log('Starting flights table fix and population...');
    
    // Step 1: Fetch jets to use for flight creation
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
    
    // Step 2: Create flights
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
    
    // Prepare flights batch insert
    const flightsToInsert = [];
    
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
      
      // Create flight object
      flightsToInsert.push({
        jet_id: jet.id,
        origin_airport: route.origin,
        destination_airport: route.destination,
        departure_time: departureDate.toISOString(),
        arrival_time: arrivalDate.toISOString(),
        available_seats: availableSeats,
        base_price: basePrice,
        status: 'scheduled',
        specialized_event: Math.random() < 0.3, // 30% chance
      });
    }
    
    // Batch insert flights
    const { data: insertedFlights, error: insertError } = await supabase
      .from('flights')
      .insert(flightsToInsert)
      .select();
    
    if (insertError) {
      console.error('Error inserting flights:', insertError.message);
      
      // If the flights table doesn't exist or has schema issues, try inserting flights one by one
      if (insertError.message.includes('does not exist') || insertError.message.includes('column') || insertError.message.includes('relation')) {
        console.log('Trying to insert flights one by one...');
        
        // Insert flights individually to catch and log specific errors
        let successCount = 0;
        
        for (let i = 0; i < flightsToInsert.length; i++) {
          const flight = flightsToInsert[i];
          const { error: singleInsertError } = await supabase
            .from('flights')
            .insert(flight);
          
          if (singleInsertError) {
            console.error(`Error inserting flight ${i+1}:`, singleInsertError.message);
          } else {
            console.log(`Successfully inserted flight ${i+1}`);
            successCount++;
          }
        }
        
        console.log(`Successfully inserted ${successCount} out of ${flightsToInsert.length} flights`);
      }
    } else {
      console.log(`Successfully inserted ${insertedFlights.length} flights`);
    }
    
    // Step 3: Verify flights were created
    const { data: flightsCount, error: countError } = await supabase
      .from('flights')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting flights:', countError.message);
    } else {
      console.log(`Total flights in database: ${flightsCount.count}`);
    }
    
    console.log('Flight table fix and population completed!');
    
  } catch (error) {
    console.error('Unexpected error during flights fix:', error.message);
  }
}

fixFlightsTable().catch(err => {
  console.error('Fatal error:', err);
}); 