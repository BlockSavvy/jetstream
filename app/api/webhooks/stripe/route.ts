import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase-server';

// Initialize Stripe conditionally
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY) 
  : null;

export async function POST(request: NextRequest) {
  console.log('Stripe webhook received');
  
  // Check if Stripe is properly initialized
  if (!stripe) {
    console.error('Stripe API key is not configured');
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    );
  }

  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  // Verify the webhook signature (if in production)
  let event;
  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      // In development, just parse the payload
      event = JSON.parse(payload);
      console.log('Development mode: skipping signature verification');
    }
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('Webhook event type:', event.type);

  // Connect to Supabase
  const supabase = await createClient();

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Check if this is a JetShare payment using metadata
        if (paymentIntent.metadata?.offerId) {
          console.log('Processing JetShare payment for offer:', paymentIntent.metadata.offerId);
          
          // Update the transaction status to completed
          const { data: transaction, error: txError } = await supabase
            .from('jetshare_transactions')
            .update({ payment_status: 'completed' })
            .eq('transaction_reference', paymentIntent.id)
            .select()
            .single();
            
          if (txError) {
            console.error('Error updating transaction:', txError);
          } else {
            console.log('Transaction updated successfully:', transaction.id);
            
            // Update the offer status to completed
            const { error: offerError } = await supabase
              .from('jetshare_offers')
              .update({ status: 'completed' })
              .eq('id', paymentIntent.metadata.offerId);
              
            if (offerError) {
              console.error('Error updating offer status:', offerError);
            } else {
              console.log('Offer status updated to completed');
            }
          }
        } else {
          // Handle other payment intents (not JetShare)
          console.log('Non-JetShare payment, skipping JetShare processing');
        }
        break;
        
      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', failedPaymentIntent.id);
        
        // Check if this is a JetShare payment
        if (failedPaymentIntent.metadata?.offerId) {
          console.log('Failed JetShare payment for offer:', failedPaymentIntent.metadata.offerId);
          
          // Update the transaction status to failed
          const { error: txError } = await supabase
            .from('jetshare_transactions')
            .update({ payment_status: 'failed' })
            .eq('transaction_reference', failedPaymentIntent.id);
            
          if (txError) {
            console.error('Error updating transaction status to failed:', txError);
          }
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