-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS jetshare_transactions CASCADE;
DROP TABLE IF EXISTS jetshare_offers CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS fractional_tokens CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS flights CASCADE;
DROP TABLE IF EXISTS airports CASCADE;
DROP TABLE IF EXISTS jets CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- User Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  preferences JSONB,
  user_type TEXT NOT NULL CHECK (user_type IN ('traveler', 'owner', 'admin')),
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jets
CREATE TABLE IF NOT EXISTS jets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  year INTEGER NOT NULL,
  tail_number TEXT UNIQUE NOT NULL,
  capacity INTEGER NOT NULL,
  range_nm INTEGER NOT NULL,
  images TEXT[],
  amenities JSONB,
  home_base_airport TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'maintenance', 'unavailable')),
  hourly_rate DECIMAL(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Airports
CREATE TABLE IF NOT EXISTS airports (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  location GEOGRAPHY(POINT),
  is_private BOOLEAN DEFAULT FALSE
);

-- Flights
CREATE TABLE IF NOT EXISTS flights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jet_id UUID REFERENCES jets(id) ON DELETE CASCADE,
  origin_airport TEXT REFERENCES airports(code),
  destination_airport TEXT REFERENCES airports(code),
  departure_time TIMESTAMPTZ NOT NULL,
  arrival_time TIMESTAMPTZ NOT NULL,
  available_seats INTEGER NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'boarding', 'in_air', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
  seats_booked INTEGER NOT NULL DEFAULT 1,
  booking_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (booking_status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  total_price DECIMAL(10, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_id TEXT,
  ticket_code TEXT UNIQUE,
  special_requests TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fractional Tokens
CREATE TABLE IF NOT EXISTS fractional_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jet_id UUID REFERENCES jets(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  token_percentage DECIMAL(5, 2) NOT NULL,
  token_value DECIMAL(12, 2) NOT NULL,
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'for_sale', 'transferred')),
  blockchain_address TEXT,
  contract_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Ratings
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  flight_id UUID REFERENCES flights(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id TEXT,
  payment_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- JetShare Offers
CREATE TABLE IF NOT EXISTS jetshare_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  matched_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  flight_date DATE NOT NULL,
  departure_location TEXT NOT NULL,
  arrival_location TEXT NOT NULL,
  total_flight_cost DECIMAL(10, 2) NOT NULL,
  requested_share_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'matched', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- JetShare Transactions
CREATE TABLE IF NOT EXISTS jetshare_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID REFERENCES jetshare_offers(id) ON DELETE CASCADE,
  payer_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view any profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view available jets" ON jets;
DROP POLICY IF EXISTS "Owners can manage their jets" ON jets;
DROP POLICY IF EXISTS "Anyone can view scheduled flights" ON flights;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON bookings;
DROP POLICY IF EXISTS "View open offers" ON jetshare_offers;
DROP POLICY IF EXISTS "View own offers" ON jetshare_offers;
DROP POLICY IF EXISTS "Insert own offers" ON jetshare_offers;
DROP POLICY IF EXISTS "Update own open offers" ON jetshare_offers;
DROP POLICY IF EXISTS "System can update any offer" ON jetshare_offers;
DROP POLICY IF EXISTS "Delete own open offers" ON jetshare_offers;
DROP POLICY IF EXISTS "Users can view their own transactions" ON jetshare_transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON jetshare_transactions;

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jets ENABLE ROW LEVEL SECURITY;
ALTER TABLE airports ENABLE ROW LEVEL SECURITY;
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fractional_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetshare_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetshare_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view any profile"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Jets RLS policies
CREATE POLICY "Anyone can view available jets"
  ON jets FOR SELECT
  USING (status = 'available');

CREATE POLICY "Owners can manage their jets"
  ON jets FOR ALL
  USING (auth.uid() = owner_id);

-- Flights RLS policies
CREATE POLICY "Anyone can view scheduled flights"
  ON flights FOR SELECT
  USING (status IN ('scheduled', 'boarding'));

-- Bookings RLS policies
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- JetShare Offers RLS policies
CREATE POLICY "View open offers" ON jetshare_offers
  FOR SELECT
  USING (status = 'open');

CREATE POLICY "View own offers" ON jetshare_offers
  FOR SELECT
  USING (user_id = auth.uid() OR matched_user_id = auth.uid());

CREATE POLICY "Insert own offers" ON jetshare_offers
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Update own open offers" ON jetshare_offers
  FOR UPDATE
  USING (user_id = auth.uid() AND status = 'open');

CREATE POLICY "System can update any offer" ON jetshare_offers
  FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Delete own open offers" ON jetshare_offers
  FOR DELETE
  USING (user_id = auth.uid() AND status = 'open');

-- JetShare Transactions RLS policies
CREATE POLICY "Users can view their own transactions"
  ON jetshare_transactions FOR SELECT
  USING (auth.uid() IN (payer_user_id, recipient_user_id));

CREATE POLICY "Users can create their own transactions"
  ON jetshare_transactions FOR INSERT
  WITH CHECK (auth.uid() = payer_user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_modtime ON profiles;
DROP TRIGGER IF EXISTS update_jets_modtime ON jets;
DROP TRIGGER IF EXISTS update_flights_modtime ON flights;
DROP TRIGGER IF EXISTS update_bookings_modtime ON bookings;
DROP TRIGGER IF EXISTS update_fractional_tokens_modtime ON fractional_tokens;
DROP TRIGGER IF EXISTS update_payments_modtime ON payments;
DROP TRIGGER IF EXISTS update_jetshare_offers_modtime ON jetshare_offers;
DROP TRIGGER IF EXISTS update_jetshare_transactions_modtime ON jetshare_transactions;

CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_jets_modtime
BEFORE UPDATE ON jets
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_flights_modtime
BEFORE UPDATE ON flights
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_bookings_modtime
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_fractional_tokens_modtime
BEFORE UPDATE ON fractional_tokens
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_payments_modtime
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_jetshare_offers_modtime
BEFORE UPDATE ON jetshare_offers
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_jetshare_transactions_modtime
BEFORE UPDATE ON jetshare_transactions
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Only add JetShare offers if none exist
DO $$
DECLARE
  offer_count integer;
  creator_user_id uuid;
  matched_user_id uuid;
BEGIN
  -- Check if we already have offers
  SELECT COUNT(*) INTO offer_count FROM jetshare_offers;
  
  -- Only proceed if no offers exist
  IF offer_count = 0 THEN
    -- Get two different random verified user IDs from existing profiles
    SELECT id INTO creator_user_id 
    FROM profiles 
    WHERE verification_status = 'verified' 
      AND user_type = 'traveler'
    ORDER BY RANDOM() 
    LIMIT 1;

    SELECT id INTO matched_user_id 
    FROM profiles 
    WHERE verification_status = 'verified' 
      AND user_type = 'traveler'
      AND id != creator_user_id 
    ORDER BY RANDOM() 
    LIMIT 1;

    -- Only proceed if we found valid users
    IF creator_user_id IS NOT NULL AND matched_user_id IS NOT NULL THEN
      -- Create sample open offers
      INSERT INTO jetshare_offers (
        user_id,
        flight_date,
        departure_location,
        arrival_location,
        total_flight_cost,
        requested_share_amount,
        status
      ) VALUES 
      (creator_user_id, CURRENT_DATE + INTERVAL '5 days', 'New York, NY', 'Miami, FL', 45000, 22500, 'open'),
      (creator_user_id, CURRENT_DATE + INTERVAL '7 days', 'Los Angeles, CA', 'Las Vegas, NV', 35000, 17500, 'open'),
      (creator_user_id, CURRENT_DATE + INTERVAL '10 days', 'Chicago, IL', 'Dallas, TX', 55000, 27500, 'open'),
      (creator_user_id, CURRENT_DATE + INTERVAL '12 days', 'San Francisco, CA', 'Seattle, WA', 40000, 20000, 'open'),
      (creator_user_id, CURRENT_DATE + INTERVAL '15 days', 'Boston, MA', 'Washington, DC', 38000, 19000, 'open');

      -- Create sample accepted offers
      INSERT INTO jetshare_offers (
        user_id,
        matched_user_id,
        flight_date,
        departure_location,
        arrival_location,
        total_flight_cost,
        requested_share_amount,
        status
      ) VALUES 
      (creator_user_id, matched_user_id, CURRENT_DATE + INTERVAL '20 days', 'Atlanta, GA', 'Nashville, TN', 42000, 21000, 'accepted'),
      (creator_user_id, matched_user_id, CURRENT_DATE + INTERVAL '25 days', 'Denver, CO', 'Phoenix, AZ', 48000, 24000, 'accepted'),
      (creator_user_id, matched_user_id, CURRENT_DATE + INTERVAL '30 days', 'Houston, TX', 'New Orleans, LA', 36000, 18000, 'accepted');

      -- Create sample completed offers
      INSERT INTO jetshare_offers (
        user_id,
        matched_user_id,
        flight_date,
        departure_location,
        arrival_location,
        total_flight_cost,
        requested_share_amount,
        status
      ) VALUES 
      (creator_user_id, matched_user_id, CURRENT_DATE - INTERVAL '5 days', 'Portland, OR', 'San Diego, CA', 52000, 26000, 'completed'),
      (creator_user_id, matched_user_id, CURRENT_DATE - INTERVAL '10 days', 'Austin, TX', 'Miami, FL', 58000, 29000, 'completed');
    END IF;
  END IF;
END;
$$; 