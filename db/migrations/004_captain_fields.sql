-- Add captain-specific columns to pilots_crews table
ALTER TABLE pilots_crews 
  ADD COLUMN IF NOT EXISTS is_captain BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dedicated_jet_owner_id TEXT,
  ADD COLUMN IF NOT EXISTS years_of_experience INTEGER,
  ADD COLUMN IF NOT EXISTS availability TEXT[];

-- Create index on is_captain for faster filtering
CREATE INDEX IF NOT EXISTS idx_pilots_crews_is_captain ON pilots_crews (is_captain);

-- Create index on years_of_experience for faster filtering
CREATE INDEX IF NOT EXISTS idx_pilots_crews_years_experience ON pilots_crews (years_of_experience);

-- Create index on dedicated_jet_owner_id for faster lookup
CREATE INDEX IF NOT EXISTS idx_pilots_crews_jet_owner ON pilots_crews (dedicated_jet_owner_id); 