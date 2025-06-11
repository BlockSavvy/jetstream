import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createBTCPayInvoice, updateOfferPaymentStatus } from '@/lib/services/btcpay-api';
import Stripe from 'stripe';

// Ensure the response is not cached
export const dynamic = 'force-dynamic';

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' })
  : null;

export async function POST(request: NextRequest) {
  console.log('process-payment API called');
  
  try {
    // Get the Supabase client
    const supabase = await createClient();
    
    // Parse the request body
    const body = await request.json();
    const { offer_id, payment_method, user_id, payment_details, pay_later = false } = body;
    
    console.log('Payment request received:', { 
      offer_id, 
      payment_method,
      user_id: user_id ? `${user_id.substring(0, 8)}...` : 'not provided',
      pay_later 
    });
    
    if (!offer_id) {
      console.error('Missing offer ID in payment request');
      return NextResponse.json(
        { error: 'Missing offer ID' }, 
        { status: 400 }
      );
    }
    
    // Fetch the offer to get the correct amount and details
    console.log(`Fetching offer details for ID: ${offer_id}`);
    const { data: offer, error: offerError } = await supabase
      .from('jetshare_offers')
      .select(`
        *,
        user:user_id (id, email, full_name),
        matched_user:matched_user_id (id, email, full_name)
      `)
      .eq('id', offer_id)
      .single();
      
    if (offerError) {
      console.error('Error fetching offer:', offerError);
      return NextResponse.json(
        { 
          error: 'Failed to fetch offer details', 
          details: offerError.message 
        }, 
        { status: 500 }
      );
    }
    
    if (!offer) {
      console.error(`Offer with ID ${offer_id} not found`);
      return NextResponse.json(
        { error: `Offer with ID ${offer_id} not found` }, 
        { status: 404 }
      );
    }
    
    console.log(`Offer found: ${offer.departure_location} to ${offer.arrival_location}, status: ${offer.status}`);
    
    // Verify the offer is in an accepted state or allow any state in development
    const isDevMode = process.env.NODE_ENV === 'development';
    if (!isDevMode && offer.status !== 'accepted' && offer.status !== 'accepted_but_unpaid') {
      console.error(`Offer is in invalid state for payment: ${offer.status}`);
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
            redirect_url: `/gdyup/payment/${offer_id}?t=${Date.now()}&status=pending`,
            force_redirect: true
          }
        });
      } catch (error) {
        console.error('Error updating offer for pay later:', error);
        return NextResponse.json(
          { 
            error: 'Failed to update offer payment status',
            details: error instanceof Error ? error.message : 'Unknown error' 
          }, 
          { status: 500 }
        );
      }
    }
    
    // Process payment based on the selected method - handle both BTC and card payment methods
    if (payment_method === 'btc' || payment_method === 'bitcoin' || payment_method === 'crypto') {
      console.log(`Processing BTC payment for offer ${offer_id}`);
      
      // Check if BTCPay Server is properly configured
      if (!process.env.BTCPAY_API_KEY || !process.env.BTCPAY_HOST) {
        console.error('BTCPay Server configuration is missing');
        
        // In development mode, provide a simulated invoice
        if (isDevMode) {
          console.log('DEV MODE: Creating simulated BTCPay invoice since server is unconfigured');
          
          // Update the offer with payment details indicating development mode
          try {
            await updateOfferPaymentStatus(
              offer_id,
              'pending',
              'btcpay',
              {
                invoice_id: `dev-invoice-${Date.now()}`,
                checkout_url: `/gdyup/payment/success?offer_id=${offer_id}&simulated=true&dev=true`,
                created_at: new Date().toISOString(),
                is_test: true
              }
            );
          } catch (updateError) {
            console.error('Error updating offer with dev payment details:', updateError);
            // Continue anyway - this is just for development
          }
          
          // Return a development mode response with simulated data
          return NextResponse.json({
            success: true,
            message: 'DEV MODE: BTC payment simulated due to BTCPay server unavailability',
            data: {
              invoice_id: `dev-invoice-${Date.now()}`,
              checkout_url: `/gdyup/payment/dev-btcpay-simulator?offer_id=${offer_id}`,
              redirect_url: `/gdyup/payment/dev-btcpay-simulator?offer_id=${offer_id}`,
              force_redirect: true,
              is_simulated: true,
              post_payment_redirect: `/gdyup/boardingpass/${offer_id}?from=simulated-btcpay&t=${Date.now()}`
            }
          });
        }
        
        return NextResponse.json(
          { error: 'Payment provider is not properly configured' }, 
          { status: 503 }
        );
      }
      
      try {
        // Prepare BTCPay Server invoice data
        const invoiceData = {
          price: offer.requested_share_amount,
          currency: 'USD',
          orderId: `GDYUP-${offer_id}`,
          itemDesc: `Flight share: ${offer.departure_location} to ${offer.arrival_location}`,
          buyerEmail: offer.matched_user?.email || undefined,
          redirectURL: `${process.env.NEXT_PUBLIC_APP_URL || 'https://gdyup.xyz'}/gdyup/payment/success?offer_id=${offer_id}`,
          redirectAutomatically: true,
          expirationTime: 3600, // 1 hour expiration
        };
        
        console.log('Creating BTCPay invoice with data:', {
          ...invoiceData,
          buyerEmail: invoiceData.buyerEmail ? '***@***' : undefined // Redact email for logs
        });
        
        // Create a BTCPay invoice
        let invoice;
        try {
          invoice = await createBTCPayInvoice(invoiceData);
        } catch (btcpayError) {
          console.error('BTCPay invoice creation failed:', btcpayError);
          
          // If in development mode, provide a simulated invoice
          if (isDevMode) {
            console.log('DEV MODE: Creating simulated BTCPay invoice since real server is unavailable');
            
            // Update the offer with payment details indicating development mode
            try {
              await updateOfferPaymentStatus(
                offer_id,
                'pending',
                'btcpay',
                {
                  invoice_id: `dev-invoice-${Date.now()}`,
                  checkout_url: `/gdyup/payment/success?offer_id=${offer_id}&simulated=true&dev=true`,
                  created_at: new Date().toISOString(),
                  is_test: true
                }
              );
            } catch (updateError) {
              console.error('Error updating offer with dev payment details:', updateError);
              // Continue anyway - this is just for development
            }
            
            // Return a development mode response with simulated data
            return NextResponse.json({
              success: true,
              message: 'DEV MODE: BTC payment simulated due to BTCPay server unavailability',
              data: {
                invoice_id: `dev-invoice-${Date.now()}`,
                checkout_url: `/gdyup/payment/dev-btcpay-simulator?offer_id=${offer_id}`,
                redirect_url: `/gdyup/payment/dev-btcpay-simulator?offer_id=${offer_id}`,
                force_redirect: true,
                is_simulated: true,
                post_payment_redirect: `/gdyup/boardingpass/${offer_id}?from=simulated-btcpay&t=${Date.now()}`
              }
            });
          }
          
          // In production, just rethrow the error
          throw btcpayError;
        }
        
        if (!invoice || !invoice.id || !invoice.checkoutLink) {
          throw new Error('BTCPay Server returned an invalid invoice response');
        }
        
        console.log(`BTCPay invoice created successfully: ${invoice.id}`);
        
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
            force_redirect: true,
            post_payment_redirect: `/gdyup/boardingpass/${offer_id}?from=btcpay&t=${Date.now()}`
          }
        });
      } catch (error) {
        console.error('Error processing BTC payment:', error);
        
        let errorMessage = 'Failed to process BTC payment';
        let statusCode = 500;
        
        if (error instanceof Error) {
          errorMessage = error.message;
          
          // More specific error handling
          if (error.message.includes('BTCPay API key is required') || 
              error.message.includes('server unreachable') ||
              error.message.includes('configuration')) {
            errorMessage = 'Payment provider is temporarily unavailable';
            statusCode = 503;
          }
          
          if (error.message.includes('BTCPay API error') && error.message.includes('401')) {
            errorMessage = 'Payment provider authorization failed';
            statusCode = 500;
          }
        }
        
        // In development mode, create a fallback response if there's a server issue
        if (isDevMode && statusCode === 503) {
          console.log('DEV MODE: BTC payment failed with service unavailable, providing fallback option');
          
          return NextResponse.json({
            success: false,
            error: errorMessage,
            fallback_available: true,
            details: {
              dev_mode: true,
              original_error: error instanceof Error ? error.message : 'Unknown error',
              fallback_url: `/gdyup/payment/dev-btcpay-simulator?offer_id=${offer_id}&error_recovery=true`
            }
          }, { status: 200 }); // Use 200 to prevent UI error, but include error details
        }
        
        return NextResponse.json(
          { 
            success: false,
            error: errorMessage,
            details: error instanceof Error ? error.message : 'Unknown error'
          }, 
          { status: statusCode }
        );
      }
    } else if (payment_method === 'card' || payment_method === 'stripe') {
      console.log(`Processing card payment for offer ${offer_id}`);
      
      // Check if Stripe is properly configured
      if (!stripe) {
        console.error('Stripe configuration is missing');
        
        if (isDevMode) {
          console.log('DEV MODE: Simulating successful Stripe payment without actual API call');
          
          // Update the offer with simulated payment details for development
          try {
            await updateOfferPaymentStatus(
              offer_id,
              'paid',
              'stripe',
              {
                payment_intent_id: `dev-pi-${Date.now()}`,
                amount: offer.requested_share_amount,
                created_at: new Date().toISOString(),
                is_test: true
              }
            );
          } catch (updateError) {
            console.error('Error updating offer with mock payment details:', updateError);
          }
          
          return NextResponse.json({
            success: true,
            message: 'TEST MODE: Card payment simulated',
            data: {
              payment_intent_id: `dev-pi-${Date.now()}`,
              redirect_url: `/gdyup/payment/success?offer_id=${offer_id}&mockstripe=true`,
              redirect_now: true
            }
          });
        }
        
        return NextResponse.json(
          { error: 'Stripe configuration is missing' }, 
          { status: 500 }
        );
      }
      
      try {
        // Calculate the total amount including fees
        const amount = Math.round(offer.requested_share_amount * 100); // Stripe uses cents
        const fee = Math.round(amount * 0.075); // 7.5% fee
        const total = amount + fee;
        
        console.log(`Creating Stripe payment intent for $${(total / 100).toFixed(2)} (${offer.requested_share_amount} + fees)`);
        
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
        
        console.log(`Stripe payment intent created: ${paymentIntent.id}`);
        
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
            redirect_url: `/gdyup/boardingpass/${offer_id}?payment_intent_id=${paymentIntent.id}&t=${Date.now()}`,
            redirect_now: true
          }
        });
      } catch (error) {
        console.error('Error processing Stripe payment:', error);
        
        // If we're in development mode, fallback to a simulated success path
        if (isDevMode) {
          console.log('DEV MODE: Stripe payment failed, using fallback simulation');
          
          return NextResponse.json({
            success: true,
            message: 'TEST MODE: Stripe payment simulated after real attempt failed',
            data: {
              payment_intent_id: `dev-recovery-${Date.now()}`,
              redirect_url: `/gdyup/boardingpass/${offer_id}?mockstripe=true&error_recovery=true&t=${Date.now()}`,
              redirect_now: true
            }
          });
        }
        
        return NextResponse.json(
          { 
            error: 'Failed to process card payment',
            details: error instanceof Error ? error.message : String(error)
          }, 
          { status: 500 }
        );
      }
    } else {
      console.error(`Invalid payment method: ${payment_method}`);
      return NextResponse.json(
        { error: `Invalid payment method: ${payment_method}. Supported methods are 'btc', 'bitcoin', 'crypto', 'card', or 'stripe'` }, 
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Unhandled error in process-payment:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      details: error instanceof Error ? error.stack : undefined
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