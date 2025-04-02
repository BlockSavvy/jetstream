-- Create concierge_conversations table if it doesn't exist
CREATE TABLE IF NOT EXISTS concierge_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]'::JSONB,
  interaction_type TEXT NOT NULL DEFAULT 'text',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster lookup
CREATE INDEX IF NOT EXISTS concierge_conversations_user_id_idx 
ON concierge_conversations(user_id);

-- Create concierge_scheduled_tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS concierge_scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  task_details JSONB NOT NULL DEFAULT '{}'::JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS concierge_scheduled_tasks_user_id_idx 
ON concierge_scheduled_tasks(user_id);

CREATE INDEX IF NOT EXISTS concierge_scheduled_tasks_status_idx 
ON concierge_scheduled_tasks(status);

CREATE INDEX IF NOT EXISTS concierge_scheduled_tasks_scheduled_at_idx 
ON concierge_scheduled_tasks(scheduled_at);

-- Create amenity bookings table if it doesn't exist
CREATE TABLE IF NOT EXISTS concierge_amenity_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flight_id UUID NOT NULL,
  amenity_type TEXT NOT NULL,
  preferences TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster lookup
CREATE INDEX IF NOT EXISTS concierge_amenity_bookings_user_id_idx 
ON concierge_amenity_bookings(user_id);

CREATE INDEX IF NOT EXISTS concierge_amenity_bookings_flight_id_idx 
ON concierge_amenity_bookings(flight_id);

-- Create transportation bookings table if it doesn't exist
CREATE TABLE IF NOT EXISTS concierge_transportation_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  pickup_time TIMESTAMPTZ NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'sedan',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster lookup
CREATE INDEX IF NOT EXISTS concierge_transportation_bookings_user_id_idx 
ON concierge_transportation_bookings(user_id);

CREATE INDEX IF NOT EXISTS concierge_transportation_bookings_pickup_time_idx 
ON concierge_transportation_bookings(pickup_time);

-- Add RLS policies
ALTER TABLE concierge_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own conversations" ON concierge_conversations;
CREATE POLICY "Users can view own conversations"
  ON concierge_conversations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own conversations" ON concierge_conversations;
CREATE POLICY "Users can insert own conversations"
  ON concierge_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON concierge_conversations;
CREATE POLICY "Users can update own conversations"
  ON concierge_conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- Add RLS policies for tasks
ALTER TABLE concierge_scheduled_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tasks" ON concierge_scheduled_tasks;
CREATE POLICY "Users can view own tasks"
  ON concierge_scheduled_tasks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON concierge_scheduled_tasks;
CREATE POLICY "Users can insert own tasks"
  ON concierge_scheduled_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON concierge_scheduled_tasks;
CREATE POLICY "Users can update own tasks"
  ON concierge_scheduled_tasks FOR UPDATE
  USING (auth.uid() = user_id);

-- Add RLS policies for amenity bookings
ALTER TABLE concierge_amenity_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own amenity bookings" ON concierge_amenity_bookings;
CREATE POLICY "Users can view own amenity bookings"
  ON concierge_amenity_bookings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own amenity bookings" ON concierge_amenity_bookings;
CREATE POLICY "Users can insert own amenity bookings"
  ON concierge_amenity_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own amenity bookings" ON concierge_amenity_bookings;
CREATE POLICY "Users can update own amenity bookings"
  ON concierge_amenity_bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- Add RLS policies for transportation bookings
ALTER TABLE concierge_transportation_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transportation bookings" ON concierge_transportation_bookings;
CREATE POLICY "Users can view own transportation bookings"
  ON concierge_transportation_bookings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transportation bookings" ON concierge_transportation_bookings;
CREATE POLICY "Users can insert own transportation bookings"
  ON concierge_transportation_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own transportation bookings" ON concierge_transportation_bookings;
CREATE POLICY "Users can update own transportation bookings"
  ON concierge_transportation_bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create functions to create individual tables (can be called through RPC)
CREATE OR REPLACE FUNCTION create_concierge_conversations_table()
RETURNS VOID AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS concierge_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    messages JSONB NOT NULL DEFAULT '[]'::JSONB,
    interaction_type TEXT NOT NULL DEFAULT 'text',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_concierge_scheduled_tasks_table()
RETURNS VOID AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS concierge_scheduled_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    task_type TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    task_details JSONB NOT NULL DEFAULT '{}'::JSONB,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_concierge_amenity_bookings_table()
RETURNS VOID AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS concierge_amenity_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    flight_id UUID NOT NULL,
    amenity_type TEXT NOT NULL,
    preferences TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_concierge_transportation_bookings_table()
RETURNS VOID AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS concierge_transportation_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    pickup_location TEXT NOT NULL,
    dropoff_location TEXT NOT NULL,
    pickup_time TIMESTAMPTZ NOT NULL,
    vehicle_type TEXT NOT NULL DEFAULT 'sedan',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Master function to create all tables (can be called through RPC)
CREATE OR REPLACE FUNCTION create_concierge_tables()
RETURNS VOID AS $$
BEGIN
  PERFORM create_concierge_conversations_table();
  PERFORM create_concierge_scheduled_tasks_table();
  PERFORM create_concierge_amenity_bookings_table();
  PERFORM create_concierge_transportation_bookings_table();
END;
$$ LANGUAGE plpgsql; 