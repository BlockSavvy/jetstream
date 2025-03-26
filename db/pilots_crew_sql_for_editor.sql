-- This file is designed to be run directly in the Supabase SQL Editor
-- to set up the Pilots & Crew Specialization feature

-- Create pilots_crews table if it doesn't exist
CREATE TABLE IF NOT EXISTS pilots_crews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  specializations TEXT[] NOT NULL,
  social_links JSONB,
  ratings_avg FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create crew_reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS crew_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_id UUID REFERENCES pilots_crews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  flight_id UUID REFERENCES flights(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create specialized_flights table if it doesn't exist
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

-- Create custom_itinerary_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS custom_itinerary_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
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

-- Add specialized_event column to the flights table if it doesn't exist
ALTER TABLE flights ADD COLUMN IF NOT EXISTS specialized_event BOOLEAN DEFAULT FALSE;

-- Add crew_id column to the flights table if it doesn't exist
ALTER TABLE flights ADD COLUMN IF NOT EXISTS crew_id UUID REFERENCES pilots_crews(id) ON DELETE SET NULL;

-- Create index on crew specializations for faster searching
CREATE INDEX IF NOT EXISTS idx_crew_specializations ON pilots_crews USING GIN (specializations);

-- Create index on review ratings for faster aggregation
CREATE INDEX IF NOT EXISTS idx_review_ratings ON crew_reviews (crew_id, rating);

-- Create indexes for faster filtering on specialized flights
CREATE INDEX IF NOT EXISTS idx_specialized_flights_crew ON specialized_flights (crew_id);
CREATE INDEX IF NOT EXISTS idx_specialized_flights_theme ON specialized_flights (theme);

-- Create indexes for better performance on the flights table
CREATE INDEX IF NOT EXISTS idx_flights_crew_id ON flights(crew_id);
CREATE INDEX IF NOT EXISTS idx_flights_specialized_event ON flights(specialized_event);

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

-- Create table for travel preferences if it doesn't exist
CREATE TABLE IF NOT EXISTS travel_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  travel_interests TEXT[] DEFAULT '{}',
  social_preferences TEXT[] DEFAULT '{}',
  preferred_destinations TEXT[] DEFAULT '{}',
  urgency_preferences TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- Create an index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS travel_preferences_user_id_idx ON travel_preferences(user_id);

-- Create RLS policies for the tables

-- Enable RLS on all tables
ALTER TABLE pilots_crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialized_flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_itinerary_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_preferences ENABLE ROW LEVEL SECURITY;

-- RLS for pilots_crews
DROP POLICY IF EXISTS "Public can view pilots_crews" ON pilots_crews;
CREATE POLICY "Public can view pilots_crews" ON pilots_crews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own crew profile" ON pilots_crews;
CREATE POLICY "Users can insert their own crew profile" ON pilots_crews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own crew profile" ON pilots_crews;
CREATE POLICY "Users can update their own crew profile" ON pilots_crews
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own crew profile" ON pilots_crews;
CREATE POLICY "Users can delete their own crew profile" ON pilots_crews
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for crew_reviews
DROP POLICY IF EXISTS "Public can view crew_reviews" ON crew_reviews;
CREATE POLICY "Public can view crew_reviews" ON crew_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own reviews" ON crew_reviews;
CREATE POLICY "Users can insert their own reviews" ON crew_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON crew_reviews;
CREATE POLICY "Users can update their own reviews" ON crew_reviews
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON crew_reviews;
CREATE POLICY "Users can delete their own reviews" ON crew_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for specialized_flights
DROP POLICY IF EXISTS "Public can view specialized_flights" ON specialized_flights;
CREATE POLICY "Public can view specialized_flights" ON specialized_flights
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Crew can insert their specialized flights" ON specialized_flights;
CREATE POLICY "Crew can insert their specialized flights" ON specialized_flights
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pilots_crews 
      WHERE pilots_crews.id = crew_id AND pilots_crews.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Crew can update their specialized flights" ON specialized_flights;
CREATE POLICY "Crew can update their specialized flights" ON specialized_flights
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM pilots_crews 
      WHERE pilots_crews.id = crew_id AND pilots_crews.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Crew can delete their specialized flights" ON specialized_flights;
CREATE POLICY "Crew can delete their specialized flights" ON specialized_flights
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM pilots_crews 
      WHERE pilots_crews.id = crew_id AND pilots_crews.user_id = auth.uid()
    )
  );

