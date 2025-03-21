-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- User Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
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
CREATE TABLE jets (
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
CREATE TABLE airports (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  location GEOGRAPHY(POINT),
  is_private BOOLEAN DEFAULT FALSE
);

-- Flights
CREATE TABLE flights (
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
CREATE TABLE bookings (
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
CREATE TABLE fractional_tokens (
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
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  flight_id UUID REFERENCES flights(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
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

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jets ENABLE ROW LEVEL SECURITY;
ALTER TABLE airports ENABLE ROW LEVEL SECURITY;
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fractional_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view any profile"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

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

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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