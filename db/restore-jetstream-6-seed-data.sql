-- JETSTREAM DATABASE RESTORATION SCRIPT - PART 6: SEED DATA
-- This script populates the database with sample data

-- ======================================================================
-- HELPER FUNCTIONS
-- ======================================================================

-- Helper function to generate random future date
CREATE OR REPLACE FUNCTION random_future_date(days_ahead int) RETURNS timestamptz AS $$
BEGIN
  RETURN NOW() + (random() * days_ahead || ' days')::interval;
END;
$$ LANGUAGE plpgsql;

-- Helper function to generate random past date
CREATE OR REPLACE FUNCTION random_past_date(days_ago int) RETURNS timestamptz AS $$
BEGIN
  RETURN NOW() - (random() * days_ago || ' days')::interval;
END;
$$ LANGUAGE plpgsql;

-- Helper function to generate random flight cost
CREATE OR REPLACE FUNCTION random_flight_cost() RETURNS numeric AS $$
DECLARE
  min_cost int;
  max_cost int;
  bucket int;
BEGIN
  bucket := floor(random() * 4);
  
  IF bucket = 0 THEN
    min_cost := 20000;
    max_cost := 35000;
  ELSIF bucket = 1 THEN
    min_cost := 35000;
    max_cost := 50000;
  ELSIF bucket = 2 THEN
    min_cost := 50000;
    max_cost := 75000;
  ELSE
    min_cost := 75000;
    max_cost := 100000;
  END IF;
  
  RETURN min_cost + floor(random() * (max_cost - min_cost));
END;
$$ LANGUAGE plpgsql;

-- Helper function to calculate share amount
CREATE OR REPLACE FUNCTION calculate_share_amount(total_cost numeric) RETURNS numeric AS $$
BEGIN
  RETURN floor(total_cost * (0.4 + random() * 0.2));
END;
$$ LANGUAGE plpgsql;

-- ======================================================================
-- USERS AND PROFILES
-- ======================================================================

-- First, create sample users in auth.users
DO $$
DECLARE
  user_id uuid;
  first_names text[] := ARRAY['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Emma', 'William', 'Olivia',
                            'Alexander', 'Sophia', 'Daniel', 'Ava', 'Matthew', 'Isabella', 'Christopher', 'Mia', 'Andrew', 'Charlotte'];
  last_names text[] := ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                           'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White', 'Lopez'];
  user_types text[] := ARRAY['traveler', 'traveler', 'traveler', 'traveler', 'owner', 'traveler', 'traveler', 'traveler', 'owner', 'traveler',
                          'traveler', 'traveler', 'owner', 'traveler', 'traveler', 'traveler', 'owner', 'traveler', 'traveler', 'owner'];
