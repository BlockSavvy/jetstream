import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase-server';

// Initialize Stripe conditionally if API key is present
let stripe: Stripe | undefined;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is properly initialized
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe API is not configured' },
        { status: 500 }
      );
    }

    const { flightId, userId, seatsBooked, totalPrice } = await request.json();

    if (!flightId || !userId || !seatsBooked || !totalPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalPrice * 100), // Convert to cents for Stripe
      currency: 'usd',
      metadata: {
        flightId,
        userId,
        seatsBooked: seatsBooked.toString(),
      },
    });

    // Store the payment intent in Supabase
    const supabase = await createClient();
    const { error } = await supabase
      .from('payment_intents')
      .insert([
        {
          id: paymentIntent.id,
          user_id: userId,
          flight_id: flightId,
          amount: totalPrice,
          currency: 'USD',
          payment_method: 'stripe',
          status: 'created',
          metadata: {
            clientSecret: paymentIntent.client_secret,
            seatsBooked
          }
        }
      ]);

    if (error) {
      console.error('Error storing payment intent:', error);
      // We continue because the payment intent is created in Stripe
    }

    return NextResponse.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: totalPrice,
        currency: 'usd'
      }
    });
  } catch (error: any) {
    console.error('Stripe payment error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 