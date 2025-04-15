# JetShare Status Constraint Fix

This document provides instructions for fixing the JetShare status constraint issue that prevents users from accepting offers.

## Quick Fix SQL

Run the following SQL statements in your Supabase SQL Editor:

```sql
-- 1. Remove the existing constraint
ALTER TABLE jetshare_offers DROP CONSTRAINT IF EXISTS jetshare_offers_status_check;

-- 2. Standardize existing status values
UPDATE jetshare_offers SET status = 'open' WHERE status IS NULL OR status NOT IN ('open', 'accepted', 'completed');

-- 3. Add the correct constraint back
ALTER TABLE jetshare_offers ADD CONSTRAINT jetshare_offers_status_check CHECK (status IN ('open', 'accepted', 'completed'));

-- 4. Create a helpful function to update offer status safely
CREATE OR REPLACE FUNCTION update_offer_status(offer_id UUID, user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Update the offer
  UPDATE jetshare_offers
  SET status = 'accepted',
      matched_user_id = user_id,
      updated_at = NOW()
  WHERE id = offer_id
  AND status = 'open';
  
  -- Return the updated offer
  SELECT jsonb_build_object(
    'success', TRUE,
    'offer', jsonb_build_object(
      'id', id,
      'status', status,
      'matched_user_id', matched_user_id
    )
  )
  INTO result
  FROM jetshare_offers
  WHERE id = offer_id;
  
  RETURN result;
END;
$$;
```

## Using the Fix from API

If you can't access the SQL editor directly, you can call this API endpoint:

```
GET /api/jetshare/fixOfferByUpdate?id=YOUR_OFFER_ID
```

## Creating Missing Profiles or Fixing Email Issues

You can also fix profile issues with:

```
GET /api/jetshare/fixProfileEmail?all=true
```

Or for a specific user:

```
GET /api/jetshare/fixProfileEmail?userId=USER_ID
``` 