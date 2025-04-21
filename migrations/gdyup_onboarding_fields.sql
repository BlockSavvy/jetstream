-- Migration to add onboarding fields to profiles table
-- This ensures all the required fields for the GDYup onboarding process exist

BEGIN;

-- Check if the profiles table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    -- Add onboarding_completed column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'onboarding_completed') THEN
      ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
      RAISE NOTICE 'Added onboarding_completed column to profiles table';
    END IF;

    -- Add onboarding_step column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'onboarding_step') THEN
      ALTER TABLE profiles ADD COLUMN onboarding_step TEXT DEFAULT 'profile';
      RAISE NOTICE 'Added onboarding_step column to profiles table';
    END IF;

    -- Add has_jet column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'has_jet') THEN
      ALTER TABLE profiles ADD COLUMN has_jet BOOLEAN DEFAULT false;
      RAISE NOTICE 'Added has_jet column to profiles table';
    END IF;

    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'role') THEN
      ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
      RAISE NOTICE 'Added role column to profiles table';
    END IF;

    -- Add affiliation column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'affiliation') THEN
      ALTER TABLE profiles ADD COLUMN affiliation TEXT;
      RAISE NOTICE 'Added affiliation column to profiles table';
    END IF;

    RAISE NOTICE 'Updated profiles table to ensure all GDYup onboarding columns exist';
  ELSE
    RAISE EXCEPTION 'The profiles table does not exist!';
  END IF;
END $$;

-- Ensure existing profiles have onboarding fields set
UPDATE profiles 
SET onboarding_completed = true 
WHERE onboarding_completed IS NULL;

COMMIT; 