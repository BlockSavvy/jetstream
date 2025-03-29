import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  // Log entry point
  console.log('[API /jetshare/getOffers] Function execution started.');
  
  const { searchParams } = new URL(request.url);
  
  // Log received query parameters
  const status = searchParams.get('status');
  const userId = searchParams.get('userId');
  const matchedUserId = searchParams.get('matchedUserId');
  const viewMode = searchParams.get('viewMode') || 'marketplace';
  console.log('[API /jetshare/getOffers] Query Params:', { status, userId, matchedUserId, viewMode });
  
  // Log before creating Supabase client
  console.log('[API /jetshare/getOffers] Attempting to create Supabase client...');
  const supabase = await createClient();
  console.log('[API /jetshare/getOffers] Supabase client created successfully.');
  
  try {
    // Log before getting user
    console.log('[API /jetshare/getOffers] Attempting to get authenticated user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.warn('[API /jetshare/getOffers] Auth error during getUser:', authError);
      // Potentially return 401 here, but log it first
    }
    console.log(`[API /jetshare/getOffers] User fetched. User ID: ${user?.id ?? 'null'}, Auth Error: ${authError ? 'Yes' : 'No'}`);
    
    let query; // Define query variable outside conditional blocks
    
    if (viewMode === 'marketplace') {
      console.log('[API /jetshare/getOffers] Processing Marketplace view...');
      // Build the query - Check the select statement carefully
      query = supabase.from('jetshare_offers').select(`
        *,
        user:user_id (*),
        matched_user:matched_user_id (*)
      `).eq('status', 'open');
      console.log('[API /jetshare/getOffers] Base marketplace query constructed.');
      
      if (user) {
        console.log(`[API /jetshare/getOffers] Applying filters for authenticated user ${user.id}: exclude own, exclude matched.`);
        query = query.neq('user_id', user.id).is('matched_user_id', null);
      } else {
        console.log('[API /jetshare/getOffers] Applying filters for anonymous user: exclude matched.');
        query = query.is('matched_user_id', null);
      }
      
      const today = new Date().toISOString().split('T')[0];
      console.log(`[API /jetshare/getOffers] Applying date filter: flight_date >= ${today}`);
      query = query.gte('flight_date', today);
      
      console.log('[API /jetshare/getOffers] Applying order: flight_date ascending.');
      query = query.order('flight_date', { ascending: true });
      
    } else if (viewMode === 'dashboard') {
      // Ensure user is authenticated for dashboard
      if (authError || !user) {
        console.error('[API /jetshare/getOffers] Authentication required for dashboard view. AuthError:', authError);
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      console.log(`[API /jetshare/getOffers] Processing Dashboard view for user ${user.id}...`);
      
      query = supabase.from('jetshare_offers').select(`
        *,
        user:user_id (*),
        matched_user:matched_user_id (*)
      `);
      console.log('[API /jetshare/getOffers] Base dashboard query constructed.');
      
      // Apply filters based on parameters (add logs for each applied filter)
      if (status) {
        if (status.includes(',')) {
          const statusValues = status.split(',');
          console.log(`[API /jetshare/getOffers] Applying filter: status IN (${statusValues.join(',')})`);
          query = query.in('status', statusValues);
        } else {
          console.log(`[API /jetshare/getOffers] Applying filter: status = ${status}`);
          query = query.eq('status', status);
        }
      }
      if (userId === 'current') {
        console.log(`[API /jetshare/getOffers] Applying filter: user_id = ${user.id}`);
        query = query.eq('user_id', user.id);
      } else if (userId) {
        console.log(`[API /jetshare/getOffers] Applying filter: user_id = ${userId}`);
        query = query.eq('user_id', userId);
      }
      if (matchedUserId === 'current') {
        console.log(`[API /jetshare/getOffers] Applying filter: matched_user_id = ${user.id}`);
        query = query.eq('matched_user_id', user.id);
      } else if (matchedUserId) {
        console.log(`[API /jetshare/getOffers] Applying filter: matched_user_id = ${matchedUserId}`);
        query = query.eq('matched_user_id', matchedUserId);
      }
      // Special case for completed filter
      if (status === 'completed' && !userId && !matchedUserId) {
         console.log(`[API /jetshare/getOffers] Applying OR filter for completed: user_id=${user.id} OR matched_user_id=${user.id}`);
         query = query.or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`);
      }
      
    } else {
      console.error(`[API /jetshare/getOffers] Invalid viewMode: ${viewMode}`);
      return NextResponse.json({ error: 'Invalid view mode' }, { status: 400 });
    }
    
    // Log *right before* executing the query
    console.log('[API /jetshare/getOffers] Attempting to execute the constructed Supabase query...');
    const { data: offers, error: dbError } = await query;
    
    // Log the result or error *immediately after* execution
    if (dbError) {
      console.error('[API /jetshare/getOffers] !!! Supabase query failed !!!');
      console.error('[API /jetshare/getOffers] Database Error Code:', dbError.code);
      console.error('[API /jetshare/getOffers] Database Error Message:', dbError.message);
      console.error('[API /jetshare/getOffers] Database Error Details:', dbError.details);
      console.error('[API /jetshare/getOffers] Database Error Hint:', dbError.hint);
      // Return 500 immediately
      return NextResponse.json({ error: 'Database query failed', details: dbError.message }, { status: 500 });
    } else {
      console.log(`[API /jetshare/getOffers] Supabase query executed successfully. Found ${offers?.length ?? 0} offers.`);
    }
    
    // Continue processing if successful...
    // Add isOwnOffer flag (simplified logic from original)
    const enhancedOffers = offers?.map(offer => ({
      ...offer,
      isOwnOffer: user && offer.user_id === user.id
    })) || [];
    
    const responsePayload = {
      success: true,
      timestamp: viewMode === 'marketplace' ? Date.now() : undefined, // Add timestamp only for marketplace
      userId: user?.id,
      userEmail: user?.email,
      offers: enhancedOffers,
      counts: {
        total: enhancedOffers.length,
        own: enhancedOffers.filter(o => o.isOwnOffer).length,
        others: enhancedOffers.filter(o => !o.isOwnOffer).length
      }
    };
    
    // Log before returning success
    console.log(`[API /jetshare/getOffers] Preparing successful response for ${viewMode} view.`);
    return NextResponse.json(responsePayload, {
      headers: { // Add appropriate cache headers based on viewMode if needed
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
      }
    });
  } catch (error: any) {
    // Log any unexpected errors caught by the try/catch block
    console.error('[API /jetshare/getOffers] !!! Unexpected error in GET handler !!!');
    console.error('[API /jetshare/getOffers] Error Message:', error.message);
    console.error('[API /jetshare/getOffers] Error Stack:', error.stack);
    return NextResponse.json(
      { error: 'Internal server error occurred', details: error.message },
      { status: 500 }
    );
  }
}

// Ensure OPTIONS handler is present if needed for CORS (Keep the original one)
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
} 