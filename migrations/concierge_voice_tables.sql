-- Create voice sessions table for storing voice interaction data
CREATE TABLE IF NOT EXISTS concierge_voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  audio_duration_seconds NUMERIC(10, 2),
  transcription TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS concierge_voice_sessions_user_id_idx ON concierge_voice_sessions(user_id);

-- Add interaction_type column to concierge_conversations to track voice vs text
ALTER TABLE IF EXISTS concierge_conversations 
ADD COLUMN IF NOT EXISTS interaction_type TEXT NOT NULL DEFAULT 'text' 
CHECK (interaction_type IN ('text', 'voice', 'multimodal'));

-- Add voice_session_id to link conversations with voice sessions
ALTER TABLE IF EXISTS concierge_conversations 
ADD COLUMN IF NOT EXISTS voice_session_id UUID REFERENCES concierge_voice_sessions(id);

-- Create tables for function calling capabilities
CREATE TABLE IF NOT EXISTS concierge_function_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES concierge_conversations(id),
  function_name TEXT NOT NULL,
  function_parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  function_result JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Add indexes for function calls
CREATE INDEX IF NOT EXISTS concierge_function_calls_user_id_idx ON concierge_function_calls(user_id);
CREATE INDEX IF NOT EXISTS concierge_function_calls_conversation_id_idx ON concierge_function_calls(conversation_id);
CREATE INDEX IF NOT EXISTS concierge_function_calls_status_idx ON concierge_function_calls(status);

-- Create RLS policies for voice sessions
ALTER TABLE concierge_voice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own voice sessions"
  ON concierge_voice_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own voice sessions"
  ON concierge_voice_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice sessions"
  ON concierge_voice_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice sessions"
  ON concierge_voice_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for function calls
ALTER TABLE concierge_function_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own function calls"
  ON concierge_function_calls FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own function calls"
  ON concierge_function_calls FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own function calls"
  ON concierge_function_calls FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own function calls"
  ON concierge_function_calls FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can access all tables for processing events
CREATE POLICY "Service role can access all voice sessions"
  ON concierge_voice_sessions
  FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role can access all function calls"
  ON concierge_function_calls
  FOR ALL
  TO service_role
  USING (true);

-- Add extended schema description
COMMENT ON TABLE concierge_voice_sessions IS 'Stores voice interaction sessions for the AI concierge';
COMMENT ON TABLE concierge_function_calls IS 'Stores function call requests and results from the AI concierge';
COMMENT ON COLUMN concierge_conversations.interaction_type IS 'Type of interaction: text, voice, or multimodal';
COMMENT ON COLUMN concierge_conversations.voice_session_id IS 'Reference to the voice session if this conversation involved voice'; 