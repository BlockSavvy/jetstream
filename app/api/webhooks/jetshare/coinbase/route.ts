import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'coinbase-commerce-node';
import Webhook from 'coinbase-commerce-node/lib/Webhook';
import { createClient } from '@/lib/supabase-server';

// Initialize Coinbase Commerce client if API key is present
if (process.env.COINBASE_COMMERCE_API_KEY) {
  Client.init(process.env.COINBASE_COMMERCE_API_KEY);
}

export async function POST(request: NextRequest) {
  try {
    // Check if Coinbase Commerce is properly initialized
    if (!process.env.COINBASE_COMMERCE_API_KEY) {
      console.error('Coinbase Commerce API key is not configured');
      return NextResponse.json(
        { error: 'Coinbase Commerce is not configured' },
        { status: 500 }
      );
    }
    
    // Get the signature from headers
    const signature = request.headers.get('x-cc-webhook-signature') || '';
    
    // Get the webhook secret
    const webhookSecret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET || '';
    
    // Get the request body as text
    const rawBody = await request.text();
    
    let event;
    
    try {
      // Verify the webhook signature
      const webhook = new Webhook(webhookSecret);
      
      if (!webhook.verify(rawBody, signature)) {
        throw new Error('Invalid signature');
      }
      
      event = webhook.construct(rawBody);
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