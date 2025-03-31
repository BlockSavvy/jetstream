import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

// Schema for validating the request body
const validateRequestBody = (body: any): { 
  valid: boolean; 
  error?: string; 
  data?: { offer_id: string; payment_method: 'fiat' | 'crypto' } 
} => {
  const { offer_id, payment_method } = body;
  
  if (!offer_id) {
    return { valid: false, error: 'Offer ID is required' };
  }
  
  if (!payment_method) {
    return { valid: false, error: 'Payment method is required' };
  }
  
  if (!['fiat', 'crypto'].includes(payment_method)) {
    return { valid: false, error: 'Invalid payment method. Use "fiat" or "crypto"' };
  }
  
  return { 
    valid: true, 
    data: { 
      offer_id: String(offer_id), 
      payment_method: payment_method as 'fiat' | 'crypto'
    } 
  };
};

// Helper function to validate JWT token format
const isValidJwtFormat = (token: string): boolean => {
  // Simple JWT validation - Check if it has the common 3-part structure
  const parts = token.split('.');
  return parts.length === 3;
};

// Ensure the response is not cached
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('acceptOffer API called');
  
  try {
    // Get the Supabase client
    const supabase = await createClient();
    
    // Get the request body first to extract user_id for private browsing mode
    const body = await request.json();
    
    // Extract auth token from Authorization header if present
    const authHeader = request.headers.get('authorization');
    let authToken = null;
    let authHeaderPresent = false;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      authToken = authHeader.substring(7);
      authHeaderPresent = true;
      console.log('API: acceptOffer - Authorization header present');
    }
    
    // Attempt to authenticate using multiple methods
    let user = null;
    let authError = null;
    
    // Method 1: Try standard cookie-based auth first
    try {
      const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser();
      
      if (sessionUser) {
        console.log('API: acceptOffer - User authenticated via session cookie');
        user = sessionUser;
      } else if (sessionError) {
        console.log('API: acceptOffer - Session cookie auth failed:', sessionError.message);
        authError = sessionError;
      }
    } catch (e) {
      console.warn('API: acceptOffer - Error checking session cookie auth:', e);
    }
    
    // Method 2: If cookie auth failed but we have a token in the Authorization header, try that
    if (!user && authToken) {
      try {
        const { data: { user: tokenUser }, error: tokenError } = 
          await supabase.auth.getUser(authToken);
        
        if (tokenUser) {
          console.log('API: acceptOffer - User authenticated via Authorization header');
          user = tokenUser;
        } else if (tokenError) {
          console.log('API: acceptOffer - Authorization header auth failed:', tokenError.message);
          authError = tokenError;
        }
      } catch (e) {
        console.warn('API: acceptOffer - Error checking auth header token:', e);
      }
    }
    
    // Method 3: Try private browsing mode with user_id provided in request body
    if (!user && body.user_id) {
      console.log('API: acceptOffer - Attempting private browsing mode auth with user_id');
      
      // Verify the user exists in the database
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', body.user_id)
        .single();
      
      if (userData) {
        console.log('API: acceptOffer - User verified in private mode:', userData.id);
        // Create a minimal user object with the verified user ID
        user = { id: userData.id, email: userData.email || null };
      } else {
        console.log('API: acceptOffer - Failed to verify user in private mode:', userError?.message);
      }
    }
    
    // If all authentication methods failed, return 401
    if (!user) {
      console.error('API: acceptOffer - Authentication failed through all methods');
      
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'You must be logged in to accept this offer',
          details: 'No valid authentication method found',
          redirectUrl: '/auth/login?returnUrl=' + encodeURIComponent('/jetshare/listings'),
          authHeaderPresent: authHeaderPresent
        }, 
        { status: 401 }
      );
    }
    
    // Basic validation of offer_id
    if (!body.offer_id) {
      return NextResponse.json(
        { error: 'Missing offer ID' }, 
        { status: 400 }
      );
    }
    
    const offer_id = body.offer_id;
    
    // Accept the offer
    const { data: updatedOffer, error: updateError } = await supabase
      .from('jetshare_offers')
      .update({
        status: 'accepted',
        matched_user_id: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', offer_id)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error updating offer status:', updateError);
      return NextResponse.json({
        success: false,
        error: updateError.message
      }, { status: 500 });
    }
    
    console.log('Offer accepted successfully. Offer ID:', offer_id);
    
    // Store offer ID in a cookie to make it more reliable during redirects
    const cookieExpires = new Date();
    cookieExpires.setMinutes(cookieExpires.getMinutes() + 30); // 30 minutes
    
    const timestamp = Date.now();
    const response = NextResponse.json({
      success: true,
      message: 'Offer accepted successfully',
      data: {
        offer: updatedOffer,
        redirect_url: `/jetshare/payment/${offer_id}?t=${timestamp}&from=accept`,
      }
    });
    
    // Set a cookie with the offer ID to help with redirects
    response.cookies.set({
      name: 'pending_payment_offer_id',
      value: offer_id,
      expires: cookieExpires,
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Unhandled error in acceptOffer:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  // Allow CORS for development and production
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Supabase-Auth',
    'Access-Control-Allow-Credentials': 'true',
  };
  
  return NextResponse.json({}, { headers: corsHeaders });
} 