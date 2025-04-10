-- IMPROVED SCRIPT: Create and populate the flights table with correct airport references
-- Run this in the Supabase SQL Editor

-- Step 1: First check if we need to clean up the flights table
DO $$ 
BEGIN
  -- Check if flights table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flights') THEN
    -- Drop existing flights
    TRUNCATE TABLE flights CASCADE;
    -- Keep the table but empty it
  END IF;
END $$;

-- Step 2: Generate flights with real airports

-- Function to generate random flights
CREATE OR REPLACE FUNCTION generate_flights(num_flights INTEGER) RETURNS VOID AS $$
DECLARE
  jet_record RECORD;
  origin_code TEXT;
  destination_code TEXT;
  departure_time TIMESTAMPTZ;
  arrival_time TIMESTAMPTZ;
  flight_hours NUMERIC;
  available_seats INTEGER;
  base_price NUMERIC;
  flight_status TEXT;
  specialized_event BOOLEAN;
  
  -- Helper variables
  jet_count INTEGER;
  airport_count INTEGER;
  hour_offset INTEGER;
  status_options TEXT[] := ARRAY['scheduled', 'scheduled', 'scheduled', 'scheduled', 'boarding', 'in_air'];
  origin_index INTEGER;
  destination_index INTEGER;
  i INTEGER;
BEGIN
  -- Get count of available jets and airports
  SELECT COUNT(*) INTO jet_count FROM jets;
  SELECT COUNT(*) INTO airport_count FROM airports;
  
  -- Only proceed if we have jets and airports
  IF jet_count > 0 AND airport_count > 1 THEN
    i := 0;
    -- Generate the specified number of flights
    WHILE i < num_flights LOOP
      -- 1. Get a random jet
      SELECT * INTO jet_record FROM jets ORDER BY random() LIMIT 1;
      
      -- 2. Pick random origin and destination airports (must be different)
      origin_index := floor(random() * airport_count) + 1;
      destination_index := floor(random() * airport_count) + 1;
      
      -- Ensure origin and destination are different
      WHILE origin_index = destination_index LOOP
        destination_index := floor(random() * airport_count) + 1;
      END LOOP;
      
      -- Get the airport codes
      SELECT code INTO origin_code FROM airports OFFSET origin_index - 1 LIMIT 1;
      SELECT code INTO destination_code FROM airports OFFSET destination_index - 1 LIMIT 1;
      
      -- 3. Create departure time (1-30 days in future)
      hour_offset := floor(random() * 14) + 6; -- Between 6 AM and 8 PM
      departure_time := NOW() + (floor(random() * 30) + 1 || ' days')::interval + (hour_offset || ' hours')::interval;
      
      -- 4. Determine flight duration based on jet category
      IF jet_record.category IN ('ultra_large', 'heavy') THEN
        flight_hours := 2 + floor(random() * 4); -- 2-5 hours
      ELSIF jet_record.category IN ('super_midsize', 'midsize') THEN
        flight_hours := 1.5 + floor(random() * 3.5); -- 1.5-4.5 hours
      ELSE 
        flight_hours := 1 + floor(random() * 2); -- 1-3 hours
      END IF;
      
      -- 5. Calculate arrival time
      arrival_time := departure_time + (flight_hours || ' hours')::interval;
      
      -- 6. Set price based on category and flight duration
      IF jet_record.hourly_rate IS NOT NULL THEN
        -- Use hourly rate if available
        base_price := floor(jet_record.hourly_rate * flight_hours * (0.9 + random() * 0.2));
      ELSE
        -- Otherwise use category-based pricing
        IF jet_record.category IN ('very_light', 'light') THEN
          base_price := 2000 + (flight_hours * 500) + floor(random() * 1000);
        ELSIF jet_record.category IN ('midsize', 'super_midsize') THEN
          base_price := 4000 + (flight_hours * 1000) + floor(random() * 2000);
        ELSIF jet_record.category = 'heavy' THEN
          base_price := 8000 + (flight_hours * 1500) + floor(random() * 3000);
        ELSIF jet_record.category = 'ultra_large' THEN
          base_price := 15000 + (flight_hours * 2500) + floor(random() * 5000);
        ELSE
          base_price := 5000 + (flight_hours * 1000) + floor(random() * 2000);
        END IF;
      END IF;
      
      -- 7. Available seats (based on capacity but never full)
      available_seats := 1 + floor(random() * (COALESCE(jet_record.capacity, 10) - 1));
      
      -- 8. Flight status
      flight_status := status_options[1 + floor(random() * array_length(status_options, 1))];
      
      -- 9. Specialized event (30% chance)
      specialized_event := random() < 0.3;
      
      -- 10. Insert the flight
      BEGIN
        INSERT INTO flights (
          jet_id, 
          origin_airport, 
          destination_airport, 
          departure_time, 
          arrival_time, 
          available_seats, 
          base_price, 
          status, 
          specialized_event, 
          created_at, 
          updated_at
        ) VALUES (
          jet_record.id,
          origin_code,
          destination_code,
          departure_time,
          arrival_time,
          available_seats,
          base_price,
          flight_status,
          specialized_event,
          NOW(),
          NOW()
        );
        
        i := i + 1;
      EXCEPTION WHEN OTHERS THEN
        -- Skip this iteration if there was an error
        RAISE NOTICE 'Error inserting flight: %', SQLERRM;
      END;
    END LOOP;
  ELSE
    RAISE EXCEPTION 'Not enough jets (%) or airports (%) to create flights', jet_count, airport_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Run the function to generate 30 flights
