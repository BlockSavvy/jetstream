require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
console.log('Loading environment variables...');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchFlightIds() {
  try {
    console.log('Fetching flight IDs from the database...');
    
    // Get actual flight IDs from the database
    const { data: flights, error } = await supabase
      .from('flights')
      .select('id')
      .limit(10);
    
    if (error) {
      console.error('Error fetching flight IDs:', error);
      return;
    }
    
    if (!flights || flights.length === 0) {
      console.log('No flights found in the database.');
      console.log(`
=== SQL to remove foreign key constraint temporarily ===
BEGIN;
-- Temporarily disable the foreign key constraint
ALTER TABLE specialized_flights DROP CONSTRAINT IF EXISTS specialized_flights_flight_id_fkey;

-- After running your seed script, you can re-enable the constraint with:
-- ALTER TABLE specialized_flights ADD CONSTRAINT specialized_flights_flight_id_fkey 
--   FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE;
COMMIT;
      `);
      return;
    }
    
    // Print the flight IDs
    console.log(`Found ${flights.length} flights. You can use these IDs in your seed script:`);
    console.log(flights.map(flight => flight.id));
    
    // Generate helpful SQL statements for updating the seed script
    console.log('\n=== SQL to update flight_ids in specialized_flights ===');
    
    for (let i = 0; i < Math.min(flights.length, 10); i++) {
      console.log(`-- For flight ${i+1}:`);
      console.log(`UPDATE specialized_flights SET flight_id = '${flights[i].id}' WHERE id = 'your_specialized_flight_id_${i+1}';`);
    }
    
    console.log(`
=== SQL to add foreign key constraint if needed ===
ALTER TABLE specialized_flights ADD CONSTRAINT specialized_flights_flight_id_fkey 
  FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE;
    `);
  } catch (err) {
    console.error('Error:', err);
  }
}

// Run the function
fetchFlightIds(); 