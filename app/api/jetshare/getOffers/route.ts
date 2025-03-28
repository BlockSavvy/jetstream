import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  console.log('getOffers API hit');
  
  const { searchParams } = new URL(request.url);
  
  // Query parameters
  const status = searchParams.get('status');
  const userId = searchParams.get('userId');
  const matchedUserId = searchParams.get('matchedUserId');
  const viewMode = searchParams.get('viewMode') || 'marketplace';
  
  console.log('GetOffers: Query params:', {
    status,
    userId,
    matchedUserId,
    viewMode
  });
  
  // Set up Supabase client
  console.log('Creating Supabase client with URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Using service role key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Key provided (value hidden)' : 'No key provided');
  
  // Check for cookie header
  console.log('Cookie header present:', request.headers.has('cookie'), request.headers.has('cookie') ? `Length: ${request.headers.get('cookie')?.length}` : '');
  
  const supabase = await createClient();
  
  try {
    // Get the current authenticated user - this is optional for marketplace view
    // but required for dashboard view
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // For marketplace view, we don't require authentication but use it if available
    if (viewMode === 'marketplace') {
      console.log('GetOffers: Marketplace view');
      
      // Add a cache control timestamp to prevent browser/CDN caching
      const noCache = Date.now();
      
      // Build the query - explicitly select status='open' for marketplace
      // regardless of other status parameters
      let query = supabase.from('jetshare_offers').select(`
        *,
        user:user_id (*),
        matched_user:matched_user_id (*)
      `).eq('status', 'open');
      
      console.log('Marketplace query: filtering to open offers only');
      
      // If user is authenticated, filter out their own offers and offers with matched users
      if (user) {
        console.log('User is authenticated:', user.email);
        // In marketplace view, exclude current user's offers and offers that already have a matched user
        query = query.neq('user_id', user.id).is('matched_user_id', null);
        console.log('Marketplace filters applied: status=open, excluding user offers and offers with matched_user_id');
      } else {
        // Even for anonymous users, ensure we only show truly available offers
        // with no matched user
        query = query.is('matched_user_id', null);
        console.log('Anonymous user for marketplace view, showing all open offers with no matched user');
      }
      
      // Add additional filter to exclude offers with a flight date in the past
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('flight_date', today);
      console.log('Applied date filter: only showing offers with flight date >= today');
      
      // Order by flight date (soonest first)
      query = query.order('flight_date', { ascending: true });
      
      // Execute the query
      const { data: offers, error: dbError } = await query;
      
      if (dbError) {
        console.error('Database error:', dbError);
        return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
      }
      
      // Double-check status is 'open' for all offers (extra safety)
      const filteredOffers = offers?.filter(offer => offer.status === 'open') || [];
      
      // For marketplace, add a flag to indicate if the current user created the offer
      const enhancedOffers = filteredOffers.map(offer => ({
        ...offer,
        isOwnOffer: user && offer.user_id === user.id
      }));
      
      console.log('GetOffers: Found', enhancedOffers.length, 'open offers for marketplace');
      
      return NextResponse.json({
        success: true,
        timestamp: noCache, // Include timestamp in response to prevent caching
        userId: user?.id,
        userEmail: user?.email,
        offers: enhancedOffers,
        counts: {
          total: enhancedOffers.length,
          own: enhancedOffers.filter(o => o.isOwnOffer).length,
          others: enhancedOffers.filter(o => !o.isOwnOffer).length
        }
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
          'ETag': `W/"${noCache}"` // Add ETag with timestamp to force revalidation
        }
      });
    }
    
    // For dashboard view, authentication is required
    if (viewMode === 'dashboard') {
      if (authError || !user) {
        console.error('Authentication required for dashboard view:', authError);
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      
      console.log('GetOffers: User authenticated for dashboard view:', user.id, user.email);
      
      // Build the query
      let query = supabase.from('jetshare_offers').select(`
        *,
        user:user_id (*),
        matched_user:matched_user_id (*)
      `);
      
      // Apply filters based on parameters
      if (status) {
        query = query.eq('status', status);
        console.log('Dashboard filter: status=' + status);
      }
      
      // If userId=current, get the current user's offers (offers they created)
      if (userId === 'current') {
        query = query.eq('user_id', user.id);
        console.log('Dashboard filter: user_id=' + user.id);
      } else if (userId) {
        query = query.eq('user_id', userId);
        console.log('Dashboard filter: user_id=' + userId);
      }
      
      // If matchedUserId=current, get offers where the current user is the matched user (bookings they made)
      if (matchedUserId === 'current') {
        query = query.eq('matched_user_id', user.id);
        console.log('Dashboard filter: matched_user_id=' + user.id);
      } else if (matchedUserId) {
        query = query.eq('matched_user_id', matchedUserId);
        console.log('Dashboard filter: matched_user_id=' + matchedUserId);
      }
      
      // For completed flights in dashboard, if no user or matched_user filter is applied,
      // show all offers related to the current user (both created and accepted)
      if (status === 'completed' && !userId && !matchedUserId) {
        query = query.or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`);
        console.log('Dashboard filter: getting all offers for user', user.id, '(both created and matched)');
      }
      
      // Execute the query
      const { data: offers, error: dbError } = await query;
      
      if (dbError) {
        console.error('Database error:', dbError);
        return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
      }
      
      // Add isOwnOffer flag
      const enhancedOffers = offers?.map(offer => ({
        ...offer,
        isOwnOffer: offer.user_id === user.id
      })) || [];
      
      console.log('GetOffers: Found', enhancedOffers.length, 'offers');
      
      return NextResponse.json({
        success: true,
        userId: user.id,
        userEmail: user.email,
        offers: enhancedOffers,
        counts: {
          total: enhancedOffers.length,
          own: enhancedOffers.filter(o => o.isOwnOffer).length,
          others: enhancedOffers.filter(o => !o.isOwnOffer).length
        }
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }
    
    // If we get here, the viewMode is invalid
    return NextResponse.json({ error: 'Invalid view mode' }, { status: 400 });
  } catch (error) {
    console.error('Error in getOffers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offers', details: (error as Error)?.message }, 
      { status: 500 }
    );
  }
}

// Add OPTIONS handler for CORS
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