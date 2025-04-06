-- Create an enum type for simulation types
CREATE TYPE sim_type AS ENUM ('jetshare', 'pulse', 'marketplace');

-- Create simulation_logs table
CREATE TABLE IF NOT EXISTS simulation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sim_type sim_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  virtual_users INTEGER NOT NULL,
  ai_matching_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  input_parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  results_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  agent_instruction_summary TEXT,
  triggered_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for efficient querying
CREATE INDEX idx_simulation_logs_created_at ON simulation_logs(created_at DESC);
CREATE INDEX idx_simulation_logs_sim_type ON simulation_logs(sim_type);
CREATE INDEX idx_simulation_logs_user_id ON simulation_logs(triggered_by_user_id);

-- Set up Row Level Security policies
ALTER TABLE simulation_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users with admin access can read simulation logs
CREATE POLICY "admins_read_simulation_logs"
ON simulation_logs
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin' OR role = 'super_admin'
  )
);

-- Policy: Only authenticated users with admin access can insert simulation logs
CREATE POLICY "admins_insert_simulation_logs"
ON simulation_logs
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin' OR role = 'super_admin'
  )
); 