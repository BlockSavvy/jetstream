import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { ensureUserProfile } from '@/app/jetshare/utils/ensureUserProfile';

// Define CORS headers for consistent response
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Supabase-Auth',
  'Access-Control-Allow-Credentials': 'true',
};

export async function GET(request: NextRequest) {
  // Only allow in development/test mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is not available in production' }, 
      { status: 403, headers: corsHeaders }
    );
  }
  
  try {
    // Create supabase client
    const supabase = await createClient();
    
    // Check if an ID is provided for direct offer lookup
    const url = new URL(request.url);
    const offerId = url.searchParams.get('id');
    const tableName = url.searchParams.get('table') || 'jetshare_offers';
    
    // Direct offer lookup bypasses authentication
    if (offerId) {
      console.log(`Debug endpoint looking up ${tableName} with ID: ${offerId}`);
      const { data: offer, error: offerError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', offerId)
        .single();
      
      if (offerError) {
        return NextResponse.json(
          { error: `Error fetching ${tableName}`, details: offerError.message },
          { status: 404, headers: corsHeaders }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: offer
      }, { status: 200, headers: corsHeaders });
    }
    
    // Try to get the authentication token from the request header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    console.log('API: Debug - Auth Header:', authHeader ? 'Present' : 'Missing');
    console.log('API: Debug - Token Extracted:', token ? 'Yes' : 'No');
    
    // Try to get user_id from query params for private browsing support
    const providedUserId = url.searchParams.get('user_id');
    console.log('API: Debug - User ID from query:', providedUserId || 'None provided');
    
    // Get the current user's session using token if available
    let userData;
    let privateMode = false;
    
    if (token) {
      // Use the token to get the user
      const { data: userDataWithToken, error: userErrorWithToken } = await supabase.auth.getUser(token);
      userData = userDataWithToken;
      
      if (userErrorWithToken) {
        console.error('Auth error with token:', userErrorWithToken.message);
      } else {
        console.log('API: Debug - Token auth successful, user ID:', userDataWithToken?.user?.id);
      }
    }
    
    // If token approach failed, fall back to cookie-based auth
    if (!userData?.user) {
      const { data, error: userError } = await supabase.auth.getUser();
      userData = data;
      
      if (userError) {
        console.error('Authentication error in debug (cookie auth):', userError.message);
        
        // If specific token-related auth errors occur and we have a provided userId, try private mode
        if (userError.message.includes('expired') || userError.message.includes('invalid') || userError.message.includes('missing')) {
          if (providedUserId) {
            console.log('API: Debug - Attempting private browsing mode with provided user ID');
            privateMode = true;
          } else {
            return NextResponse.json(
              { 
                message: 'Your authentication session has expired. Please refresh the page and try again.',
                code: 'AUTH_TOKEN_EXPIRED',
                redirectUrl: '/auth/login?returnUrl=' + encodeURIComponent('/jetshare/debug') + '&tokenExpired=true'
              },
              { status: 401, headers: corsHeaders }
            );
          }
        }
      } else {
        console.log('API: Debug - Cookie auth successful, user ID:', data?.user?.id || 'Unknown');
      }
    }
    
    // Handle private browsing mode if needed
    let user = userData?.user;
    
    // If we're in privateMode and have a providedUserId but no authenticated user
    if (!user && privateMode && providedUserId) {
      console.log('API: Debug - Using provided User ID in private mode:', providedUserId);
      
      // First verify this user actually exists in our database
      const { data: userCheck, error: userCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', providedUserId)
        .single();
      
      if (userCheckError || !userCheck) {
        console.error('API: Debug - Invalid user ID provided in private mode:', userCheckError?.message);
        return NextResponse.json(
          { 
            message: 'Invalid user credentials. Please try again with a standard browser session.',
            code: 'INVALID_USER_ID',
            redirectUrl: '/auth/login?returnUrl=' + encodeURIComponent('/jetshare/debug')
          },
          { status: 401, headers: corsHeaders }
        );
      }
      
      // If user exists in our database, manually construct a user object
      user = { 
        id: providedUserId,
        // Add minimum required User properties to satisfy TypeScript
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      };
      console.log('API: Debug - Verified user in private mode:', user.id);
    }
    
    // Final check if we have a valid user
    if (!user) {
      console.error('No authenticated user found in debug endpoint');
      return NextResponse.json(
        { 
          message: 'Not authenticated. Please sign in to access debug features.',
          code: 'NO_USER',
          redirectUrl: '/auth/login?returnUrl=' + encodeURIComponent('/jetshare/debug')
        },
        { status: 401, headers: corsHeaders }
      );
    }
    
    // Check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    // Check user's offers
    const { data: userOffers, error: offersError } = await supabase
      .from('jetshare_offers')
      .select('*')
      .eq('user_id', user.id);
    
    // Get total offers in system
    const { count: totalOffers, error: countError } = await supabase
      .from('jetshare_offers')
      .select('*', { count: 'exact', head: true });
    
    // Attempt to ensure profile exists if it doesn't
    let profileResult = { success: false, message: 'Profile already exists' };
    if (!profile) {
      const result = await ensureUserProfile(user);
      profileResult = {
        success: result.success,
        message: result.message || 'Profile creation completed'
      };
    }
    
    // Get database schema info for troubleshooting
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_table_info', { table_name: 'jetshare_offers' })
      .select('*');
    
    return NextResponse.json({
      success: true,
      debug_info: {
        user: {
          id: user.id,
          email: user.email,
          metadata: user.user_metadata,
        },
        profile: {
          exists: !!profile,
          data: profile || null,
          error: profileError ? profileError.message : null,
          fixed: profileResult.success,
          fixMessage: profileResult.message,
        },
        offers: {
          user_offers: userOffers || [],
          user_offers_count: userOffers?.length || 0,
          total_offers_in_system: totalOffers || 0,
          error: offersError ? offersError.message : null,
        },
        schema: {
          data: schemaData || null,
          error: schemaError ? schemaError.message : null
        }
      }
    }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Debug operation failed', message: (error as Error).message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
} 