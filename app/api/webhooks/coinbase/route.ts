import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { processBookingTickets } from '@/lib/services/tickets';
import { verifyCoinbaseWebhookSignature } from '@/lib/services/payment-api';

export async function POST(request: NextRequest) {
  try {
    // Get the request body and signature
    const payload = await request.text();
    const signature = request.headers.get('x-cc-webhook-signature') || '';
    const webhookSecret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET || '';

    if (!webhookSecret) {
      console.error('Coinbase webhook secret is not configured');
      return NextResponse.json(
        { error: 'Webhook not properly configured' },
        { status: 500 }
      );
    }

    // Verify the webhook signature using our custom implementation
    let isValid = false;
    try {
      isValid = verifyCoinbaseWebhookSignature(
        payload,
        signature,
        webhookSecret
      );
      
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Parse the event data
    const event = JSON.parse(payload);

    // Connect to Supabase
    const supabase = await createClient();

    // Process the event
    if (event.type === 'charge:confirmed') {
      const charge = event.data;
      
      // Find the booking by payment_id
      const { data: bookingData, error: bookingQueryError } = await supabase
        .from('bookings')
        .select('*, users(*)')
        .eq('payment_id', charge.id)
        .single();
        
      if (bookingQueryError || !bookingData) {
        console.error('Booking not found for charge:', charge.id);
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      // Update booking status to confirmed
      const { error: bookingUpdateError } = await supabase
        .from('bookings')
        .update({ booking_status: 'confirmed', payment_status: 'completed' })
        .eq('id', bookingData.id);

      if (bookingUpdateError) {
        console.error('Error updating booking status:', bookingUpdateError);
        return NextResponse.json({ error: 'Error updating booking' }, { status: 500 });
      }
      
      // Generate tickets for the booking if user data is available
      if (bookingData && bookingData.users) {
        try {
          await processBookingTickets(bookingData.id, {
            passengerName: `${bookingData.users.first_name} ${bookingData.users.last_name}`,
            email: bookingData.users.email,
            phone: bookingData.users.phone,
            sendEmail: true,
            sendSMS: !!bookingData.users.phone,
          });
        } catch (error) {
          console.error('Error generating tickets:', error);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing Coinbase webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
} 