-- Nostr Embeddings Integration for AI Concierge
-- This migration adds vector search capabilities to Nostr-related tables
-- allowing the AI concierge to search across Nostr data

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns to Nostr-related tables
ALTER TABLE nostr_offer_events ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE nostr_offer_events ADD COLUMN IF NOT EXISTS embedding_updated_at timestamptz;
ALTER TABLE nostr_offer_events ADD COLUMN IF NOT EXISTS needs_embedding boolean DEFAULT true;

ALTER TABLE nostr_messages ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE nostr_messages ADD COLUMN IF NOT EXISTS embedding_updated_at timestamptz;
ALTER TABLE nostr_messages ADD COLUMN IF NOT EXISTS needs_embedding boolean DEFAULT true;

ALTER TABLE nostr_zaps ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE nostr_zaps ADD COLUMN IF NOT EXISTS embedding_updated_at timestamptz;
ALTER TABLE nostr_zaps ADD COLUMN IF NOT EXISTS needs_embedding boolean DEFAULT true;

-- Create function to generate embedding text for Nostr events
CREATE OR REPLACE FUNCTION generate_nostr_event_embedding_text(
  event_id text
) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  event_record nostr_offer_events%ROWTYPE;
  offer_record jetshare_offers%ROWTYPE;
BEGIN
  -- Get the event record
  SELECT * INTO event_record FROM nostr_offer_events WHERE event_id = event_id;
  
  -- Get related offer if available
  IF event_record.offer_id IS NOT NULL THEN
    SELECT * INTO offer_record FROM jetshare_offers WHERE id = event_record.offer_id;
  END IF;
  
  -- Generate formatted text for embedding
  RETURN concat_ws(E'\n',
    'Nostr Event:',
    'Event ID: ' || event_record.event_id,
    'Pubkey: ' || event_record.pubkey,
    'Relay: ' || COALESCE(event_record.relay, 'Unknown'),
    'Kind: ' || event_record.event_kind::text,
    'Content: ' || COALESCE(event_record.content, ''),
    'Tags: ' || COALESCE(event_record.tags::text, ''),
    'Created At: ' || event_record.created_at::text,
    -- Add offer details if available
    CASE WHEN offer_record.id IS NOT NULL THEN
      concat_ws(E'\n',
        'Related JetShare Offer:',
        'From: ' || offer_record.departure_location,
        'To: ' || offer_record.arrival_location,
        'Date: ' || offer_record.flight_date::text,
        'Status: ' || offer_record.status
      )
    ELSE '' END
  );
END;
$$;

-- Create function to generate embedding text for Nostr messages
CREATE OR REPLACE FUNCTION generate_nostr_message_embedding_text(
  message_id uuid
) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  message_record nostr_messages%ROWTYPE;
  content_text text;
BEGIN
  -- Get the message record
  SELECT * INTO message_record FROM nostr_messages WHERE id = message_id;
  
  -- Handle encrypted content
  IF message_record.encrypted THEN
    content_text := '[Encrypted message]';
  ELSE
    content_text := message_record.content;
  END IF;
  
  -- Generate formatted text for embedding
  RETURN concat_ws(E'\n',
    'Nostr Message:',
    'Sender: ' || message_record.sender_pubkey,
    'Recipient: ' || message_record.recipient_pubkey,
    'Content: ' || content_text,
    'Created At: ' || message_record.created_at::text,
    'Read: ' || message_record.read::text
  );
END;
$$;

-- Create function to generate embedding text for Nostr zaps
CREATE OR REPLACE FUNCTION generate_nostr_zap_embedding_text(
  zap_id uuid
) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  zap_record nostr_zaps%ROWTYPE;
  offer_record jetshare_offers%ROWTYPE;
BEGIN
  -- Get the zap record
  SELECT * INTO zap_record FROM nostr_zaps WHERE id = zap_id;
  
  -- Get related offer if available
  IF zap_record.offer_id IS NOT NULL THEN
    SELECT * INTO offer_record FROM jetshare_offers WHERE id = zap_record.offer_id;
  END IF;
  
  -- Generate formatted text for embedding
  RETURN concat_ws(E'\n',
    'Nostr Zap:',
    'From: ' || zap_record.from_npub,
    'To: ' || zap_record.to_npub,
    'Amount: ' || zap_record.amount_sats::text || ' sats',
    'Comment: ' || COALESCE(zap_record.comment, 'No comment'),
    'Status: ' || zap_record.status,
    'Created At: ' || zap_record.created_at::text,
    -- Add offer details if available
    CASE WHEN offer_record.id IS NOT NULL THEN
      concat_ws(E'\n',
        'Related JetShare Offer:',
        'From: ' || offer_record.departure_location,
        'To: ' || offer_record.arrival_location,
        'Date: ' || offer_record.flight_date::text,
        'Status: ' || offer_record.status
      )
    ELSE '' END
  );
