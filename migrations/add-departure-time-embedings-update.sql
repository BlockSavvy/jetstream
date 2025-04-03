-- Migration to flag existing offers for re-embedding after adding departure_time field

-- Mark all existing offers as needing embedding regeneration
UPDATE jetshare_offers
SET 
  needs_embedding = TRUE, 
  embedding = NULL,
  last_embedded_at = NULL
WHERE
  departure_time IS NOT NULL;

-- Log information about how many offers will be re-embedded
DO $$
DECLARE
  total_count INT;
  null_time_count INT;
BEGIN
  SELECT COUNT(*) INTO total_count FROM jetshare_offers;
  SELECT COUNT(*) INTO null_time_count FROM jetshare_offers WHERE departure_time IS NULL;
  
  RAISE NOTICE 'Total JetShare offers: %', total_count;
  RAISE NOTICE 'Offers with NULL departure_time: %', null_time_count;
  RAISE NOTICE 'Offers flagged for re-embedding: %', total_count - null_time_count;
END $$;

-- Make sure departure_time is included in search results
DROP FUNCTION IF EXISTS match_jetshare_offers;
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
  departure_time timestamptz,
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
    jo.departure_time,
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

-- Ensure views are updated to include departure_time
DROP VIEW IF EXISTS active_jetshare_offers;
CREATE VIEW active_jetshare_offers AS
SELECT * FROM jetshare_offers
WHERE status = 'open'
AND flight_date > NOW();

DROP VIEW IF EXISTS historical_jetshare_offers;
CREATE VIEW historical_jetshare_offers AS
SELECT * FROM jetshare_offers
WHERE status IN ('completed', 'cancelled')
OR flight_date < NOW(); 