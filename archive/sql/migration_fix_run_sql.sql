-- Create a function to execute SQL queries with safety restrictions
CREATE OR REPLACE FUNCTION run_sql(query text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Run with definer's permissions
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Add security checks to prevent destructive operations
  IF query ILIKE '%DROP%' OR query ILIKE '%DELETE%' OR query ILIKE '%TRUNCATE%' 
     OR query ILIKE '%ALTER%' OR query ILIKE '%UPDATE%' OR query ILIKE '%GRANT%' THEN
    RAISE EXCEPTION 'Operation not permitted via this interface';
  END IF;
  
  -- Execute the query and return results as JSON
  EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION run_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION run_sql(text) TO service_role; 