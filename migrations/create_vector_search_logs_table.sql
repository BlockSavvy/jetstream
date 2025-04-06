-- This migration creates the vector_search_logs table to track all vector search operations
-- This helps build an audit trail and can be used for analytics to improve search

-- Create the table
CREATE TABLE IF NOT EXISTS vector_search_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_text TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  object_type TEXT NOT NULL, -- 'jetshare_offer', 'flight', 'crew', 'user', 'simulation', 'all'
  results_count INTEGER NOT NULL DEFAULT 0,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes to optimize queries
CREATE INDEX IF NOT EXISTS idx_vector_search_logs_user_id ON vector_search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_vector_search_logs_object_type ON vector_search_logs(object_type);
CREATE INDEX IF NOT EXISTS idx_vector_search_logs_timestamp ON vector_search_logs(timestamp);

-- Add row-level security (RLS) policies
ALTER TABLE vector_search_logs ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users to see only their own logs
CREATE POLICY "Users can view their own search logs"
  ON vector_search_logs
  FOR SELECT
  USING (auth.uid() = user_id);
  
-- Grant full access to service role
CREATE POLICY "Service role has full access to all search logs"
  ON vector_search_logs
  FOR ALL
  USING (auth.role() = 'service_role');
  
-- Grant users ability to create logs
CREATE POLICY "Users can create their own search logs"
  ON vector_search_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  
-- Allow admins to see all logs
CREATE POLICY "Admins can view all search logs"
  ON vector_search_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Comment on table and columns for better documentation
COMMENT ON TABLE vector_search_logs IS 'Tracks all vector search operations for audit and analytics';
COMMENT ON COLUMN vector_search_logs.query_text IS 'The text query used for the vector search';
COMMENT ON COLUMN vector_search_logs.user_id IS 'The user who performed the search';
COMMENT ON COLUMN vector_search_logs.object_type IS 'The type of object searched for (e.g., jetshare_offer, flight)';
COMMENT ON COLUMN vector_search_logs.results_count IS 'Number of results returned from the search';
COMMENT ON COLUMN vector_search_logs.timestamp IS 'When the search was performed'; 