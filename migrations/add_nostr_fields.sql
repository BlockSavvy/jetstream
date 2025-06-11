-- Add Nostr fields to profiles table

-- Add missing Nostr-related columns if they don't exist
DO $$
BEGIN
  -- Add npub column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'npub') THEN
    ALTER TABLE profiles ADD COLUMN npub TEXT;
  END IF;

  -- Add nip05 column if it doesn't exist (e.g. pilot@gdyup.xyz)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'nip05') THEN
    ALTER TABLE profiles ADD COLUMN nip05 TEXT;
  END IF;

  -- Add lud16 column if it doesn't exist (Lightning address)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'lud16') THEN
    ALTER TABLE profiles ADD COLUMN lud16 TEXT;
  END IF;
  
  -- Add nostr_pubkey column if it doesn't exist (for storing the hex pubkey format)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'nostr_pubkey') THEN
    ALTER TABLE profiles ADD COLUMN nostr_pubkey TEXT;
  END IF;
  
  -- Add nostr_relays column if it doesn't exist (array of relay URLs)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'nostr_relays') THEN
    ALTER TABLE profiles ADD COLUMN nostr_relays TEXT[] DEFAULT '{"wss://relay.damus.io", "wss://nos.lol", "wss://relay.nostr.band"}';
  END IF;
  
  -- Add nostr_settings column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'nostr_settings') THEN
    ALTER TABLE profiles ADD COLUMN nostr_settings JSONB DEFAULT '{
      "enabled": false,
      "broadcast_offers": false,
      "receive_messages": false,
      "enable_zaps": false,
      "private_mode": true,
      "auto_connect": false
    }';
  END IF;
  
  -- Add nostr_signature column if it doesn't exist (for storing the NIP-01 signature)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'nostr_signature') THEN
    ALTER TABLE profiles ADD COLUMN nostr_signature TEXT;
  END IF;

  -- Add feature_flags column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'feature_flags') THEN
    ALTER TABLE profiles ADD COLUMN feature_flags JSONB DEFAULT '{
      "enable_nostr_identity": false,
      "enable_nostr_messages": false,
      "enable_nostr_offers": false,
      "enable_nostr_zaps": false
    }';
  END IF;
END
$$;

