-- SQL functions for JetShare database diagnostics and maintenance
-- Run this in the Supabase SQL Editor

-- Function to get table information
CREATE OR REPLACE FUNCTION get_table_info(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable boolean,
  column_default text,
  constraint_name text,
  constraint_type text,
  foreign_key_table text,
  foreign_key_column text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::text,
    c.data_type::text,
    c.is_nullable = 'YES' as is_nullable,
    c.column_default::text,
    tc.constraint_name::text,
    tc.constraint_type::text,
    ccu.table_name::text as foreign_key_table,
    ccu.column_name::text as foreign_key_column
  FROM 
    information_schema.columns c
  LEFT JOIN 
    information_schema.key_column_usage kcu
    ON c.column_name = kcu.column_name
    AND c.table_name = kcu.table_name
    AND c.table_schema = kcu.table_schema
  LEFT JOIN 
    information_schema.table_constraints tc
    ON kcu.constraint_name = tc.constraint_name
    AND kcu.table_schema = tc.table_schema
  LEFT JOIN 
    information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
    AND tc.table_schema = ccu.table_schema
  WHERE 
    c.table_name = table_name
    AND c.table_schema = 'public';
END;
$$;

-- Function to remove orphaned offers (offers with user_id not in profiles)
CREATE OR REPLACE FUNCTION remove_orphaned_offers()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  removed_count INTEGER;
  orphaned_offers json;
BEGIN
  -- First, get the orphaned offers for reporting
  SELECT json_agg(o.*)
  INTO orphaned_offers
  FROM jetshare_offers o
  LEFT JOIN profiles p ON o.user_id = p.id
  WHERE p.id IS NULL;
  
  -- Then remove them
  WITH deleted AS (
    DELETE FROM jetshare_offers o
    USING (
      SELECT o.id
      FROM jetshare_offers o
      LEFT JOIN profiles p ON o.user_id = p.id
      WHERE p.id IS NULL
    ) as orphaned
    WHERE o.id = orphaned.id
    RETURNING o.*
  )
  SELECT count(*) INTO removed_count FROM deleted;
  
  RETURN json_build_object(
    'removed_count', removed_count,
    'orphaned_offers', orphaned_offers
  );
END;
$$;

-- Function to find users with offers but no profiles
CREATE OR REPLACE FUNCTION find_users_without_profiles()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  users_without_profiles json;
BEGIN
  -- Find users with offers but no profiles
  SELECT json_agg(distinct o.user_id)
  INTO users_without_profiles
  FROM jetshare_offers o
  LEFT JOIN profiles p ON o.user_id = p.id
  WHERE p.id IS NULL;
  
  RETURN json_build_object(
    'users_without_profiles', users_without_profiles
  );
END;
$$;

-- Function to run SQL queries (admin only)
-- Note: This requires the dblink extension to be enabled in Supabase
CREATE OR REPLACE FUNCTION run_sql_query(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT json_agg(t) FROM (SELECT * FROM dblink('dbname=' || current_database(), query) AS t) AS t);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Create a view for checking foreign key relationships
CREATE OR REPLACE VIEW jetshare_diagnostics AS
SELECT 
  'orphaned_offers' as issue_type,
  o.id as offer_id,
  o.user_id,
  o.departure_location,
  o.arrival_location,
  o.flight_date,
  o.status
FROM 
  jetshare_offers o
LEFT JOIN 
  profiles p ON o.user_id = p.id
WHERE 
  p.id IS NULL;

-- Grant permissions for the anon role to execute these functions
GRANT EXECUTE ON FUNCTION get_table_info(text) TO anon;
GRANT EXECUTE ON FUNCTION remove_orphaned_offers() TO anon;
GRANT EXECUTE ON FUNCTION find_users_without_profiles() TO anon;
GRANT SELECT ON jetshare_diagnostics TO anon; 