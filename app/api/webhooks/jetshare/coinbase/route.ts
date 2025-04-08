import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { verifyCoinbaseWebhookSignature } from '@/lib/services/payment-api';

export async function POST(request: NextRequest) {
  try {
    // Get the signature from headers
    const signature = request.headers.get('x-cc-webhook-signature') || '';
    
    // Get the webhook secret
    const webhookSecret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET || '';
    
    if (!webhookSecret) {
      console.error('Coinbase webhook secret is not configured');
      return NextResponse.json(
        { error: 'Webhook not properly configured' },
        { status: 500 }
      );
    }
    
    // Get the request body as text
    const rawBody = await request.text();
    
    // Verify the webhook signature
    try {
      const isValid = verifyCoinbaseWebhookSignature(rawBody, signature, webhookSecret);
      
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }
    
    // Parse the event data
    const event = JSON.parse(rawBody);
    
    const supabase = await createClient();
    
    // Handle the event based on type
    switch (event.type) {
      case 'charge:confirmed':
        // Payment was successful
        const charge = event.data;
        
        // Get the metadata to identify the JetShare offer
        const { offerId, userId, recipientId } = charge.metadata || {};
        
        if (offerId && userId && recipientId) {
          // Update the transaction status in the database
          const { error: transactionError } = await supabase
            .from('jetshare_transactions')
            .update({ 
              payment_status: 'completed',
              transaction_date: new Date().toISOString()
            })
            .eq('transaction_reference', charge.id);
          
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
          
          console.log(`JetShare crypto payment completed for offer ${offerId}`);
        }
        break;
      
      case 'charge:failed':
        // Payment failed
        const failedCharge = event.data;
        
        // Update the transaction status in the database
        const { error: failureError } = await supabase
          .from('jetshare_transactions')
          .update({ 
            payment_status: 'failed',
            transaction_date: new Date().toISOString() 
          })
          .eq('transaction_reference', failedCharge.id);
        
        if (failureError) {
          console.error('Error updating transaction status on failure:', failureError);
        }
        
        console.log(`JetShare crypto payment failed for charge ${failedCharge.id}`);
        break;
      
      default:
        // Unexpected event type
        console.log(`Unhandled Coinbase Commerce event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error handling Coinbase Commerce webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', message: (error as Error).message },
      { status: 500 }
    );
  }
} 