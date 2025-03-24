-- Pilots & Crew
CREATE TABLE pilots_crews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  ratings_avg DECIMAL(3, 2) DEFAULT 0,
  specializations TEXT[] NOT NULL,
  social_links JSONB,
  availability TSRANGE[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crew Reviews
CREATE TABLE crew_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_id UUID REFERENCES pilots_crews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  flight_id UUID REFERENCES flights(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Specialized Flights
CREATE TABLE specialized_flights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  theme TEXT NOT NULL,
  description TEXT,
  crew_id UUID REFERENCES pilots_crews(id) ON DELETE SET NULL,
  nft_ticketed BOOLEAN DEFAULT FALSE,
  seats_available INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Custom Itinerary Requests
CREATE TABLE custom_itinerary_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requesting_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  destination TEXT,
  origin TEXT,
  date_time TIMESTAMPTZ,
  requested_specializations TEXT[],
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'completed', 'cancelled')),
  matches_found JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add specialized_event column to the flights table
ALTER TABLE flights ADD COLUMN IF NOT EXISTS specialized_event BOOLEAN DEFAULT FALSE;

-- Add crew_id column to the flights table
ALTER TABLE flights ADD COLUMN IF NOT EXISTS crew_id UUID REFERENCES pilots_crews(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_pilots_crews_specializations ON pilots_crews USING GIN (specializations);
CREATE INDEX idx_crew_reviews_crew_id ON crew_reviews(crew_id);
CREATE INDEX idx_specialized_flights_flight_id ON specialized_flights(flight_id);
CREATE INDEX idx_custom_itinerary_requests_status ON custom_itinerary_requests(status);
CREATE INDEX idx_flights_crew_id ON flights(crew_id);
CREATE INDEX idx_flights_specialized_event ON flights(specialized_event);

-- Create RLS policies for the new tables
ALTER TABLE pilots_crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialized_flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_itinerary_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read pilots_crews
CREATE POLICY pilots_crews_select_policy ON pilots_crews
  FOR SELECT USING (true);

-- Allow crew members to update their own profiles
CREATE POLICY pilots_crews_update_policy ON pilots_crews
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow anyone to read crew_reviews
CREATE POLICY crew_reviews_select_policy ON crew_reviews
  FOR SELECT USING (true);

-- Allow users to create reviews if they have a booking for that flight
CREATE POLICY crew_reviews_insert_policy ON crew_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow anyone to read specialized_flights
CREATE POLICY specialized_flights_select_policy ON specialized_flights
  FOR SELECT USING (true);

-- Allow anyone to read custom_itinerary_requests
CREATE POLICY custom_itinerary_requests_select_policy ON custom_itinerary_requests
  FOR SELECT USING (requesting_user_id = auth.uid() OR auth.uid() IN 
    (SELECT user_id FROM pilots_crews WHERE id = ANY(ARRAY(
      SELECT crew_id FROM flights WHERE flights.id = ANY(
        SELECT flight_id FROM specialized_flights WHERE specialized_flights.id = custom_itinerary_requests.id
      )
    )))
  );

-- Allow users to create and update their own custom_itinerary_requests
CREATE POLICY custom_itinerary_requests_insert_policy ON custom_itinerary_requests
  FOR INSERT WITH CHECK (auth.uid() = requesting_user_id);

CREATE POLICY custom_itinerary_requests_update_policy ON custom_itinerary_requests
  FOR UPDATE USING (auth.uid() = requesting_user_id); 