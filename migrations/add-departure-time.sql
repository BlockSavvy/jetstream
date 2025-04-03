-- Migration to add departure_time column to jetshare_offers

-- Add the column with a default value of NOW() for existing rows
ALTER TABLE jetshare_offers ADD COLUMN departure_time TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Set departure_time to match flight_date for existing records
-- This handles existing data by copying the flight_date value
UPDATE jetshare_offers SET departure_time = flight_date;

-- Create an index for efficient querying by departure_time
CREATE INDEX IF NOT EXISTS idx_jetshare_offers_departure_time ON jetshare_offers(departure_time);

-- Add a comment describing the column
COMMENT ON COLUMN jetshare_offers.departure_time IS 'The specific departure time of the flight, including timezone information'; 