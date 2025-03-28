-- JETSTREAM DATABASE RESTORATION SCRIPT - PART 4: ROW LEVEL SECURITY POLICIES
-- This script creates all the Row Level Security (RLS) policies

-- Enable RLS on core tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jets ENABLE ROW LEVEL SECURITY;
ALTER TABLE airports ENABLE ROW LEVEL SECURITY;
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fractional_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on crew tables
ALTER TABLE pilots_crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialized_flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_itinerary_requests ENABLE ROW LEVEL SECURITY;

-- Enable RLS on JetShare tables
ALTER TABLE "jetshare_offers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "jetshare_transactions" ENABLE ROW LEVEL SECURITY;

-- ======================================================================
-- RLS POLICIES FOR CORE TABLES
-- ======================================================================

-- Profiles RLS policies
CREATE POLICY IF NOT EXISTS "Users can view any profile"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Jets RLS policies
CREATE POLICY IF NOT EXISTS "Anyone can view available jets"
  ON jets FOR SELECT
  USING (status = 'available');

CREATE POLICY IF NOT EXISTS "Owners can manage their jets"
  ON jets FOR ALL
  USING (auth.uid() = owner_id);

-- Flights RLS policies
CREATE POLICY IF NOT EXISTS "Anyone can view scheduled flights"
  ON flights FOR SELECT
  USING (status IN ('scheduled', 'boarding'));

-- Bookings RLS policies
CREATE POLICY IF NOT EXISTS "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create their own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ======================================================================
-- RLS POLICIES FOR CREW TABLES
-- ======================================================================

-- Pilots/Crews RLS policies
CREATE POLICY IF NOT EXISTS "Public can view pilots_crews" ON pilots_crews
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert their own crew profile" ON pilots_crews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own crew profile" ON pilots_crews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own crew profile" ON pilots_crews
  FOR DELETE USING (auth.uid() = user_id);

-- Crew Reviews RLS policies
CREATE POLICY IF NOT EXISTS "Public can view crew_reviews" ON crew_reviews
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert their own reviews" ON crew_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own reviews" ON crew_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own reviews" ON crew_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Specialized Flights RLS policies
CREATE POLICY IF NOT EXISTS "Public can view specialized_flights" ON specialized_flights
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Crew can insert their specialized flights" ON specialized_flights
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pilots_crews 
      WHERE pilots_crews.id = crew_id AND pilots_crews.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Crew can update their specialized flights" ON specialized_flights
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM pilots_crews 
      WHERE pilots_crews.id = crew_id AND pilots_crews.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Crew can delete their specialized flights" ON specialized_flights
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM pilots_crews 
      WHERE pilots_crews.id = crew_id AND pilots_crews.user_id = auth.uid()
    )
  );

-- Custom Itinerary Requests RLS policies
CREATE POLICY IF NOT EXISTS "Users can view their own requests" ON custom_itinerary_requests
  FOR SELECT USING (auth.uid() = requesting_user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own requests" ON custom_itinerary_requests
  FOR INSERT WITH CHECK (auth.uid() = requesting_user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own requests" ON custom_itinerary_requests
  FOR UPDATE USING (auth.uid() = requesting_user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own requests" ON custom_itinerary_requests
  FOR DELETE USING (auth.uid() = requesting_user_id);

-- ======================================================================
-- RLS POLICIES FOR JETSHARE TABLES
-- ======================================================================

-- JetShare Offers RLS policies
CREATE POLICY IF NOT EXISTS "View open offers" ON "jetshare_offers"
  FOR SELECT
  USING (status = 'open');

CREATE POLICY IF NOT EXISTS "View own offers" ON "jetshare_offers"
  FOR SELECT
  USING (user_id = auth.uid() OR matched_user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Insert own offers" ON "jetshare_offers"
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Update own open offers" ON "jetshare_offers"
  FOR UPDATE
  USING (user_id = auth.uid() AND status = 'open');

CREATE POLICY IF NOT EXISTS "System can update any offer" ON "jetshare_offers"
  FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Delete own open offers" ON "jetshare_offers"
  FOR DELETE
  USING (user_id = auth.uid() AND status = 'open');

-- JetShare Transactions RLS policies
CREATE POLICY IF NOT EXISTS "View own transactions" ON "jetshare_transactions"
  FOR SELECT
  USING (payer_user_id = auth.uid() OR recipient_user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "System can insert transactions" ON "jetshare_transactions"
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "System can update transactions" ON "jetshare_transactions"
  FOR UPDATE
  USING (auth.role() = 'service_role'); 