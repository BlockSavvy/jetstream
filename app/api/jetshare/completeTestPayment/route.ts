import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { z } from 'zod';

// Validation schema for the request body
const completeTestPaymentSchema = z.object({
  offer_id: z.string().uuid(),
  payment_method: z.enum(['card', 'crypto']),
  payment_intent_id: z.string(),
  transaction_reference: z.string(),
  payment_details: z.object({}).passthrough(),
});

// Ensure the response is not cached
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('completeTestPayment API called');
  
  // Log request headers for debugging
  const reqHeaders = Object.fromEntries(request.headers.entries());
  const cookieHeader = reqHeaders.cookie || '';
  console.log('Request headers:', {
    cookie: cookieHeader ? `Present (length: ${cookieHeader.length})` : 'Missing',
    'content-type': reqHeaders['content-type'] || 'Missing',
    authorization: reqHeaders.authorization ? 'Present' : 'Missing',
    host: reqHeaders.host || 'Missing',
    origin: reqHeaders.origin || 'Missing',
    referer: reqHeaders.referer || 'Missing',
  });
  
  // Log cookie details (sanitized) for debugging
  const cookieNames = cookieHeader ? cookieHeader.split(';').map(c => c.split('=')[0].trim()) : [];
  console.log('Cookie names present:', cookieNames);
  
  // Check for auth cookies specifically
  const hasAuthCookies = cookieNames.some(name => 
    name.includes('supabase-auth-token') || 
    name.includes('sb-') || 
    name.startsWith('sb_')
  );
  console.log('Auth cookies detected:', hasAuthCookies);
  
  try {
    // Create Supabase client with the request cookies
    const supabase = await createClient();
    
    // Try multiple approaches to get the user
    let user = null;
    let authError = null;
    
    // Approach 1: Try standard getUser
    const authResult = await supabase.auth.getUser();
    if (!authResult.error && authResult.data.user) {
      user = authResult.data.user;
      console.log('User authenticated via getUser:', user.id, user.email);
    } else {
      authError = authResult.error;
      console.log('getUser failed, trying getSession next...');
      
      // Approach 2: Try getSession as fallback
      const sessionResult = await supabase.auth.getSession();
      if (!sessionResult.error && sessionResult.data.session?.user) {
        user = sessionResult.data.session.user;
        console.log('User authenticated via getSession:', user.id, user.email);
        
        // Also try to refresh the token if we're here
        try {
          console.log('Attempting to refresh auth token...');
          const refreshResult = await supabase.auth.refreshSession();
          if (!refreshResult.error) {
            console.log('Successfully refreshed auth token');
            // Update user with refreshed data
            user = refreshResult.data.user || user;
          } else {
            console.warn('Failed to refresh token, continuing with existing session');
          }
        } catch (refreshError) {
          console.warn('Error refreshing token:', refreshError);
        }
      } else {
        console.error('Both authentication methods failed:', authResult.error, sessionResult.error);
      }
    }
    
    // If no authenticated user found after all attempts
    if (!user) {
      console.error('No authenticated user found in completeTestPayment');
      return NextResponse.json({ 
        error: 'Authentication required', 
        message: 'You must be logged in to complete this payment' 
      }, { status: 401 });
    }
    
    console.log('Authenticated user for payment:', user.id, user.email);
    
    // Parse and validate the request body
    let body;
    try {
      body = await request.json();
      console.log('Request body:', body);
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json({ 
        error: 'Invalid request body', 
        details: 'The request body could not be parsed' 
      }, { status: 400 });
    }
    
    const validationResult = completeTestPaymentSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('Invalid request data:', validationResult.error.format());
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { 
      offer_id, 
      payment_method, 
      payment_intent_id, 
      transaction_reference,
      payment_details 
    } = validationResult.data;
    
    // Get the offer details
    const { data: offer, error: offerError } = await supabase
      .from('jetshare_offers')
      .select('*')
      .eq('id', offer_id)
      .single();
    
    if (offerError) {
      console.error('Error fetching offer:', offerError);
      return NextResponse.json(
        { error: 'Error fetching offer details', details: offerError.message },
        { status: 404 }
      );
    }
    
    // Validate that the offer can be paid for
    if (offer.status === 'completed') {
      return NextResponse.json(
        { error: 'This offer has already been completed and paid for' },
        { status: 409 }
      );
    }
    
    if (offer.status !== 'accepted') {
      return NextResponse.json(
        { error: `Offer is not in a valid state for payment, current status: ${offer.status}` },
        { status: 400 }
      );
    }
    
    if (offer.matched_user_id !== user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to pay for this offer' },
        { status: 403 }
      );
    }
    
    // Calculate payment details
    const amount = offer.requested_share_amount;
    const handlingFee = Math.round(amount * 0.075); // 7.5% handling fee
    const totalAmount = amount + handlingFee;
    
    console.log('Payment details:', { 
      amount, 
      handlingFee, 
      totalAmount, 
      paymentMethod: payment_method 
    });
    
    // For testing - simulate a successful payment
    // In a real implementation, this would call the Stripe or Coinbase APIs
    
    // Log the transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('jetshare_transactions')
      .insert([{
        offer_id,
        amount,
        payment_method,
        payment_status: 'completed', // Mark as completed immediately for test purposes
        transaction_reference,
        payer_user_id: user.id,
        recipient_user_id: offer.user_id,
        handling_fee: handlingFee,
        transaction_date: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (transactionError) {
      console.error('Error logging transaction:', transactionError);
      return NextResponse.json(
        { error: 'Failed to log transaction', details: transactionError.message },
        { status: 500 }
      );
    }
    
    // Update the offer status to completed
    const { error: updateError } = await supabase
      .from('jetshare_offers')
      .update({ status: 'completed' })
      .eq('id', offer_id);
    
    if (updateError) {
      console.error('Error updating offer status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update offer status', details: updateError.message },
        { status: 500 }
      );
    }
    
    // Get the user's current auth session for cookie propagation
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    const refreshToken = sessionData?.session?.refresh_token;

    // Create the response object
    const response = NextResponse.json({
      success: true,
      message: 'Test payment completed successfully',
      transaction_id: transaction.id,
      offer_id: offer.id
    });

    // Set auth cookies if available to maintain session continuity
    if (accessToken && refreshToken) {
      // Add session cookies with appropriate settings
      response.cookies.set('sb-access-token', accessToken, {
        path: '/',
        maxAge: 60 * 60, // 1 hour
        sameSite: 'lax',
        httpOnly: true
      });
      
      response.cookies.set('sb-refresh-token', refreshToken, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax',
        httpOnly: true
      });
      
      // Also set a plain auth flag for the client
      response.cookies.set('auth-state', 'authenticated', {
        path: '/',
        maxAge: 60 * 60, // 1 hour
        sameSite: 'lax'
      });
    }

    return response;
    
  } catch (error) {
    console.error('Error processing test payment:', error);
    
    return NextResponse.json(
      { error: 'Failed to process payment', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Add OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}