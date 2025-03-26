-- Add captain-specific columns to pilots_crews table if they don't exist
ALTER TABLE pilots_crews 
  ADD COLUMN IF NOT EXISTS is_captain BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dedicated_jet_owner_id TEXT,
  ADD COLUMN IF NOT EXISTS years_of_experience INTEGER,
  ADD COLUMN IF NOT EXISTS availability TEXT[];

-- Create index on is_captain for faster filtering if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_pilots_crews_is_captain ON pilots_crews (is_captain);

-- Create index on years_of_experience for faster filtering if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_pilots_crews_years_experience ON pilots_crews (years_of_experience);

-- Create index on dedicated_jet_owner_id for faster lookup if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_pilots_crews_jet_owner ON pilots_crews (dedicated_jet_owner_id);

-- Temporarily disable the foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'pilots_crews_user_id_fkey' 
             AND table_name = 'pilots_crews') THEN
    EXECUTE 'ALTER TABLE pilots_crews DROP CONSTRAINT IF EXISTS pilots_crews_user_id_fkey';
  END IF;
END $$;

-- Insert elite captains if they don't exist
INSERT INTO pilots_crews (id, user_id, name, bio, profile_image_url, specializations, social_links, ratings_avg, is_captain, years_of_experience, created_at, updated_at)
SELECT 
  '20000000-0000-0000-0000-000000000001'::uuid,
  NULL,
  'Captain William Powell',
  'Elite captain with over 25 years of experience in luxury private aviation. Specialized in VIP services and international long-haul flights.',
  '/images/crew/captain_powell',
  ARRAY['Luxury', 'VIP Service', 'International Flights', 'Long-haul Expert'],
  '{"linkedin":"https://linkedin.com/in/captainpowell"}'::jsonb,
  4.9,
  TRUE,
  25,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM pilots_crews WHERE name = 'Captain William Powell' AND is_captain = TRUE
);

INSERT INTO pilots_crews (id, user_id, name, bio, profile_image_url, specializations, social_links, ratings_avg, is_captain, years_of_experience, created_at, updated_at)
SELECT 
  '20000000-0000-0000-0000-000000000002'::uuid,
  NULL,
  'Captain Alexandra Reid',
  'Dedicated captain with expertise in business aviation and family-friendly flights. Known for creating a comfortable and safe environment for executives and families alike.',
  '/images/crew/captain_reid',
  ARRAY['Business', 'Family-oriented', 'VIP Service'],
  '{"twitter":"@CaptReid","instagram":"@captain_reid"}'::jsonb,
  4.8,
  TRUE,
  18,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM pilots_crews WHERE name = 'Captain Alexandra Reid' AND is_captain = TRUE
);

-- Make sure we have some crew members flagged as captains for testing
UPDATE pilots_crews 
SET is_captain = TRUE, 
    years_of_experience = FLOOR(RANDOM() * 20) + 5
WHERE (is_captain IS NULL OR is_captain = FALSE)
AND id IN (SELECT id FROM pilots_crews WHERE is_captain IS NULL OR is_captain = FALSE LIMIT 10);

-- Make sure we have some crew members flagged as regular crew (not captains) for testing
UPDATE pilots_crews 
SET is_captain = FALSE 
WHERE is_captain IS NULL
AND id IN (SELECT id FROM pilots_crews WHERE is_captain IS NULL LIMIT 20);

-- Fix the foreign key issue for crew_reviews
-- First, check if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_name = 'crew_reviews') THEN
    -- Drop existing constraint if it exists and is causing problems
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'crew_reviews_user_id_fkey' 
              AND table_name = 'crew_reviews') THEN
      ALTER TABLE crew_reviews DROP CONSTRAINT crew_reviews_user_id_fkey;
    END IF;
    
    -- Make sure the profiles table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables 
              WHERE table_name = 'profiles') THEN
      
      -- Add the constraint properly with explicit column references
      ALTER TABLE crew_reviews 
      ADD CONSTRAINT crew_reviews_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES profiles(id) 
      ON DELETE SET NULL;
    ELSE
      RAISE NOTICE 'Profiles table does not exist. Cannot create foreign key.';
    END IF;
  ELSE
    -- Create the crew_reviews table if it doesn't exist
    CREATE TABLE IF NOT EXISTS crew_reviews (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      crew_id UUID NOT NULL REFERENCES pilots_crews(id) ON DELETE CASCADE,
      user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
      flight_id UUID,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      review_text TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;