-- JetShare Offer Helper Functions
-- This file contains helper functions for the embedding system

-- Function to generate text for a JetShare offer
CREATE OR REPLACE FUNCTION generate_jetshare_offer_embedding_text(
  offer_id uuid
) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  offer_record jetshare_offers%ROWTYPE;
BEGIN
  -- Get the offer record
  SELECT * INTO offer_record FROM jetshare_offers WHERE id = offer_id;
  
  -- Generate formatted text for embedding
  RETURN concat_ws(E'\n',
    'JetShare Offer Information:',
    'ID: ' || offer_record.id,
    'Status: ' || offer_record.status,
    'From: ' || offer_record.departure_location,
    'To: ' || offer_record.arrival_location,
    'Date: ' || offer_record.flight_date::text,
    'Time: ' || offer_record.departure_time::text,
    'Aircraft: ' || COALESCE(offer_record.aircraft_model, 'Not specified'),
    'Total Cost: $' || offer_record.total_flight_cost::text,
    'Available Seats: ' || offer_record.available_seats::text || ' of ' || offer_record.total_seats::text,
    'Cost Per Seat: $' || offer_record.requested_share_amount::text,
    'Created: ' || offer_record.created_at::text
  );
END;
$$;

-- Function to mark a JetShare offer as embedded
CREATE OR REPLACE FUNCTION mark_jetshare_offer_as_embedded(
  offer_id uuid
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE jetshare_offers
  SET 
    embedding_updated_at = NOW()
  WHERE id = offer_id;
END;
$$;

-- Function to get batch of offers needing embedding
CREATE OR REPLACE FUNCTION get_jetshare_offers_needing_embedding(
  limit_param int DEFAULT 50
) RETURNS TABLE (
  id uuid
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT jo.id
  FROM jetshare_offers jo
  WHERE jo.embedding IS NULL OR jo.embedding_updated_at IS NULL
  ORDER BY
    -- Prioritize open offers
    CASE WHEN jo.status = 'open' THEN 0 ELSE 1 END,
    -- Prioritize newer offers
    jo.created_at DESC
  LIMIT limit_param;
END;
$$; 