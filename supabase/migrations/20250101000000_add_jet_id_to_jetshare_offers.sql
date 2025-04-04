-- Add jet_id column to jetshare_offers table
ALTER TABLE jetshare_offers ADD COLUMN IF NOT EXISTS jet_id UUID REFERENCES jets(id);

-- Create an index for the jet_id column to improve query performance
CREATE INDEX IF NOT EXISTS idx_jetshare_offers_jet_id ON jetshare_offers(jet_id);

-- Fix any null values in the jet_id column by inferring from aircraft_model where possible
-- This is a best-effort approach for existing data
DO $$
DECLARE
    offer_record RECORD;
    matching_jet UUID;
BEGIN
    FOR offer_record IN 
        SELECT id, aircraft_model FROM jetshare_offers 
        WHERE jet_id IS NULL AND aircraft_model IS NOT NULL
    LOOP
        -- Try to find a matching jet based on the aircraft model name
        SELECT id INTO matching_jet
        FROM jets
        WHERE LOWER(manufacturer || ' ' || model) LIKE LOWER('%' || offer_record.aircraft_model || '%')
        OR LOWER(model) LIKE LOWER('%' || offer_record.aircraft_model || '%')
        LIMIT 1;
        
        -- If found a match, update the offer
        IF matching_jet IS NOT NULL THEN
            UPDATE jetshare_offers
            SET jet_id = matching_jet
            WHERE id = offer_record.id;
        END IF;
    END LOOP;
END $$; 