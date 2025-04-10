-- Script to recreate and populate the flights table with proper data
-- Run this in the Supabase SQL Editor

-- Step 1: Drop the flights table if it exists
DROP TABLE IF EXISTS flights CASCADE;

-- Step 2: Create the flights table with the proper schema
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

-- Step 4: Insert sample flights using actual jet IDs from your database
-- Each section adds flights for different jet categories to ensure a good distribution
-- The SQL uses subqueries to fetch random jet IDs for each category

-- First, add flights for ultra_large jets
INSERT INTO flights (
  jet_id, origin_airport, destination_airport, departure_time, arrival_time, 
  available_seats, base_price, status, specialized_event, created_at, updated_at
)
SELECT 
  id as jet_id,
  (ARRAY['KTEB', 'KJFK', 'KLAX', 'KSFO', 'KLAS'])[floor(random() * 5 + 1)] as origin_airport,
  (ARRAY['KMIA', 'KBOS', 'KORD', 'KDFW', 'KDEN'])[floor(random() * 5 + 1)] as destination_airport,
  NOW() + (random() * 30 || ' days')::interval as departure_time,
  NOW() + (random() * 30 || ' days')::interval + (floor(random() * 6 + 3) || ' hours')::interval as arrival_time,
  floor(random() * 20 + 15) as available_seats, -- Ultra large jets have more seats
  floor(random() * 20000 + 20000) as base_price, -- Higher prices for ultra large
  (ARRAY['scheduled', 'scheduled', 'boarding', 'in_air'])[floor(random() * 4 + 1)] as status,
  random() < 0.3 as specialized_event, -- 30% chance of specialized event
  NOW() as created_at,
  NOW() as updated_at
FROM jets
WHERE category = 'ultra_large'
LIMIT 5;

-- Add flights for heavy jets
INSERT INTO flights (
  jet_id, origin_airport, destination_airport, departure_time, arrival_time, 
  available_seats, base_price, status, specialized_event, created_at, updated_at
)
SELECT 
  id as jet_id,
  (ARRAY['KMIA', 'KBOS', 'KSEA', 'KDEN', 'KORD'])[floor(random() * 5 + 1)] as origin_airport,
  (ARRAY['KLAX', 'KJFK', 'KSFO', 'KDFW', 'KLAS'])[floor(random() * 5 + 1)] as destination_airport,
  NOW() + (random() * 30 || ' days')::interval as departure_time,
  NOW() + (random() * 30 || ' days')::interval + (floor(random() * 5 + 2) || ' hours')::interval as arrival_time,
  floor(random() * 10 + 10) as available_seats,
  floor(random() * 10000 + 10000) as base_price,
  (ARRAY['scheduled', 'scheduled', 'boarding', 'in_air'])[floor(random() * 4 + 1)] as status,
  random() < 0.3 as specialized_event,
  NOW() as created_at,
  NOW() as updated_at
FROM jets
WHERE category = 'heavy'
LIMIT 5;

-- Add flights for super_midsize jets
INSERT INTO flights (
  jet_id, origin_airport, destination_airport, departure_time, arrival_time, 
  available_seats, base_price, status, specialized_event, created_at, updated_at
)
SELECT 
  id as jet_id,
  (ARRAY['KLAS', 'KORD', 'KJFK', 'KPHL', 'KATL'])[floor(random() * 5 + 1)] as origin_airport,
  (ARRAY['KDEN', 'KLAX', 'KMIA', 'KSFO', 'KBOS'])[floor(random() * 5 + 1)] as destination_airport,
  NOW() + (random() * 30 || ' days')::interval as departure_time,
  NOW() + (random() * 30 || ' days')::interval + (floor(random() * 4 + 2) || ' hours')::interval as arrival_time,
  floor(random() * 6 + 6) as available_seats,
  floor(random() * 5000 + 5000) as base_price,
  (ARRAY['scheduled', 'scheduled', 'boarding', 'in_air'])[floor(random() * 4 + 1)] as status,
  random() < 0.3 as specialized_event,
  NOW() as created_at,
  NOW() as updated_at
