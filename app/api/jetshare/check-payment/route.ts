import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { checkBTCPayInvoice, updateOfferPaymentStatus } from '@/lib/services/btcpay-api';
import Stripe from 'stripe';

// Ensure the response is not cached
export const dynamic = 'force-dynamic';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

export async function GET(request: NextRequest) {
  try {
    // Get parameters from query string
    const searchParams = request.nextUrl.searchParams;
    const offerId = searchParams.get('offer_id');
    const invoiceId = searchParams.get('invoice_id');
    const paymentIntentId = searchParams.get('payment_intent_id');
    
    if (!offerId) {
      return NextResponse.json(
        { error: 'Missing offer ID' }, 
        { status: 400 }
      );
    }
    
    // Get the Supabase client
    const supabase = await createClient();
    
    // Get the current offer status
    const { data: offer, error: offerError } = await supabase
      .from('jetshare_offers')
      .select('*')
      .eq('id', offerId)
      .single();
      
    if (offerError || !offer) {
      console.error('Error fetching offer:', offerError);
      return NextResponse.json(
        { error: 'Failed to fetch offer details' }, 
        { status: 500 }
      );
    }
    
    // If the offer is already paid or completed, return the current status
    if (offer.status === 'completed' || offer.payment_status === 'paid') {
      return NextResponse.json({
        success: true,
        status: 'paid',
        offer
      });
    }
    
    // If we have an invoice ID, check with BTCPay Server
    if (invoiceId) {
      try {
        const invoice = await checkBTCPayInvoice(invoiceId);
        
        // If the invoice is settled, update the offer status
        if (invoice.status === 'Settled' || invoice.status === 'Complete') {
          await updateOfferPaymentStatus(
            offerId,
            'paid',
            'btcpay',
            {
              invoice_id: invoiceId,
              status: 'paid',
              payment_timestamp: new Date().toISOString(),
              amount: invoice.amount,
              currency: invoice.currency
            }
          );
          
          // Fetch the updated offer
          const { data: updatedOffer } = await supabase
            .from('jetshare_offers')
            .select('*')
            .eq('id', offerId)
            .single();
            
          return NextResponse.json({
            success: true,
            status: 'paid',
            offer: updatedOffer
          });
        }
        
        // Return the current invoice status
        return NextResponse.json({
          success: true,
          status: invoice.status.toLowerCase(),
          invoice,
          offer
        });
      } catch (error) {
        console.error('Error checking BTCPay invoice:', error);
        return NextResponse.json(
          { error: 'Failed to check BTCPay invoice status' }, 
          { status: 500 }
        );
      }
    }
    
    // If we have a Stripe payment intent ID, check with Stripe
    if (paymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        // If the payment is successful, update the offer status
        if (paymentIntent.status === 'succeeded') {
          await updateOfferPaymentStatus(
            offerId,
            'paid',
            'stripe',
            {
              payment_intent_id: paymentIntentId,
              status: 'paid',
              payment_timestamp: new Date().toISOString(),
              amount: paymentIntent.amount / 100, // Convert from cents to dollars
              currency: paymentIntent.currency
            }
          );
          
          // Fetch the updated offer
          const { data: updatedOffer } = await supabase
            .from('jetshare_offers')
            .select('*')
            .eq('id', offerId)
            .single();
            
          return NextResponse.json({
            success: true,
            status: 'paid',
            offer: updatedOffer
          });
        }
        
        // Return the current payment intent status
        return NextResponse.json({
          success: true,
          status: paymentIntent.status,
          paymentIntent,
          offer
        });
      } catch (error) {
        console.error('Error checking Stripe payment intent:', error);
        return NextResponse.json(
          { error: 'Failed to check Stripe payment status' }, 
          { status: 500 }
        );
      }
    }
    
    // If we don't have any payment IDs, just return the current offer status
    return NextResponse.json({
      success: true,
      status: offer.payment_status || offer.status,
      offer
    });
  } catch (error) {
    console.error('Unhandled error in check-payment:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
} 