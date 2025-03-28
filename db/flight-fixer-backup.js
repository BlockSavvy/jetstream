const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixFlightsTableBackup() {
  try {
    console.log('Starting backup flights table fix...');
    
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
    
    // Step 2: Check if flights table exists and has any entries
    console.log('Checking flights table...');
    
    let flightsExist = false;
    let flightsCount = 0;
    
    try {
      const { data: flights, error: flightsError } = await supabase
        .from('flights')
        .select('id', { count: 'exact', head: true });
      
      if (!flightsError && flights) {
        flightsExist = true;
        flightsCount = flights.count || 0;
        console.log(`Flights table exists with ${flightsCount} entries.`);
      } else {
        console.log('Flights table does not exist or could not be accessed:', flightsError?.message);
      }
    } catch (checkError) {
      console.log('Error checking flights table:', checkError.message);
    }
    
    // If flights already exist, clear out the data if necessary
    if (flightsExist && flightsCount > 0) {
      console.log('Attempting to clear existing flights data...');
      
      try {
        const { error: deleteError } = await supabase
          .from('flights')
          .delete()
          .gte('id', '00000000-0000-0000-0000-000000000000');
        
        if (deleteError) {
          console.error('Error clearing flights data:', deleteError.message);
          console.log('Will attempt to insert flights anyway...');
        } else {
          console.log('Successfully cleared existing flights data.');
        }
      } catch (deleteError) {
        console.error('Exception clearing flights data:', deleteError.message);
      }
    }
    
    // Step 3: Generate flight data
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
      
      // Create basic flight object (excluding any possibly problematic fields)
      const flight = {
        jet_id: jet.id,
        origin_airport: route.origin,
        destination_airport: route.destination,
        departure_time: departureDate.toISOString(),
        arrival_time: arrivalDate.toISOString(),
        available_seats: availableSeats,
        base_price: Math.round(basePrice),
        status: status
      };
      
      // Only add specialized_event if we know it exists in the schema
      if (flightsExist) {
        flight.specialized_event = Math.random() < 0.3; // 30% chance
      }
      
      flightsToInsert.push(flight);
    }
    
    // Step 4: Insert flights one by one to handle any schema issues
    console.log('Inserting flights individually...');
    
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < flightsToInsert.length; i++) {
      try {
        const flight = flightsToInsert[i];
        const { error: insertError } = await supabase
          .from('flights')
          .insert(flight);
        
        if (insertError) {
          console.error(`Error inserting flight ${i+1}:`, insertError.message);
          
          // Try to figure out what's wrong with the schema
          if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
            // Extract problematic column
            const match = insertError.message.match(/column "(.*)" of relation/);
            if (match && match[1]) {
              const problematicColumn = match[1];
              console.log(`Removing problematic column '${problematicColumn}' and trying again...`);
              
              // Create a modified flight object
              const modifiedFlight = { ...flight };
              delete modifiedFlight[problematicColumn];
              
              // Try again
              const { error: retryError } = await supabase
                .from('flights')
                .insert(modifiedFlight);
              
              if (retryError) {
                console.error(`Still error after removing ${problematicColumn}:`, retryError.message);
                failureCount++;
              } else {
                console.log(`Successfully inserted flight ${i+1} after removing ${problematicColumn}`);
                successCount++;
              }
            } else {
              failureCount++;
            }
          } else {
            failureCount++;
          }
        } else {
          console.log(`Successfully inserted flight ${i+1}`);
          successCount++;
        }
      } catch (error) {
        console.error(`Exception inserting flight ${i+1}:`, error.message);
        failureCount++;
      }
    }
    
    console.log(`Flights insertion complete. Success: ${successCount}, Failed: ${failureCount}`);
    
    // Step 5: Verify flights were created
    try {
      const { data: finalCount, error: countError } = await supabase
        .from('flights')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Error counting flights:', countError.message);
      } else {
        console.log(`Total flights in database: ${finalCount.count}`);
      }
    } catch (verifyError) {
      console.error('Error verifying flights count:', verifyError.message);
    }
    
    console.log('Flight table fix completed!');
    
  } catch (error) {
    console.error('Unexpected error during flights fix:', error.message);
  }
}

fixFlightsTableBackup().catch(err => {
  console.error('Fatal error:', err);
}); 