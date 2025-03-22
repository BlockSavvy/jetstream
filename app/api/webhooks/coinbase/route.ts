import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'coinbase-commerce-node';
// Add module declaration to satisfy TypeScript
// @ts-ignore
import Webhook from 'coinbase-commerce-node/lib/Webhook';
import { createClient } from '@/lib/supabase-server';
import { processBookingTickets } from '@/lib/services/tickets';

// Initialize Coinbase Commerce client conditionally
let WebhookClass: any = null;

if (process.env.COINBASE_COMMERCE_API_KEY) {
  Client.init(process.env.COINBASE_COMMERCE_API_KEY);
  WebhookClass = Webhook;
}

export async function POST(request: NextRequest) {
  try {
    // Check if Coinbase Commerce is properly initialized
    if (!WebhookClass) {
      return NextResponse.json(
        { error: 'Coinbase Commerce is not configured' },
        { status: 500 }
      );
    }

    // Get the request body and signature
    const payload = await request.text();
    const signature = request.headers.get('x-cc-webhook-signature') || '';
    const webhookSecret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET || '';

    // Verify the webhook signature
    let event;
    try {
      event = WebhookClass.verifyEventBody(payload, signature, webhookSecret);
    } catch (error) {
      console.error('Invalid webhook signature:', error);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Connect to Supabase
    const supabase = await createClient();

    // Process the event
    if (event.type === 'charge:confirmed') {
      const charge = event.data;
      
      // Find the payment intent record
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('payment_intents')
        .select('booking_id')
        .eq('id', charge.id)
        .single();

      if (paymentError || !paymentRecord) {
        console.error('Payment record not found for charge:', charge.id);
        return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
      }

      // Update booking status to confirmed
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ booking_status: 'confirmed', payment_status: 'completed' })
        .eq('id', paymentRecord.booking_id);

      if (bookingError) {
        console.error('Error updating booking status:', bookingError);
        return NextResponse.json({ error: 'Error updating booking' }, { status: 500 });
      }

      // Update payment intent status
      const { error: intentError } = await supabase
        .from('payment_intents')
        .update({ status: 'completed' })
        .eq('id', charge.id);

      if (intentError) {
        console.error('Error updating payment intent status:', intentError);
      }
      
      // Get user details for ticket generation
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('*, users(*)')
        .eq('id', paymentRecord.booking_id)
        .single();
        
      if (bookingData && bookingData.users) {
        // Generate tickets for the booking
        try {
          await processBookingTickets(paymentRecord.booking_id, {
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