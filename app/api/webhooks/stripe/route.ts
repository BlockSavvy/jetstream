import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase-server';
import { processBookingTickets } from '@/lib/services/tickets';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

// Helper for confirming a booking
async function confirmBooking(bookingId: string, supabase: any) {
  // Update booking status to confirmed
  await supabase
    .from('bookings')
    .update({ booking_status: 'confirmed', payment_status: 'completed' })
    .eq('id', bookingId);

  // Update payment intent status
  await supabase
    .from('payment_intents')
    .update({ status: 'completed' })
    .eq('booking_id', bookingId);
    
  // Get user details for ticket generation
  const { data: bookingData } = await supabase
    .from('bookings')
    .select('*, users(*)')
    .eq('id', bookingId)
    .single();
    
  if (bookingData && bookingData.users) {
    // Generate tickets for the booking
    try {
      await processBookingTickets(bookingId, {
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

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Connect to Supabase
  const supabase = await createClient();

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Find the booking associated with this payment intent
        const { data: paymentRecord, error: paymentError } = await supabase
          .from('payment_intents')
          .select('booking_id')
          .eq('id', paymentIntent.id)
          .single();

        if (paymentError || !paymentRecord) {
          console.error('Payment record not found for intent:', paymentIntent.id);
          break;
        }

        // Confirm the booking
        await confirmBooking(paymentRecord.booking_id, supabase);
        break;

      case 'charge.succeeded':
        const charge = event.data.object as Stripe.Charge;
        
        if (charge.payment_intent) {
          // Find the booking associated with this payment intent
          const { data: intentRecord, error: intentError } = await supabase
            .from('payment_intents')
            .select('booking_id')
            .eq('id', charge.payment_intent)
            .single();

          if (intentError || !intentRecord) {
            console.error('Payment record not found for charge:', charge.id);
            break;
          }

          // Confirm the booking
          await confirmBooking(intentRecord.booking_id, supabase);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
} 