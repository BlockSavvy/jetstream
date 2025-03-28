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

-- Create RLS policies for pilots_crews
ALTER TABLE pilots_crews ENABLE ROW LEVEL SECURITY;

-- Anyone can read pilots_crews
CREATE POLICY "Public can view pilots_crews" ON pilots_crews
  FOR SELECT USING (true);

-- Only authenticated users can insert/update their own crew profile
CREATE POLICY "Users can insert their own crew profile" ON pilots_crews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own crew profile" ON pilots_crews
  FOR UPDATE USING (auth.uid() = user_id);

-- Only admins or the user themselves can delete their crew profile
CREATE POLICY "Users can delete their own crew profile" ON pilots_crews
  FOR DELETE USING (auth.uid() = user_id);
  
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

-- Create RLS policies for crew_reviews
ALTER TABLE crew_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read crew_reviews
CREATE POLICY "Public can view crew_reviews" ON crew_reviews
  FOR SELECT USING (true);

-- Only authenticated users can insert their own reviews
CREATE POLICY "Users can insert their own reviews" ON crew_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews" ON crew_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews" ON crew_reviews
  FOR DELETE USING (auth.uid() = user_id);

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

-- Create RLS policies for specialized_flights
ALTER TABLE specialized_flights ENABLE ROW LEVEL SECURITY;

-- Anyone can view specialized_flights
CREATE POLICY "Public can view specialized_flights" ON specialized_flights
  FOR SELECT USING (true);

-- Only crew members can insert specialized_flights
CREATE POLICY "Crew can insert their specialized flights" ON specialized_flights
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pilots_crews 
      WHERE pilots_crews.id = crew_id AND pilots_crews.user_id = auth.uid()
    )
  );

-- Only crew members can update their specialized_flights
CREATE POLICY "Crew can update their specialized flights" ON specialized_flights
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM pilots_crews 
      WHERE pilots_crews.id = crew_id AND pilots_crews.user_id = auth.uid()
    )
  );

-- Only crew members can delete their specialized_flights
CREATE POLICY "Crew can delete their specialized flights" ON specialized_flights
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM pilots_crews 
      WHERE pilots_crews.id = crew_id AND pilots_crews.user_id = auth.uid()
    )
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

-- Create RLS policies for custom_itinerary_requests
ALTER TABLE custom_itinerary_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own requests" ON custom_itinerary_requests
  FOR SELECT USING (auth.uid() = requesting_user_id);

-- Crew can view requests directed to them
CREATE POLICY "Crew can view requests directed to them" ON custom_itinerary_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pilots_crews 
      WHERE pilots_crews.id = crew_id AND pilots_crews.user_id = auth.uid()
    )
  );

-- Only authenticated users can insert requests
CREATE POLICY "Users can insert their own requests" ON custom_itinerary_requests
  FOR INSERT WITH CHECK (auth.uid() = requesting_user_id);

-- Users can update their own requests
CREATE POLICY "Users can update their own requests" ON custom_itinerary_requests
  FOR UPDATE USING (auth.uid() = requesting_user_id);

-- Users can delete their own requests
CREATE POLICY "Users can delete their own requests" ON custom_itinerary_requests
  FOR DELETE USING (auth.uid() = requesting_user_id);

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

-- Create index on crew specializations for faster searching
CREATE INDEX IF NOT EXISTS idx_crew_specializations ON pilots_crews USING GIN (specializations);

-- Create index on review ratings for faster aggregation
CREATE INDEX IF NOT EXISTS idx_review_ratings ON crew_reviews (crew_id, rating);

-- Create indexes for faster filtering on specialized flights
CREATE INDEX IF NOT EXISTS idx_specialized_flights_crew ON specialized_flights (crew_id);
CREATE INDEX IF NOT EXISTS idx_specialized_flights_theme ON specialized_flights (theme);

-- Add specialized_event column to the flights table
ALTER TABLE flights ADD COLUMN IF NOT EXISTS specialized_event BOOLEAN DEFAULT FALSE;

-- Add crew_id column to the flights table
ALTER TABLE flights ADD COLUMN IF NOT EXISTS crew_id UUID REFERENCES pilots_crews(id) ON DELETE SET NULL;

-- Create indexes for better performance on the flights table
CREATE INDEX IF NOT EXISTS idx_flights_crew_id ON flights(crew_id);
CREATE INDEX IF NOT EXISTS idx_flights_specialized_event ON flights(specialized_event);

-- Add the required extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; 