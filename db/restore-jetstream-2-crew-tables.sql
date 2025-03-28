-- JETSTREAM DATABASE RESTORATION SCRIPT - PART 2: CREW TABLES
-- This script creates the pilots and crew related tables

-- Create pilots_crews table
CREATE TABLE IF NOT EXISTS pilots_crews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  specializations TEXT[] NOT NULL,
  social_links JSONB,
  ratings_avg FLOAT DEFAULT 0,
  is_captain BOOLEAN DEFAULT FALSE,
  dedicated_jet_owner_id TEXT,
  years_of_experience INTEGER,
  availability TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create crew_reviews table
CREATE TABLE IF NOT EXISTS crew_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_id UUID REFERENCES pilots_crews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  flight_id UUID REFERENCES flights(id) ON DELETE SET NULL, -- Reference to a flight
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create specialized_flights table
CREATE TABLE IF NOT EXISTS specialized_flights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_id UUID REFERENCES pilots_crews(id) ON DELETE CASCADE,
  flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT NOT NULL,
  seats_available INTEGER NOT NULL DEFAULT 0,
  date_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  price_premium_percentage INTEGER DEFAULT 0,
  nft_ticketed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create custom_itinerary_requests table
CREATE TABLE IF NOT EXISTS custom_itinerary_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requesting_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  destination TEXT,
  origin TEXT,
  date_time TIMESTAMPTZ,
  requested_specializations TEXT[] NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'completed', 'cancelled')),
  matches_found JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create or update trigger function to update ratings average
CREATE OR REPLACE FUNCTION update_crew_ratings_avg()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pilots_crews
  SET ratings_avg = (
    SELECT AVG(rating)
    FROM crew_reviews
    WHERE crew_id = NEW.crew_id
  )
  WHERE id = NEW.crew_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or update trigger to call the function after insert or update on crew_reviews
DROP TRIGGER IF EXISTS update_crew_ratings_trig ON crew_reviews;
CREATE TRIGGER update_crew_ratings_trig
AFTER INSERT OR UPDATE ON crew_reviews
FOR EACH ROW
EXECUTE FUNCTION update_crew_ratings_avg();

-- Create indexes for faster searching and filtering
CREATE INDEX IF NOT EXISTS idx_crew_specializations ON pilots_crews USING GIN (specializations);
CREATE INDEX IF NOT EXISTS idx_review_ratings ON crew_reviews (crew_id, rating);
CREATE INDEX IF NOT EXISTS idx_specialized_flights_crew ON specialized_flights (crew_id);
CREATE INDEX IF NOT EXISTS idx_specialized_flights_theme ON specialized_flights (theme);
CREATE INDEX IF NOT EXISTS idx_flights_crew_id ON flights(crew_id);
CREATE INDEX IF NOT EXISTS idx_flights_specialized_event ON flights(specialized_event); 