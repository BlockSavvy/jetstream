-- Create an RPC function to run arbitrary SQL queries (with permissions restrictions)
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

-- Create an RPC function to get table row counts
CREATE OR REPLACE FUNCTION table_row_counts()
RETURNS TABLE (
  table_name text,
  row_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tables.table_name::text,
    (SELECT reltuples::bigint FROM pg_class WHERE oid = (tables.table_schema || '.' || tables.table_name)::regclass) AS row_count
  FROM information_schema.tables
  WHERE 
    table_schema = 'public'
    AND table_type = 'BASE TABLE'
  ORDER BY 
    table_name;
END;
$$;

-- Create an RPC function to get table columns (for database schema exploration)
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable boolean
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    columns.column_name::text,
    columns.data_type::text,
    columns.is_nullable::boolean
  FROM 
    information_schema.columns
  WHERE 
    columns.table_schema = 'public'
    AND columns.table_name = table_name
  ORDER BY 
    columns.ordinal_position;
END;
$$; 