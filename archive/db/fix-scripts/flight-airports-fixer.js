const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixFlightsWithAirports() {
  try {
    console.log('Starting comprehensive flights table fix with airport code handling...');
    
    // Step 1: Check if the flights table exists and if it's empty or has a foreign key constraint issue
    console.log('Checking flights table schema...');
    
    const { data: flightCheck, error: flightCheckError } = await supabase
      .from('flights')
      .select('count(*)');
      
    let tableNeedsReset = true;
    
    if (flightCheckError) {
      if (flightCheckError.message.includes('does not exist')) {
        console.log('Flights table does not exist. Will create it.');
      } else {
        console.log('Error checking flights table:', flightCheckError.message);
      }
    } else {
      console.log(`Found flights table with ${flightCheck ? flightCheck.length : 0} rows.`);
      
      // Try to delete all flights to start fresh
      const { error: deleteError } = await supabase
        .from('flights')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');
        
      if (deleteError) {
        console.log('Error deleting existing flights:', deleteError.message);
        tableNeedsReset = true;
      } else {
        console.log('Successfully cleared existing flights.');
        tableNeedsReset = false;
      }
    }
    
    // Step 2: Drop and recreate the flights table if needed
    if (tableNeedsReset) {
      console.log('Attempting to drop and recreate flights table...');
      
      try {
        // Try to execute a DROP and CREATE via rpc
        await supabase.rpc('exec_sql', {
          sql_query: `
            DROP TABLE IF EXISTS flights CASCADE;
            
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
            
            CREATE INDEX IF NOT EXISTS idx_flights_jet_id ON flights(jet_id);
            CREATE INDEX IF NOT EXISTS idx_flights_status ON flights(status);
            CREATE INDEX IF NOT EXISTS idx_flights_departure_time ON flights(departure_time);
          `
        });
        console.log('Successfully recreated flights table.');
      } catch (rpcError) {
        console.log('RPC error when recreating table:', rpcError.message);
        console.log('Please run the SQL script directly in the Supabase SQL editor.');
        console.log('See db/fix-flights-sql-editor.sql for the script to run.');
        return;
      }
    }
    
    // Step 3: Check for existing jets before creating flights
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
    
    // Step 4: Generate flight data with hardcoded airport codes (no foreign keys)
    console.log('Generating flights data with plain text airport codes...');
    
    const airportRoutes = [
      { origin: 'KTEB', destination: 'KLAX', name: 'New York to Los Angeles' },
      { origin: 'KMIA', destination: 'KLAS', name: 'Miami to Las Vegas' },
      { origin: 'KSFO', destination: 'KORD', name: 'San Francisco to Chicago' },
      { origin: 'KBOS', destination: 'KDFW', name: 'Boston to Dallas' },
      { origin: 'KIAD', destination: 'KSEA', name: 'Washington DC to Seattle' },
      { origin: 'KDEN', destination: 'KATL', name: 'Denver to Atlanta' },
      { origin: 'KHOU', destination: 'KPHX', name: 'Houston to Phoenix' },
      { origin: 'KORD', destination: 'KTEB', name: 'Chicago to New York' },
      { origin: 'KLAX', destination: 'KDEN', name: 'Los Angeles to Denver' },
      { origin: 'KLAS', destination: 'KMIA', name: 'Las Vegas to Miami' }
    ];
    
    const flightsToInsert = [];
    
    // Generate 30 flights across all jet categories
    for (let i = 0; i < 30; i++) {
      const jet = jets[Math.floor(Math.random() * jets.length)];
      const route = airportRoutes[Math.floor(Math.random() * airportRoutes.length)];
      
      // Create departure and arrival times (1-30 days in the future)
      const departureDate = new Date();
      departureDate.setDate(departureDate.getDate() + Math.floor(Math.random() * 30) + 1);
      departureDate.setHours(Math.floor(Math.random() * 14) + 6); // Between 6 AM and 8 PM
      departureDate.setMinutes(Math.random() < 0.5 ? 0 : 30); // 0 or 30 minutes
      
      // Flight duration based on jet category (faster jets = shorter flights)
      let flightHours;
      if (jet.category === 'ultra_large' || jet.category === 'heavy') {
        flightHours = 2 + Math.floor(Math.random() * 4); // 2-5 hours
      } else if (jet.category === 'super_midsize' || jet.category === 'midsize') {
        flightHours = 1.5 + Math.floor(Math.random() * 3.5); // 1.5-4.5 hours
      } else {
        flightHours = 1 + Math.floor(Math.random() * 2); // 1-3 hours
      }
      
      const arrivalDate = new Date(departureDate);
      arrivalDate.setHours(arrivalDate.getHours() + flightHours);
      
      // Set price based on jet category and flight duration
      let basePrice;
      if (jet.hourly_rate) {
        // If hourly_rate is available, use it to calculate a realistic price
        basePrice = Math.round(jet.hourly_rate * flightHours * (0.9 + Math.random() * 0.2)); // ±10% variation
      } else {
        // Otherwise use category-based pricing
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
      }
      
      // Available seats (based on capacity but never full)
      const maxSeats = jet.capacity || 10;
      const availableSeats = 1 + Math.floor(Math.random() * (maxSeats - 1));
      
      // Flight status (mostly scheduled, some boarding/in_air)
      const statusOptions = ['scheduled', 'scheduled', 'scheduled', 'scheduled', 'boarding', 'in_air'];
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      
      // Create flight object
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
    
    // Step 5: Insert flight data in batches
    console.log('Inserting flights in batches...');
    
    let successCount = 0;
    let failureCount = 0;
    
    // Insert in batches of 5
    for (let i = 0; i < flightsToInsert.length; i += 5) {
      const batch = flightsToInsert.slice(i, Math.min(i + 5, flightsToInsert.length));
      
      try {
        const { data: insertedFlights, error: insertError } = await supabase
          .from('flights')
          .insert(batch);
        
        if (insertError) {
          console.error(`Error inserting batch ${i/5 + 1}:`, insertError.message);
          failureCount += batch.length;
          
          // Try individual inserts if batch fails
          for (const flight of batch) {
            try {
              const { error: singleError } = await supabase
                .from('flights')
                .insert(flight);
              
              if (singleError) {
                console.error('Error inserting single flight:', singleError.message);
                failureCount++;
              } else {
                console.log('Successfully inserted single flight');
                successCount++;
                failureCount--; // Correct the count
              }
            } catch (e) {
              console.error('Exception inserting single flight:', e.message);
            }
          }
        } else {
          console.log(`Successfully inserted batch ${i/5 + 1}`);
          successCount += batch.length;
        }
      } catch (e) {
        console.error(`Exception in batch ${i/5 + 1}:`, e.message);
        failureCount += batch.length;
      }
    }
    
    console.log(`Flight insertion results: ${successCount} successful, ${failureCount} failed`);
    
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
    
    console.log('Flight table fix completed. If you still see issues, please run the SQL script directly in the Supabase SQL Editor.');
    
  } catch (error) {
    console.error('Unexpected error during flights fix:', error.message);
  }
}

fixFlightsWithAirports().catch(err => {
  console.error('Fatal error:', err);
}); 