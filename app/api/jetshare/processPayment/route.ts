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
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse and validate the request body
    const body = await request.json();
    const validationResult = processPaymentSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { offer_id, payment_method, payment_details } = validationResult.data;
    
    // Get the offer details
    const offer = await getJetShareOfferById(offer_id);
    
    // Check if the offer is in the correct state
    if (offer.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Offer is not in accepted state' },
        { status: 400 }
      );
    }
    
    // Ensure the user is the one who accepted the offer
    if (offer.matched_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - only the user who accepted the offer can process payment' },
        { status: 403 }
      );
    }
    
    let paymentIntent;
    let checkoutInfo;
    let transactionReference;
    
    // Process payment based on the selected method
    if (payment_method === 'fiat') {
      // Process Stripe payment
      if (!stripe) {
        return NextResponse.json(
          { error: 'Stripe payment processing is not configured' },
          { status: 500 }
        );
      }
      
      // Create a payment intent
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(offer.requested_share_amount * 100), // Convert to cents
        currency: 'usd',
        description: `JetShare payment for flight from ${offer.departure_location} to ${offer.arrival_location}`,
        metadata: {
          offerId: offer_id,
          userId: user.id,
          recipientId: offer.user_id,
        },
      });
      
      transactionReference = paymentIntent.id;
    } else if (payment_method === 'crypto') {
      // Process Coinbase Commerce payment
      if (!process.env.COINBASE_COMMERCE_API_KEY) {
        return NextResponse.json(
          { error: 'Coinbase Commerce is not configured' },
          { status: 500 }
        );
      }
      
      // Create a charge
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
    }
    
    // Calculate handling fee
    const handlingFee = await calculateHandlingFee(offer.requested_share_amount);
    
    // Log the transaction
    await logJetShareTransaction({
      offer_id,
      amount: offer.requested_share_amount,
      payment_method,
      payment_status: 'pending',
      transaction_reference: transactionReference,
      payer_user_id: user.id,
      recipient_user_id: offer.user_id,
      handling_fee: handlingFee
    });
    
    // Return the payment details
    return NextResponse.json({
      success: true,
      payment_method,
      ...(paymentIntent && {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      ...(checkoutInfo && { checkoutInfo }),
    }, { status: 200 });
  } catch (error) {
    console.error('Error processing JetShare payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment', message: (error as Error).message },
      { status: 500 }
    );
  }
} 