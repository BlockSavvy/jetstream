import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

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
    const includeJetDetails = searchParams.get('include_aircraft_details') === 'true';
    
    // Log the parameters for debugging
    console.log('[API /jetshare/getOffers] Function execution started.');
    console.log('[API /jetshare/getOffers] Query Params:', {
      status,
      userId,
      matchedUserId,
      viewMode,
      includeJetDetails,
      instanceId: searchParams.get('instance_id') ? '00000000...' : null
    });

    // Log request headers for debugging (redact cookies for privacy)
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('sb-vjhrmizwqhmafkxbmfwa-auth-token');
    console.log('[API /jetshare/getOffers] Request headers:', { 
      cookie: authCookie ? 'Present' : 'Missing',
      authorization: request.headers.get('authorization') ? 'Present (Bearer token)' : 'Missing'
    });

    // Create Supabase client
    console.log('[API /jetshare/getOffers] Attempting to create Supabase client...');
    const supabase = await createClient();
    console.log('[API /jetshare/getOffers] Supabase client created successfully.');

    // Get user information if needed
    let user: any = null;
    let authError: string | null = null;
    
    // For marketplace view, we don't need to authenticate
    if (viewMode !== 'marketplace') {
      try {
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

    // Handle different view modes
    if (viewMode === 'marketplace') {
      console.log('[API /jetshare/getOffers] Marketplace view - using direct DB access');
      
      // Define the base fields to select
      let selectFields = `
        *,
        user:user_id (
          id,
          email,
          first_name,
          last_name,
          avatar_url
        )
      `;
      
      // Add aircraft details if requested
      if (includeJetDetails) {
        console.log('[API /jetshare/getOffers] Including jet details in query');
        selectFields = `
          *,
          user:user_id (
            id,
            email,
            first_name,
            last_name,
            avatar_url
          ),
          jet:jet_id (
            id,
            manufacturer,
            model,
            image_url,
            images,
            category,
            capacity,
            range_nm,
            cruise_speed_kts,
            tail_number,
            description
          )
        `;
      }
      
      // Updated marketplace query
      // Ensure we're showing all open offers, ordered by newest first
      let query = supabase
        .from('jetshare_offers')
        .select(selectFields)
        .order('created_at', { ascending: false });

      // Apply status filter if provided
      if (status) {
        console.log(`[API /jetshare/getOffers] Filtering by status: ${status}`);
        query = query.eq('status', status);
      } else {
        // Default to 'open' status if not specified
        console.log('[API /jetshare/getOffers] Using default status filter: open');
        query = query.eq('status', 'open');
      }

      // Execute the query
      console.log('[API /jetshare/getOffers] Executing marketplace query with service role');
      const { data: offersData, error: offersError } = await query;
      
      if (offersError) {
        console.error('[API /jetshare/getOffers] Query error:', offersError);
        return NextResponse.json(
          { message: 'Failed to fetch offers', error: offersError.message },
          { status: 500 }
        );
      }
      
      // Log the total count of offers found
      console.log(`[API /jetshare/getOffers] Found ${offersData?.length || 0} marketplace offers`);

      // Add debug information for the first few offers (if any)
      if (offersData && offersData.length > 0) {
        const sampleOffers = offersData.slice(0, 3).map((offer: any) => ({
          id: offer.id,
          status: offer.status,
          created_at: offer.created_at,
          departure_location: offer.departure_location,
          user_id: offer.user_id
        }));
        console.log(`[API /jetshare/getOffers] Sample offers:`, sampleOffers);
      }
      
      // Return the offers
      return NextResponse.json({
        offers: offersData || [],
        count: offersData?.length || 0,
        success: true
      });
    } else if (viewMode === 'dashboard') {
      // For dashboard, we must have a user ID one way or another
      const activeUserId = user?.id || userId;
      
      if (!activeUserId) {
        console.log('[API /jetshare/getOffers] Dashboard view requires a user ID');
        return NextResponse.json(
          { error: 'User ID required for dashboard view' },
          { status: 400 }
        );
      }
      
      console.log('[API /jetshare/getOffers] Dashboard view - fetching all offers for user:', activeUserId);
      
      // For dashboard, we get all offers where the user is either poster or buyer
      const query = supabase
        .from('jetshare_offers')
        .select('*')
        .or(`user_id.eq.${activeUserId},matched_user_id.eq.${activeUserId}`);
        
      // Execute the query
      const { data: offersData, error: offersError } = await query;
      
      if (offersError) {
        console.error('[API /jetshare/getOffers] Dashboard query error:', offersError);
        return NextResponse.json(
          { message: 'Failed to fetch dashboard offers', error: offersError.message },
          { status: 500 }
        );
      }
      
      console.log(`[API /jetshare/getOffers] Found ${offersData?.length || 0} offers for user ${activeUserId}`);
      
      // Return the data
      return NextResponse.json({
        offers: offersData || [],
        count: offersData?.length || 0,
        success: true
      });
    } else if (viewMode === 'profile' && matchedUserId) {
      // For profile view with matchedUserId, show only matched offers
      if (!user && !userId) {
        console.log('[API /jetshare/getOffers] Profile view requires authentication');
        return NextResponse.json(
          { error: 'Authentication required for profile view' },
          { status: 401 }
        );
      }
      
      const activeUserId = user?.id || userId;
      console.log('[API /jetshare/getOffers] Profile view - fetching matched offers between', activeUserId, 'and', matchedUserId);
      
      const query = supabase
        .from('jetshare_offers')
        .select('*')
        .or(`user_id.eq.${activeUserId},matched_user_id.eq.${activeUserId}`)
        .or(`user_id.eq.${matchedUserId},matched_user_id.eq.${matchedUserId}`);
        
      // Execute the query
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
        console.log('[API /jetshare/getOffers] No offers found for the given profile criteria.');
        return NextResponse.json({
          offers: [],
          count: 0,
          success: true,
          message: 'No offers found'
        });
      }
      
      // Success case with enhanced offers
      const enhancedOffers = queryData.map((offer: any) => {
        return {
          ...offer,
          isMatched: !!offer.matched_user_id,
          daysUntilFlight: offer.flight_date ? Math.max(0, Math.floor((new Date(offer.flight_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null,
        };
      });
      
      return NextResponse.json({
        offers: enhancedOffers,
        count: enhancedOffers.length,
        success: true
      });
    } else {
      // Default to user's own offers
      if (!user && !userId) {
        console.log('[API /jetshare/getOffers] Default view requires authentication');
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      const activeUserId = user?.id || userId;
      console.log('[API /jetshare/getOffers] Default view - fetching offers for user:', activeUserId);
      
      const query = supabase
        .from('jetshare_offers')
        .select('*')
        .eq('user_id', activeUserId);
        
      // Execute the query
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
        console.log('[API /jetshare/getOffers] No offers found for the user.');
        return NextResponse.json({
          offers: [],
          count: 0,
          success: true,
          message: 'No offers found'
        });
      }
      
      // Success case with enhanced offers
      const enhancedOffers = queryData.map((offer: any) => {
        return {
          ...offer,
          isMatched: !!offer.matched_user_id,
          daysUntilFlight: offer.flight_date ? Math.max(0, Math.floor((new Date(offer.flight_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null,
        };
      });
      
      return NextResponse.json({
        offers: enhancedOffers,
        count: enhancedOffers.length,
        success: true
      });
    }
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