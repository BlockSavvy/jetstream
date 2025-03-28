-- JetShare Schema and Seed Data
BEGIN;

-- Create jetshare_offers table if it doesn't exist
CREATE TABLE IF NOT EXISTS jetshare_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flight_date TIMESTAMP WITH TIME ZONE NOT NULL,
  departure_location TEXT NOT NULL,
  arrival_location TEXT NOT NULL,
  total_flight_cost DECIMAL(10, 2) NOT NULL,
  requested_share_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  matched_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for jetshare_offers
DROP TRIGGER IF EXISTS update_jetshare_offers_updated_at ON jetshare_offers;
CREATE TRIGGER update_jetshare_offers_updated_at
BEFORE UPDATE ON jetshare_offers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create jetshare_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS jetshare_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES jetshare_offers(id) ON DELETE CASCADE,
  payer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  handling_fee DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create trigger for jetshare_transactions
DROP TRIGGER IF EXISTS update_jetshare_transactions_updated_at ON jetshare_transactions;
CREATE TRIGGER update_jetshare_transactions_updated_at
BEFORE UPDATE ON jetshare_transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to get all users for seeding data
CREATE OR REPLACE FUNCTION get_all_user_ids()
RETURNS TABLE (id UUID) AS $$
BEGIN
  RETURN QUERY SELECT auth.users.id FROM auth.users;
END;
$$ LANGUAGE plpgsql;

-- Get list of users for seed data
DO $$
DECLARE
  seed_user_id UUID;
  seed_user_id2 UUID;
  user_ids UUID[];
  user_count INTEGER;
BEGIN
  -- Collect user IDs
  SELECT array_agg(id) INTO user_ids FROM get_all_user_ids();
  SELECT COUNT(*) INTO user_count FROM get_all_user_ids();
  
  IF user_count = 0 THEN
    RAISE NOTICE 'No users found in the database. Seed data will not be created.';
    RETURN;
  END IF;
  
  -- Get two different user IDs for the seed data
  seed_user_id := user_ids[1];
  
  IF user_count >= 2 THEN
    seed_user_id2 := user_ids[2];
  ELSE
    seed_user_id2 := seed_user_id;
  END IF;
  
  -- Clear existing seed data if any
  DELETE FROM jetshare_transactions;
  DELETE FROM jetshare_offers;
  
  -- Insert sample jetshare_offers
  INSERT INTO jetshare_offers (
    user_id, flight_date, departure_location, arrival_location, 
    total_flight_cost, requested_share_amount, status, matched_user_id, created_at
  ) VALUES
  (
    seed_user_id, 
    NOW() + INTERVAL '2 days', 
    'New York (JFK)', 
    'Los Angeles (LAX)', 
    25000.00, 
    12500.00, 
    'open', 
    NULL, 
    NOW() - INTERVAL '1 day'
  ),
  (
    seed_user_id, 
    NOW() + INTERVAL '7 days', 
    'San Francisco (SFO)', 
    'Las Vegas (LAS)', 
    15000.00, 
    7500.00, 
    'open', 
    NULL, 
    NOW() - INTERVAL '3 days'
  ),
  (
    seed_user_id, 
    NOW() + INTERVAL '14 days', 
    'Miami (MIA)', 
    'Chicago (ORD)', 
    18000.00, 
    9000.00, 
    'open', 
    NULL, 
    NOW() - INTERVAL '2 days'
  ),
  (
    seed_user_id, 
    NOW() + INTERVAL '10 days', 
    'Seattle (SEA)', 
    'Denver (DEN)', 
    16500.00, 
    8250.00, 
    'open', 
    NULL, 
    NOW() - INTERVAL '1 day'
  ),
  (
    seed_user_id, 
    NOW() + INTERVAL '5 days', 
    'Boston (BOS)', 
    'Washington DC (DCA)', 
    12000.00, 
    6000.00, 
    'accepted', 
    seed_user_id2, 
    NOW() - INTERVAL '5 days'
  ),
  (
    seed_user_id2, 
    NOW() + INTERVAL '3 days', 
    'Austin (AUS)', 
    'New Orleans (MSY)', 
    14000.00, 
    7000.00, 
    'open', 
    NULL, 
    NOW() - INTERVAL '2 days'
  );
  
  -- Insert sample transaction for the accepted offer
  INSERT INTO jetshare_transactions (
    offer_id, payer_user_id, recipient_user_id, amount, handling_fee, payment_method, payment_status, transaction_date
  )
  SELECT
    id, -- offer_id
    seed_user_id2, -- payer_user_id
    seed_user_id, -- recipient_user_id
    requested_share_amount, -- amount
    requested_share_amount * 0.075, -- handling_fee (7.5%)
    'fiat', -- payment_method
    'completed', -- payment_status
    NOW() - INTERVAL '1 day' -- transaction_date
  FROM jetshare_offers
  WHERE status = 'accepted' AND user_id = seed_user_id AND matched_user_id = seed_user_id2;

  RAISE NOTICE 'JetShare seed data created successfully.';
END;
$$;

-- Security policies for Row Level Security
ALTER TABLE jetshare_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetshare_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for jetshare_offers - can be viewed by created user or matched user
DROP POLICY IF EXISTS "Users can view their own offers or matched offers" ON jetshare_offers;
CREATE POLICY "Users can view their own offers or matched offers"
  ON jetshare_offers
  FOR SELECT
  USING (
    auth.uid() = user_id OR 
    auth.uid() = matched_user_id OR
    status = 'open'
  );

-- Policies for jetshare_offers - can only be updated by the owner
DROP POLICY IF EXISTS "Users can update their own offers" ON jetshare_offers;
CREATE POLICY "Users can update their own offers"
  ON jetshare_offers
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for jetshare_offers - can only be created by authenticated users
DROP POLICY IF EXISTS "Users can create their own offers" ON jetshare_offers;
CREATE POLICY "Users can create their own offers"
  ON jetshare_offers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for jetshare_transactions - can be viewed by payer or recipient
DROP POLICY IF EXISTS "Users can view their own transactions" ON jetshare_transactions;
CREATE POLICY "Users can view their own transactions"
  ON jetshare_transactions
  FOR SELECT
  USING (
    auth.uid() = payer_user_id OR 
    auth.uid() = recipient_user_id
  );

COMMIT; 