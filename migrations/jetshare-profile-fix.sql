-- JetShare Profile Schema Fix

-- First, check if the profiles table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    -- Create the profiles table if it doesn't exist
    CREATE TABLE profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      avatar_url TEXT,
      user_type TEXT DEFAULT 'traveler',
      verification_status TEXT DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Created profiles table with all required columns';
  ELSE
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
      ALTER TABLE profiles ADD COLUMN email TEXT;
      RAISE NOTICE 'Added email column to profiles table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_type') THEN
      ALTER TABLE profiles ADD COLUMN user_type TEXT DEFAULT 'traveler';
      RAISE NOTICE 'Added user_type column to profiles table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verification_status') THEN
      ALTER TABLE profiles ADD COLUMN verification_status TEXT DEFAULT 'pending';
      RAISE NOTICE 'Added verification_status column to profiles table';
    END IF;
    
    RAISE NOTICE 'Updated profiles table to ensure all required columns exist';
  END IF;
END $$; 