import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getJetShareOfferById, calculateHandlingFee, logJetShareTransaction } from '@/lib/services/jetshare';
import { z } from 'zod';
import Stripe from 'stripe';
import { Client, Charge } from 'coinbase-commerce-node';

// Initialize payment providers
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY) 
  : null;

if (process.env.COINBASE_COMMERCE_API_KEY) {
  Client.init(process.env.COINBASE_COMMERCE_API_KEY);
}

// Create a schema for validating the request body
const processPaymentSchema = z.object({
  offer_id: z.string().uuid(),
  payment_method: z.enum(['fiat', 'crypto']),
  payment_details: z.object({
    amount: z.number().positive(),
  }).passthrough(),
});

export async function POST(request: NextRequest) {
  console.log('processPayment API called');
  
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
  
  try {
    // Check cookies to help debug auth issues
    const cookieString = request.headers.get('cookie') || '';
    console.log('Cookie header present:', !!cookieString, 'Length:', cookieString.length);
    if (cookieString) {
      // Log the cookie names present (not values for security)
      const cookieNames = cookieString.split(';').map(c => c.trim().split('=')[0]);
      console.log('Cookie names present:', cookieNames);
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
      console.error('No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized', message: 'You must be logged in to process a payment' }, { status: 401 });
    }
    
    const user = data.user;
    console.log('Authenticated user:', user.id, user.email || 'no email');

    // Parse and validate the request body
    const body = await request.json();
    console.log('Request body:', body);
    
    const validationResult = processPaymentSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('Invalid request data:', validationResult.error.format());
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { offer_id, payment_method, payment_details } = validationResult.data;
    
    // Get the offer details
    console.log('Getting offer details for:', offer_id);
    let offer;
    try {
      offer = await getJetShareOfferById(offer_id);
      console.log('Offer details:', {
        id: offer.id,
        status: offer.status,
        user_id: offer.user_id,
        matched_user_id: offer.matched_user_id || 'none'
      });
      
      // Check if the offer is in a valid state for payment
      if (offer.status === 'completed') {
        console.error('Offer is already completed, cannot process payment');
        return NextResponse.json(
          { error: 'This offer has already been completed and paid for' },
          { status: 409 }
        );
      }
      
      // Check that the offer is accepted and matched to the current user
      if (offer.status !== 'accepted') {
        console.error('Offer is not in accepted state, current status:', offer.status);
        return NextResponse.json(
          { error: `Offer is not in a valid state for payment, current status: ${offer.status}` },
          { status: 400 }
        );
      }
      
      if (offer.matched_user_id !== user.id) {
        console.error('User mismatch: offer is matched to', offer.matched_user_id, 'but payment attempt from', user.id);
        return NextResponse.json(
          { error: 'You are not authorized to pay for this offer' },
          { status: 403 }
        );
      }
      
      // Make sure we don't charge the offer creator
      if (offer.user_id === user.id) {
        console.error('Offer creator attempting to pay for their own offer');
        return NextResponse.json(
          { error: 'You cannot pay for your own offer' },
          { status: 400 }
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
      
      // Rest of payment processing code...
    } catch (offerError) {
      console.error('Error getting offer details:', offerError);
      throw offerError;
    }
    
    let paymentIntent;
    let checkoutInfo;
    let transactionReference;
    
    // Process payment based on the selected method
    if (payment_method === 'fiat') {
      // Process Stripe payment
      if (!stripe) {
        console.error('Stripe not configured');
        return NextResponse.json(
          { error: 'Stripe payment processing is not configured' },
          { status: 500 }
        );
      }
      
      try {
        // Create a payment intent
        console.log('Creating Stripe payment intent for offer:', offer_id);
        console.log('Amount:', Math.round(offer.requested_share_amount * 100));
        
        // Use automatic_payment_methods only and remove payment_method_types to avoid API conflicts
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(offer.requested_share_amount * 100), // Convert to cents
          currency: 'usd',
          description: `JetShare payment for flight from ${offer.departure_location} to ${offer.arrival_location}`,
          metadata: {
            offerId: offer_id,
            userId: user.id,
            recipientId: offer.user_id,
          },
          automatic_payment_methods: { enabled: true },
        });
        
        console.log('Payment Intent created successfully:', {
          id: paymentIntent.id,
          clientSecret: paymentIntent.client_secret ? 'CLIENT_SECRET_EXISTS' : 'NO_CLIENT_SECRET',
          amount: paymentIntent.amount,
          status: paymentIntent.status,
        });
        
        transactionReference = paymentIntent.id;
      } catch (stripeError) {
        console.error('Error creating Stripe payment intent:', stripeError);
        
        // Return a more specific error for Stripe issues
        const errorMessage = stripeError instanceof Stripe.errors.StripeError 
          ? stripeError.message 
          : 'Unknown Stripe error occurred';
          
        return NextResponse.json(
          { 
            error: 'Failed to create payment', 
            message: `Stripe error: ${errorMessage}` 
          },
          { status: 400 }
        );
      }
    } else if (payment_method === 'crypto') {
      // Process Coinbase Commerce payment
      if (!process.env.COINBASE_COMMERCE_API_KEY) {
        console.error('Coinbase Commerce not configured');
        return NextResponse.json(
          { error: 'Coinbase Commerce is not configured' },
          { status: 500 }
        );
      }
      
      // Create a charge
      try {
        console.log('Creating Coinbase Commerce charge');
        const charge = await Charge.create({
          name: 'JetShare Flight Payment',
          description: `Payment for flight from ${offer.departure_location} to ${offer.arrival_location}`,
          local_price: {
            amount: offer.requested_share_amount.toString(),
            currency: 'USD',
          },
          pricing_type: 'fixed_price',
          metadata: {
            offerId: offer_id,
            userId: user.id,
            recipientId: offer.user_id,
          },
        });
        
        checkoutInfo = {
          checkoutId: charge.id,
          checkoutUrl: charge.hosted_url,
          expiresAt: charge.expires_at,
        };
        
        transactionReference = charge.id;
        console.log('Crypto charge created:', { checkoutId: charge.id });
      } catch (coinbaseError) {
        console.error('Error creating Coinbase Commerce charge:', coinbaseError);
        throw coinbaseError;
      }
    }
    
    // Calculate handling fee
    const handlingFee = await calculateHandlingFee(offer.requested_share_amount);
    console.log('Handling fee calculated:', handlingFee);
    
    // Log the transaction
    try {
      const transaction = await logJetShareTransaction({
        offer_id,
        amount: offer.requested_share_amount,
        payment_method,
        payment_status: 'pending',
        transaction_reference: transactionReference,
        payer_user_id: user.id,
        recipient_user_id: offer.user_id,
        handling_fee: handlingFee
      });
      
      console.log('Transaction logged:', transaction.id);
    } catch (transactionError) {
      console.error('Error logging transaction:', transactionError);
      // Continue with the payment process even if logging fails
    }
    
    // Return the payment details
    const response = {
      success: true,
      payment_method,
      ...(paymentIntent && {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      ...(checkoutInfo && { checkoutInfo }),
    };
    
    console.log('Returning payment response:', {
      ...response,
      clientSecret: response.clientSecret ? 'CLIENT_SECRET_EXISTS' : 'NO_CLIENT_SECRET',
    });
    
    return NextResponse.json(response, { 
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
  } catch (error) {
    console.error('Error processing JetShare payment:', error);
    
    // Provide a more detailed error response
    let errorMessage = 'Failed to process payment';
    let statusCode = 500;
    
    if (error instanceof Stripe.errors.StripeError) {
      errorMessage = `Stripe error: ${error.message}`;
      statusCode = 400;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: 'Failed to process payment', message: errorMessage },
      { status: statusCode }
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