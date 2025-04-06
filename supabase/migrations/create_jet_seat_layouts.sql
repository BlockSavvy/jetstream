-- Create jet_seat_layouts table for storing custom seat layouts
CREATE TABLE IF NOT EXISTS public.jet_seat_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jet_id UUID REFERENCES jets(id) ON DELETE CASCADE,
  layout JSONB NOT NULL, -- Store layout as JSON (rows, seats per row, skip positions)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add triggers for updated_at if not already existing
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for jet_seat_layouts
DROP TRIGGER IF EXISTS update_jet_seat_layouts_modtime ON jet_seat_layouts;
CREATE TRIGGER update_jet_seat_layouts_modtime
BEFORE UPDATE ON jet_seat_layouts
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_jet_seat_layouts_jet_id ON jet_seat_layouts(jet_id);

-- Enable RLS
ALTER TABLE public.jet_seat_layouts ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jet_seat_layouts TO authenticated;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated full access" 
  ON public.jet_seat_layouts 
  FOR ALL 
  TO authenticated 
  USING (true);

-- Comment on table
COMMENT ON TABLE public.jet_seat_layouts IS 'Custom seat layouts for jets for use with JetSeatVisualizer'; 