END;
$$;

-- Create trigger functions to mark Nostr records as needing embedding
-- For nostr_offer_events
CREATE OR REPLACE FUNCTION flag_nostr_event_for_embedding()
RETURNS TRIGGER AS $$
BEGIN
  NEW.needs_embedding = TRUE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- For nostr_messages
CREATE OR REPLACE FUNCTION flag_nostr_message_for_embedding()
RETURNS TRIGGER AS $$
BEGIN
  NEW.needs_embedding = TRUE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- For nostr_zaps
CREATE OR REPLACE FUNCTION flag_nostr_zap_for_embedding()
RETURNS TRIGGER AS $$
BEGIN
  NEW.needs_embedding = TRUE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic embedding updates
CREATE TRIGGER trigger_flag_nostr_event_for_embedding
BEFORE INSERT OR UPDATE ON nostr_offer_events
FOR EACH ROW
EXECUTE FUNCTION flag_nostr_event_for_embedding();

CREATE TRIGGER trigger_flag_nostr_message_for_embedding
BEFORE INSERT OR UPDATE ON nostr_messages
FOR EACH ROW
EXECUTE FUNCTION flag_nostr_message_for_embedding();

CREATE TRIGGER trigger_flag_nostr_zap_for_embedding
BEFORE INSERT OR UPDATE ON nostr_zaps
FOR EACH ROW
EXECUTE FUNCTION flag_nostr_zap_for_embedding();

-- Create indexes for vector search
CREATE INDEX IF NOT EXISTS idx_nostr_offer_events_embedding 
ON nostr_offer_events 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 50);

CREATE INDEX IF NOT EXISTS idx_nostr_messages_embedding
ON nostr_messages
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 50);

CREATE INDEX IF NOT EXISTS idx_nostr_zaps_embedding
ON nostr_zaps
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 50);

-- Create index for efficient embedding updates
CREATE INDEX IF NOT EXISTS idx_nostr_offer_events_needs_embedding 
ON nostr_offer_events(needs_embedding) 
WHERE needs_embedding = TRUE;

CREATE INDEX IF NOT EXISTS idx_nostr_messages_needs_embedding
ON nostr_messages(needs_embedding)
WHERE needs_embedding = TRUE;

CREATE INDEX IF NOT EXISTS idx_nostr_zaps_needs_embedding
ON nostr_zaps(needs_embedding)
WHERE needs_embedding = TRUE;

-- Function to get Nostr entities needing embedding 
CREATE OR REPLACE FUNCTION get_nostr_entities_needing_embedding(
  entity_type text,
  batch_size int DEFAULT 20
) RETURNS TABLE (
  id text, -- Using text to accommodate both UUID and string IDs
  entity_type text
) LANGUAGE plpgsql AS $$
BEGIN
  CASE entity_type
    WHEN 'nostr_event' THEN
      RETURN QUERY
      SELECT event_id::text, 'nostr_event'::text
      FROM nostr_offer_events
      WHERE needs_embedding = TRUE
      LIMIT batch_size;
      
    WHEN 'nostr_message' THEN
      RETURN QUERY
      SELECT id::text, 'nostr_message'::text
      FROM nostr_messages
      WHERE needs_embedding = TRUE
      LIMIT batch_size;
      
    WHEN 'nostr_zap' THEN
      RETURN QUERY
      SELECT id::text, 'nostr_zap'::text
      FROM nostr_zaps
      WHERE needs_embedding = TRUE
      LIMIT batch_size;
      
    ELSE
      RAISE EXCEPTION 'Unsupported entity type: %', entity_type;
  END CASE;
END;
$$;

