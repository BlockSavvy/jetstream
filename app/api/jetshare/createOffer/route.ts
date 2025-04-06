import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { ensureUserProfile } from '@/app/jetshare/utils/ensureUserProfile';

// Add CORS headers to support cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Add jet_id to the types
interface CreateOfferData {
  user_id: string;
  departure_time: string;
  flight_date: string;
  departure_location: string;
  arrival_location: string;
  aircraft_model?: string;
  jet_id?: string; // Add jet_id field to handle real jet references
  total_seats?: number;
  available_seats?: number;
  total_flight_cost: number;
  requested_share_amount: number;
  split_configuration?: any;
  status: string;
  created_at: string;
}

export async function POST(request: Request) {
  try {
    // Use server-side client instead of cookie-based authentication
    const supabase = await createClient();
    
    // Try to get the authentication token from the request header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    console.log('API: CreateOffer - Auth Header:', authHeader ? 'Present' : 'Missing');
    console.log('API: CreateOffer - Token Extracted:', token ? 'Yes' : 'No');
    
    // Parse body first to get user_id in case we need it for private browsing mode
    const body = await request.json().catch(e => ({}));
    console.log('Request body received:', Object.keys(body).join(', '));
    
    const providedUserId = body.user_id;
    console.log('API: CreateOffer - User ID from request body:', providedUserId || 'None provided');
    
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
        console.log('API: CreateOffer - Token auth successful, user ID:', userDataWithToken?.user?.id);
      }
    }
    
    // If token approach failed, fall back to cookie-based auth
    if (!userData?.user) {
      const { data, error: userError } = await supabase.auth.getUser();
      userData = data;
      
      if (userError) {
        console.error('Authentication error in createOffer (cookie auth):', userError.message);
        
        // If specific token-related auth errors occur, provide a more helpful error message
        if (userError.message.includes('expired') || userError.message.includes('invalid') || userError.message.includes('missing')) {
          // This may be a private browsing context with no cookies/tokens
          // Check if we have a user_id in the request body for private browsing mode
          if (providedUserId) {
            console.log('API: CreateOffer - Attempting private browsing mode with provided user ID');
            privateMode = true;
          } else {
            return NextResponse.json(
              { 
                message: 'Your authentication session has expired. Please refresh the page and try again.',
                code: 'AUTH_TOKEN_EXPIRED',
                redirectUrl: '/auth/login?returnUrl=' + encodeURIComponent('/jetshare/create') + '&tokenExpired=true'
              },
              { status: 401, headers: corsHeaders }
            );
          }
        }
      } else {
        console.log('API: CreateOffer - Cookie auth successful, user ID:', data?.user?.id || 'Unknown');
      }
    }
    
    // Handle private browsing mode if needed
    let user = userData?.user;
    
    // If we're in privateMode and have a providedUserId but no authenticated user
    if (!user && privateMode && providedUserId) {
      console.log('API: CreateOffer - Using provided User ID in private mode:', providedUserId);
      
      // First verify this user actually exists in our database
      const { data: userCheck, error: userCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', providedUserId)
        .single();
      
      if (userCheckError || !userCheck) {
        console.error('API: CreateOffer - Invalid user ID provided in private mode:', userCheckError?.message);
        return NextResponse.json(
          { 
            message: 'Invalid user credentials. Please try again with a standard browser session.',
            code: 'INVALID_USER_ID',
            redirectUrl: '/auth/login?returnUrl=' + encodeURIComponent('/jetshare/create')
          },
          { status: 401, headers: corsHeaders }
        );
      }
      
      // If user exists in our database, manually construct a user object
      // Use a simplified user object that matches what ensureUserProfile needs
      user = { 
        id: providedUserId,
        // Add minimum required User properties to satisfy TypeScript
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      };
      console.log('API: CreateOffer - Verified user in private mode:', user.id);
    }
    
    // Final check if we have a valid user
    if (!user) {
      console.error('No authenticated user found in createOffer');
      return NextResponse.json(
        { 
          message: 'Not authenticated. Please sign in to create an offer.',
          code: 'NO_USER',
          redirectUrl: '/auth/login?returnUrl=' + encodeURIComponent('/jetshare/listings/create')
        },
        { status: 401, headers: corsHeaders }
      );
    }
    
    console.log('Authenticated user ID:', user.id);
    
    // Before creating the offer, ensure the user profile exists
    // This is required because jetshare_offers has a foreign key to the profiles table
    const { success: profileSuccess, message: profileMessage } = await ensureUserProfile(user);
    
    if (!profileSuccess) {
      console.error('Failed to ensure user profile:', profileMessage);
      return NextResponse.json(
        { 
          message: 'Failed to create user profile required for offers: ' + profileMessage,
          code: 'PROFILE_ERROR' 
        },
        { status: 500, headers: corsHeaders }
      );
    }
    
    // In the POST method, add jet_id to the fields to parse
    const {
      user_id,
      flight_date,
      departure_time,
      departure_location,
      arrival_location,
      aircraft_model,
      jet_id, // Add jet_id to the fields we're extracting
      total_seats,
      available_seats,
      total_flight_cost,
      requested_share_amount,
      split_configuration,
      status = 'open',
    } = body;
    
    // Validate required fields
    if (!user_id || !departure_location || !arrival_location || !total_flight_cost || !requested_share_amount) {
      console.error('Missing required fields in createOffer', body);
      return NextResponse.json(
        { 
          message: 'Missing required fields', 
          code: 'VALIDATION_ERROR',
          details: {
            requiredFields: ['user_id', 'departure_location', 'arrival_location', 'total_flight_cost', 'requested_share_amount'],
            receivedFields: Object.keys(body || {})
          }
        },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Validate numeric fields
    if (total_seats < 1 || available_seats < 1 || total_flight_cost <= 0 || requested_share_amount <= 0) {
      return NextResponse.json(
        { 
          message: 'Invalid numeric values',
          code: 'VALIDATION_ERROR',
          details: { total_seats, available_seats, total_flight_cost, requested_share_amount }
        },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Validate available seats
    if (available_seats > total_seats) {
      return NextResponse.json(
        { 
          message: 'Available seats cannot exceed total seats',
          code: 'VALIDATION_ERROR',
          details: { total_seats, available_seats }
        },
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log('Creating offer for user:', user.id);
    
    // Create the offer
    const offerData: CreateOfferData = {
      user_id,
      flight_date,
      departure_time: departure_time || flight_date, // Ensure departure_time is set
      departure_location,
      arrival_location,
      aircraft_model: aircraft_model || null,
      jet_id: jet_id || null, // Add jet_id to the data being inserted
      total_seats: total_seats || null,
      available_seats: available_seats || null,
      total_flight_cost,
      requested_share_amount,
      split_configuration: split_configuration || null,
      status,
      created_at: new Date().toISOString(),
    };
    
    const { data: offer, error: offerError } = await supabase
      .from('jetshare_offers')
      .insert([offerData])
      .select()
      .single();
    
    if (offerError) {
      console.error('Error creating offer:', offerError);
      return NextResponse.json(
        { 
          message: 'Failed to create offer: ' + offerError.message,
          code: 'DB_ERROR',
          details: offerError
        },
        { status: 500, headers: corsHeaders }
      );
    }
    
    console.log('Offer created successfully:', offer.id);

    // Immediately index the offer with embeddings (non-blocking)
    try {
      console.log('Starting real-time embedding indexing for offer:', offer.id);
      
      // Fire and forget - don't wait for the response but make sure we don't
      // block the main offer creation flow
      void (async () => {
        try {
          // Use fetch API to make the call to embedding API
          await fetch(`${request.headers.get('origin') || 'https://jetstream.aiya.sh'}/api/embedding/index-offer`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ offerId: offer.id }),
          });
          console.log('Successfully requested embedding indexing');
        } catch (indexError) {
          console.error('Error indexing offer (non-critical):', indexError);
          
          try {
            // Add to embedding queue for retry
            await supabase
              .from('embedding_queue')
              .insert([{
                object_id: offer.id,
                object_type: 'jetshare_offer',
                status: 'pending',
                attempts: 0
              }]);
            console.log('Added to embedding queue for retry');
          } catch (queueError) {
            console.error('Failed to add to embedding queue:', queueError);
          }
        }
      })();
    } catch (indexingError) {
      console.error('Error during index offer operation (non-critical):', indexingError);
      // This failure is non-critical for the offer creation, so we just log it
    }

    return NextResponse.json(offer, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in createOffer route:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
} 