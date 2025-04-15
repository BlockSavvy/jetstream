-- IMPROVED SCRIPT: Create and populate the flights table
-- Run this in the Supabase SQL Editor

-- Step 1: Drop the flights table if it exists
DROP TABLE IF EXISTS flights CASCADE;

-- Step 2: Create the flights table with text for airport codes (not foreign keys)
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

-- Step 3: Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_flights_jet_id ON flights(jet_id);
CREATE INDEX IF NOT EXISTS idx_flights_status ON flights(status);
CREATE INDEX IF NOT EXISTS idx_flights_departure_time ON flights(departure_time);

-- Step 4: Insert sample flights for different jet categories
-- This script creates a variety of flights across multiple jet categories and routes

-- First, add some flights for ultra_large category jets
INSERT INTO flights (
  jet_id, origin_airport, destination_airport, departure_time, arrival_time, 
  available_seats, base_price, status, specialized_event
)
SELECT 
  id as jet_id,
  'KTEB' as origin_airport,
  'KLAX' as destination_airport,
  NOW() + ((random() * 30)::integer || ' days')::interval as departure_time,
  NOW() + ((random() * 30)::integer || ' days')::interval + ((5 + random() * 2)::integer || ' hours')::interval as arrival_time,
  (capacity * 0.7)::integer as available_seats,
  hourly_rate * 5 as base_price,
  'scheduled' as status,
  (random() > 0.7) as specialized_event
FROM jets
WHERE category = 'ultra_large'
LIMIT 3;

-- Add flights for heavy jets
INSERT INTO flights (
  jet_id, origin_airport, destination_airport, departure_time, arrival_time, 
  available_seats, base_price, status, specialized_event
)
SELECT 
  id as jet_id,
  'KMIA' as origin_airport,
  'KLAS' as destination_airport,
  NOW() + ((random() * 25)::integer || ' days')::interval as departure_time,
  NOW() + ((random() * 25)::integer || ' days')::interval + ((4 + random() * 2)::integer || ' hours')::interval as arrival_time,
  (capacity * 0.8)::integer as available_seats,
  hourly_rate * 4 as base_price,
  'scheduled' as status,
  (random() > 0.7) as specialized_event
FROM jets
WHERE category = 'heavy'
LIMIT 4;

-- Add flights for super_midsize jets
INSERT INTO flights (
  jet_id, origin_airport, destination_airport, departure_time, arrival_time, 
  available_seats, base_price, status, specialized_event
)
SELECT 
  id as jet_id,
  'KORD' as origin_airport,
  'KJFK' as destination_airport,
  NOW() + ((random() * 20)::integer || ' days')::interval as departure_time,
  NOW() + ((random() * 20)::integer || ' days')::interval + ((3 + random() * 2)::integer || ' hours')::interval as arrival_time,
  (capacity * 0.75)::integer as available_seats,
  hourly_rate * 3 as base_price,
  'scheduled' as status,
  (random() > 0.7) as specialized_event
FROM jets
WHERE category = 'super_midsize'
LIMIT 4;

-- Add flights for midsize jets
INSERT INTO flights (
  jet_id, origin_airport, destination_airport, departure_time, arrival_time, 
  available_seats, base_price, status, specialized_event
)
SELECT 
  id as jet_id,
  'KSFO' as origin_airport,
  'KDEN' as destination_airport,
  NOW() + ((random() * 15)::integer || ' days')::interval as departure_time,
  NOW() + ((random() * 15)::integer || ' days')::interval + ((2 + random() * 2)::integer || ' hours')::interval as arrival_time,
  (capacity * 0.8)::integer as available_seats,
  hourly_rate * 2.5 as base_price,
  'scheduled' as status,
  (random() > 0.7) as specialized_event
FROM jets
WHERE category = 'midsize'
LIMIT 3;

-- Add flights for light jets
INSERT INTO flights (
  jet_id, origin_airport, destination_airport, departure_time, arrival_time, 
  available_seats, base_price, status, specialized_event
)
SELECT 
  id as jet_id,
  'KBOS' as origin_airport,
  'KPHL' as destination_airport,
  NOW() + ((random() * 10)::integer || ' days')::interval as departure_time,
  NOW() + ((random() * 10)::integer || ' days')::interval + ((1 + random() * 2)::integer || ' hours')::interval as arrival_time,
  (capacity * 0.9)::integer as available_seats,
  hourly_rate * 2 as base_price,
  'scheduled' as status,
  (random() > 0.7) as specialized_event
