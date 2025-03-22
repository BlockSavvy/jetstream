import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase-server';
import { processBookingTickets } from '@/lib/services/tickets';

export async function POST(request: NextRequest) {
  try {
    const { flightId, userId, tokenId, seatsBooked, totalPrice, bookingId } = await request.json();
    
    if (!flightId || !userId || !tokenId || !seatsBooked || !totalPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Check if the token exists and has sufficient balance
    const { data: token, error: tokenError } = await supabase
      .from('fractional_tokens')
      .select('*')
      .eq('id', tokenId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    
    if (tokenError || !token) {
      return NextResponse.json(
        { error: 'Token not found or not active' },
        { status: 404 }
      );
    }
    
    // Record the token payment
    const paymentId = uuidv4();
    const { error: paymentError } = await supabase
      .from('payments')
      .insert([
        {
          id: paymentId,
          user_id: userId,
          booking_id: bookingId,
          amount: totalPrice,
          currency: 'USD',
          payment_method: 'token',
          payment_status: 'completed',
          payment_details: JSON.stringify({
            tokenId: token.id,
            timestamp: new Date().toISOString(),
          }),
        }
      ]);
    
    if (paymentError) {
      console.error('Error recording token payment:', paymentError);
      return NextResponse.json(
        { error: 'Failed to record payment' },
        { status: 500 }
      );
    }
    
    // Get user details for ticket generation
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }
    
    // Generate tickets immediately since token payments are instant
    try {
      const tickets = await processBookingTickets(bookingId, {
        passengerName: `${userData.first_name} ${userData.last_name}`,
        email: userData.email,
        phone: userData.phone,
        sendEmail: true,
        sendSMS: !!userData.phone,
      });
      
      return NextResponse.json({
        success: true,
        payment: { id: paymentId, status: 'completed' },
        tickets: tickets.map(t => t.id)
      });
    } catch (ticketError) {
      console.error('Error generating tickets:', ticketError);
      return NextResponse.json(
        { error: 'Payment successful but failed to generate tickets' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Token payment error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 