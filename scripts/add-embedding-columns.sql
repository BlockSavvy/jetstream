-- Add embedding_updated_at column to tables that need it

-- flights table
ALTER TABLE flights 
ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- jets table
ALTER TABLE jets
ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- airports table
ALTER TABLE airports
ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- jetshare_offers table
ALTER TABLE jetshare_offers
ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create indexes on embedding_updated_at for better performance
CREATE INDEX IF NOT EXISTS idx_flights_embedding_updated_at ON flights(embedding_updated_at);
CREATE INDEX IF NOT EXISTS idx_jets_embedding_updated_at ON jets(embedding_updated_at);
CREATE INDEX IF NOT EXISTS idx_airports_embedding_updated_at ON airports(embedding_updated_at); 