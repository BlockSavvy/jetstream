const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixFlightsWithAirports() {
  try {
    console.log('Starting flights table fix with correct airport references...');
    
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
    
    // Step 2: Get existing airports from the database
    console.log('Fetching airports from database...');
    const { data: airports, error: airportsError } = await supabase
      .from('airports')
      .select('*')
      .limit(20);
    
    if (airportsError || !airports || airports.length === 0) {
      console.error('Error fetching airports:', airportsError?.message || 'No airports found');
      console.log('We need to know which airports exist before creating flights.');
      return;
    }
    
    console.log(`Found ${airports.length} airports for flight creation`);
    
    // Step 3: Sample the first airport to determine what field to use as foreign key
    const sampleAirport = airports[0];
    console.log('Sample airport structure:', sampleAirport);
    
    // Determine which field to use (id, code, etc.) - for now, assuming 'code' since that's the error message
    const airportKeyField = 'code';
    
    // Create a map of airport codes for quick lookup
    const airportCodes = airports.map(airport => airport[airportKeyField]);
    console.log('Available airport codes:', airportCodes);
    
    if (airportCodes.length < 2) {
      console.error('Need at least 2 airports to create flights');
      return;
    }
    
    // Step 4: Generate flight data using existing airports
    console.log('Generating flights data with valid airport references...');
    
    const flightsToInsert = [];
    
    // Generate 25 flights across all jet categories
    for (let i = 0; i < 25; i++) {
      // Randomly select a jet 
      const jet = jets[Math.floor(Math.random() * jets.length)];
      
      // Randomly select two different airports
      let originIndex = Math.floor(Math.random() * airportCodes.length);
      let destinationIndex = Math.floor(Math.random() * airportCodes.length);
      
      // Ensure origin and destination are different
      while (originIndex === destinationIndex) {
        destinationIndex = Math.floor(Math.random() * airportCodes.length);
      }
      
      const originCode = airportCodes[originIndex];
      const destinationCode = airportCodes[destinationIndex];
      
      // Create departure and arrival times (1-30 days in the future)
      const departureDate = new Date();
      departureDate.setDate(departureDate.getDate() + Math.floor(Math.random() * 30) + 1);
      departureDate.setHours(Math.floor(Math.random() * 14) + 6); // Between 6 AM and 8 PM
      
      // Flight duration based on jet category
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
      
      // Create flight object with valid airport references
      flightsToInsert.push({
        jet_id: jet.id,
        origin_airport: originCode,
        destination_airport: destinationCode,
        departure_time: departureDate.toISOString(),
        arrival_time: arrivalDate.toISOString(),
        available_seats: availableSeats,
        base_price: Math.round(basePrice),
        status: status
      });
    }
    
    // Step 5: Insert flights one by one
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
          failureCount++;
        } else {
          console.log(`Successfully inserted flight ${i+1} from ${flight.origin_airport} to ${flight.destination_airport}`);
          successCount++;
        }
      } catch (e) {
        console.error(`Exception for flight ${i+1}:`, e.message);
        failureCount++;
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
    
    console.log('Flight table fix completed!');
    
  } catch (error) {
    console.error('Unexpected error during flights fix:', error.message);
  }
}

fixFlightsWithAirports().catch(err => {
  console.error('Fatal error:', err);
}); 