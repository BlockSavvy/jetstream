-- Function to fix missing emails in profiles table
-- This function will:
-- 1. Update any profiles with missing emails from auth.users table
-- 2. Create profiles for any users without profiles
CREATE OR REPLACE FUNCTION fix_profile_emails()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER -- Run as owner
AS $$
DECLARE
  updated_count INTEGER;
  created_count INTEGER;
  result TEXT;
BEGIN
  -- Update existing profiles that have null or empty emails
  UPDATE profiles p
  SET 
    email = u.email,
    updated_at = NOW()
  FROM auth.users u
  WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Create profiles for users without profiles
  INSERT INTO profiles (id, email, first_name, last_name, created_at, updated_at)
  SELECT 
    u.id, 
    u.email,
    COALESCE(u.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(u.raw_user_meta_data->>'last_name', 'User'),
    NOW(),
    NOW()
  FROM auth.users u
  WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id);
  
  GET DIAGNOSTICS created_count = ROW_COUNT;
  
  -- Return the results
  result := format('Updated %s existing profiles and created %s new profiles with proper email values', 
                    updated_count::text, created_count::text);
  
  RETURN result;
END;
$$; 