import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { 
      flightId, 
      userId, 
      seatsBooked, 
      totalPrice, 
      specialRequests, 
      paymentMethod,
      paymentIntentId 
    } = await request.json();

    if (!flightId || !userId || !seatsBooked || !totalPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if flight exists and has enough seats
    const { data: flight, error: flightError } = await supabase
      .from('flights')
      .select('*')
      .eq('id', flightId)
      .single();

    if (flightError || !flight) {
      return NextResponse.json(
        { error: 'Flight not found' },
        { status: 404 }
      );
    }

    if (flight.available_seats < seatsBooked) {
      return NextResponse.json(
        { error: 'Not enough seats available' },
        { status: 400 }
      );
    }

    // Generate a unique ticket code
    const ticketCode = `JS-${Math.floor(Math.random() * 10000000)}`;
    
    // Determine payment status based on payment method
    const paymentStatus = paymentMethod === 'token' ? 'completed' : 'pending';

    // Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([
        {
          id: uuidv4(),
          user_id: userId,
          flight_id: flightId,
          seats_booked: seatsBooked,
          booking_status: paymentMethod === 'token' ? 'confirmed' : 'pending',
          total_price: totalPrice,
          payment_status: paymentStatus,
          ticket_code: ticketCode,
          special_requests: specialRequests || null,
          payment_method: paymentMethod || 'credit_card'
        }
      ])
      .select()
      .single();

    if (bookingError) {
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    // Update the flight's available seats
    const { error: updateError } = await supabase
      .from('flights')
      .update({ available_seats: flight.available_seats - seatsBooked })
      .eq('id', flightId);

    if (updateError) {
      // If updating seats fails, we should roll back the booking
      await supabase
        .from('bookings')
        .delete()
        .eq('id', booking.id);

      return NextResponse.json(
        { error: 'Failed to update flight seats' },
        { status: 500 }
      );
    }

    // If there's a payment intent ID, update any existing payment record
    if (paymentIntentId) {
      // Update the payment intent with the booking ID
      await supabase
        .from('payment_intents')
        .update({ 
          status: paymentMethod === 'token' ? 'completed' : 'pending',
          booking_id: booking.id 
        })
        .eq('id', paymentIntentId);
    }

    // Create a payment record if one doesn't exist (for traditional payment methods)
    if (!paymentIntentId && paymentMethod !== 'token') {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([
          {
            id: uuidv4(),
            booking_id: booking.id,
            user_id: userId,
            amount: totalPrice,
            currency: 'USD',
            payment_method: paymentMethod || 'credit_card',
            payment_status: paymentStatus,
            payment_details: JSON.stringify({
              method: paymentMethod || 'credit_card',
              timestamp: new Date().toISOString()
            })
          }
        ]);

      if (paymentError) {
        console.error('Failed to create payment record but booking succeeded');
      }
    }

    // If payment method is token-based, immediately mark the booking as confirmed
    if (paymentMethod === 'token') {
      // Update token payment record with booking ID
      const { data: payments } = await supabase
        .from('payments')
        .select('id')
        .eq('user_id', userId)
        .eq('payment_method', 'token')
        .is('booking_id', null)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (payments && payments.length > 0) {
        await supabase
          .from('payments')
          .update({ booking_id: booking.id })
          .eq('id', payments[0].id);
      }
    }

    return NextResponse.json({
      success: true,
      booking: {
        ...booking,
        ticket_code: ticketCode
      }
    });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 