-- Profiles table enhancements

-- First, check if the profiles table exists and create it if not
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Add bio column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
    ALTER TABLE profiles ADD COLUMN bio TEXT;
  END IF;

  -- Add company column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company') THEN
    ALTER TABLE profiles ADD COLUMN company TEXT;
  END IF;

  -- Add position column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'position') THEN
    ALTER TABLE profiles ADD COLUMN position TEXT;
  END IF;

  -- Add website column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'website') THEN
    ALTER TABLE profiles ADD COLUMN website TEXT;
  END IF;

  -- Add social_links column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'social_links') THEN
    ALTER TABLE profiles ADD COLUMN social_links JSONB DEFAULT '{"twitter": null, "linkedin": null, "instagram": null}';
  END IF;

  -- Add phone_number column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone_number') THEN
    ALTER TABLE profiles ADD COLUMN phone_number TEXT;
  END IF;

  -- Add notification_preferences column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notification_preferences') THEN
    ALTER TABLE profiles ADD COLUMN notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}';
  END IF;

  -- Add privacy_settings column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'privacy_settings') THEN
    ALTER TABLE profiles ADD COLUMN privacy_settings JSONB DEFAULT '{"show_profile": true, "show_travel_history": false, "show_upcoming_flights": true}';
  END IF;
END
$$; 