-- Create jetshare_tickets table for storing booking tickets
CREATE TABLE IF NOT EXISTS jetshare_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID NOT NULL REFERENCES jetshare_offers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_code VARCHAR(20) NOT NULL,
  passenger_name TEXT,
  seat_number VARCHAR(5),
  boarding_time TIMESTAMPTZ,
  gate VARCHAR(5),
  status VARCHAR(20) DEFAULT 'active',
  booking_status VARCHAR(20) DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  qr_code_url TEXT,
  boarding_pass_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index on offer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_jetshare_tickets_offer_id ON jetshare_tickets(offer_id);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_jetshare_tickets_user_id ON jetshare_tickets(user_id);

-- Add RLS policies if using Row Level Security
ALTER TABLE jetshare_tickets ENABLE ROW LEVEL SECURITY;

-- Users can read their own tickets
CREATE POLICY "Users can view their own tickets" 
ON jetshare_tickets FOR SELECT 
USING (auth.uid() = user_id);

-- Service role can do anything
CREATE POLICY "Service role can do everything on tickets" 
ON jetshare_tickets USING (true)
WITH CHECK (true);

-- Add a function to check if a ticket exists for an offer
CREATE OR REPLACE FUNCTION has_ticket_for_offer(offer_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM jetshare_tickets 
    WHERE jetshare_tickets.offer_id = $1 
    AND jetshare_tickets.user_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add tickets_count function to count tickets for an offer
CREATE OR REPLACE FUNCTION public.get_jetshare_tickets_count(offer_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*) FROM public.jetshare_tickets WHERE offer_id = $1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Add column to jetshare_offers table to track ticket generation
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'jetshare_offers' 
                AND column_name = 'tickets_generated') 
  THEN
    ALTER TABLE public.jetshare_offers ADD COLUMN tickets_generated BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'jetshare_offers' 
                AND column_name = 'completed_at') 
  THEN
    ALTER TABLE public.jetshare_offers ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
END $$; 