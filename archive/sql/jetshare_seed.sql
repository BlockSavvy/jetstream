-- JetShare Seed Script for Supabase SQL Editor

-- Check if settings exist, if not, create default
INSERT INTO jetshare_settings (handling_fee_percentage, allow_crypto_payments, allow_fiat_payments)
SELECT 7.5, true, true
WHERE NOT EXISTS (
  SELECT 1 FROM jetshare_settings LIMIT 1
);

-- Helper function to generate UUIDs
CREATE OR REPLACE FUNCTION random_uuid() RETURNS uuid AS $$
BEGIN
  RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- Helper function to get random user ID with profile
CREATE OR REPLACE FUNCTION random_user_id() RETURNS uuid AS $$
DECLARE
  user_id uuid;
BEGIN
  SELECT p.id INTO user_id 
  FROM profiles p 
  WHERE p.user_type = 'traveler' 
  ORDER BY RANDOM() 
  LIMIT 1;
  RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get different random user ID with profile
CREATE OR REPLACE FUNCTION different_random_user_id(exclude_id uuid) RETURNS uuid AS $$
DECLARE
  user_id uuid;
BEGIN
  SELECT p.id INTO user_id 
  FROM profiles p 
  WHERE p.id != exclude_id AND p.user_type = 'traveler'
  ORDER BY RANDOM() 
  LIMIT 1;
  RETURN user_id;
END;
$$ LANGUAGE plpgsql;

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

-- Helper function to generate random location
CREATE OR REPLACE FUNCTION random_location() RETURNS text AS $$
DECLARE
  locations text[] := ARRAY[
    'New York, NY',
    'Los Angeles, CA',
    'Chicago, IL',
    'Miami, FL',
    'Las Vegas, NV',
    'San Francisco, CA',
    'Seattle, WA',
    'Boston, MA',
    'Dallas, TX',
    'Atlanta, GA',
    'Denver, CO',
    'Austin, TX',
    'Nashville, TN',
    'New Orleans, LA',
    'Washington, DC'
  ];
BEGIN
  RETURN locations[floor(random() * array_length(locations, 1)) + 1];
END;
$$ LANGUAGE plpgsql;

-- Helper function to generate different random location
CREATE OR REPLACE FUNCTION different_random_location(exclude_location text) RETURNS text AS $$
DECLARE
  result text;
BEGIN
  LOOP
    result := random_location();
    EXIT WHEN result != exclude_location;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create sample users and profiles first
DO $$
DECLARE
  new_user_id uuid;
  first_names text[] := ARRAY['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Emma', 'William', 'Olivia'];
  last_names text[] := ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  i int;
BEGIN
  FOR i IN 1..10 LOOP
    -- Create user in auth.users
    INSERT INTO auth.users (id, email)
    VALUES (
      gen_random_uuid(),
      lower(first_names[i] || '.' || last_names[i] || '@example.com')
    )
    RETURNING id INTO new_user_id;
    
    -- Create corresponding profile
    INSERT INTO profiles (
      id,
      first_name,
      last_name,
      user_type,
      verification_status,
      created_at,
      updated_at
    ) VALUES (
      new_user_id,
      first_names[i],
      last_names[i],
      'traveler',
      'verified',
      NOW(),
      NOW()
    );
  END LOOP;
END;
$$;

-- Create sample open offers
DO $$
DECLARE
  departure text;
  arrival text;
  user_id uuid;
  total_cost numeric;
  share_amount numeric;
BEGIN
  FOR i IN 1..5 LOOP
    user_id := random_user_id();
    departure := random_location();
    arrival := different_random_location(departure);
    total_cost := random_flight_cost();
    share_amount := calculate_share_amount(total_cost);
    
    INSERT INTO jetshare_offers (
      user_id,
      flight_date,
      departure_location,
      arrival_location,
      total_flight_cost,
      requested_share_amount,
      status
    ) VALUES (
      user_id,
      random_future_date(60),
      departure,
      arrival,
      total_cost,
      share_amount,
      'open'
    );
  END LOOP;
