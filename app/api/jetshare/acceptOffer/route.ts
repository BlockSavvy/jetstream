import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { acceptJetShareOffer } from '@/lib/services/jetshare';
import { ensureUserProfile } from '@/app/jetshare/utils/ensureUserProfile';
import { z } from 'zod';

// Create a schema for validating the request body
const acceptOfferSchema = z.object({
  offer_id: z.string().uuid(),
  payment_method: z.enum(['fiat', 'crypto']),
});

export async function POST(request: NextRequest) {
  try {
    console.log('acceptOffer API endpoint called');
    
    // Check if we have all required headers for better debugging
    const headers = Object.fromEntries(request.headers.entries());
    console.log('Request headers:', {
      cookie: headers.cookie ? 'Present (length: ' + headers.cookie.length + ')' : 'Missing',
      'content-type': headers['content-type'] || 'Missing',
      authorization: headers.authorization ? 'Present' : 'Missing',
      host: headers.host || 'Missing',
      origin: headers.origin || 'Missing',
      referer: headers.referer || 'Missing',
    });
    
    // Get the request body
    const body = await request.json();
    console.log('Request body:', body);

    // Check cookies to help debug auth issues
    const cookieString = request.headers.get('cookie') || '';
    console.log('Cookie header present:', !!cookieString, 'Length:', cookieString.length);
    if (cookieString) {
      // Log the cookie names present (not values for security)
      const cookieNames = cookieString.split(';').map(c => c.trim().split('=')[0]);
      console.log('Cookie names present:', cookieNames);
    }
    
    // Validate request body
    try {
      acceptOfferSchema.parse(body);
    } catch (validationError) {
      console.error('Validation error:', validationError);
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: (validationError as Error).message 
      }, { status: 400 });
    }
    
    // Get the authenticated user
    const supabase = await createClient();
    const { data, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ 
        error: 'Authentication failed', 
        message: 'Authentication error occurred', 
        details: authError.message 
      }, { status: 401 });
    }
    
    if (!data.user) {
      console.error('User not authenticated (no user in response)');
      return NextResponse.json({ error: 'You must be signed in to accept an offer', message: 'Authentication required' }, { status: 401 });
    }
    
    const user = data.user;
    console.log('Authenticated user:', user.id, user.email);
    
    // Ensure user profile exists before accepting the offer
    console.log('Ensuring user profile exists...');
    const profileResult = await ensureUserProfile(user);
    
    if (!profileResult.success) {
      console.error('Profile creation failed:', profileResult.message);
      return NextResponse.json({ 
        error: 'Failed to create or verify user profile',
        details: profileResult.message
      }, { status: 500 });
    }
    
    console.log('User profile confirmed, proceeding to accept offer');
    
    // Accept the offer
    try {
      const updatedOffer = await acceptJetShareOffer(user.id, {
        offer_id: body.offer_id,
        payment_method: body.payment_method
      });
      
      console.log('Offer accepted successfully:', updatedOffer.id);
      
      // Inside the POST handler function
      // After successfully fetching the offer but before checking if it's the user's own offer
      console.log('Offer details for accepting:', {
        id: updatedOffer.id,
        status: updatedOffer.status,
        userId: user.id,
        offerUserId: updatedOffer.user_id,
        currentMatchedUserId: updatedOffer.matched_user_id || 'none'
      });

      // Check if the user is trying to accept their own offer
      if (updatedOffer.user_id === user.id) {
        console.error('User attempting to accept their own offer:', user.id);
        throw new Error('You cannot accept your own offer');
      }

      // Check if the offer already has a matched user that isn't the current user
      if (updatedOffer.matched_user_id && updatedOffer.matched_user_id !== user.id) {
        console.error('Offer already matched to another user:', updatedOffer.matched_user_id);
        throw new Error('Offer has already been accepted by another user');
      }

      // Allow continuing if the matched_user_id is the current user (re-accepting)
      if (updatedOffer.matched_user_id === user.id) {
        console.log('User re-accepting an offer they already matched with');
        
        // If already completed, return error
        if (updatedOffer.status === 'completed') {
          console.error('Attempting to accept a completed offer:', updatedOffer.id);
          throw new Error('This offer has already been completed and paid for');
        }
        
        // If already accepted by this user, just return the offer without error
        if (updatedOffer.status === 'accepted') {
          console.log('Offer already accepted by this user, returning without update');
          return updatedOffer;
        }
      }

      // Update the offer
      console.log('Updating offer status to accepted with matched_user_id:', user.id);
      
      return NextResponse.json({ 
        success: true, 
        offer: updatedOffer
      }, { 
        status: 200,
        headers: {
          // Ensure cache-control to prevent caching issues
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          // Allow credentials
          'Access-Control-Allow-Credentials': 'true',
          // CORS headers if needed
          'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    } catch (acceptError) {
      console.error('Error in acceptJetShareOffer:', acceptError);
      // Return a more specific error response
      return NextResponse.json(
        { 
          error: 'Failed to accept offer', 
          message: (acceptError as Error).message 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Unexpected error accepting JetShare offer:', error);
    return NextResponse.json(
      { error: 'Failed to accept offer', message: (error as Error).message },
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