FROM jets
WHERE category = 'light' OR category = 'very_light'
LIMIT 3;

-- Add additional popular routes
INSERT INTO flights (
  jet_id, origin_airport, destination_airport, departure_time, arrival_time, 
  available_seats, base_price, status, specialized_event
)
VALUES
-- New York to LA route (popular business route)
(
  (SELECT id FROM jets WHERE category = 'heavy' LIMIT 1),
  'KJFK', 'KLAX',
  NOW() + '7 days'::interval + '8 hours'::interval,
  NOW() + '7 days'::interval + '14 hours'::interval,
  8, 12000, 'scheduled', TRUE
),
-- Miami to Las Vegas (popular leisure route)
(
  (SELECT id FROM jets WHERE category = 'super_midsize' LIMIT 1),
  'KMIA', 'KLAS',
  NOW() + '10 days'::interval + '10 hours'::interval,
  NOW() + '10 days'::interval + '14 hours'::interval,
  6, 8500, 'scheduled', TRUE
),
-- San Francisco to Chicago (business route)
(
  (SELECT id FROM jets WHERE category = 'midsize' LIMIT 1),
  'KSFO', 'KORD',
  NOW() + '5 days'::interval + '7 hours'::interval,
  NOW() + '5 days'::interval + '12 hours'::interval,
  4, 6800, 'scheduled', FALSE
),
-- Boston to Atlanta (regional route)
(
  (SELECT id FROM jets WHERE category = 'light' LIMIT 1),
  'KBOS', 'KATL',
  NOW() + '3 days'::interval + '9 hours'::interval,
  NOW() + '3 days'::interval + '12 hours'::interval,
  6, 4500, 'scheduled', FALSE
);

-- Add a few flights with boarding or in-air status (for variety)
INSERT INTO flights (
  jet_id, origin_airport, destination_airport, departure_time, arrival_time, 
  available_seats, base_price, status, specialized_event
)
VALUES
-- Boarding flight
(
  (SELECT id FROM jets WHERE category = 'heavy' LIMIT 1 OFFSET 1),
  'KDFW', 'KMIA',
  NOW() + '1 hours'::interval,
  NOW() + '4 hours'::interval,
  2, 9500, 'boarding', FALSE
),
-- In-air flight
(
  (SELECT id FROM jets WHERE category = 'super_midsize' LIMIT 1 OFFSET 1),
  'KLAS', 'KSEA',
  NOW() - '2 hours'::interval,
  NOW() + '1 hours'::interval,
  0, 7200, 'in_air', TRUE
);

-- Add crew connections for the specialized events
UPDATE flights 
SET crew_id = (SELECT id FROM pilots_crews WHERE specializations @> ARRAY['Comedy'] LIMIT 1)
WHERE specialized_event = TRUE 
AND id IN (SELECT id FROM flights ORDER BY RANDOM() LIMIT 3);

UPDATE flights 
SET crew_id = (SELECT id FROM pilots_crews WHERE specializations @> ARRAY['Business Networking'] LIMIT 1)
WHERE specialized_event = TRUE 
AND crew_id IS NULL
AND id IN (SELECT id FROM flights ORDER BY RANDOM() LIMIT 3);

UPDATE flights 
SET crew_id = (SELECT id FROM pilots_crews WHERE specializations @> ARRAY['Wine Tasting'] LIMIT 1)
WHERE specialized_event = TRUE 
AND crew_id IS NULL
AND id IN (SELECT id FROM flights ORDER BY RANDOM() LIMIT 3);

-- Verify flights were created
SELECT COUNT(*) as flights_count FROM flights;

-- Show a sample of flights created
SELECT 
  f.id, 
  j.model, 
  j.manufacturer,
  f.origin_airport, 
  f.destination_airport, 
  f.departure_time, 
  f.arrival_time, 
  f.available_seats, 
  f.base_price,
  f.status,
  f.specialized_event,
  CASE WHEN f.crew_id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_crew
FROM flights f
JOIN jets j ON f.jet_id = j.id
ORDER BY f.departure_time
LIMIT 10; 