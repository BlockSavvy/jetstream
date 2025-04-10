-- Migration to create embedding_logs table
CREATE TABLE IF NOT EXISTS public.embedding_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  object_type TEXT NOT NULL,
  object_id TEXT NOT NULL,
  status TEXT NOT NULL,
  error TEXT,
  processing_time FLOAT,
  token_count INTEGER,
  embedding_model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries by object_type and status
CREATE INDEX IF NOT EXISTS embedding_logs_object_type_idx ON public.embedding_logs (object_type);
CREATE INDEX IF NOT EXISTS embedding_logs_status_idx ON public.embedding_logs (status);
CREATE INDEX IF NOT EXISTS embedding_logs_timestamp_idx ON public.embedding_logs (timestamp);

-- Add comment to the table
COMMENT ON TABLE public.embedding_logs IS 'Logs for embedding generation operations';
