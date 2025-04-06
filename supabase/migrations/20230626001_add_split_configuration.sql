-- Add split_configuration column to jetshare_offers table
ALTER TABLE IF EXISTS jetshare_offers
ADD COLUMN IF NOT EXISTS split_configuration JSONB;

-- Add comment to the column
COMMENT ON COLUMN jetshare_offers.split_configuration IS 'JSON structure storing the seat split configuration data for the jet'; 