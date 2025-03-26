-- Enable the necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum type for offer statuses
CREATE TYPE jetshare_offer_status AS ENUM ('open', 'accepted', 'completed');

-- Create enum type for payment methods
CREATE TYPE jetshare_payment_method AS ENUM ('fiat', 'crypto');

-- Create enum type for payment statuses
CREATE TYPE jetshare_payment_status AS ENUM ('pending', 'completed', 'failed');

-- Create JetShare Settings Table
CREATE TABLE IF NOT EXISTS "jetshare_settings" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "handling_fee_percentage" DECIMAL(5, 2) NOT NULL DEFAULT 7.5,
  "allow_crypto_payments" BOOLEAN NOT NULL DEFAULT TRUE,
  "allow_fiat_payments" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create JetShare Offers Table
CREATE TABLE IF NOT EXISTS "jetshare_offers" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "flight_date" TIMESTAMPTZ NOT NULL,
  "departure_location" TEXT NOT NULL,
  "arrival_location" TEXT NOT NULL,
  "total_flight_cost" DECIMAL(10, 2) NOT NULL,
  "requested_share_amount" DECIMAL(10, 2) NOT NULL,
  "status" TEXT NOT NULL CHECK (status IN ('open', 'accepted', 'completed')),
  "matched_user_id" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create JetShare Transactions Table
CREATE TABLE IF NOT EXISTS "jetshare_transactions" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "offer_id" UUID NOT NULL REFERENCES jetshare_offers(id) ON DELETE CASCADE,
  "payer_user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "recipient_user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "amount" DECIMAL(10, 2) NOT NULL,
  "handling_fee" DECIMAL(10, 2) NOT NULL,
  "payment_method" TEXT NOT NULL CHECK (payment_method IN ('fiat', 'crypto')),
  "payment_status" TEXT NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed')),
  "transaction_date" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "transaction_reference" TEXT,
  "receipt_url" TEXT
);

-- Insert default settings
INSERT INTO "jetshare_settings" ("handling_fee_percentage", "allow_crypto_payments", "allow_fiat_payments")
VALUES (7.5, TRUE, TRUE);

-- Create Row Level Security Policies

-- Enable RLS on the tables
ALTER TABLE "jetshare_offers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "jetshare_transactions" ENABLE ROW LEVEL SECURITY;

-- Offers policies
-- Anyone can view open offers
CREATE POLICY "View open offers" ON "jetshare_offers"
  FOR SELECT
  USING (status = 'open');

-- Users can view their own offers (created or matched)
CREATE POLICY "View own offers" ON "jetshare_offers"
  FOR SELECT
  USING (user_id = auth.uid() OR matched_user_id = auth.uid());

-- Only the owner can insert their own offers
CREATE POLICY "Insert own offers" ON "jetshare_offers"
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Only the owner can update their own open offers
CREATE POLICY "Update own open offers" ON "jetshare_offers"
  FOR UPDATE
  USING (user_id = auth.uid() AND status = 'open');

-- System can update any offer (for accepting/completing)
CREATE POLICY "System can update any offer" ON "jetshare_offers"
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Only owner can delete their own open offers
CREATE POLICY "Delete own open offers" ON "jetshare_offers"
  FOR DELETE
  USING (user_id = auth.uid() AND status = 'open');

-- Transactions policies
-- Users can view their own transactions
CREATE POLICY "View own transactions" ON "jetshare_transactions"
  FOR SELECT
  USING (payer_user_id = auth.uid() OR recipient_user_id = auth.uid());

-- System can insert transactions
CREATE POLICY "System can insert transactions" ON "jetshare_transactions"
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- System can update transactions
CREATE POLICY "System can update transactions" ON "jetshare_transactions"
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Create functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_jetshare_offers_modtime
BEFORE UPDATE ON "jetshare_offers"
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_jetshare_settings_modtime
BEFORE UPDATE ON "jetshare_settings"
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create index for faster lookups
CREATE INDEX idx_jetshare_offers_user_id ON "jetshare_offers" ("user_id");
CREATE INDEX idx_jetshare_offers_status ON "jetshare_offers" ("status");
CREATE INDEX idx_jetshare_offers_flight_date ON "jetshare_offers" ("flight_date");
CREATE INDEX idx_jetshare_transactions_offer_id ON "jetshare_transactions" ("offer_id");
CREATE INDEX idx_jetshare_transactions_payer_user_id ON "jetshare_transactions" ("payer_user_id");
CREATE INDEX idx_jetshare_transactions_recipient_user_id ON "jetshare_transactions" ("recipient_user_id");

-- Create notification function
CREATE OR REPLACE FUNCTION notify_jetshare_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM pg_notify(
      'jetshare_' || TG_TABLE_NAME || '_changes',
      json_build_object(
        'operation', TG_OP,
        'record', row_to_json(NEW)
      )::text
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM pg_notify(
      'jetshare_' || TG_TABLE_NAME || '_changes',
      json_build_object(
        'operation', TG_OP,
        'old_record', row_to_json(OLD)
      )::text
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for real-time updates
CREATE TRIGGER notify_jetshare_offers_changes
AFTER INSERT OR UPDATE OR DELETE ON "jetshare_offers"
FOR EACH ROW EXECUTE FUNCTION notify_jetshare_changes();

CREATE TRIGGER notify_jetshare_transactions_changes
AFTER INSERT OR UPDATE OR DELETE ON "jetshare_transactions"
FOR EACH ROW EXECUTE FUNCTION notify_jetshare_changes(); 