FROM jets
WHERE category = 'super_midsize'
LIMIT 5;

-- Add flights for midsize jets
INSERT INTO flights (
  jet_id, origin_airport, destination_airport, departure_time, arrival_time, 
  available_seats, base_price, status, specialized_event, created_at, updated_at
)
SELECT 
  id as jet_id,
  (ARRAY['KDEN', 'KHOU', 'KATL', 'KPHL', 'KBOS'])[floor(random() * 5 + 1)] as origin_airport,
  (ARRAY['KJFK', 'KMIA', 'KLAS', 'KSEA', 'KSFO'])[floor(random() * 5 + 1)] as destination_airport,
  NOW() + (random() * 30 || ' days')::interval as departure_time,
  NOW() + (random() * 30 || ' days')::interval + (floor(random() * 3 + 2) || ' hours')::interval as arrival_time,
  floor(random() * 4 + 4) as available_seats,
  floor(random() * 4000 + 3500) as base_price,
  (ARRAY['scheduled', 'scheduled', 'boarding', 'in_air'])[floor(random() * 4 + 1)] as status,
  random() < 0.3 as specialized_event,
  NOW() as created_at,
  NOW() as updated_at
FROM jets
WHERE category = 'midsize'
LIMIT 5;

-- Add flights for light jets
INSERT INTO flights (
  jet_id, origin_airport, destination_airport, departure_time, arrival_time, 
  available_seats, base_price, status, specialized_event, created_at, updated_at
)
SELECT 
  id as jet_id,
  (ARRAY['KSEA', 'KPHL', 'KSJC', 'KSAN', 'KMSP'])[floor(random() * 5 + 1)] as origin_airport,
  (ARRAY['KLAS', 'KDEN', 'KHOU', 'KATL', 'KORD'])[floor(random() * 5 + 1)] as destination_airport,
  NOW() + (random() * 30 || ' days')::interval as departure_time,
  NOW() + (random() * 30 || ' days')::interval + (floor(random() * 3 + 1) || ' hours')::interval as arrival_time,
  floor(random() * 3 + 3) as available_seats,
  floor(random() * 3000 + 2000) as base_price,
  (ARRAY['scheduled', 'scheduled', 'boarding', 'in_air'])[floor(random() * 4 + 1)] as status,
  random() < 0.3 as specialized_event,
  NOW() as created_at,
  NOW() as updated_at
FROM jets
WHERE category = 'light' OR category = 'very_light'
LIMIT 5;

-- Add a few additional specialized flights focusing on crew experience for JetStream Pulse
INSERT INTO flights (
  jet_id, origin_airport, destination_airport, departure_time, arrival_time, 
  available_seats, base_price, status, specialized_event, created_at, updated_at
)
SELECT 
  id as jet_id,
  'KTEB' as origin_airport,
  'KLAX' as destination_airport,
  NOW() + (7 || ' days')::interval as departure_time,
  NOW() + (7 || ' days')::interval + (6 || ' hours')::interval as arrival_time,
  10 as available_seats,
  15000 as base_price,
  'scheduled' as status,
  TRUE as specialized_event,
  NOW() as created_at,
  NOW() as updated_at
FROM jets
WHERE category = 'heavy'
LIMIT 1;

-- Add one more flight with high demand (low seats) for Pulse matching
INSERT INTO flights (
  jet_id, origin_airport, destination_airport, departure_time, arrival_time, 
  available_seats, base_price, status, specialized_event, created_at, updated_at
)
SELECT 
  id as jet_id,
  'KMIA' as origin_airport,
  'KLAS' as destination_airport,
  NOW() + (3 || ' days')::interval as departure_time,
  NOW() + (3 || ' days')::interval + (5 || ' hours')::interval as arrival_time,
  2 as available_seats,
  8500 as base_price,
  'scheduled' as status,
  TRUE as specialized_event,
  NOW() as created_at,
  NOW() as updated_at
FROM jets
WHERE category = 'super_midsize'
LIMIT 1;

-- Verify flights were created
SELECT COUNT(*) as flights_count FROM flights; 