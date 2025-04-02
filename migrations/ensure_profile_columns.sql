-- Ensure all necessary profile columns exist
DO $$
BEGIN
  -- Check if profiles table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    -- Add company column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company') THEN
      ALTER TABLE profiles ADD COLUMN company TEXT;
      RAISE NOTICE 'Added company column to profiles table';
    END IF;
    
    -- Add position column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'position') THEN
      ALTER TABLE profiles ADD COLUMN position TEXT;
      RAISE NOTICE 'Added position column to profiles table';
    END IF;
    
    -- Add phone_number column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone_number') THEN
      ALTER TABLE profiles ADD COLUMN phone_number TEXT;
      RAISE NOTICE 'Added phone_number column to profiles table';
    END IF;
    
    -- Add bio column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
      ALTER TABLE profiles ADD COLUMN bio TEXT;
      RAISE NOTICE 'Added bio column to profiles table';
    END IF;
    
    -- Add full_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
      ALTER TABLE profiles ADD COLUMN full_name TEXT;
      RAISE NOTICE 'Added full_name column to profiles table';
    END IF;
    
    -- Add profile_visibility column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'profile_visibility') THEN
      ALTER TABLE profiles ADD COLUMN profile_visibility TEXT DEFAULT 'public';
      RAISE NOTICE 'Added profile_visibility column to profiles table';
    END IF;
    
    -- Add website column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'website') THEN
      ALTER TABLE profiles ADD COLUMN website TEXT;
      RAISE NOTICE 'Added website column to profiles table';
    END IF;
    
    -- Add location column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location') THEN
      ALTER TABLE profiles ADD COLUMN location TEXT;
      RAISE NOTICE 'Added location column to profiles table';
    END IF;
    
    RAISE NOTICE 'Verified all required profile columns exist';
  ELSE
    RAISE EXCEPTION 'Profiles table does not exist. Please run the initial schema migration first.';
  END IF;
END $$; 