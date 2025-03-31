import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Supabase-Auth',
  'Access-Control-Allow-Credentials': 'true',
};

export async function GET(request: NextRequest) {
  // Only allow in development/test mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'This endpoint is not available in production' }, { status: 403 });
  }
  
  try {
    // Create supabase client
    const supabase = await createClient();
    
    // Get offer ID from query parameters
    const url = new URL(request.url);
    const offerId = url.searchParams.get('id');
    const userId = url.searchParams.get('userId');
    
    if (!offerId) {
      return NextResponse.json({ error: 'Missing offer ID' }, { status: 400, headers: corsHeaders });
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400, headers: corsHeaders });
    }
    
    // First, get the offer details
    console.log(`[testAccept] Step 1: Fetching offer ${offerId}`);
    const { data: offerData, error: offerError } = await supabase
      .from('jetshare_offers')
      .select('*')
      .eq('id', offerId)
      .single();
    
    if (offerError) {
      console.error('[testAccept] Error retrieving offer:', offerError);
      return NextResponse.json(
        { error: 'Offer not found', details: offerError.message },
        { status: 404, headers: corsHeaders }
      );
    }
    
    console.log('[testAccept] Offer details:', {
      id: offerData.id,
      status: offerData.status,
      user_id: offerData.user_id,
      matched_user_id: offerData.matched_user_id
    });
    
    // Attempt to update the offer status directly
    console.log('[testAccept] Step 2: Updating offer status to accepted');
    const { data: updateData, error: updateError } = await supabase
      .from('jetshare_offers')
      .update({
        status: 'accepted',
        matched_user_id: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', offerId)
      .eq('status', 'open')
      .select();
    
    if (updateError) {
      console.error('[testAccept] Error updating offer:', updateError);
      return NextResponse.json(
        { error: 'Failed to update offer', details: updateError.message },
        { status: 500, headers: corsHeaders }
      );
    }
    
    console.log('[testAccept] Update result:', updateData);
    
    // Record the transaction
    console.log('[testAccept] Step 3: Recording transaction');
    const handlingFeePercent = process.env.JETSHARE_HANDLING_FEE_PERCENT || '7.5';
    const handlingFee = (parseFloat(offerData.requested_share_amount) * parseFloat(handlingFeePercent)) / 100;
    
    const { data: transactionData, error: transactionError } = await supabase
      .from('jetshare_transactions')
      .insert({
        offer_id: offerId,
        payer_user_id: userId,
        recipient_user_id: offerData.user_id,
        amount: offerData.requested_share_amount,
        handling_fee: handlingFee,
        payment_method: 'fiat',
        payment_status: 'pending',
        transaction_date: new Date().toISOString()
      })
      .select();
    
    if (transactionError) {
      console.error('[testAccept] Error recording transaction:', transactionError);
    }
    
    // Success response
    return NextResponse.json({
      success: true,
      message: 'Test accept operation completed',
      details: {
        offer: offerData,
        update_result: updateData,
        transaction: transactionData
      }
    }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('[testAccept] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Test operation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
} 