-- Create feature flags table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_feature_flags (
  id SERIAL PRIMARY KEY,
  flag_name TEXT NOT NULL UNIQUE,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  user_configurable BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Nostr-related feature flags
INSERT INTO app_feature_flags (flag_name, description, enabled, user_configurable)
VALUES 
  ('ENABLE_NOSTR_IDENTITY', 'Enable Nostr decentralized identity integration', false, true),
  ('ENABLE_NOSTR_MESSAGES', 'Enable Nostr-based messaging system', false, true),
  ('ENABLE_NOSTR_OFFERS', 'Enable broadcasting offers to Nostr network', false, true), 
  ('ENABLE_NOSTR_ZAPS', 'Enable Nostr Zaps for Lightning payments', false, true)
ON CONFLICT (flag_name) DO NOTHING;

-- Create well-known JSON generator function for NIP-05 verification
CREATE OR REPLACE FUNCTION generate_nostr_nip05_json()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Query profiles with valid nip05 and public keys
  SELECT json_build_object(
    'names', 
    (SELECT jsonb_object_agg(
      split_part(nip05, '@', 1), 
      nostr_pubkey
    ) FROM profiles WHERE nip05 IS NOT NULL AND nostr_pubkey IS NOT NULL)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Add function to verify if a given NIP-05 is unique
CREATE OR REPLACE FUNCTION is_nip05_unique(p_nip05 TEXT, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  -- Check if the NIP-05 is already used by another user
  SELECT NOT EXISTS(
    SELECT 1 FROM profiles 
    WHERE nip05 = p_nip05 
    AND id != p_user_id
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create table to store Nostr offer broadcast events
CREATE TABLE IF NOT EXISTS nostr_offer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES jetshare_offers(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  pubkey TEXT NOT NULL,
  relay TEXT,
  event_kind INTEGER NOT NULL,
  content TEXT,
  signature TEXT,
  tags JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on offer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_nostr_offer_events_offer_id ON nostr_offer_events(offer_id);
CREATE INDEX IF NOT EXISTS idx_nostr_offer_events_event_id ON nostr_offer_events(event_id);

-- Create table to store Nostr zap history
CREATE TABLE IF NOT EXISTS nostr_zaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_npub TEXT NOT NULL,
  from_pubkey TEXT NOT NULL,
  to_npub TEXT NOT NULL,
  to_pubkey TEXT NOT NULL,
  amount_sats INTEGER NOT NULL,
  ln_invoice TEXT,
  offer_id UUID REFERENCES jetshare_offers(id) ON DELETE SET NULL,
  event_id TEXT,
  comment TEXT,
  zap_receipt_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster zap lookups
CREATE INDEX IF NOT EXISTS idx_nostr_zaps_from_pubkey ON nostr_zaps(from_pubkey);
CREATE INDEX IF NOT EXISTS idx_nostr_zaps_to_pubkey ON nostr_zaps(to_pubkey);
CREATE INDEX IF NOT EXISTS idx_nostr_zaps_offer_id ON nostr_zaps(offer_id);

-- Modify payments table with BTCPay Server and Nostr payment tracking
DO $$
BEGIN
  -- Add BTCPay invoice ID column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'btcpay_invoice_id') THEN
    ALTER TABLE payments ADD COLUMN btcpay_invoice_id TEXT;
  END IF;

  -- Add flag to track if payment was done via Nostr
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'paid_via_nostr') THEN
    ALTER TABLE payments ADD COLUMN paid_via_nostr BOOLEAN DEFAULT false;
  END IF;
  
  -- Add zap_receipt_id column to link payments to Nostr zaps
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'zap_receipt_id') THEN
    ALTER TABLE payments ADD COLUMN zap_receipt_id TEXT;
  END IF;

  -- Add lightning_payment_hash column for LN invoice tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'lightning_payment_hash') THEN
    ALTER TABLE payments ADD COLUMN lightning_payment_hash TEXT;
  END IF;
END
$$;

-- Create table to store Nostr messages between users
CREATE TABLE IF NOT EXISTS nostr_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE,
  sender_pubkey TEXT NOT NULL,
  sender_npub TEXT,
  recipient_pubkey TEXT NOT NULL,
  recipient_npub TEXT,
  content TEXT NOT NULL,
  encrypted BOOLEAN DEFAULT true,
  relay TEXT,
  read BOOLEAN DEFAULT false,
  tags JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster message lookups
CREATE INDEX IF NOT EXISTS idx_nostr_messages_sender_pubkey ON nostr_messages(sender_pubkey);
CREATE INDEX IF NOT EXISTS idx_nostr_messages_recipient_pubkey ON nostr_messages(recipient_pubkey);
CREATE INDEX IF NOT EXISTS idx_nostr_messages_event_id ON nostr_messages(event_id);

-- Add function to get conversations for a user
CREATE OR REPLACE FUNCTION get_nostr_conversations(p_pubkey TEXT)
RETURNS TABLE (
  pubkey TEXT,
  npub TEXT,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH conversations AS (
    SELECT 
      CASE 
        WHEN sender_pubkey = p_pubkey THEN recipient_pubkey 
        ELSE sender_pubkey 
      END AS pubkey,
      CASE 
        WHEN sender_pubkey = p_pubkey THEN recipient_npub 
        ELSE sender_npub 
      END AS npub,
      content AS last_message,
      created_at AS last_message_at,
      CASE 
        WHEN recipient_pubkey = p_pubkey AND NOT read THEN 1
        ELSE 0
      END AS is_unread
    FROM nostr_messages
    WHERE sender_pubkey = p_pubkey OR recipient_pubkey = p_pubkey
    ORDER BY created_at DESC
  )
  SELECT 
    c.pubkey,
    c.npub,
    c.last_message,
    c.last_message_at,
    SUM(c.is_unread)::integer AS unread_count
  FROM conversations c
  GROUP BY c.pubkey, c.npub, c.last_message, c.last_message_at
  ORDER BY c.last_message_at DESC;
END;
$$ LANGUAGE plpgsql; 