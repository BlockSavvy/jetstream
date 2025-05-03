import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createBTCPayInvoice, updateOfferPaymentStatus } from '@/lib/services/btcpay-api';
import Stripe from 'stripe';

// Ensure the response is not cached
export const dynamic = 'force-dynamic';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(request: NextRequest) {
  try {
    // Get the Supabase client
    const supabase = await createClient();
    
    // Parse the request body
    const body = await request.json();
    const { offer_id, payment_method, user_id, payment_details, pay_later = false } = body;
    
    if (!offer_id) {
      return NextResponse.json(
        { error: 'Missing offer ID' }, 
        { status: 400 }
      );
    }
    
    // Fetch the offer to get the correct amount and details
    const { data: offer, error: offerError } = await supabase
      .from('jetshare_offers')
      .select(`
        *,
        user:user_id (id, email, full_name),
        matched_user:matched_user_id (id, email, full_name)
      `)
      .eq('id', offer_id)
      .single();
      
    if (offerError || !offer) {
      console.error('Error fetching offer:', offerError);
      return NextResponse.json(
        { error: 'Failed to fetch offer details' }, 
        { status: 500 }
      );
    }
    
    // Verify the offer is in an accepted state
    if (offer.status !== 'accepted' && offer.status !== 'accepted_but_unpaid') {
      return NextResponse.json(
        { error: `Offer is not in accepted state. Current status: ${offer.status}` }, 
        { status: 400 }
      );
    }
    
    // Check if this is a "Pay Later" request
    if (pay_later === true) {
      console.log('Processing "Pay Later" request for offer:', offer_id);
      
      try {
        // Update the offer as accepted but unpaid with an expiration time
        await updateOfferPaymentStatus(
          offer_id,
          'pending',
          payment_method === 'btc' ? 'btcpay' : 'stripe',
          { pay_later: true }
        );
        
        return NextResponse.json({
          success: true,
          message: 'Offer marked as accepted and pending payment',
          data: {
            offer_id,
            expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
            redirect_url: `/gdyup/dashboard?offerId=${offer_id}&status=pending`,
            force_redirect: true
          }
        });
      } catch (error) {
        console.error('Error updating offer for pay later:', error);
        return NextResponse.json(
          { error: 'Failed to update offer payment status' }, 
          { status: 500 }
        );
      }
    }
    
    // Process payment based on the selected method
    if (payment_method === 'btc' || payment_method === 'bitcoin' || payment_method === 'crypto') {
      // Process Bitcoin payment via BTCPay Server
      try {
        // Prepare BTCPay Server invoice data
        const invoiceData = {
          price: offer.requested_share_amount,
          currency: 'USD',
          orderId: `GDYUP-${offer_id}`,
          itemDesc: `Flight share: ${offer.departure_location} to ${offer.arrival_location}`,
          buyerEmail: offer.matched_user?.email || undefined,
          redirectURL: `${process.env.NEXT_PUBLIC_APP_URL || 'https://fly.gdyup.xyz'}/gdyup/payment/success?offer_id=${offer_id}`,
          redirectAutomatically: true,
          expirationTime: 3600, // 1 hour expiration
        };
        
        // Create a BTCPay invoice
        const invoice = await createBTCPayInvoice(invoiceData);
        
        // Update the offer with payment details
        await updateOfferPaymentStatus(
          offer_id,
          'pending',
          'btcpay',
          {
            invoice_id: invoice.id,
            checkout_url: invoice.checkoutLink,
            created_at: new Date().toISOString()
          }
        );
        
        return NextResponse.json({
          success: true,
          message: 'BTC payment initiated',
          data: {
            invoice_id: invoice.id,
            checkout_url: invoice.checkoutLink,
            redirect_url: invoice.checkoutLink,
            force_redirect: true
          }
        });
      } catch (error) {
        console.error('Error processing BTC payment:', error);
        return NextResponse.json(
          { error: 'Failed to process BTC payment' }, 
          { status: 500 }
        );
      }
    } else if (payment_method === 'card' || payment_method === 'stripe') {
      // Process Stripe payment
      try {
        // In a real implementation, we'd use the Stripe SDK to create a payment intent
        // For this implementation, we're simulating a successful payment
        
        // Calculate the total amount including fees
        const amount = Math.round(offer.requested_share_amount * 100); // Stripe uses cents
        const fee = Math.round(amount * 0.075); // 7.5% fee
        const total = amount + fee;
        
        // Create a Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: total,
          currency: 'usd',
          description: `Flight share: ${offer.departure_location} to ${offer.arrival_location}`,
          receipt_email: offer.matched_user?.email,
          metadata: {
            offer_id,
            type: 'jetshare',
            user_id: user_id || offer.matched_user_id,
          },
          automatic_payment_methods: {
            enabled: true,
          }
        });
        
        // Update the offer with payment details
        await updateOfferPaymentStatus(
          offer_id,
          'paid', // Mark as paid immediately for this example
          'stripe',
          {
            payment_intent_id: paymentIntent.id,
            amount: total / 100, // Convert back to dollars
            created_at: new Date().toISOString()
          }
        );
        
        return NextResponse.json({
          success: true,
          message: 'Payment processed successfully',
          data: {
            payment_intent_id: paymentIntent.id,
            client_secret: paymentIntent.client_secret,
            redirect_url: `/gdyup/payment/success?offer_id=${offer_id}&payment_intent_id=${paymentIntent.id}`,
            redirect_now: true
          }
        });
      } catch (error) {
        console.error('Error processing Stripe payment:', error);
        return NextResponse.json(
          { error: 'Failed to process card payment' }, 
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid payment method' }, 
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Unhandled error in process-payment:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Supabase-Auth, x-user-id, x-token-auth',
    'Access-Control-Allow-Credentials': 'true',
  };
  
  return NextResponse.json({}, { headers: corsHeaders });
} 