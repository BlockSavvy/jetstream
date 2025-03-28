-- Add new columns to jetshare_offers table
ALTER TABLE "jetshare_offers"
ADD COLUMN IF NOT EXISTS "aircraft_model" TEXT NOT NULL DEFAULT 'Gulfstream G650',
ADD COLUMN IF NOT EXISTS "total_seats" INTEGER NOT NULL DEFAULT 8,
ADD COLUMN IF NOT EXISTS "available_seats" INTEGER NOT NULL DEFAULT 4;

-- Add check constraints
ALTER TABLE "jetshare_offers"
ADD CONSTRAINT "total_seats_positive" CHECK (total_seats > 0),
ADD CONSTRAINT "available_seats_positive" CHECK (available_seats > 0),
ADD CONSTRAINT "available_seats_not_exceed_total" CHECK (available_seats <= total_seats);

-- Update existing rows with default values
UPDATE "jetshare_offers"
SET 
  aircraft_model = 'Gulfstream G650',
  total_seats = 8,
  available_seats = 4
WHERE aircraft_model IS NULL; 