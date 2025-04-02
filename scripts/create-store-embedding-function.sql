-- Create a SQL function to handle embedding storage with dimension adaptation
CREATE OR REPLACE FUNCTION public.store_embedding(
  p_table text,
  p_id text,
  p_embedding numeric[]
) RETURNS void AS $$
DECLARE
  expected_dimensions integer := 1536;
  actual_dimensions integer := array_length(p_embedding, 1);
  padded_embedding numeric[];
  sql_update text;
BEGIN
  -- Check dimensions
  IF actual_dimensions = expected_dimensions THEN
    -- If dimensions match, use the embedding as is
    padded_embedding := p_embedding;
  ELSE
    -- Otherwise pad with zeros or truncate
    -- First create an array of the expected size filled with zeros
    padded_embedding := array_fill(0::numeric, ARRAY[expected_dimensions]);
    
    -- Copy as many values as possible from the original embedding
    FOR i IN 1..LEAST(actual_dimensions, expected_dimensions) LOOP
      padded_embedding[i] := p_embedding[i];
    END LOOP;
  END IF;
  
  -- Construct and execute dynamic SQL to update the table
  sql_update := format('
    UPDATE %I 
    SET embedding = $1, embedding_updated_at = now() 
    WHERE id = $2
  ', p_table);
  
  EXECUTE sql_update USING padded_embedding, p_id;
END;
$$ LANGUAGE plpgsql;

-- Special function for airports table which uses 'code' as the primary key
CREATE OR REPLACE FUNCTION public.store_airport_embedding(
  p_code text,
  p_embedding numeric[]
) RETURNS void AS $$
DECLARE
  expected_dimensions integer := 1536;
  actual_dimensions integer := array_length(p_embedding, 1);
  padded_embedding numeric[];
BEGIN
  -- Check dimensions
  IF actual_dimensions = expected_dimensions THEN
    -- If dimensions match, use the embedding as is
    padded_embedding := p_embedding;
  ELSE
    -- Otherwise pad with zeros or truncate
    -- First create an array of the expected size filled with zeros
    padded_embedding := array_fill(0::numeric, ARRAY[expected_dimensions]);
    
    -- Copy as many values as possible from the original embedding
    FOR i IN 1..LEAST(actual_dimensions, expected_dimensions) LOOP
      padded_embedding[i] := p_embedding[i];
    END LOOP;
  END IF;
  
  -- Update the airports table
  UPDATE airports
  SET embedding = padded_embedding, embedding_updated_at = now()
  WHERE code = p_code;
END;
$$ LANGUAGE plpgsql;

-- Update the store_embedding function to handle the airports table special case
CREATE OR REPLACE FUNCTION public.store_embedding(
  p_table text,
  p_id text,
  p_embedding numeric[]
) RETURNS void AS $$
BEGIN
  -- Special handling for airports table which uses code instead of id
  IF p_table = 'airports' THEN
    PERFORM store_airport_embedding(p_id, p_embedding);
  ELSE
    -- Construct and execute dynamic SQL to update the table
    EXECUTE format('
      UPDATE %I 
      SET embedding = $1, embedding_updated_at = now() 
      WHERE id = $2
    ', p_table) USING p_embedding, p_id;
  END IF;
END;
$$ LANGUAGE plpgsql; 