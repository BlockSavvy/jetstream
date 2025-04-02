-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns to relevant tables
ALTER TABLE airports ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE flights ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE jets ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create match_airports function
CREATE OR REPLACE FUNCTION match_airports(
  query_embedding vector,
  match_threshold float,
  match_count int
) RETURNS TABLE (
  id uuid,
  name text,
  code text,
  city text,
  country text,
  similarity float
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.code,
    a.city,
    a.country,
    1 - (a.embedding <=> query_embedding) AS similarity
  FROM airports a
  WHERE 1 - (a.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Create match_flights function
CREATE OR REPLACE FUNCTION match_flights(
  query_embedding vector,
  match_threshold float,
  match_count int
) RETURNS TABLE (
  id uuid,
  departure_location text,
  arrival_location text,
  flight_date timestamp,
  aircraft_model text,
  total_flight_cost numeric,
  available_seats int,
  similarity float
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.departure_location,
    f.arrival_location,
    f.flight_date,
    f.aircraft_model,
    f.total_flight_cost,
    f.available_seats,
    1 - (f.embedding <=> query_embedding) AS similarity
  FROM flights f
  WHERE 1 - (f.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Create match_jets function
CREATE OR REPLACE FUNCTION match_jets(
  query_embedding vector,
  match_threshold float,
  match_count int
) RETURNS TABLE (
  id uuid,
  model text,
  manufacturer text,
  range numeric,
  passenger_capacity int,
  cruise_speed numeric,
  similarity float
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.id,
    j.model,
    j.manufacturer,
    j.range,
    j.passenger_capacity,
    j.cruise_speed,
    1 - (j.embedding <=> query_embedding) AS similarity
  FROM jets j
  WHERE 1 - (j.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Create indexes for faster vector searches
CREATE INDEX IF NOT EXISTS airports_embedding_idx ON airports USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS flights_embedding_idx ON flights USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS jets_embedding_idx ON jets USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create a function to update airport embeddings (to be called from application code)
CREATE OR REPLACE FUNCTION update_airport_embedding(
  airport_id uuid,
  new_embedding vector
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE airports
  SET embedding = new_embedding
  WHERE id = airport_id;
END;
$$;

-- Create a function to update flight embeddings (to be called from application code)
CREATE OR REPLACE FUNCTION update_flight_embedding(
  flight_id uuid,
  new_embedding vector
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE flights
  SET embedding = new_embedding
  WHERE id = flight_id;
END;
$$;

-- Create a function to update jet embeddings (to be called from application code)
CREATE OR REPLACE FUNCTION update_jet_embedding(
  jet_id uuid,
  new_embedding vector
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE jets
  SET embedding = new_embedding
  WHERE id = jet_id;
END;
$$; 