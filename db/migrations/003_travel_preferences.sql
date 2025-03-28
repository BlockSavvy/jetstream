-- Create travel preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS travel_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Enable RLS
ALTER TABLE travel_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow users to only read their own preferences
CREATE POLICY "Users can view their own travel preferences"
ON travel_preferences FOR SELECT
USING (auth.uid() = user_id);

-- Create RLS policy to allow users to only update their own preferences
CREATE POLICY "Users can update their own travel preferences"
ON travel_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Create RLS policy to allow users to only insert their own preferences
CREATE POLICY "Users can insert their own travel preferences"
ON travel_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create RLS policy to allow users to only delete their own preferences
CREATE POLICY "Users can delete their own travel preferences"
ON travel_preferences FOR DELETE
USING (auth.uid() = user_id);

-- Create or replace function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_travel_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at timestamp
DROP TRIGGER IF EXISTS update_travel_preferences_modtime ON travel_preferences;
CREATE TRIGGER update_travel_preferences_modtime
BEFORE UPDATE ON travel_preferences
FOR EACH ROW
EXECUTE FUNCTION update_travel_preferences_updated_at(); 