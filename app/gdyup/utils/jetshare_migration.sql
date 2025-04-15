-- JetShare Database Migration Script
-- This script creates or updates all the tables needed for the JetShare module

-- Check if the tables exist before creating them
-- For jetshare_offers
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jetshare_offers') THEN
    -- Create the offers table
    CREATE TABLE public.jetshare_offers (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id),
      flight_date TIMESTAMP WITH TIME ZONE NOT NULL,
      departure_location TEXT NOT NULL,
      arrival_location TEXT NOT NULL,
      total_flight_cost NUMERIC NOT NULL CHECK (total_flight_cost > 0),
      requested_share_amount NUMERIC NOT NULL CHECK (requested_share_amount > 0),
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'completed', 'cancelled')),
      matched_user_id UUID REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- Add RLS policies for the offers table
    ALTER TABLE public.jetshare_offers ENABLE ROW LEVEL SECURITY;

    -- Users can read all offers
    CREATE POLICY "Anyone can view offers" ON public.jetshare_offers
      FOR SELECT USING (true);

    -- Users can create their own offers
    CREATE POLICY "Users can create their own offers" ON public.jetshare_offers
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    -- Users can update their own offers
    CREATE POLICY "Users can update their own offers" ON public.jetshare_offers
      FOR UPDATE USING (auth.uid() = user_id);

    -- Index for faster searches
    CREATE INDEX idx_jetshare_offers_status ON public.jetshare_offers(status);
    CREATE INDEX idx_jetshare_offers_user_id ON public.jetshare_offers(user_id);
    CREATE INDEX idx_jetshare_offers_matched_user_id ON public.jetshare_offers(matched_user_id);
    CREATE INDEX idx_jetshare_offers_flight_date ON public.jetshare_offers(flight_date);
  END IF;
END
$$;

-- For jetshare_transactions
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jetshare_transactions') THEN
    -- Create the transactions table
    CREATE TABLE public.jetshare_transactions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      offer_id UUID NOT NULL REFERENCES public.jetshare_offers(id),
      payer_user_id UUID NOT NULL REFERENCES auth.users(id),
      recipient_user_id UUID NOT NULL REFERENCES auth.users(id),
      amount NUMERIC NOT NULL CHECK (amount > 0),
      handling_fee NUMERIC NOT NULL CHECK (handling_fee >= 0),
      payment_method TEXT NOT NULL CHECK (payment_method IN ('fiat', 'crypto')),
      payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
      transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
      payment_details JSONB DEFAULT '{}'::jsonb
    );

    -- Add RLS policies for transactions
    ALTER TABLE public.jetshare_transactions ENABLE ROW LEVEL SECURITY;

    -- Users can only view transactions they are part of
    CREATE POLICY "Users can view their transactions" ON public.jetshare_transactions
      FOR SELECT USING (auth.uid() = payer_user_id OR auth.uid() = recipient_user_id);

    -- Only the system can create transactions (via API)
    CREATE POLICY "System can create transactions" ON public.jetshare_transactions
      FOR INSERT WITH CHECK (true);

    -- Only the system can update transactions (via API)
    CREATE POLICY "System can update transactions" ON public.jetshare_transactions
      FOR UPDATE USING (true);

    -- Indexes for faster searches
    CREATE INDEX idx_jetshare_transactions_offer_id ON public.jetshare_transactions(offer_id);
    CREATE INDEX idx_jetshare_transactions_payer_user_id ON public.jetshare_transactions(payer_user_id);
    CREATE INDEX idx_jetshare_transactions_recipient_user_id ON public.jetshare_transactions(recipient_user_id);
    CREATE INDEX idx_jetshare_transactions_payment_status ON public.jetshare_transactions(payment_status);
  END IF;
END
$$;

-- Update outdated tables with new columns if needed
DO $$
BEGIN
  -- Add any column changes here
  -- For example:
  -- IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.jetshare_offers'::regclass AND attname = 'new_column') THEN
  --   ALTER TABLE public.jetshare_offers ADD COLUMN new_column TEXT;
  -- END IF;
END
$$; 