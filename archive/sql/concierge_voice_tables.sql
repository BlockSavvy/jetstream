-- Create conversations table for storing chat history
CREATE TABLE IF NOT EXISTS concierge_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  interaction_type TEXT NOT NULL DEFAULT 'text' CHECK (interaction_type IN ('text', 'voice', 'multimodal')),
  voice_session_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS concierge_conversations_user_id_idx ON concierge_conversations(user_id);

-- Create table for scheduled tasks and reminders
CREATE TABLE IF NOT EXISTS concierge_scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN ('offer_notification', 'reminder', 'schedule')),
  task_details JSONB NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for scheduled tasks
CREATE INDEX IF NOT EXISTS concierge_tasks_user_id_idx ON concierge_scheduled_tasks(user_id);
CREATE INDEX IF NOT EXISTS concierge_tasks_status_idx ON concierge_scheduled_tasks(status);
CREATE INDEX IF NOT EXISTS concierge_tasks_scheduled_at_idx ON concierge_scheduled_tasks(scheduled_at);

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

-- Add foreign key from conversations to voice sessions (after both tables exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'concierge_conversations_voice_session_id_fkey'
  ) THEN
    ALTER TABLE concierge_conversations 
    ADD CONSTRAINT concierge_conversations_voice_session_id_fkey 
    FOREIGN KEY (voice_session_id) REFERENCES concierge_voice_sessions(id) ON DELETE SET NULL;
  END IF;
END $$;

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

-- Create RLS policies for concierge_conversations
ALTER TABLE concierge_conversations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'concierge_conversations' AND policyname = 'Users can create their own conversations'
  ) THEN
    CREATE POLICY "Users can create their own conversations"
      ON concierge_conversations FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'concierge_conversations' AND policyname = 'Users can view their own conversations'
  ) THEN
    CREATE POLICY "Users can view their own conversations"
      ON concierge_conversations FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'concierge_conversations' AND policyname = 'Users can update their own conversations'
  ) THEN
    CREATE POLICY "Users can update their own conversations"
      ON concierge_conversations FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'concierge_conversations' AND policyname = 'Users can delete their own conversations'
  ) THEN
    CREATE POLICY "Users can delete their own conversations"
      ON concierge_conversations FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create RLS policies for concierge_scheduled_tasks
ALTER TABLE concierge_scheduled_tasks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'concierge_scheduled_tasks' AND policyname = 'Users can create their own tasks'
  ) THEN
    CREATE POLICY "Users can create their own tasks"
      ON concierge_scheduled_tasks FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'concierge_scheduled_tasks' AND policyname = 'Users can view their own tasks'
  ) THEN
    CREATE POLICY "Users can view their own tasks"
      ON concierge_scheduled_tasks FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'concierge_scheduled_tasks' AND policyname = 'Users can update their own tasks'
  ) THEN
    CREATE POLICY "Users can update their own tasks"
      ON concierge_scheduled_tasks FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'concierge_scheduled_tasks' AND policyname = 'Users can delete their own tasks'
  ) THEN
    CREATE POLICY "Users can delete their own tasks"
      ON concierge_scheduled_tasks FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create RLS policies for voice sessions
ALTER TABLE concierge_voice_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'concierge_voice_sessions' AND policyname = 'Users can create their own voice sessions'
  ) THEN
    CREATE POLICY "Users can create their own voice sessions"
      ON concierge_voice_sessions FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'concierge_voice_sessions' AND policyname = 'Users can view their own voice sessions'
  ) THEN
    CREATE POLICY "Users can view their own voice sessions"
      ON concierge_voice_sessions FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'concierge_voice_sessions' AND policyname = 'Users can update their own voice sessions'
  ) THEN
    CREATE POLICY "Users can update their own voice sessions"
      ON concierge_voice_sessions FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'concierge_voice_sessions' AND policyname = 'Users can delete their own voice sessions'
  ) THEN
    CREATE POLICY "Users can delete their own voice sessions"
      ON concierge_voice_sessions FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create RLS policies for function calls
ALTER TABLE concierge_function_calls ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'concierge_function_calls' AND policyname = 'Users can create their own function calls'
  ) THEN
    CREATE POLICY "Users can create their own function calls"
      ON concierge_function_calls FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'concierge_function_calls' AND policyname = 'Users can view their own function calls'
  ) THEN
    CREATE POLICY "Users can view their own function calls"
      ON concierge_function_calls FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'concierge_function_calls' AND policyname = 'Users can update their own function calls'
  ) THEN
    CREATE POLICY "Users can update their own function calls"
      ON concierge_function_calls FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'concierge_function_calls' AND policyname = 'Users can delete their own function calls'
  ) THEN
    CREATE POLICY "Users can delete their own function calls"
      ON concierge_function_calls FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Service role can access all tables for processing events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'concierge_voice_sessions' AND policyname = 'Service role can access all voice sessions'
  ) THEN
    CREATE POLICY "Service role can access all voice sessions"
      ON concierge_voice_sessions
      FOR ALL
      TO service_role
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'concierge_function_calls' AND policyname = 'Service role can access all function calls'
  ) THEN
    CREATE POLICY "Service role can access all function calls"
      ON concierge_function_calls
      FOR ALL
      TO service_role
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'concierge_scheduled_tasks' AND policyname = 'Service role can access all tasks'
  ) THEN
    CREATE POLICY "Service role can access all tasks"
      ON concierge_scheduled_tasks
      FOR ALL
      TO service_role
      USING (true);
  END IF;
END $$;

-- Add extended schema description
COMMENT ON TABLE concierge_conversations IS 'Stores AI concierge conversation history for users';
COMMENT ON TABLE concierge_scheduled_tasks IS 'Stores scheduled tasks and reminders created by the AI concierge';
COMMENT ON TABLE concierge_voice_sessions IS 'Stores voice interaction sessions for the AI concierge';
COMMENT ON TABLE concierge_function_calls IS 'Stores function call requests and results from the AI concierge';
COMMENT ON COLUMN concierge_conversations.interaction_type IS 'Type of interaction: text, voice, or multimodal';
COMMENT ON COLUMN concierge_conversations.voice_session_id IS 'Reference to the voice session if this conversation involved voice'; 