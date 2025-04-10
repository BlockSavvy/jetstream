# JetShare Status Constraint Fix

This document provides instructions for fixing the status constraint issue in the JetShare component, which prevents users from accepting offers due to a database constraint error.

## Issue Description

When users try to accept an offer, they get a 500 error with the message:

```
new row for relation "jetshare_offers" violates check constraint "jetshare_offers_status_check"
```

This happens because there's an inconsistency in how the status field is defined in the database schema - it needs to be fixed by updating the database constraint.

## Fix Options

### Option 1: Run the Fix Script (Preferred)

The easiest way to fix this issue is to run the `fix-status-constraint.js` script:

1. Install dependencies (if you haven't already):

   ```
   npm install @supabase/supabase-js
   ```

2. Run the script with your Supabase credentials:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co SUPABASE_SERVICE_ROLE_KEY=your-service-key node fix-status-constraint.js
   ```

3. The script will:
   - Report current status values
   - Drop the existing constraint
   - Normalize all status values
   - Re-add the constraint with correct settings
   - Create a utility function for safer offer updates
   - Create a table for tracking asynchronous operations
   - Verify the changes

### Option 2: Manual SQL Fix

If you prefer to run the SQL commands directly:

1. Connect to your database using Supabase dashboard or preferred PostgreSQL client
2. Run the following SQL commands:

```sql
-- Step 1: Drop the existing constraint
ALTER TABLE jetshare_offers DROP CONSTRAINT IF EXISTS jetshare_offers_status_check;

-- Step 2: Normalize status values
UPDATE jetshare_offers SET status = 'open' WHERE status NOT IN ('open', 'accepted', 'completed');

-- Step 3: Re-add the constraint with correct format
ALTER TABLE jetshare_offers ADD CONSTRAINT jetshare_offers_status_check CHECK (status IN ('open', 'accepted', 'completed'));

-- Step 4: Create update function (optional but recommended)
CREATE OR REPLACE FUNCTION update_offer_status(p_offer_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_count INT;
  v_offer JSONB;
BEGIN
  -- Check if offer exists and is open
  SELECT COUNT(*) INTO v_count
  FROM jetshare_offers
  WHERE id = p_offer_id AND status = 'open';
  
  IF v_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Offer not found or not in open status'
    );
  END IF;
  
  -- Update the offer
  UPDATE jetshare_offers
  SET status = 'accepted',
      matched_user_id = p_user_id,
      updated_at = NOW()
  WHERE id = p_offer_id
  AND status = 'open';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Get the updated offer for return
  SELECT jsonb_build_object(
    'id', id,
    'status', status,
    'matched_user_id', matched_user_id,
    'updated_at', updated_at
  ) INTO v_offer
  FROM jetshare_offers
  WHERE id = p_offer_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Offer status updated successfully',
    'offer', v_offer
  );
END;
$$;
```

## Workaround Until Fixed

If you cannot fix the database immediately, the application includes a workaround:

1. When a user attempts to accept an offer, the backend will still record the transaction and set `matched_user_id` even if it can't update the status.
2. The frontend is configured to handle this case and will proceed to the payment screen.
3. You can manually update offer statuses in the database as needed.

## Prevention for Future Deployments

To prevent this issue in the future:

1. Always deploy database migrations through proper migration scripts
2. Use the existing Supabase migration system
3. Include `restore-jetstream-3-jetshare-tables.sql` in your deployment process