BEGIN
  FOR i IN 1..20 LOOP
    -- Insert into auth.users
    INSERT INTO auth.users (id, email, created_at)
    VALUES (
      uuid_generate_v4(),
      lower(first_names[i] || '.' || last_names[i] || '@example.com'),
      NOW() - (random() * 30 || ' days')::interval
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO user_id;
    
    IF user_id IS NOT NULL THEN
      -- Create corresponding profile
      INSERT INTO profiles (
        id,
        first_name,
        last_name,
        avatar_url,
        bio,
        user_type,
        verification_status,
        created_at,
        updated_at
      ) VALUES (
        user_id,
        first_names[i],
        last_names[i],
        CASE WHEN random() > 0.3 THEN '/avatars/user-' || i || '.jpg' ELSE NULL END,
        CASE 
          WHEN user_types[i] = 'traveler' THEN 'Frequent traveler who enjoys luxury experiences'
          WHEN user_types[i] = 'owner' THEN 'Private jet owner looking to optimize asset utilization'
          ELSE 'JetStream administrator'
        END,
        user_types[i],
        'verified',
        NOW() - (random() * 30 || ' days')::interval,
        NOW() - (random() * 15 || ' days')::interval
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- ======================================================================
-- JETS
-- ======================================================================

-- Create sample jets
INSERT INTO jets (id, owner_id, model, manufacturer, year, tail_number, capacity, range_nm, 
                images, amenities, home_base_airport, status, hourly_rate, created_at, updated_at)
SELECT
  uuid_generate_v4(),
  (SELECT id FROM profiles WHERE user_type = 'owner' ORDER BY random() LIMIT 1),
  model,
  manufacturer,
  year,
  'N' || (1000 + n)::text,
  capacity,
  range_nm,
  ARRAY['/jets/' || n || '.jpg'],
  amenities,
  airport,
  status,
  hourly_rate,
  NOW() - (random() * 90 || ' days')::interval,
  NOW() - (random() * 30 || ' days')::interval
FROM (
  VALUES
    ('Gulfstream G650', 'Gulfstream', 2020, 13, 7000, '{"wifi": true, "shower": true, "bedroom": true, "entertainment": "Premium entertainment system"}'::jsonb, 'KTEB', 'available', 9500),
    ('Bombardier Global 7500', 'Bombardier', 2021, 14, 7700, '{"wifi": true, "shower": true, "bedroom": true, "galley": "Full kitchen"}'::jsonb, 'KLAS', 'available', 10200),
    ('Dassault Falcon 8X', 'Dassault', 2019, 12, 6450, '{"wifi": true, "entertainment": "Advanced entertainment system"}'::jsonb, 'KLAX', 'available', 8900),
    ('Cessna Citation Longitude', 'Cessna', 2018, 8, 3500, '{"wifi": true, "entertainment": "Standard entertainment"}'::jsonb, 'KSJC', 'available', 5500),
    ('Embraer Praetor 600', 'Embraer', 2021, 9, 4018, '{"wifi": true, "entertainment": "Premium sound system"}'::jsonb, 'KPBI', 'available', 6200),
    ('Bombardier Challenger 350', 'Bombardier', 2020, 10, 3200, '{"wifi": true, "galley": "Premium refreshment center"}'::jsonb, 'KMDW', 'available', 7100),
    ('Gulfstream G550', 'Gulfstream', 2017, 16, 6750, '{"wifi": true, "shower": true, "bedroom": true}'::jsonb, 'KJFK', 'available', 8800),
    ('Dassault Falcon 2000LXS', 'Dassault', 2019, 10, 4000, '{"wifi": true, "galley": "Luxurious dining"}'::jsonb, 'KDAL', 'available', 6500),
    ('Cessna Citation Latitude', 'Cessna', 2018, 9, 2700, '{"wifi": true, "entertainment": "Streaming capability"}'::jsonb, 'KDEN', 'available', 4900),
    ('Bombardier Global 6000', 'Bombardier', 2016, 13, 6000, '{"wifi": true, "bedroom": true, "galley": "Chef station"}'::jsonb, 'KSFO', 'available', 8200),
    ('Gulfstream G450', 'Gulfstream', 2015, 14, 4350, '{"wifi": true, "entertainment": "Multi-screen system"}'::jsonb, 'KIAD', 'available', 7800),
    ('Embraer Legacy 500', 'Embraer', 2017, 8, 3125, '{"wifi": true, "galley": "Premium service area"}'::jsonb, 'KMIA', 'available', 5600),
    ('Bombardier Challenger 650', 'Bombardier', 2019, 12, 4000, '{"wifi": true, "entertainment": "Surround sound"}'::jsonb, 'KATL', 'available', 7300),
    ('Pilatus PC-24', 'Pilatus', 2020, 6, 2000, '{"wifi": true, "entertainment": "Basic system"}'::jsonb, 'KAUS', 'maintenance', 4200),
    ('HondaJet Elite', 'Honda', 2021, 5, 1437, '{"wifi": true, "entertainment": "Compact system"}'::jsonb, 'KBOS', 'unavailable', 3100)
  ) AS t(model, manufacturer, year, capacity, range_nm, amenities, airport, status, hourly_rate), 
  generate_series(1, 15) AS s(n)
ON CONFLICT DO NOTHING;

-- ======================================================================
-- AIRPORTS
-- ======================================================================

-- Add sample airports
INSERT INTO airports (code, name, city, country, is_private)
VALUES 
  ('KTEB', 'Teterboro Airport', 'Teterboro, NJ', 'USA', TRUE),
  ('KLAS', 'Harry Reid International Airport', 'Las Vegas, NV', 'USA', FALSE),
  ('KLAX', 'Los Angeles International Airport', 'Los Angeles, CA', 'USA', FALSE),
  ('KSJC', 'Norman Y. Mineta San Jose International Airport', 'San Jose, CA', 'USA', FALSE),
  ('KPBI', 'Palm Beach International Airport', 'West Palm Beach, FL', 'USA', FALSE),
  ('KMDW', 'Chicago Midway International Airport', 'Chicago, IL', 'USA', FALSE),
  ('KJFK', 'John F. Kennedy International Airport', 'New York, NY', 'USA', FALSE),
  ('KDAL', 'Dallas Love Field', 'Dallas, TX', 'USA', FALSE),
  ('KDEN', 'Denver International Airport', 'Denver, CO', 'USA', FALSE),
  ('KSFO', 'San Francisco International Airport', 'San Francisco, CA', 'USA', FALSE),
  ('KIAD', 'Dulles International Airport', 'Washington, DC', 'USA', FALSE),
  ('KMIA', 'Miami International Airport', 'Miami, FL', 'USA', FALSE),
  ('KATL', 'Hartsfield-Jackson Atlanta International Airport', 'Atlanta, GA', 'USA', FALSE),
  ('KAUS', 'Austin-Bergstrom International Airport', 'Austin, TX', 'USA', FALSE),
  ('KBOS', 'Boston Logan International Airport', 'Boston, MA', 'USA', FALSE)
ON CONFLICT DO NOTHING;

-- ======================================================================
-- PILOTS AND CREW
-- ======================================================================

-- Create crew members
DO $$
DECLARE
  crew_id uuid;
  user_id uuid;
  first_names text[] := ARRAY['Thomas', 'Rebecca', 'Jonathan', 'Victoria', 'Benjamin', 'Katherine', 'Max', 'Elizabeth', 'Nicholas', 
                               'Alexandra', 'Samuel', 'Gabriella', 'Xavier', 'Sophia', 'Timothy', 'Eva', 'Nathan', 'Natalia', 'Edward', 'Olivia'];
  last_names text[] := ARRAY['Wright', 'Johnson', 'Spencer', 'Williams', 'Harrison', 'Brooks', 'Reynolds', 'Fletcher', 'Shepard', 
                              'Montgomery', 'Stevens', 'Sullivan', 'Rodriguez', 'Morgan', 'Collins', 'Winters', 'Lincoln', 'Blackwood', 'Lancaster', 'Richardson'];
  specializations text[][] := ARRAY[
    ARRAY['Comedy', 'Business Networking'], 
    ARRAY['Wellness', 'Yoga'], 
    ARRAY['Wine Tasting', 'Culinary'], 
    ARRAY['Business Networking', 'Tech Talks'], 
    ARRAY['Comedy', 'Musical Performance'], 
    ARRAY['Wellness', 'Meditation'], 
    ARRAY['Live Podcast', 'Business Networking'], 
    ARRAY['Wellness', 'Fitness'], 
    ARRAY['Business Networking', 'Finance Workshops'], 
    ARRAY['Art Appreciation', 'Cultural Experiences'], 
    ARRAY['Comedy', 'Improv'], 
    ARRAY['Live Podcast', 'Tech Talks'], 
    ARRAY['Wine Tasting', 'Cultural Experiences'], 
    ARRAY['Wellness', 'Nutrition'], 
    ARRAY['Business Networking', 'Entrepreneurship'], 
    ARRAY['Meditation', 'Yoga'], 
    ARRAY['Comedy', 'Storytelling'], 
    ARRAY['Culinary', 'Wine Tasting'], 
    ARRAY['Business Networking', 'Investing'], 
    ARRAY['Live Podcast', 'Wellness']
  ];
  bio_templates text[] := ARRAY[
    'A seasoned aviation professional with %s years experience, specializing in %s. Known for creating memorable inflight experiences.',
    'With over %s years in luxury aviation, excels in %s. Committed to creating unforgettable journeys.',
    'Elite aviation specialist with %s years experience. Expert in %s, dedicated to exceptional service.',
    'Aviation professional for %s years, passionate about %s. Creates personalized luxury experiences.',
    'Experienced aviation expert with %s years in the industry. Specializes in %s, delivering premium service.'
  ];
  years int;
  bio text;
  is_captain boolean;
  availability text[];
BEGIN
  -- Get all traveler users
  FOR i IN 1..20 LOOP
    -- Create a new user for the crew member
    INSERT INTO auth.users (id, email, created_at)
    VALUES (
      uuid_generate_v4(),
      lower(first_names[i] || '.' || last_names[i] || '@jetstream.crew.com'),
      NOW() - (random() * 60 || ' days')::interval
    )
    RETURNING id INTO user_id;
    
    -- Create profile
    INSERT INTO profiles (
      id,
      first_name,
      last_name,
      avatar_url,
      user_type,
      verification_status,
      created_at,
      updated_at
    ) VALUES (
      user_id,
      first_names[i],
      last_names[i],
      '/crew/' || i || '.jpg',
      'traveler',
      'verified',
      NOW() - (random() * 60 || ' days')::interval,
      NOW() - (random() * 30 || ' days')::interval
    );
    
    -- Generate data for crew
    years := 5 + floor(random() * 20);
    bio := format(
      bio_templates[1 + floor(random() * array_length(bio_templates, 1))], 
      years, 
      specializations[i][1] || ' and ' || specializations[i][2]
    );
    is_captain := i <= 10; -- First 10 are captains
    availability := ARRAY['weekdays', 'weekends'];
    
    -- Create crew entry
    INSERT INTO pilots_crews (
      id,
      user_id,
      name,
      bio,
      profile_image_url,
      specializations,
      social_links,
      ratings_avg,
      is_captain,
      years_of_experience,
      availability,
      created_at,
      updated_at
    ) VALUES (
      uuid_generate_v4(),
      user_id,
      first_names[i] || ' ' || last_names[i],
      bio,
      '/crew/' || i || '.jpg',
      specializations[i],
      jsonb_build_object(
        'instagram', '@' || lower(first_names[i]) || lower(last_names[i]),
        'twitter', '@' || lower(first_names[i]) || lower(last_names[i]),
        'linkedin', 'in/' || lower(first_names[i]) || '-' || lower(last_names[i])
      ),
      4.0 + random() * 1.0,
      is_captain,
      years,
      availability,
      NOW() - (random() * 60 || ' days')::interval,
      NOW() - (random() * 30 || ' days')::interval
    )
    RETURNING id INTO crew_id;
    
    -- Create reviews for crew
    FOR j IN 1..5 LOOP
      INSERT INTO crew_reviews (
        crew_id,
        user_id,
        rating,
        review_text,
        created_at
      ) VALUES (
        crew_id,
        (SELECT id FROM profiles WHERE user_type = 'traveler' ORDER BY random() LIMIT 1),
        floor(random() * 2) + 4, -- Rating between 4 and 5
        CASE 
          WHEN j = 1 THEN 'Exceptional service and professionalism!'
          WHEN j = 2 THEN 'Made the flight experience truly memorable.'
          WHEN j = 3 THEN 'Knowledgeable and attentive throughout the journey.'
          WHEN j = 4 THEN 'Incredibly skilled and personable.'
          ELSE 'Top-notch service, would recommend highly!'
        END,
        NOW() - (random() * 30 || ' days')::interval
      );
    END LOOP;
  END LOOP;
END;
$$;

-- ======================================================================
-- FLIGHTS & BOOKINGS
-- ======================================================================

-- Create sample flights and bookings
DO $$
DECLARE
  flight_id uuid;
  jet_id uuid;
  user_id uuid;
  origin_code text;
  destination_code text;
  departure_time timestamptz;
  arrival_time timestamptz;
  crew_member uuid;
  base_price numeric;
  available_seats integer;
  crew_ids uuid[];
BEGIN
  -- Generate 15 flights
  FOR i IN 1..15 LOOP
    -- Get a random jet
    SELECT id INTO jet_id FROM jets ORDER BY random() LIMIT 1;
    
    -- Get random airports
    SELECT code INTO origin_code FROM airports ORDER BY random() LIMIT 1;
    
    -- Ensure different destination
    SELECT code INTO destination_code FROM airports WHERE code != origin_code ORDER BY random() LIMIT 1;
    
    -- Get a random crew member
    SELECT id INTO crew_member FROM pilots_crews WHERE is_captain = true ORDER BY random() LIMIT 1;
    
    -- Set times
    departure_time := random_future_date(30);
    arrival_time := departure_time + ((2 + random() * 8) || ' hours')::interval;
    
    -- Set price and capacity
    base_price := 5000 + floor(random() * 25000);
    available_seats := 4 + floor(random() * 12);
    
    -- Create flight
    INSERT INTO flights (
      id,
      jet_id,
      origin_airport,
      destination_airport,
      departure_time,
      arrival_time,
      available_seats,
      base_price,
      status,
      specialized_event,
      crew_id,
      created_at,
      updated_at
    ) VALUES (
      uuid_generate_v4(),
      jet_id,
      origin_code,
      destination_code,
      departure_time,
      arrival_time,
      available_seats,
      base_price,
      'scheduled',
      random() < 0.4, -- 40% chance of being specialized
      crew_member,
      NOW() - (random() * 15 || ' days')::interval,
      NOW() - (random() * 7 || ' days')::interval
    )
    RETURNING id INTO flight_id;
    
    -- Create bookings for this flight
    FOR j IN 1..floor(random() * 3) + 1 LOOP
      -- Get a random traveler
      SELECT id INTO user_id FROM profiles WHERE user_type = 'traveler' ORDER BY random() LIMIT 1;
      
      -- Create booking
      INSERT INTO bookings (
        user_id,
        flight_id,
        seats_booked,
        booking_status,
        total_price,
        payment_status,
        ticket_code,
        created_at,
        updated_at
      ) VALUES (
        user_id,
        flight_id,
        1 + floor(random() * 2),
        'confirmed',
        base_price * (1 + floor(random() * 2)),
        'paid',
        'TKT-' || upper(substr(md5(random()::text), 1, 8)),
        NOW() - (random() * 7 || ' days')::interval,
        NOW() - (random() * 3 || ' days')::interval
      );
    END LOOP;
    
    -- Create specialized flight for some flights
    IF random() < 0.5 THEN
      -- Get random crew member
      SELECT id INTO crew_member FROM pilots_crews ORDER BY random() LIMIT 1;
      
      INSERT INTO specialized_flights (
        crew_id,
        flight_id,
        title,
        description,
        theme,
        seats_available,
        date_time,
        status,
        price_premium_percentage,
        nft_ticketed
      ) VALUES (
        crew_member,
        flight_id,
        CASE 
          WHEN random() < 0.2 THEN 'Sky-High Comedy Night'
          WHEN random() < 0.4 THEN 'Airborne Wine Tasting'
          WHEN random() < 0.6 THEN 'Business Networking at Altitude'
          WHEN random() < 0.8 THEN 'Wellness in the Clouds'
          ELSE 'Live Podcast Recording'
        END,
        'A unique and exclusive experience at 40,000 feet',
        (SELECT specializations[1] FROM pilots_crews WHERE id = crew_member),
        available_seats,
        departure_time,
        'scheduled',
        floor(random() * 20),
        random() < 0.3
      );
    END IF;
  END LOOP;
END;
$$;

-- ======================================================================
-- JETSHARE OFFERS AND TRANSACTIONS
-- ======================================================================

-- Create sample JetShare offers
DO $$
DECLARE
  offer_id uuid;
  user_id uuid;
  matched_user_id uuid;
  departure text;
  arrival text;
  total_cost numeric;
  share_amount numeric;
  handling_fee numeric;
  payment_method text;
  payment_status text;
BEGIN
  -- Create open offers
  FOR i IN 1..10 LOOP
    -- Get a random user
    SELECT id INTO user_id FROM profiles WHERE user_type = 'traveler' ORDER BY random() LIMIT 1;
    
    -- Generate flight details
    SELECT code INTO departure FROM airports ORDER BY random() LIMIT 1;
    SELECT code INTO arrival FROM airports WHERE code != departure ORDER BY random() LIMIT 1;
    
    total_cost := random_flight_cost();
    share_amount := calculate_share_amount(total_cost);
    
    -- Create the offer
    INSERT INTO "jetshare_offers" (
      id,
      user_id,
      flight_date,
      departure_location,
      arrival_location,
      total_flight_cost,
      requested_share_amount,
      status,
      created_at,
      updated_at
    ) VALUES (
      uuid_generate_v4(),
      user_id,
      random_future_date(45),
      departure,
      arrival,
      total_cost,
      share_amount,
      'open',
      NOW() - (random() * 10 || ' days')::interval,
      NOW() - (random() * 5 || ' days')::interval
    );
  END LOOP;
  
  -- Create accepted/completed offers with transactions
  FOR i IN 1..10 LOOP
    -- Get different users
    SELECT id INTO user_id FROM profiles WHERE user_type = 'traveler' ORDER BY random() LIMIT 1;
    SELECT id INTO matched_user_id FROM profiles WHERE user_type = 'traveler' AND id != user_id ORDER BY random() LIMIT 1;
    
    -- Generate flight details
    SELECT code INTO departure FROM airports ORDER BY random() LIMIT 1;
    SELECT code INTO arrival FROM airports WHERE code != departure ORDER BY random() LIMIT 1;
    
    total_cost := random_flight_cost();
    share_amount := calculate_share_amount(total_cost);
    
    -- Random status
    payment_method := CASE WHEN random() < 0.7 THEN 'fiat' ELSE 'crypto' END;
    payment_status := CASE WHEN random() < 0.8 THEN 'completed' ELSE 'pending' END;
    
    -- Create the offer
    INSERT INTO "jetshare_offers" (
      id,
      user_id,
      flight_date,
      departure_location,
      arrival_location,
      total_flight_cost,
      requested_share_amount,
      status,
      matched_user_id,
      created_at,
      updated_at
    ) VALUES (
      uuid_generate_v4(),
      user_id,
      CASE 
        WHEN i <= 5 THEN random_future_date(30) -- Future flights
        ELSE random_past_date(30) -- Past flights
      END,
      departure,
      arrival,
      total_cost,
      share_amount,
      CASE 
        WHEN i <= 5 THEN 'accepted' -- Future flights
        ELSE 'completed' -- Past flights
      END,
      matched_user_id,
      NOW() - (random() * 20 || ' days')::interval,
      NOW() - (random() * 10 || ' days')::interval
    )
    RETURNING id INTO offer_id;
    
    -- Create transaction for this offer
    handling_fee := share_amount * 0.075;
    
    INSERT INTO "jetshare_transactions" (
      offer_id,
      payer_user_id,
      recipient_user_id,
      amount,
      handling_fee,
      payment_method,
      payment_status,
      transaction_date,
      transaction_reference,
      receipt_url
    ) VALUES (
      offer_id,
      matched_user_id,
      user_id,
      share_amount,
      handling_fee,
      payment_method,
      payment_status,
      NOW() - (random() * 10 || ' days')::interval,
      'TXN-' || upper(substr(md5(random()::text), 1, 10)),
      CASE 
        WHEN payment_status = 'completed' THEN '/receipts/' || upper(substr(md5(random()::text), 1, 8)) || '.pdf'
        ELSE NULL
      END
    );
  END LOOP;
END;
$$;

-- Clean up helper functions
DROP FUNCTION IF EXISTS random_future_date(int);
DROP FUNCTION IF EXISTS random_past_date(int);
DROP FUNCTION IF EXISTS random_flight_cost();
DROP FUNCTION IF EXISTS calculate_share_amount(numeric); 