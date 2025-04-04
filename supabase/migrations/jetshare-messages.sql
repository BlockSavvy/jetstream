-- Create the messages table for JetShare
CREATE TABLE IF NOT EXISTS public.jetshare_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add RLS policies
ALTER TABLE public.jetshare_messages ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see their own messages (sent or received)
CREATE POLICY "Users can see their own messages" 
  ON public.jetshare_messages 
  FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Policy to allow users to create their own messages
CREATE POLICY "Users can create their own messages" 
  ON public.jetshare_messages 
  FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

-- Policy to allow users to mark messages they received as read
CREATE POLICY "Users can mark received messages as read" 
  ON public.jetshare_messages 
  FOR UPDATE 
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id AND NEW.read = true);

-- Drop any existing views to avoid conflicts
DROP VIEW IF EXISTS public.jetshare_message_sender_profiles;
DROP VIEW IF EXISTS public.jetshare_message_recipient_profiles;

-- Create views for sender and recipient profiles to fix messages query
CREATE OR REPLACE VIEW public.jetshare_message_sender_profiles AS
SELECT 
  users.id,
  profiles.first_name,
  profiles.last_name,
  profiles.avatar_url
FROM auth.users
LEFT JOIN public.profiles ON users.id = profiles.id;

CREATE OR REPLACE VIEW public.jetshare_message_recipient_profiles AS
SELECT 
  users.id,
  profiles.first_name,
  profiles.last_name,
  profiles.avatar_url
FROM auth.users
LEFT JOIN public.profiles ON users.id = profiles.id;

-- Grant access to the views
GRANT SELECT ON public.jetshare_message_sender_profiles TO authenticated;
GRANT SELECT ON public.jetshare_message_recipient_profiles TO authenticated;

-- Add index for faster lookups on common queries  
CREATE INDEX IF NOT EXISTS idx_jetshare_messages_sender_id ON public.jetshare_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_jetshare_messages_recipient_id ON public.jetshare_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_jetshare_messages_created_at ON public.jetshare_messages(created_at);

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.jetshare_messages TO authenticated; 