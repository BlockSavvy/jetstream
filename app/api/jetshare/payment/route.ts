import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Handles payment processing requests
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { offerId, paymentMethod, userId } = body;
    
    if (!offerId) {
      return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 });
    }
    
    if (!paymentMethod) {
      return NextResponse.json({ error: 'Payment method is required' }, { status: 400 });
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Fix the cookies handling
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore
    });
    
    // Get the offer details
    const { data: offer, error: offerError } = await supabase
      .from('jetshare_offers')
      .select('*')
      .eq('id', offerId)
      .single();
      
    if (offerError) {
      console.error('Error fetching offer:', offerError);
      return NextResponse.json({ error: 'Failed to fetch offer details' }, { status: 500 });
    }
    
    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }
    
    // Process payment based on selected method
    if (paymentMethod === 'btc') {
      // For development, we'll return a simulated BTCPay response
      if (process.env.NODE_ENV !== 'production') {
        // Update the offer status to indicate it's in the payment process
        await supabase
          .from('jetshare_offers')
          .update({
            status: 'accepted_but_unpaid',
            matched_user_id: userId,
            payment_status: 'pending',
            payment_method: 'btcpay',
            updated_at: new Date().toISOString()
          })
          .eq('id', offerId);
        
        return NextResponse.json({
          success: true,
          message: 'BTC payment initiated (simulated)',
          data: {
            offer_id: offerId,
            checkout_url: `/gdyup/payment/dev-btcpay-simulator?offer_id=${offerId}`,
            redirect_url: `/gdyup/payment/dev-btcpay-simulator?offer_id=${offerId}`,
            force_redirect: true
          }
        });
      } else {
        // In production, we would integrate with a real BTCPay server
        // For now, return a development-like response
        await supabase
          .from('jetshare_offers')
          .update({
            status: 'accepted_but_unpaid',
            matched_user_id: userId,
            payment_status: 'pending',
            payment_method: 'btcpay',
            updated_at: new Date().toISOString()
          })
          .eq('id', offerId);
          
        return NextResponse.json({
          success: true,
          message: 'BTC payment initiated',
          data: {
            offer_id: offerId,
            checkout_url: `/gdyup/payment/success?offer_id=${offerId}&simulated=true`,
            redirect_url: `/gdyup/payment/success?offer_id=${offerId}&simulated=true`,
            force_redirect: true
          }
        });
      }
    } else if (paymentMethod === 'card') {
      // For development, we'll return a simulated Stripe response
      // Update the offer status for card payment
      await supabase
        .from('jetshare_offers')
        .update({
          status: 'accepted_but_unpaid',
          matched_user_id: userId,
          payment_status: 'pending',
          payment_method: 'stripe',
          updated_at: new Date().toISOString()
        })
        .eq('id', offerId);
        
      return NextResponse.json({
        success: true,
        message: 'Card payment initiated',
        data: {
          offer_id: offerId,
          client_secret: 'dev_secret_' + Date.now(),
          payment_intent_id: 'dev_pi_' + Date.now(),
          redirect_url: `/gdyup/payment/success?offer_id=${offerId}&simulated=true`,
          force_redirect: true
        }
      });
    } else {
      return NextResponse.json({ error: 'Unsupported payment method' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in payment API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 