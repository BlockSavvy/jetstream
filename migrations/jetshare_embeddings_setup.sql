-- JetShare Embeddings System: Production Setup
-- This migration adds vector search capabilities to jetshare_offers and
-- implements automatic embedding generation through database triggers

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to jetshare_offers table if it doesn't exist
ALTER TABLE jetshare_offers ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Add last_embedded_at timestamp column to track when embeddings were last updated
ALTER TABLE jetshare_offers ADD COLUMN IF NOT EXISTS last_embedded_at timestamptz;

-- Add needs_embedding flag column to mark records for embedding update
ALTER TABLE jetshare_offers ADD COLUMN IF NOT EXISTS needs_embedding boolean DEFAULT true;

-- Create embedding search function for jetshare_offers
CREATE OR REPLACE FUNCTION match_jetshare_offers(
  query_embedding vector,
  match_threshold float,
  match_count int,
  status_filter text DEFAULT NULL
) RETURNS TABLE (
  id uuid,
  user_id uuid,
  departure_location text,
  arrival_location text,
  flight_date timestamptz,
  aircraft_model text,
  total_flight_cost numeric,
  available_seats int,
  status text,
  created_at timestamptz,
  similarity float
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    jo.id,
    jo.user_id,
    jo.departure_location,
    jo.arrival_location,
    jo.flight_date,
    jo.aircraft_model,
    jo.total_flight_cost,
    jo.available_seats,
    jo.status,
    jo.created_at,
    1 - (jo.embedding <=> query_embedding) AS similarity
  FROM jetshare_offers jo
  WHERE 
    1 - (jo.embedding <=> query_embedding) > match_threshold
    AND (status_filter IS NULL OR jo.status = status_filter)
  ORDER BY 
    -- First sort by status (open first)
    CASE WHEN jo.status = 'open' THEN 0 ELSE 1 END,
    -- Then by similarity
    similarity DESC,
    -- Then by most recent
    jo.created_at DESC
  LIMIT match_count;
END;
$$;

-- Create function to create/update embedding text for a jetshare offer
-- This function formats the offer data into a text representation for embedding
CREATE OR REPLACE FUNCTION generate_jetshare_offer_embedding_text(
  offer_id uuid
) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  offer_text text;
  offer_record jetshare_offers%ROWTYPE;
BEGIN
  -- Get the offer record
  SELECT * INTO offer_record FROM jetshare_offers WHERE id = offer_id;
  
  -- Generate formatted text for embedding
  offer_text := concat_ws(E'\n',
    'JetShare Offer:',
    'From: ' || offer_record.departure_location,
    'To: ' || offer_record.arrival_location,
    'Date: ' || offer_record.flight_date::text,
    'Aircraft: ' || offer_record.aircraft_model,
    'Total Cost: $' || offer_record.total_flight_cost::text,
    'Available Seats: ' || offer_record.available_seats::text,
    'Status: ' || offer_record.status,
    'Created: ' || offer_record.created_at::text
  );
  
  RETURN offer_text;
END;
$$;

-- Create a trigger function to mark records as needing embedding
CREATE OR REPLACE FUNCTION flag_jetshare_offer_for_embedding()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark the record as needing embedding
  NEW.needs_embedding = TRUE;
  
  -- Clear the existing embedding when relevant fields change
  IF TG_OP = 'UPDATE' THEN
    IF (
      NEW.departure_location != OLD.departure_location OR
      NEW.arrival_location != OLD.arrival_location OR
      NEW.flight_date != OLD.flight_date OR
      NEW.aircraft_model != OLD.aircraft_model OR
      NEW.total_flight_cost != OLD.total_flight_cost OR
      NEW.available_seats != OLD.available_seats OR
      NEW.status != OLD.status
    ) THEN
      NEW.embedding = NULL;
      NEW.last_embedded_at = NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically flag records for embedding
CREATE TRIGGER trigger_flag_jetshare_offer_for_embedding
BEFORE INSERT OR UPDATE ON jetshare_offers
FOR EACH ROW
EXECUTE FUNCTION flag_jetshare_offer_for_embedding();

-- Create index for faster vector searches
CREATE INDEX IF NOT EXISTS idx_jetshare_offers_embedding 
ON jetshare_offers 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Create index for efficient status-based filtering
CREATE INDEX IF NOT EXISTS idx_jetshare_offers_status 
ON jetshare_offers(status);

-- Create index for efficient embedding update batch processing
CREATE INDEX IF NOT EXISTS idx_jetshare_offers_needs_embedding 
ON jetshare_offers(needs_embedding) 
WHERE needs_embedding = TRUE;

-- Create a view for active (open) jetshare offers
CREATE OR REPLACE VIEW active_jetshare_offers AS
SELECT * FROM jetshare_offers
WHERE status = 'open'
AND flight_date > NOW();

-- Create a view for historical (completed) jetshare offers
CREATE OR REPLACE VIEW historical_jetshare_offers AS
SELECT * FROM jetshare_offers
WHERE status IN ('completed', 'cancelled')
OR flight_date < NOW();

-- Create a function to prioritize offers in search results
CREATE OR REPLACE FUNCTION search_jetshare_offers(
  search_query text,
  limit_count int DEFAULT 10,
  include_historical boolean DEFAULT false
) RETURNS TABLE (
  id uuid,
  user_id uuid,
  departure_location text,
  arrival_location text,
  flight_date timestamptz,
  aircraft_model text,
  total_flight_cost numeric,
  available_seats int,
  status text,
  search_rank float
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    jo.id,
    jo.user_id,
    jo.departure_location,
    jo.arrival_location,
    jo.flight_date,
    jo.aircraft_model,
    jo.total_flight_cost,
    jo.available_seats,
    jo.status,
    ts_rank(
      to_tsvector('english', 
        jo.departure_location || ' ' || 
        jo.arrival_location || ' ' || 
        jo.aircraft_model
      ),
      to_tsquery('english', search_query)
    ) AS search_rank
  FROM 
    jetshare_offers jo
  WHERE 
    -- Status filter
    (jo.status = 'open' OR (include_historical AND jo.status IN ('completed', 'cancelled')))
    -- Text search match
    AND (
      to_tsvector('english', 
        jo.departure_location || ' ' || 
        jo.arrival_location || ' ' || 
        jo.aircraft_model
      ) @@ to_tsquery('english', search_query)
      -- Or direct matches on locations
      OR jo.departure_location ILIKE '%' || search_query || '%'
      OR jo.arrival_location ILIKE '%' || search_query || '%'
    )
  ORDER BY
    -- Active offers first
    CASE WHEN jo.status = 'open' THEN 0 ELSE 1 END,
    -- Future flights before past flights
    CASE WHEN jo.flight_date > NOW() THEN 0 ELSE 1 END,
    -- Then by search rank
    search_rank DESC,
    -- Then by date (sooner = higher priority)
    CASE WHEN jo.flight_date > NOW() THEN jo.flight_date END ASC,
    -- For historical offers, most recent first
    CASE WHEN jo.flight_date <= NOW() THEN jo.flight_date END DESC
  LIMIT limit_count;
END;
$$;

-- Function to get batch of records needing embedding updates
CREATE OR REPLACE FUNCTION get_jetshare_offers_needing_embedding(
  batch_size int DEFAULT 50
) RETURNS TABLE (
  id uuid
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT jo.id
  FROM jetshare_offers jo
  WHERE jo.needs_embedding = TRUE
  ORDER BY
    -- Prioritize open offers
    CASE WHEN jo.status = 'open' THEN 0 ELSE 1 END,
    -- Prioritize newer offers
    jo.created_at DESC
  LIMIT batch_size;
END;
$$;

-- Function to mark a record as embedded
CREATE OR REPLACE FUNCTION mark_jetshare_offer_as_embedded(
  offer_id uuid
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE jetshare_offers
  SET 
    needs_embedding = FALSE,
    last_embedded_at = NOW()
  WHERE id = offer_id;
END;
$$;

-- Add intelligent archiving of old completed offers (optional)
-- This will convert rarely accessed historical offers to a compressed text representation
-- rather than keeping the full vector embedding, saving storage
CREATE OR REPLACE FUNCTION archive_old_jetshare_offers(
  days_threshold int DEFAULT 90
) RETURNS int LANGUAGE plpgsql AS $$
DECLARE
  archived_count int;
BEGIN
  -- Archive old completed/cancelled offers
  WITH archived AS (
    UPDATE jetshare_offers
    SET 
      embedding = NULL,
      needs_embedding = FALSE
    WHERE 
      status IN ('completed', 'cancelled')
      AND flight_date < (NOW() - (days_threshold || ' days')::interval)
      AND embedding IS NOT NULL
    RETURNING id
  )
  SELECT COUNT(*) INTO archived_count FROM archived;
  
  RETURN archived_count;
END;
$$; 