SELECT generate_flights(30);

-- Clean up the function when done
DROP FUNCTION IF EXISTS generate_flights(INTEGER);

-- Additional special flights with specific routes (NYC to LA, Miami to Vegas)
INSERT INTO flights (
  jet_id, 
  origin_airport, 
  destination_airport, 
  departure_time, 
  arrival_time, 
  available_seats, 
  base_price, 
  status, 
  specialized_event, 
  created_at, 
  updated_at
)
SELECT 
  id,
  'KJFK', -- New York
  'KLAX', -- Los Angeles
  NOW() + '7 days'::interval + '9 hours'::interval,
  NOW() + '7 days'::interval + '15 hours'::interval,
  10,
  15000,
  'scheduled',
  TRUE,
  NOW(),
  NOW()
FROM jets
WHERE category = 'heavy'
LIMIT 1;

INSERT INTO flights (
  jet_id, 
  origin_airport, 
  destination_airport, 
  departure_time, 
  arrival_time, 
  available_seats, 
  base_price, 
  status, 
  specialized_event, 
  created_at, 
  updated_at
)
SELECT 
  id,
  'KPBI', -- West Palm Beach
  'KLAS', -- Las Vegas
  NOW() + '10 days'::interval + '10 hours'::interval,
  NOW() + '10 days'::interval + '15 hours'::interval,
  6,
  8500,
  'scheduled',
  TRUE,
  NOW(),
  NOW()
FROM jets
WHERE category = 'super_midsize'
LIMIT 1;

-- Add flights with boarding/in-air status
INSERT INTO flights (
  jet_id, 
  origin_airport, 
  destination_airport, 
  departure_time, 
  arrival_time, 
  available_seats, 
  base_price, 
  status, 
  specialized_event, 
  created_at, 
  updated_at
)
SELECT 
  id,
  'KSFO', -- San Francisco
  'KDEN', -- Denver
  NOW() + '1 hours'::interval,
  NOW() + '4 hours'::interval,
  2,
  9500,
  'boarding',
  FALSE,
  NOW(),
  NOW()
FROM jets
ORDER BY random()
LIMIT 1;

INSERT INTO flights (
  jet_id, 
  origin_airport, 
  destination_airport, 
  departure_time, 
  arrival_time, 
  available_seats, 
  base_price, 
  status, 
  specialized_event, 
  created_at, 
  updated_at
)
SELECT 
  id,
  'KMDW', -- Chicago Midway
  'KTEB', -- Teterboro (NYC area)
  NOW() - '2 hours'::interval,
  NOW() + '1 hours'::interval,
  0,
  7200,
  'in_air',
  FALSE,
  NOW(),
  NOW()
FROM jets
ORDER BY random()
LIMIT 1;

-- Verify flights were created
SELECT COUNT(*) as flights_count FROM flights;

-- Show sample flights
SELECT 
  f.id, 
  j.model, 
  j.manufacturer,
  o.name as origin_airport, 
  d.name as destination_airport, 
  f.departure_time, 
  f.arrival_time, 
  f.available_seats, 
  f.base_price,
  f.status,
  f.specialized_event
FROM flights f
JOIN jets j ON f.jet_id = j.id
JOIN airports o ON f.origin_airport = o.code
JOIN airports d ON f.destination_airport = d.code
ORDER BY f.departure_time
LIMIT 10; 