const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function fixFlightsTable() {
  try {
    console.log('Starting flights table fix and population...');
    
    // Step 1: Check if flights table exists and its structure
    console.log('Checking flights table...');
    const { data: flightsCheck, error: flightsError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'flights'
        );
      `
    });
    
    if (flightsError) {
      console.error('Error checking flights table:', flightsError.message);
      return;
    }
    
    // Step 2: Create or recreate flights table with correct schema
    console.log('Creating/Updating flights table with correct schema...');
    const { error: schemaError } = await supabase.rpc('exec_sql', {
      sql_query: `
        -- Drop existing flights table if it exists
        DROP TABLE IF EXISTS flights CASCADE;
        
        -- Create flights table with correct schema
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
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_flights_jet_id ON flights(jet_id);
        CREATE INDEX IF NOT EXISTS idx_flights_status ON flights(status);
        CREATE INDEX IF NOT EXISTS idx_flights_departure_time ON flights(departure_time);
      `
    });
    
    if (schemaError) {
      console.error('Error setting up flights table schema:', schemaError.message);
      return;
    }
    
    // Step 3: Fetch jets to use for flight creation
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
    
    // Step 4: Create flights
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
    
    // Insert flights using SQL
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
      
      // Insert the flight
      const { error: insertError } = await supabase.from('flights').insert({
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
      
      if (insertError) {
        console.error(`Error creating flight ${i+1}:`, insertError.message);
      } else {
        console.log(`Created flight ${i+1} from ${route.origin} to ${route.destination}`);
      }
    }
    
    // Step 5: Verify flights were created
    const { data: flightsCount, error: countError } = await supabase
      .from('flights')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting flights:', countError.message);
    } else {
      console.log(`Successfully populated flights table with ${flightsCount.count} flights`);
    }
    
    console.log('Flight table fix and population completed successfully!');
    
  } catch (error) {
    console.error('Unexpected error during flights fix:', error.message);
  }
}

fixFlightsTable().catch(err => {
  console.error('Fatal error:', err);
}); 