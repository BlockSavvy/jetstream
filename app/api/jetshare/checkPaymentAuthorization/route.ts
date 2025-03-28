import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  console.log('checkPaymentAuthorization API called');
  
  // Get the offer ID from the query parameters
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  
  if (!id) {
    console.error('Missing offer ID in request');
    return NextResponse.json(
      { error: 'Missing offer ID', message: 'Offer ID is required' },
      { status: 400 }
    );
  }
  
  try {
    // Initialize Supabase client
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error or no user found:', authError);
      return NextResponse.json(
        { error: 'Authentication required', message: 'You must be logged in to check payment authorization' },
        { status: 401 }
      );
    }
    
    // Fetch the offer directly from database
    const { data: offer, error: offerError } = await supabase
      .from('jetshare_offers')
      .select(`
        *,
        user:user_id (id, email, first_name, last_name),
        matched_user:matched_user_id (id, email, first_name, last_name)
      `)
      .eq('id', id)
      .single();
    
    // Handle database errors
    if (offerError) {
      console.error('Database error fetching offer:', offerError);
      return NextResponse.json(
        { error: 'Database error', message: 'Error fetching offer details', details: offerError.message },
        { status: 500 }
      );
    }
    
    // Handle case where offer doesn't exist
    if (!offer) {
      console.error('Offer not found with ID:', id);
      return NextResponse.json(
        { error: 'Not found', message: 'The requested offer could not be found' },
        { status: 404 }
      );
    }
    
    // Check authorization
    const userIsCreator = offer.user_id === user.id;
    const userIsMatched = offer.matched_user_id === user.id;
    const offerIsOpen = offer.status === 'open';
    
    // Create and return authorization result
    const authResult = {
      authorized: (userIsMatched || (offerIsOpen && !userIsCreator)),
      offer: {
        id: offer.id,
        status: offer.status,
        userIsCreator,
        userIsMatched,
        offerIsOpen
      },
      reason: '',
      nextAction: ''
    };
    
    // Determine specific reason if not authorized
    if (userIsCreator) {
      authResult.authorized = false;
      authResult.reason = 'You are the creator of this offer and cannot pay for it';
      authResult.nextAction = 'redirect_dashboard_offers';
    } else if (offer.status === 'completed') {
      authResult.authorized = false;
      authResult.reason = 'This offer has already been paid for';
      authResult.nextAction = 'redirect_dashboard_transactions';
    } else if (!offerIsOpen && !userIsMatched) {
      authResult.authorized = false;
      authResult.reason = 'This offer has been accepted by another user';
      authResult.nextAction = 'redirect_listings';
    } else if (offerIsOpen && !userIsCreator) {
      // Handle the case where user could accept the offer (which happens in the payment page)
      authResult.authorized = true;
      authResult.nextAction = 'update_offer_to_accepted';
    }
    
    return NextResponse.json(authResult, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Unexpected error in checkPaymentAuthorization:', error);
    return NextResponse.json(
      { error: 'Server error', message: (error as Error).message },
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
} 