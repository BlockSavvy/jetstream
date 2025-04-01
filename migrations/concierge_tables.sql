-- Create conversations table for storing chat history
CREATE TABLE IF NOT EXISTS concierge_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
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

-- Create RLS policies for concierge_conversations
ALTER TABLE concierge_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own conversations"
  ON concierge_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own conversations"
  ON concierge_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON concierge_conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON concierge_conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for concierge_scheduled_tasks
ALTER TABLE concierge_scheduled_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own tasks"
  ON concierge_scheduled_tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own tasks"
  ON concierge_scheduled_tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON concierge_scheduled_tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON concierge_scheduled_tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can access all tasks (for processing scheduled events)
CREATE POLICY "Service role can access all tasks"
  ON concierge_scheduled_tasks
  FOR ALL
  TO service_role
  USING (true);

-- Add extended schema description
COMMENT ON TABLE concierge_conversations IS 'Stores AI concierge conversation history for users';
COMMENT ON TABLE concierge_scheduled_tasks IS 'Stores scheduled tasks and reminders created by the AI concierge'; 