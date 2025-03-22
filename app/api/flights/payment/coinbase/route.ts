import { NextRequest, NextResponse } from 'next/server';
import { Client, resources } from 'coinbase-commerce-node';
import { createClient } from '@/lib/supabase-server';

// Initialize Coinbase Commerce client
let coinbaseClient;
// TypeScript needs a type for Charge
let Charge: any;

if (process.env.COINBASE_COMMERCE_API_KEY) {
  coinbaseClient = Client.init(process.env.COINBASE_COMMERCE_API_KEY);
  ({ Charge } = resources);
}

export async function POST(request: NextRequest) {
  try {
    // Check if Coinbase Commerce is initialized
    if (!Charge) {
      return NextResponse.json(
        { error: 'Coinbase Commerce is not configured' },
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

    // Create a new charge with Coinbase Commerce
    const chargeData = {
      name: `Flight Booking (ID: ${flightId})`,
      description: `Booking for ${seatsBooked} seat(s)`,
      local_price: {
        amount: totalPrice.toString(),
        currency: 'USD'
      },
      pricing_type: 'fixed_price',
      metadata: {
        flightId,
        userId,
        seatsBooked: seatsBooked.toString()
      },
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/flights/confirmation`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/flights`
    };

    const charge = await Charge.create(chargeData);

    // Store the charge in Supabase
    const supabase = await createClient();
    const { error } = await supabase
      .from('payment_intents')
      .insert([
        {
          id: charge.id,
          user_id: userId,
          flight_id: flightId,
          amount: totalPrice,
          currency: 'USD',
          payment_method: 'coinbase',
          status: 'created',
          metadata: {
            checkoutUrl: charge.hosted_url,
            seatsBooked
          }
        }
      ]);

    if (error) {
      console.error('Error storing Coinbase charge:', error);
      // We continue because the charge is created in Coinbase
    }

    return NextResponse.json({
      success: true,
      coinbaseCheckout: {
        id: charge.id,
        checkoutUrl: charge.hosted_url,
        amount: totalPrice,
        currency: 'USD'
      }
    });
  } catch (error: any) {
    console.error('Coinbase payment error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 