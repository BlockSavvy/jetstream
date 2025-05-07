-- Migration: Create nostr_zaps table for storing zap receipts
CREATE TABLE IF NOT EXISTS nostr_zaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zap_event_id TEXT NOT NULL,
  zap_request JSONB,
  zap_receipt JSONB,
  amount BIGINT NOT NULL,
  sender_pubkey TEXT NOT NULL,
  recipient_pubkey TEXT NOT NULL,
  offer_id UUID,
  comment TEXT,
  profile_id UUID,
  flight_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_nostr_zaps_offer_id ON nostr_zaps(offer_id);
CREATE INDEX IF NOT EXISTS idx_nostr_zaps_profile_id ON nostr_zaps(profile_id);
CREATE INDEX IF NOT EXISTS idx_nostr_zaps_flight_id ON nostr_zaps(flight_id);
CREATE INDEX IF NOT EXISTS idx_nostr_zaps_sender_pubkey ON nostr_zaps(sender_pubkey);
CREATE INDEX IF NOT EXISTS idx_nostr_zaps_recipient_pubkey ON nostr_zaps(recipient_pubkey);
CREATE INDEX IF NOT EXISTS idx_nostr_zaps_created_at ON nostr_zaps(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_nostr_zaps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function on update
DROP TRIGGER IF EXISTS trigger_update_nostr_zaps_updated_at ON nostr_zaps;
CREATE TRIGGER trigger_update_nostr_zaps_updated_at
BEFORE UPDATE ON nostr_zaps
FOR EACH ROW
EXECUTE FUNCTION update_nostr_zaps_updated_at(); 