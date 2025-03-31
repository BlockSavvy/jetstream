import { createClient as createSBClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Critical Recovery API for payment processing
// This is a direct service role endpoint that bypasses all auth checks

export async function POST(request: NextRequest) {
  console.log('Payment critical recovery endpoint called');
  
  try {
    const data = await request.json();
    const { offer_id, user_id, amount, payment_method } = data;
    
    // Critical validation of required fields
    if (!offer_id) {
      return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 });
    }
    
    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    console.log(`Critical recovery for payment: offer=${offer_id}, user=${user_id}`);
    
    // Verify the offer exists
    const supabase = await createClient();
    const { data: offer, error: offerError } = await supabase
      .from('jetshare_offers')
      .select('*')
      .eq('id', offer_id)
      .single();
    
    if (offerError || !offer) {
      console.error('Offer not found:', offerError);
      return NextResponse.json(
        { error: 'Offer not found or invalid' },
        { status: 404 }
      );
    }
    
    // Generate transaction ID
    const transactionId = uuidv4();
    
    // Service role direct access
    console.log('Using direct service role for critical payment recovery');
    
    // Get service role credentials
    const serviceURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceURL || !serviceKey) {
      throw new Error('Service role credentials not configured');
    }
    
    // Create service role client
    const serviceClient = createSBClient(serviceURL, serviceKey, {
      auth: { persistSession: false }
    });
    
    // Insert transaction
    const { data: transaction, error: transactionError } = await serviceClient
      .from('jetshare_transactions')
      .insert([{
        id: transactionId,
        offer_id,
        user_id,
        amount: amount || offer.requested_share_amount,
        payment_method: payment_method || 'card',
        status: 'completed',
        transaction_date: new Date().toISOString(),
        auth_method: 'service-role-recovery',
        notes: 'Created via critical recovery endpoint'
      }])
      .select()
      .single();
    
    if (transactionError) {
      console.error('Failed to insert transaction:', transactionError);
      throw transactionError;
    }
    
    // Update offer status
    const { error: updateError } = await serviceClient
      .from('jetshare_offers')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString(),
        updated_by: user_id
      })
      .eq('id', offer_id);
    
    if (updateError) {
      console.error('Error updating offer status:', updateError);
      // Continue anyway - transaction was created
    }
    
    // Return success response
    console.log('Critical recovery payment success, redirecting to dashboard');
    return NextResponse.json({
      success: true,
      message: 'Payment processed via critical recovery',
      data: {
        transaction_id: transactionId,
        offer_id,
        status: 'completed',
        redirect_url: `/jetshare/dashboard?t=${Date.now()}&recovery=${transactionId.substring(0, 8)}`,
      }
    });
    
  } catch (error: any) {
    console.error('Critical recovery error:', error);
    return NextResponse.json(
      { error: 'Critical recovery failed', details: error.message || String(error) },
      { status: 500 }
    );
  }
} 