-- RLS for custom_itinerary_requests
DROP POLICY IF EXISTS "Users can view their own requests" ON custom_itinerary_requests;
CREATE POLICY "Users can view their own requests" ON custom_itinerary_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Crew can view requests directed to them" ON custom_itinerary_requests;
CREATE POLICY "Crew can view requests directed to them" ON custom_itinerary_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pilots_crews 
      WHERE pilots_crews.id = ANY (
        SELECT crew_id FROM specialized_flights WHERE specialized_flights.id = ANY (
          SELECT id FROM custom_itinerary_requests WHERE user_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert their own requests" ON custom_itinerary_requests;
CREATE POLICY "Users can insert their own requests" ON custom_itinerary_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own requests" ON custom_itinerary_requests;
CREATE POLICY "Users can update their own requests" ON custom_itinerary_requests
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own requests" ON custom_itinerary_requests;
CREATE POLICY "Users can delete their own requests" ON custom_itinerary_requests
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for travel_preferences
DROP POLICY IF EXISTS "Users can view their own travel preferences" ON travel_preferences;
CREATE POLICY "Users can view their own travel preferences" ON travel_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own travel preferences" ON travel_preferences;
CREATE POLICY "Users can update their own travel preferences" ON travel_preferences
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own travel preferences" ON travel_preferences;
CREATE POLICY "Users can insert their own travel preferences" ON travel_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own travel preferences" ON travel_preferences;
CREATE POLICY "Users can delete their own travel preferences" ON travel_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Create trial seed data

-- Start a transaction to keep data consistent
BEGIN;

-- Temporarily disable foreign key checks for easier seeding
SET session_replication_role = 'replica';

-- Sample crew members with placeholder user IDs 
-- (These user IDs should be replaced with actual user IDs from your profiles table)
INSERT INTO pilots_crews (id, user_id, name, bio, profile_image_url, specializations, social_links, ratings_avg, created_at, updated_at)
VALUES 
('cd5cf726-7e73-4a25-9f50-91f5c3c13ca7', (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 0), 'Alexandra Davis', 'Award-winning comedy specialist with over 10 years experience creating memorable in-flight experiences.', 'https://source.unsplash.com/random/300x300/?portrait,professional,1', ARRAY['Comedy', 'Live Podcasts'], '{"twitter":"@AlexDavisAir","instagram":"@alexdavis_air"}', 4.8, NOW(), NOW()),

('f8a7b64c-d8b4-4f36-8d01-1b9a74f748a5', (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 1), 'Michael Chen', 'TED-style speaker and business networking expert. Transform your flight time into productive connections.', 'https://source.unsplash.com/random/300x300/?portrait,professional,2', ARRAY['TED-talks', 'Business Networking'], '{"linkedin":"https://linkedin.com/in/michaelchen"}', 4.6, NOW(), NOW()),

('3e5fc9e1-b9a6-4db8-a7a3-c1e17a3128a7', (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 2), 'Sophia Johnson', 'Certified wellness coach specializing in meditation and mindfulness at 40,000 feet.', 'https://source.unsplash.com/random/300x300/?portrait,professional,3', ARRAY['Wellness Sessions', 'Mindfulness'], '{"instagram":"@sophiajohnson_wellness"}', 4.9, NOW(), NOW()),

('9a2b7c36-d42e-4f8a-b91c-5d78e6a3b254', (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 3), 'James Wilson', 'Professional sommelier offering exclusive wine tasting experiences above the clouds.', 'https://source.unsplash.com/random/300x300/?portrait,professional,4', ARRAY['Wine Tasting', 'Culinary Experiences'], '{"twitter":"@skywinewilson","instagram":"@james_inflight_sommelier"}', 4.7, NOW(), NOW()),

('5e7d9c1b-3f82-4a67-b9d5-c46e8a213b9f', (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 4), 'Emma Rodriguez', 'Interactive mystery game host and storyteller. Making your journey an adventure.', 'https://source.unsplash.com/random/300x300/?portrait,professional,5', ARRAY['Interactive Mystery Events', 'Creative Workshops'], '{"instagram":"@mysteriesabove","website":"https://skydetective.com"}', 4.6, NOW(), NOW());

-- Add reviews for crew members
INSERT INTO crew_reviews (id, crew_id, user_id, rating, review_text, created_at)
VALUES
('125fedb6-efdd-4458-93f1-ce20e629079d', 'cd5cf726-7e73-4a25-9f50-91f5c3c13ca7', (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 5), 5, 'Alexandra''s comedy routine made the flight fly by! Absolutely hilarious and engaging.', NOW() - INTERVAL '10 days'),
('1caf7761-eb95-435f-8d03-423b193dfea7', 'f8a7b64c-d8b4-4f36-8d01-1b9a74f748a5', (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 6), 4, 'Michael''s business networking session was incredibly valuable. Made two great connections.', NOW() - INTERVAL '15 days'),
('18de7d42-90f5-4fa6-984c-c4181ad5e4f6', '3e5fc9e1-b9a6-4db8-a7a3-c1e17a3128a7', (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 7), 5, 'Arrived feeling refreshed thanks to Sophia''s in-flight meditation. A game-changer for long flights!', NOW() - INTERVAL '5 days'),
('873269ad-e768-4608-a64c-4addb8b99d24', '9a2b7c36-d42e-4f8a-b91c-5d78e6a3b254', (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 8), 5, 'James curated an exceptional wine tasting that made this flight unforgettable. Learned so much!', NOW() - INTERVAL '8 days'),
('90dbbbe2-e052-4c3b-a7aa-a9ff2f04657a', '5e7d9c1b-3f82-4a67-b9d5-c46e8a213b9f', (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 9), 5, 'Emma''s mystery game kept our entire group engaged for hours. Such a creative way to spend a flight!', NOW() - INTERVAL '12 days');

-- Create specialized flights (linking to existing flights)
INSERT INTO specialized_flights (id, crew_id, flight_id, title, description, theme, seats_available, date_time, status, price_premium_percentage, created_at, updated_at)
SELECT 
  uuid_generate_v4(), 
  'cd5cf726-7e73-4a25-9f50-91f5c3c13ca7',
  id,
  'Sky-High Comedy Hour',
  'Laugh your way across the country with our award-winning comedy flight',
  'Comedy',
  6,
  departure_time,
  status,
  15,
  NOW(),
  NOW()
FROM flights
WHERE status = 'scheduled'
LIMIT 1;

INSERT INTO specialized_flights (id, crew_id, flight_id, title, description, theme, seats_available, date_time, status, price_premium_percentage, created_at, updated_at)
SELECT 
  uuid_generate_v4(), 
  'f8a7b64c-d8b4-4f36-8d01-1b9a74f748a5',
  id,
  'Executive Networking Summit',
  'Connect with industry leaders during this specialized business flight',
  'Business Networking',
  8,
  departure_time,
  status,
  20,
  NOW(),
  NOW()
FROM flights
WHERE status = 'scheduled'
LIMIT 1
OFFSET 1;

INSERT INTO specialized_flights (id, crew_id, flight_id, title, description, theme, seats_available, date_time, status, price_premium_percentage, created_at, updated_at)
SELECT 
  uuid_generate_v4(), 
  '3e5fc9e1-b9a6-4db8-a7a3-c1e17a3128a7',
  id,
  'Mindfulness at 40,000 Feet',
  'Arrive refreshed with guided meditation and wellness practices',
  'Wellness Sessions',
  10,
  departure_time,
  status,
  18,
  NOW(),
  NOW()
FROM flights
WHERE status = 'scheduled'
LIMIT 1
OFFSET 2;

INSERT INTO specialized_flights (id, crew_id, flight_id, title, description, theme, seats_available, date_time, status, price_premium_percentage, created_at, updated_at)
SELECT 
  uuid_generate_v4(), 
  '9a2b7c36-d42e-4f8a-b91c-5d78e6a3b254',
  id,
  'Sky-High Wine Tasting',
  'Experience premium wines curated by our expert sommelier',
  'Wine Tasting',
  12,
  departure_time,
  status,
  25,
  NOW(),
  NOW()
FROM flights
WHERE status = 'scheduled'
LIMIT 1
OFFSET 3;

INSERT INTO specialized_flights (id, crew_id, flight_id, title, description, theme, seats_available, date_time, status, price_premium_percentage, created_at, updated_at)
SELECT 
  uuid_generate_v4(), 
  '5e7d9c1b-3f82-4a67-b9d5-c46e8a213b9f',
  id,
  'Mystery in the Clouds',
  'Solve an interactive mystery while flying to your destination',
  'Interactive Mystery Events',
  8,
  departure_time,
  status,
  22,
  NOW(),
  NOW()
FROM flights
WHERE status = 'scheduled'
LIMIT 1
OFFSET 4;

-- Create sample custom itinerary requests
INSERT INTO custom_itinerary_requests (id, user_id, destination, origin, date_time, requested_specializations, description, created_at, updated_at)
VALUES
(uuid_generate_v4(), (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 10), 'New York', 'Los Angeles', NOW() + INTERVAL '45 days', ARRAY['Business Networking', 'TED-talks'], 'Looking for an executive networking flight for our leadership team of 6 people', NOW(), NOW()),
(uuid_generate_v4(), (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 11), 'Miami', 'Chicago', NOW() + INTERVAL '60 days', ARRAY['Wellness Sessions', 'Mindfulness'], 'Seeking a wellness retreat experience during our flight for a team-building exercise', NOW(), NOW()),
(uuid_generate_v4(), (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 12), 'Las Vegas', 'Seattle', NOW() + INTERVAL '30 days', ARRAY['Comedy', 'Interactive Mystery Events'], 'Bachelor party flight - looking for entertainment options for 8 people', NOW(), NOW());

-- Update flights to reference crew members
UPDATE flights 
SET 
  crew_id = 'cd5cf726-7e73-4a25-9f50-91f5c3c13ca7',
  specialized_event = true
WHERE id IN (
  SELECT flight_id FROM specialized_flights LIMIT 1
);

UPDATE flights 
SET 
  crew_id = 'f8a7b64c-d8b4-4f36-8d01-1b9a74f748a5',
  specialized_event = true
WHERE id IN (
  SELECT flight_id FROM specialized_flights LIMIT 1 OFFSET 1
);

-- Re-enable foreign key checking
SET session_replication_role = 'origin';

-- Sample travel preferences for a few users
INSERT INTO travel_preferences (user_id, travel_interests, social_preferences, preferred_destinations, urgency_preferences)
SELECT 
  id, 
  ARRAY['Business', 'Tech', 'Networking'],
  ARRAY['Professional', 'Social'],
  ARRAY['New York', 'San Francisco', 'London'],
  ARRAY['Planned', 'Regular']
FROM profiles
ORDER BY created_at
LIMIT 1;

INSERT INTO travel_preferences (user_id, travel_interests, social_preferences, preferred_destinations, urgency_preferences)
SELECT 
  id, 
  ARRAY['Wellness', 'Meditation', 'Yoga'],
  ARRAY['Quiet', 'Mindful'],
  ARRAY['Bali', 'Los Angeles', 'Costa Rica'],
  ARRAY['Flexible', 'Spontaneous']
FROM profiles
ORDER BY created_at
LIMIT 1
OFFSET 1;

INSERT INTO travel_preferences (user_id, travel_interests, social_preferences, preferred_destinations, urgency_preferences)
SELECT 
  id, 
  ARRAY['Entertainment', 'Music', 'Sports'],
  ARRAY['Social', 'Fun', 'Group'],
  ARRAY['Las Vegas', 'Miami', 'Ibiza'],
  ARRAY['Spontaneous', 'Last-minute']
FROM profiles
ORDER BY created_at
LIMIT 1
OFFSET 2;

COMMIT; 