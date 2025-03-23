-- Travel Preferences table creation

-- First, check if travel_preferences table exists and create it if not
CREATE TABLE IF NOT EXISTS travel_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  travel_interests TEXT[] DEFAULT '{}',
  social_preferences TEXT[] DEFAULT '{}',
  preferred_destinations TEXT[] DEFAULT '{}',
  urgency_preferences TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS travel_preferences_user_id_idx ON travel_preferences(user_id);

-- RLS (Row Level Security) Policies
-- Enable row level security
ALTER TABLE travel_preferences ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see their own preferences
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'travel_preferences' AND policyname = 'Users can view own travel preferences'
  ) THEN
    CREATE POLICY "Users can view own travel preferences" 
    ON travel_preferences FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'travel_preferences' AND policyname = 'Users can update own travel preferences'
  ) THEN
    CREATE POLICY "Users can update own travel preferences" 
    ON travel_preferences FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'travel_preferences' AND policyname = 'Users can insert own travel preferences'
  ) THEN
    CREATE POLICY "Users can insert own travel preferences" 
    ON travel_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'travel_preferences' AND policyname = 'Users can delete own travel preferences'
  ) THEN
    CREATE POLICY "Users can delete own travel preferences" 
    ON travel_preferences FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END
$$; 