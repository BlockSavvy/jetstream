import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createSBClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Get authenticated user, handling anonymous access gracefully
async function getUser(supabase: any) {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.log('[API /jetshare/getOffers] User fetch error (anonymous allowed):', error.message);
      return { user: null, authError: false };
    }
    return { user: data.user, authError: false };
  } catch (err) {
    console.log('[API /jetshare/getOffers] Auth error during getUser (anonymous allowed):', err);
    return { user: null, authError: false };
  }
}

// Main route handler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const status = searchParams.get('status');
    const userId = searchParams.get('user_id');
    const matchedUserId = searchParams.get('matched_user_id');
    const viewMode = searchParams.get('viewMode') || 'marketplace';
    const forceUserId = searchParams.get('force_user_id');
    const requestId = searchParams.get('rid') || 'unknown-rid';
    
    // Log the parameters for debugging
    console.log('[API /jetshare/getOffers] Function execution started.');
    console.log('[API /jetshare/getOffers] Query Params:', {
      status,
      userId,
      matchedUserId,
      viewMode,
      instanceId: searchParams.get('instance_id') ? '00000000...' : null
    });

    // Log request headers for debugging (redact cookies for privacy)
    const cookieHeader = request.headers.get('cookie');
    console.log('[API /jetshare/getOffers] Request headers:', { 
      cookie: cookieHeader ? 'Present (length: ' + cookieHeader.length + ')' : 'Missing',
      authorization: request.headers.get('authorization') ? 'Present (Bearer token)' : 'Missing'
    });

    // Create Supabase client
    console.log('[API /jetshare/getOffers] Attempting to create Supabase client...');
    let supabasePromise = createClient();
    let user: any = null;
    let authError: string | null = null;
    
    console.log('[API /jetshare/getOffers] Supabase client created successfully.');

    // Simplified check for dashboard view
    if (viewMode === 'dashboard' && userId) {
      console.log('[API /jetshare/getOffers] Dashboard view with user ID - using direct database access');
      
      // Skip all auth checks and query directly with the service role key
      const supabaseServiceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseServiceUrl || !supabaseServiceKey) {
        console.error('[API /jetshare/getOffers] Missing Supabase service credentials');
        return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
      }
      
      try {
        console.log(`[API /jetshare/getOffers] Creating service client for user ${userId} with URL: ${supabaseServiceUrl.substring(0, 20)}...`);
        
        // Create a service client directly with minimal options
        const serviceClient = createSBClient(supabaseServiceUrl, supabaseServiceKey, {
          auth: { persistSession: false },
          global: { headers: { 'x-connection-id': requestId || 'unknown' } }
        });
        
        // Build query for user's offers (both posted and matched)
        let dashboardQuery = serviceClient
          .from('jetshare_offers')
          .select('*')
          .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`);
        
        // Execute the query
        console.log('[API /jetshare/getOffers] Executing dashboard query with service role');
        const { data: offersData, error: offersError } = await dashboardQuery;
        
        if (offersError) {
          console.error('[API /jetshare/getOffers] Error fetching offers with service role:', JSON.stringify(offersError));
          return NextResponse.json({ error: 'Database error', details: offersError }, { status: 500 });
        }
        
        console.log(`[API /jetshare/getOffers] Found ${offersData?.length || 0} offers for user ${userId}`);
        
        // Return the data
        return NextResponse.json({
          offers: offersData || [],
          count: offersData?.length || 0,
          success: true
        });
      } catch (serviceError) {
        console.error('[API /jetshare/getOffers] Service role client error:', serviceError);
        return NextResponse.json({ error: 'Service error' }, { status: 500 });
      }
    } else {
      // For other views, do standard auth check
      try {
        const supabase = await supabasePromise;
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          authError = error.message;
          console.log('[API /jetshare/getOffers] Auth error:', authError);
        } else {
          user = data.user;
          console.log('[API /jetshare/getOffers] User authenticated:', user?.id);
        }
      } catch (e) {
        console.log('[API /jetshare/getOffers] Unexpected auth error:', e);
        authError = 'Authentication failed';
      }
    }

    // After the auth checks, handle the viewMode conditions
    if (viewMode === 'marketplace') {
      console.log('[API /jetshare/getOffers] Marketplace view - using direct DB access');
      
      // Use service role to query directly
      const supabaseServiceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseServiceUrl || !supabaseServiceKey) {
        console.error('[API /jetshare/getOffers] Missing Supabase service credentials');
        return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
      }
      
      try {
        console.log('[API /jetshare/getOffers] Creating service client for marketplace');
        
        // Create a service client directly
        const serviceClient = createSBClient(supabaseServiceUrl, supabaseServiceKey);
        
        // For marketplace, we only get open offers - FIXED: removed the join with profiles
        const query = serviceClient
          .from('jetshare_offers')
          .select('*, user:user_id(*)')
          .eq('status', 'open');
          
        // Add additional filters if provided
        if (status) {
          query.eq('status', status);
        }
        
        // Execute the query
        console.log('[API /jetshare/getOffers] Executing marketplace query with service role');
        const { data: offersData, error: offersError } = await query;
        
        if (offersError) {
          console.error('[API /jetshare/getOffers] Error fetching marketplace offers:', offersError);
          return NextResponse.json({ error: 'Database error', details: offersError }, { status: 500 });
        }
        
        console.log(`[API /jetshare/getOffers] Found ${offersData?.length || 0} marketplace offers`);
        
        // Return the offers
        return NextResponse.json({
          offers: offersData || [],
          count: offersData?.length || 0,
          success: true
        });
        
      } catch (serviceError) {
        console.error('[API /jetshare/getOffers] Service role client error for marketplace:', serviceError);
        return NextResponse.json({ error: 'Service error' }, { status: 500 });
      }
    } else if (viewMode === 'dashboard') {
      // For dashboard, we must have a user ID one way or another
      if (!user && !userId) {
        console.log('[API /jetshare/getOffers] Dashboard view requires a user ID');
        return NextResponse.json(
          { error: 'User ID required for dashboard view' },
          { status: 400 }
        );
      }
      
      // If we have a userId in the URL, use that even without auth (for client-side handling)
      if (userId && !user) {
        console.log('[API /jetshare/getOffers] Using userId from URL for dashboard:', userId);
        user = { id: userId };
      }
    } else {
      // For other views (like profile), we must be authenticated
      if (!user) {
        console.log('[API /jetshare/getOffers] Authentication required for', viewMode, 'view');
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    // For all non-admin routes, handle based on viewMode
    // First get the Supabase client
    const supabase = await supabasePromise;
    
    // Get active user ID (from authenticated user, or from query param for dashboard view)
    const activeUserId = user?.id || userId || null;

    // Build and execute the query based on the viewMode
    let query;

    if (viewMode === 'dashboard') {
      console.log('[API /jetshare/getOffers] Dashboard view - fetching all offers for user:', activeUserId);
      
      // For dashboard, we get all offers where the user is either poster or buyer
      query = supabase
        .from('jetshare_offers')
        .select('*')
        .or(`user_id.eq.${activeUserId},matched_user_id.eq.${activeUserId}`);
        
    } else if (viewMode === 'marketplace') {
      // For marketplace, we only get open offers
      console.log('[API /jetshare/getOffers] Marketplace view - fetching all open offers');
      
      query = supabase
        .from('jetshare_offers')
        .select('*')
        .eq('status', 'open');
        
    } else if (viewMode === 'profile' && matchedUserId) {
      // For profile view with matchedUserId, show only matched offers
      console.log('[API /jetshare/getOffers] Profile view - fetching matched offers between', activeUserId, 'and', matchedUserId);
      
      query = supabase
        .from('jetshare_offers')
        .select('*')
        .or(`user_id.eq.${activeUserId},matched_user_id.eq.${activeUserId}`)
        .or(`user_id.eq.${matchedUserId},matched_user_id.eq.${matchedUserId}`);
        
    } else {
      // Default to user's own offers
      console.log('[API /jetshare/getOffers] Default view - fetching offers for user:', activeUserId);
      
      query = supabase
        .from('jetshare_offers')
        .select('*')
        .eq('user_id', activeUserId);
    }

    // Execute the query
    console.log('[API /jetshare/getOffers] Attempting to execute the constructed Supabase query...');
    const { data: queryData, error: dbError } = await query;
      
    // Handle database errors
    if (dbError) {
      console.error('[API /jetshare/getOffers] Database error:', dbError);
      return NextResponse.json(
        { error: 'Database error', message: dbError.message },
        { status: 500 }
      );
    }

    // Check for empty results - this is not an error condition
    if (!queryData || queryData.length === 0) {
      console.log('[API /jetshare/getOffers] No offers found for the given criteria.');
      return NextResponse.json({
        offers: [],
        count: 0,
        success: true,
        message: 'No offers found'
      });
    }

    // Success case - add calculated fields if needed
    const enhancedOffers = queryData.map((offer: any) => {
      // Add any derived properties here
      return {
        ...offer,
        // Example derived fields
        isMatched: !!offer.matched_user_id,
        daysUntilFlight: offer.flight_date ? Math.max(0, Math.floor((new Date(offer.flight_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null,
      };
    });

    // Return the offers with success indicator
    return NextResponse.json({
      offers: enhancedOffers,
      count: enhancedOffers.length,
      success: true
    });
  } catch (error) {
    console.error('[API /jetshare/getOffers] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
} 