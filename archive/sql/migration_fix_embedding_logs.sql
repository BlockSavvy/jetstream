-- Migration to fix embedding_logs table
-- First drop the table if it exists (since it has incorrect schema)
DROP TABLE IF EXISTS public.embedding_logs;

-- Create the table with the correct schema
CREATE TABLE IF NOT EXISTS public.embedding_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  provider VARCHAR NOT NULL,
  input_type VARCHAR,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  character_count INTEGER,
  processing_time_ms INTEGER,
  endpoint VARCHAR,
  object_type VARCHAR,
  object_id VARCHAR
);

-- Create indexes for faster querying
CREATE INDEX embedding_logs_provider_idx ON public.embedding_logs(provider);
CREATE INDEX embedding_logs_timestamp_idx ON public.embedding_logs(timestamp);
CREATE INDEX embedding_logs_success_idx ON public.embedding_logs(success);

-- Add comment to the table
COMMENT ON TABLE public.embedding_logs IS 'Logs for embedding generation operations';

-- Create a helper function to get table columns (for schema migrations/compatibility)
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable boolean
)
LANGUAGE sql
SECURITY DEFINER 
AS $$
  SELECT 
    column_name::text,
    data_type::text,
    (is_nullable = 'YES') as is_nullable
  FROM 
    information_schema.columns
  WHERE 
    table_schema = 'public' 
    AND table_name = $1
  ORDER BY 
    ordinal_position;
$$;