-- Function to mark Nostr entities as embedded
CREATE OR REPLACE FUNCTION mark_nostr_entity_as_embedded(
  entity_id text,
  entity_type text
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  CASE entity_type
    WHEN 'nostr_event' THEN
      UPDATE nostr_offer_events
      SET needs_embedding = FALSE,
          embedding_updated_at = NOW()
      WHERE event_id = entity_id;
      
    WHEN 'nostr_message' THEN
      UPDATE nostr_messages
      SET needs_embedding = FALSE,
          embedding_updated_at = NOW()
      WHERE id = entity_id::uuid;
      
    WHEN 'nostr_zap' THEN
      UPDATE nostr_zaps
      SET needs_embedding = FALSE,
          embedding_updated_at = NOW()
      WHERE id = entity_id::uuid;
      
    ELSE
      RAISE EXCEPTION 'Unsupported entity type: %', entity_type;
  END CASE;
END;
$$;

-- Create a function for semantic search across Nostr entities
CREATE OR REPLACE FUNCTION nostr_semantic_search(
  query_embedding vector,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
) RETURNS TABLE (
  id text,
  entity_type text,
  content text,
  created_at timestamptz,
  similarity float
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  
  -- Search in nostr_offer_events
  SELECT 
    event_id::text,
    'nostr_event'::text,
    content,
    created_at,
    1 - (embedding <=> query_embedding) AS similarity
  FROM nostr_offer_events
  WHERE embedding IS NOT NULL
    AND 1 - (embedding <=> query_embedding) > match_threshold
  
  UNION ALL
  
  -- Search in nostr_messages (only non-encrypted)
  SELECT 
    id::text,
    'nostr_message'::text,
    content,
    created_at,
    1 - (embedding <=> query_embedding) AS similarity
  FROM nostr_messages
  WHERE embedding IS NOT NULL
    AND encrypted = FALSE
    AND 1 - (embedding <=> query_embedding) > match_threshold
  
  UNION ALL
  
  -- Search in nostr_zaps
  SELECT 
    id::text,
    'nostr_zap'::text,
    comment,
    created_at,
    1 - (embedding <=> query_embedding) AS similarity
  FROM nostr_zaps
  WHERE embedding IS NOT NULL
    AND 1 - (embedding <=> query_embedding) > match_threshold
  
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Update JetShare offer embedding function to include Nostr data
-- This enhances the existing generate_jetshare_offer_embedding_text function
CREATE OR REPLACE FUNCTION generate_jetshare_offer_embedding_text_with_nostr(
  offer_id uuid
) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  basic_text text;
  user_profile record;
  nostr_events text;
  nostr_zaps text;
BEGIN
  -- Get the basic offer text using the existing function
  SELECT generate_jetshare_offer_embedding_text(offer_id) INTO basic_text;
  
  -- Get user's Nostr profile info
  SELECT p.npub, p.nip05, p.lud16, p.nostr_pubkey
  INTO user_profile
  FROM jetshare_offers o
  JOIN profiles p ON o.user_id = p.id
  WHERE o.id = offer_id;
  
  -- Get any Nostr events related to this offer
  SELECT string_agg(
    'Event ID: ' || event_id || 
    ', Relay: ' || COALESCE(relay, 'Unknown') ||
    ', Created: ' || created_at::text,
    E'\n'
  )
  INTO nostr_events
  FROM nostr_offer_events
  WHERE offer_id = offer_id;
  
  -- Get any zaps related to this offer
  SELECT string_agg(
    'From: ' || from_npub || 
    ', To: ' || to_npub || 
    ', Amount: ' || amount_sats || ' sats' ||
    ', Comment: ' || COALESCE(comment, 'No comment'),
    E'\n'
  )
  INTO nostr_zaps
  FROM nostr_zaps
  WHERE offer_id = offer_id;
  
  -- Add Nostr information to the basic text
  RETURN concat_ws(E'\n\n',
    basic_text,
    CASE WHEN user_profile.npub IS NOT NULL OR user_profile.nip05 IS NOT NULL THEN
      concat_ws(E'\n',
        'Creator Nostr Profile:',
        CASE WHEN user_profile.npub IS NOT NULL THEN 'npub: ' || user_profile.npub ELSE '' END,
        CASE WHEN user_profile.nip05 IS NOT NULL THEN 'NIP-05: ' || user_profile.nip05 ELSE '' END,
        CASE WHEN user_profile.lud16 IS NOT NULL THEN 'Lightning Address: ' || user_profile.lud16 ELSE '' END
      )
    ELSE '' END,
    CASE WHEN nostr_events IS NOT NULL THEN
      concat_ws(E'\n',
        'Nostr Events:',
        nostr_events
      )
    ELSE '' END,
    CASE WHEN nostr_zaps IS NOT NULL THEN
      concat_ws(E'\n',
        'Nostr Zaps:',
        nostr_zaps
      )
    ELSE '' END
  );
END;
$$; 