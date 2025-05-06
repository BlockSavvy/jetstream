-- Add metadata JSONB column to jetshare_offers table
-- This provides a flexible storage for additional data without requiring schema changes

-- First, check if the column already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'jetshare_offers' 
    AND column_name = 'metadata'
  ) THEN
    -- Add the metadata column if it doesn't exist
    ALTER TABLE public.jetshare_offers 
    ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    
    -- Add a comment to the column
    COMMENT ON COLUMN public.jetshare_offers.metadata IS 'Flexible JSON storage for additional offer data and payment information';
    
    -- Create an index on the metadata column for better query performance
    CREATE INDEX idx_jetshare_offers_metadata ON public.jetshare_offers USING GIN (metadata);
    
    RAISE NOTICE 'Added metadata column to jetshare_offers table';
  ELSE
    RAISE NOTICE 'metadata column already exists in jetshare_offers table';
  END IF;
END $$; 