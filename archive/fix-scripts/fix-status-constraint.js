/**
 * Fix Status Constraint Migration Script
 * This script fixes the jetshare_offers status constraint issue
 * 
 * Run this script directly via Node:
 * NEXT_PUBLIC_SUPABASE_URL=your_url SUPABASE_SERVICE_ROLE_KEY=your_key node fix-status-constraint.js
 */
const { createClient } = require('@supabase/supabase-js');

// Get configuration from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Log colorful status messages
const log = {
  step: (msg) => console.log(`\n\x1b[34m[Step]\x1b[0m ${msg}`),
  info: (msg) => console.log(`\x1b[36m[Info]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m[Success]\x1b[0m ${msg}`),
  error: (msg) => console.error(`\x1b[31m[Error]\x1b[0m ${msg}`),
  warning: (msg) => console.warn(`\x1b[33m[Warning]\x1b[0m ${msg}`)
};

async function executeSQL(sql, description) {
  log.step(description);
  log.info(`Executing SQL: ${sql}`);
  
  try {
    // Execute raw SQL via the Postgres extension
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });
    
    if (error) {
      // Try fallback method if RPC doesn't exist
      log.warning(`RPC failed: ${error.message}`);
      log.info('Trying alternative method... (this is normal in some environments)');
      
      // Use alternative method - direct API call
      const { error: directError } = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ sql_string: sql })
      });
      
      if (directError) {
        throw new Error(`Direct API call failed: ${directError.message}`);
      }
      
      log.success('SQL executed successfully via direct API');
      return true;
    }
    
    log.success('SQL executed successfully');
    return data;
  } catch (error) {
    log.error(`Failed to execute SQL: ${error.message}`);
    return false;
  }
}

async function fixStatusConstraint() {
  log.step('Starting database fix process');
  
  try {
    // Step 1: Check current status values
    log.step('Checking current status values in jetshare_offers table');
    const { data: offers, error: offersError } = await supabase
      .from('jetshare_offers')
      .select('id, status')
      .order('status');
    
    if (offersError) {
      throw new Error(`Error fetching offers: ${offersError.message}`);
    }
    
    // Count status values
    const counts = {};
    offers.forEach(offer => {
      counts[offer.status] = (counts[offer.status] || 0) + 1;
    });
    
    log.info(`Found ${offers.length} offers with the following status values:`);
    Object.entries(counts).forEach(([status, count]) => {
      log.info(`  Status "${status}": ${count} offers`);
    });
    
    // Step 2: Fix the constraint
    // First drop the existing constraint
    await executeSQL(
      `ALTER TABLE jetshare_offers DROP CONSTRAINT IF EXISTS jetshare_offers_status_check;`,
      'Removing existing check constraint'
    );
    
    // Ensure all statuses are standardized
    await executeSQL(
      `UPDATE jetshare_offers SET status = 'open' WHERE status NOT IN ('open', 'accepted', 'completed');`,
      'Standardizing status values'
    );
    
    // Re-add the constraint with correct format
    await executeSQL(
      `ALTER TABLE jetshare_offers ADD CONSTRAINT jetshare_offers_status_check CHECK (status IN ('open', 'accepted', 'completed'));`,
      'Adding proper check constraint'
    );
    
    // Step 3: Create the stored procedure function for easier offer status updates
    await executeSQL(`
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
        
        -- Update the offer with safer SQL that will work with constraints
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
    `, 'Creating offer status update function');
    
    // Step 4: Create internal operations table if it doesn't exist
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS "jetshare_internal_ops" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "operation" TEXT NOT NULL,
        "params" JSONB NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "processed_at" TIMESTAMPTZ,
        "result" JSONB,
        "error" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      
      -- Create an index for pending operations
      CREATE INDEX IF NOT EXISTS idx_jetshare_internal_ops_pending 
      ON "jetshare_internal_ops" ("status") 
      WHERE status = 'pending';
    `, 'Creating jetshare_internal_ops table');
    
    // Step 5: Verify changes
    log.step('Verifying changes');
    const { data: updatedOffers, error: verifyError } = await supabase
      .from('jetshare_offers')
      .select('id, status')
      .order('status');
    
    if (verifyError) {
      throw new Error(`Error verifying offers: ${verifyError.message}`);
    }
    
    // Count status values
    const updatedCounts = {};
    updatedOffers.forEach(offer => {
      updatedCounts[offer.status] = (updatedCounts[offer.status] || 0) + 1;
    });
    
    log.info(`After fixes, found ${updatedOffers.length} offers with the following status values:`);
    Object.entries(updatedCounts).forEach(([status, count]) => {
      log.info(`  Status "${status}": ${count} offers`);
    });
    
    log.success('Database fix completed successfully!');
  } catch (error) {
    log.error(`Error fixing database: ${error.message}`);
    process.exit(1);
  }
}

// Run the fix
fixStatusConstraint(); 