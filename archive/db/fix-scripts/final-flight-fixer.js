const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// This script will:
// 1. Try to determine the actual schema of flights table
// 2. Create minimal flight objects matching the schema
// 3. Insert data accordingly

async function finalFlightsFix() {
  try {
    console.log('Starting final flights table fix...');
    
    // Step 1: Check for existing jets before creating flights
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
    
    // Step 2: Try to determine the flights table schema by using a SQL query
    console.log('Attempting to determine flights table schema...');
    
    try {
      const { data: schemaData, error: schemaError } = await supabase.rpc('exec_sql', {
        sql_query: `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'flights' AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });
      
      if (schemaError) {
        console.error('Error getting schema:', schemaError.message);
        console.log('Checking if flights table exists with a basic query...');
        
        // Try a simple query to see if the table exists
        const { data: exists, error: existsError } = await supabase
          .from('flights')
          .select('id')
          .limit(1);
          
        if (existsError) {
          console.log('Error checking flights table:', existsError.message);
          console.log('Please run the SQL script directly in the Supabase SQL editor.');
          return;
        } else {
          console.log('Flights table exists but schema could not be determined via SQL.');
        }
      } else {
        console.log('Schema determined successfully:', schemaData);
      }
    } catch (e) {
      console.log('Error executing schema query:', e.message);
    }
    
    // Step 3: Try with a minimal flight object (required fields only)
    console.log('Attempting minimal flight insert to determine schema...');
    
    // Create a minimal flight object with only essential fields
    const minimalFlight = {
      jet_id: jets[0].id,
      origin_airport: 'KTEB',
      destination_airport: 'KLAX',
      departure_time: new Date(Date.now() + 7*24*60*60*1000).toISOString(), // 7 days in future
      arrival_time: new Date(Date.now() + 7*24*60*60*1000 + 5*60*60*1000).toISOString(), // 5 hours flight
      available_seats: 5,
      base_price: 5000,
      status: 'scheduled'
    };
    
    const { error: testError } = await supabase
      .from('flights')
      .insert(minimalFlight);
      
    if (testError) {
      console.log('Error with minimal flight insert:', testError.message);
      
      if (testError.message.includes('not-null constraint')) {
        console.log('Missing a required field. Please check SQL script for the correct schema.');
        return;
      }
    } else {
      console.log('Minimal flight inserted successfully. Schema determined to be compatible.');
    }
    
    // Step 4: Generate flight data with the determined schema
    console.log('Generating flights data with compatible schema...');
    
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
    
    // Generate 25 flights across all jet categories
    for (let i = 0; i < 25; i++) {
      const jet = jets[Math.floor(Math.random() * jets.length)];
      const route = airportRoutes[Math.floor(Math.random() * airportRoutes.length)];
      
      // Create departure and arrival times (1-30 days in the future)
      const departureDate = new Date();
      departureDate.setDate(departureDate.getDate() + Math.floor(Math.random() * 30) + 1);
      departureDate.setHours(Math.floor(Math.random() * 14) + 6); // Between 6 AM and 8 PM
      
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
      
      // Create minimal flight object (only including properties we know exist)
      flightsToInsert.push({
        jet_id: jet.id,
        origin_airport: route.origin,
        destination_airport: route.destination,
        departure_time: departureDate.toISOString(),
        arrival_time: arrivalDate.toISOString(),
        available_seats: availableSeats,
        base_price: Math.round(basePrice),
        status: status
      });
    }
    
    // Step 5: Insert flight data one by one
    console.log('Inserting flights individually...');
    
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < flightsToInsert.length; i++) {
      try {
        const { error: insertError } = await supabase
          .from('flights')
          .insert(flightsToInsert[i]);
        
        if (insertError) {
          console.error(`Error inserting flight ${i+1}:`, insertError.message);
          failureCount++;
        } else {
          console.log(`Successfully inserted flight ${i+1}`);
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
    
    console.log('Flight table fix completed. If you encounter issues, please use the SQL script from db/fix-flights-sql-editor.sql.');
    
  } catch (error) {
    console.error('Unexpected error during flights fix:', error.message);
  }
}

finalFlightsFix().catch(err => {
  console.error('Fatal error:', err);
}); 