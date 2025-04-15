-- Fix for status field issues in jetshare_offers table

-- Step 1: Remove the existing check constraint
ALTER TABLE jetshare_offers DROP CONSTRAINT IF EXISTS jetshare_offers_status_check;

-- Step 2: Set all status values to 'open' to ensure consistency
UPDATE jetshare_offers SET status = 'open' WHERE status IS NULL OR status NOT IN ('open', 'accepted', 'completed');

-- Step 3: Recreate the constraint with correct allowed values
ALTER TABLE jetshare_offers ADD CONSTRAINT jetshare_offers_status_check CHECK (status IN ('open', 'accepted', 'completed'));

-- Step 4: Test by updating one offer to 'accepted'
UPDATE jetshare_offers 
SET status = 'accepted', matched_user_id = '4c2487a1-171f-4968-afe4-5298b32f456b'
WHERE id = 'a2772e66-54ce-418b-a212-6bd872b761a9' AND status = 'open'
RETURNING id, status, matched_user_id;

-- Add RPC function to force update offer status
CREATE OR REPLACE FUNCTION force_update_offer_status(p_offer_id UUID, p_status TEXT)
RETURNS VOID AS $$
BEGIN
  -- Direct SQL update to bypass triggers and constraints
  UPDATE jetshare_offers 
  SET status = p_status, 
      updated_at = NOW() 
  WHERE id = p_offer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create operations table if it doesn't exist
CREATE TABLE IF NOT EXISTS jetshare_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation_type TEXT NOT NULL,
  offer_id UUID REFERENCES jetshare_offers(id),
  target_status TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE
); 