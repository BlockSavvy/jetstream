-- Create a function to check and ensure JetShare tables exist
CREATE OR REPLACE FUNCTION ensure_jetshare_tables()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if jetshare_offers table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'jetshare_offers'
  ) THEN
    -- Create the jetshare_offers table
    CREATE TABLE jetshare_offers (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES profiles(id),
      flight_date TIMESTAMP WITH TIME ZONE NOT NULL,
      departure_location TEXT NOT NULL,
      arrival_location TEXT NOT NULL,
      total_flight_cost INTEGER NOT NULL,
      requested_share_amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      matched_user_id UUID REFERENCES profiles(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create indexes for faster queries
    CREATE INDEX jetshare_offers_user_id_idx ON jetshare_offers(user_id);
    CREATE INDEX jetshare_offers_status_idx ON jetshare_offers(status);
    
    RAISE NOTICE 'Created jetshare_offers table and indexes';
  END IF;

  -- Check if jetshare_transactions table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'jetshare_transactions'
  ) THEN
    -- Create the jetshare_transactions table
    CREATE TABLE jetshare_transactions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      offer_id UUID NOT NULL REFERENCES jetshare_offers(id),
      payer_user_id UUID NOT NULL REFERENCES profiles(id),
      recipient_user_id UUID NOT NULL REFERENCES profiles(id),
      amount INTEGER NOT NULL,
      handling_fee INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      transaction_reference TEXT,
      transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE 'Created jetshare_transactions table';
  END IF;

  -- Ensure every auth.users has a profile
  INSERT INTO profiles (id, first_name, last_name, email, created_at, updated_at)
  SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'first_name', 'User'),
    COALESCE(raw_user_meta_data->>'last_name', 'User'),
    email,
    created_at,
    updated_at
  FROM auth.users
  WHERE id NOT IN (SELECT id FROM profiles);
  
  RAISE NOTICE 'Ensured all users have profiles';
END;
$$;

-- Function to run the JetShare DB check
CREATE OR REPLACE FUNCTION check_and_setup_jetshare_db()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  BEGIN
    PERFORM ensure_jetshare_tables();
    
    SELECT json_build_object(
      'success', true,
      'message', 'JetShare database setup verified',
      'offers_count', (SELECT COUNT(*) FROM jetshare_offers),
      'transactions_count', (SELECT COUNT(*) FROM jetshare_transactions),
      'profiles_count', (SELECT COUNT(*) FROM profiles)
    ) INTO result;
    
    RETURN result;
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', 'Error checking/setting up JetShare database'
    );
  END;
END;
$$;

-- Grant permissions to execute these functions
GRANT EXECUTE ON FUNCTION ensure_jetshare_tables() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION check_and_setup_jetshare_db() TO anon, authenticated, service_role; 