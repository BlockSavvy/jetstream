import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase-server';

// Initialize Stripe only if API key is present
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY) 
  : null;

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is properly initialized
    if (!stripe) {
      console.error('Stripe API key is not configured');
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    // Get the stripe signature from headers
    const signature = request.headers.get('stripe-signature') || '';
    
    // Get the request body as text
    const body = await request.text();
    
    let event;
    
    try {
      // Verify the webhook signature
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Handle the event based on type
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Payment was successful
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Get the metadata to identify the JetShare offer
        const { offerId, userId, recipientId } = paymentIntent.metadata;
        
        if (offerId && userId && recipientId) {
          // Update the transaction status in the database
          // This will automatically update the offer status to completed
          const { error: transactionError } = await supabase
            .from('jetshare_transactions')
            .update({ 
              payment_status: 'completed',
              transaction_date: new Date().toISOString()
            })
            .eq('transaction_reference', paymentIntent.id);
          
          if (transactionError) {
            console.error('Error updating transaction status:', transactionError);
          } else {
            // Update the offer status to completed
            const { error: offerError } = await supabase
              .from('jetshare_offers')
              .update({ status: 'completed' })
              .eq('id', offerId);
            
            if (offerError) {
              console.error('Error updating offer status:', offerError);
            }
          }
          
          console.log(`JetShare payment completed for offer ${offerId}`);
        }
        break;
      
      case 'payment_intent.payment_failed':
        // Payment failed
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update the transaction status in the database
        const { error: failureError } = await supabase
          .from('jetshare_transactions')
          .update({ 
            payment_status: 'failed',
            transaction_date: new Date().toISOString()
          })
          .eq('transaction_reference', failedPaymentIntent.id);
        
        if (failureError) {
          console.error('Error updating transaction status on failure:', failureError);
        }
        
        console.log(`JetShare payment failed for payment intent ${failedPaymentIntent.id}`);
        break;
      
      default:
        // Unexpected event type
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', message: (error as Error).message },
      { status: 500 }
    );
  }
} 