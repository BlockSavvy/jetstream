-- Add missing columns to jets table
ALTER TABLE jets
ADD COLUMN IF NOT EXISTS cruise_speed_kts INTEGER,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create jet_interiors table if it doesn't exist
CREATE TABLE IF NOT EXISTS jet_interiors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jet_id UUID REFERENCES jets(id) ON DELETE CASCADE,
  interior_type TEXT,
  seats INTEGER,
  berths BOOLEAN,
  lavatory BOOLEAN,
  galley BOOLEAN,
  entertainment TEXT,
  wifi BOOLEAN,
  interior_image_url TEXT,
  notes TEXT,
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

DROP TRIGGER IF EXISTS update_jet_interiors_modtime ON jet_interiors;
CREATE TRIGGER update_jet_interiors_modtime
BEFORE UPDATE ON jet_interiors
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_jets_category ON jets(category);
CREATE INDEX IF NOT EXISTS idx_jets_manufacturer ON jets(manufacturer); 