END;
$$;

-- Create sample accepted offers with transactions
DO $$
DECLARE
  departure text;
  arrival text;
  user_id uuid;
  matched_user_id uuid;
  total_cost numeric;
  share_amount numeric;
  offer_id uuid;
  handling_fee numeric;
BEGIN
  FOR i IN 1..3 LOOP
    user_id := random_user_id();
    matched_user_id := different_random_user_id(user_id);
    departure := random_location();
    arrival := different_random_location(departure);
    total_cost := random_flight_cost();
    share_amount := calculate_share_amount(total_cost);
    
    INSERT INTO jetshare_offers (
      user_id,
      flight_date,
      departure_location,
      arrival_location,
      total_flight_cost,
      requested_share_amount,
      status,
      matched_user_id
    ) VALUES (
      user_id,
      random_future_date(30),
      departure,
      arrival,
      total_cost,
      share_amount,
      'accepted',
      matched_user_id
    ) RETURNING id INTO offer_id;
    
    -- Create transaction for this offer
    handling_fee := share_amount * 0.075;
    
    INSERT INTO jetshare_transactions (
      offer_id,
      payer_user_id,
      recipient_user_id,
      amount,
      handling_fee,
      payment_method,
      payment_status,
      transaction_date,
      transaction_reference
    ) VALUES (
      offer_id,
      matched_user_id,
      user_id,
      share_amount,
      handling_fee,
      CASE WHEN random() > 0.5 THEN 'fiat' ELSE 'crypto' END,
      'pending',
      NOW(),
      'tx_' || substr(md5(random()::text), 1, 10)
    );
  END LOOP;
END;
$$;

-- Create sample completed offers with transactions
DO $$
DECLARE
  departure text;
  arrival text;
  user_id uuid;
  matched_user_id uuid;
  total_cost numeric;
  share_amount numeric;
  offer_id uuid;
  handling_fee numeric;
BEGIN
  FOR i IN 1..4 LOOP
    user_id := random_user_id();
    matched_user_id := different_random_user_id(user_id);
    departure := random_location();
    arrival := different_random_location(departure);
    total_cost := random_flight_cost();
    share_amount := calculate_share_amount(total_cost);
    
    INSERT INTO jetshare_offers (
      user_id,
      flight_date,
      departure_location,
      arrival_location,
      total_flight_cost,
      requested_share_amount,
      status,
      matched_user_id
    ) VALUES (
      user_id,
      random_past_date(45),
      departure,
      arrival,
      total_cost,
      share_amount,
      'completed',
      matched_user_id
    ) RETURNING id INTO offer_id;
    
    -- Create transaction for this offer
    handling_fee := share_amount * 0.075;
    
    INSERT INTO jetshare_transactions (
      offer_id,
      payer_user_id,
      recipient_user_id,
      amount,
      handling_fee,
      payment_method,
      payment_status,
      transaction_date,
      transaction_reference
    ) VALUES (
      offer_id,
      matched_user_id,
      user_id,
      share_amount,
      handling_fee,
      CASE WHEN random() > 0.5 THEN 'fiat' ELSE 'crypto' END,
      'completed',
      random_past_date(30),
      'tx_' || substr(md5(random()::text), 1, 10)
    );
  END LOOP;
END;
$$;

-- Clean up helper functions
DROP FUNCTION IF EXISTS random_user_id;
DROP FUNCTION IF EXISTS different_random_user_id;
DROP FUNCTION IF EXISTS random_future_date;
DROP FUNCTION IF EXISTS random_past_date;
DROP FUNCTION IF EXISTS random_flight_cost;
DROP FUNCTION IF EXISTS calculate_share_amount;
DROP FUNCTION IF EXISTS random_location;
DROP FUNCTION IF EXISTS different_random_location; 