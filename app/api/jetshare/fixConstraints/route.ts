import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { ensureUserProfile } from '@/app/jetshare/utils/ensureUserProfile';

// This API endpoint is used for fixing database constraints
export async function POST(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'This endpoint is only available in development mode' }, { status: 403 });
  }
  
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { operation } = body;
    
    let result = null;
    
    // Different operations based on what we're fixing
    switch (operation) {
      case 'ensure_user_profile':
        // Ensure current user has a profile
        result = await ensureUserProfile(user);
        break;
        
      case 'remove_orphaned_offers':
        // Remove offers with invalid user_id (not existing in profiles)
        const { data: orphanedOffers, error: orphanedError } = await supabase.rpc('remove_orphaned_offers');
        if (orphanedError) throw orphanedError;
        result = orphanedOffers;
        break;
        
      case 'fix_all_constraints':
        // First ensure the user profile exists
        await ensureUserProfile(user);
        
        // Then remove any orphaned offers
        const { data: removedOffers, error: removeError } = await supabase.rpc('remove_orphaned_offers');
        if (removeError) throw removeError;
        
        // Check for any users with offers but no profiles
        const { data: missingProfiles, error: missingError } = await supabase.rpc('find_users_without_profiles');
        if (missingError) throw missingError;
        
        result = {
          profile_ensured: true,
          orphaned_offers_removed: removedOffers,
          users_missing_profiles: missingProfiles
        };
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      result
    }, { status: 200 });
  } catch (error) {
    console.error('Error fixing constraints:', error);
    return NextResponse.json(
      { error: 'Failed to fix constraints', message: (error as Error).message },
      { status: 500 }
    );
  }
}

// SQL functions to add to Supabase:
/*
-- Function to remove orphaned offers (offers with user_id not in profiles)
CREATE OR REPLACE FUNCTION remove_orphaned_offers()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  removed_count INTEGER;
  orphaned_offers json;
BEGIN
  -- First, get the orphaned offers for reporting
  SELECT json_agg(o.*)
  INTO orphaned_offers
  FROM jetshare_offers o
  LEFT JOIN profiles p ON o.user_id = p.id
  WHERE p.id IS NULL;
  
  -- Then remove them
  WITH deleted AS (
    DELETE FROM jetshare_offers o
    USING (
      SELECT o.id
      FROM jetshare_offers o
      LEFT JOIN profiles p ON o.user_id = p.id
      WHERE p.id IS NULL
    ) as orphaned
    WHERE o.id = orphaned.id
    RETURNING o.*
  )
  SELECT count(*) INTO removed_count FROM deleted;
  
  RETURN json_build_object(
    'removed_count', removed_count,
    'orphaned_offers', orphaned_offers
  );
END;
$$;

-- Function to find users with offers but no profiles
CREATE OR REPLACE FUNCTION find_users_without_profiles()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  users_without_profiles json;
BEGIN
  -- Find users with offers but no profiles
  SELECT json_agg(distinct o.user_id)
  INTO users_without_profiles
  FROM jetshare_offers o
  LEFT JOIN profiles p ON o.user_id = p.id
  WHERE p.id IS NULL;
  
  RETURN json_build_object(
    'users_without_profiles', users_without_profiles
  );
END;
$$;
*/ 