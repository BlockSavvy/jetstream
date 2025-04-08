import { NextRequest, NextResponse } from 'next/server';
import { BookingFormData } from '@/app/flights/types';
import { createClient } from '@/lib/supabase-server';
import { createCoinbaseCharge, CoinbaseChargeData } from '@/lib/services/payment-api';

export async function POST(request: NextRequest) {
  try {
    const data: BookingFormData = await request.json();
    const { flightId, userId, seatsBooked, totalPrice } = data;
    
    if (!flightId || !userId || !seatsBooked || !totalPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Get flight details
    const { data: flight, error: flightError } = await supabase
      .from('flights')
      .select('*, jets:jet_id(*)')
      .eq('id', flightId)
      .single();
    
    if (flightError || !flight) {
      console.error('Error getting flight:', flightError);
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
    }
    
    // Initialize Coinbase Commerce API
    const apiKey = process.env.COINBASE_COMMERCE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Coinbase API key not configured' }, { status: 500 });
    }
    
    // Create a charge using our server-side API
    const chargeData: CoinbaseChargeData = {
      name: `JetStream Flight Booking: ${flight.origin_airport} to ${flight.destination_airport}`,
      description: `${seatsBooked} seat(s) on ${flight.jets.manufacturer} ${flight.jets.model}`,
      local_price: {
        amount: totalPrice.toString(),
        currency: 'USD'
      },
      pricing_type: 'fixed_price',
      metadata: {
        flightId,
        userId,
        seatsBooked,
        bookingType: 'flight'
      },
      redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/flights/booking/confirm?flightId=${flightId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/flights/${flightId}?cancelled=true`
    };
    
    // Call our API client instead of the Coinbase SDK
    const chargeResponse = await createCoinbaseCharge(chargeData, apiKey);
    
    // Create a booking record
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        flight_id: flightId,
        seats_booked: seatsBooked,
        total_price: totalPrice,
        payment_method: 'coinbase',
        payment_status: 'pending',
        payment_id: chargeResponse.data.id
      })
      .select()
      .single();
    
    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json({ error: 'Failed to create booking record' }, { status: 500 });
    }
    
    return NextResponse.json({
      id: chargeResponse.data.id,
      checkoutUrl: chargeResponse.data.hosted_url,
      amount: totalPrice,
      currency: 'USD',
      bookingId: booking.id
    });
  } catch (error) {
    console.error('Error processing Coinbase payment:', error);
    return NextResponse.json(
      { error: 'Failed to process Coinbase payment' },
      { status: 500 }
    );
  }
} 