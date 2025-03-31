import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Only allow in development/test mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'This endpoint is not available in production' }, { status: 403 });
  }
  
  try {
    // Create supabase client
    const supabase = await createClient();
    
    // Get parameters
    const url = new URL(request.url);
    const offerId = url.searchParams.get('id') || 'a2772e66-54ce-418b-a212-6bd872b761a9';
    const userId = url.searchParams.get('userId') || '4c2487a1-171f-4968-afe4-5298b32f456b';
    const paymentMethod = url.searchParams.get('payment') || 'fiat';
    
    console.log(`Admin endpoint: Accepting offer ${offerId} for user ${userId}`);
    
    // First, get the offer details
    const { data: offerData, error: offerError } = await supabase
      .from('jetshare_offers')
      .select('*')
      .eq('id', offerId)
      .single();
    
    if (offerError) {
      console.error('Error retrieving offer:', offerError);
      return NextResponse.json({ error: 'Offer not found', details: offerError.message }, { status: 404 });
    }
    
    // Set the offer status directly via SQL instead of using the API
    console.log('Setting offer status via direct SQL update');
    
    // Skip RPC function since it's not deployed yet
    // Try direct update
    const { data: updateData, error: updateError } = await supabase
      .from('jetshare_offers')
      .update({
        status: 'accepted',
        matched_user_id: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', offerId)
      .select();
      
    if (updateError) {
      console.error('Error updating offer:', updateError);
      // If direct update fails, fall back to just updating matched_user_id
      console.log('Falling back to matched_user_id update only');
      
      const { data: partialUpdateData, error: partialUpdateError } = await supabase
        .from('jetshare_offers')
        .update({
          matched_user_id: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', offerId)
        .select();
        
      if (partialUpdateError) {
        console.error('Partial update also failed:', partialUpdateError);
      } else {
        console.log('Partial update successful');
      }
      
      // Try to create internal operation record
      try {
        const { error: opsError } = await supabase.from('jetshare_internal_ops').insert({
          operation: 'accept_offer',
          params: { 
            offer_id: offerId, 
            user_id: userId,
            payment_method: paymentMethod 
          },
          created_at: new Date().toISOString()
        });
        
        if (opsError) {
          console.error('Failed to create internal operation record:', opsError);
          console.log('Internal ops table may not exist, but continuing');
        } else {
          console.log('Created internal operation record for async processing');
        }
      } catch (opsError) {
        console.warn('Could not create internal ops record:', opsError);
      }
    } else {
      console.log('Direct update successful!', updateData);
    }
    
    // Record the transaction
    const handlingFeePercent = process.env.JETSHARE_HANDLING_FEE_PERCENT || '7.5';
    const handlingFee = (parseFloat(offerData.requested_share_amount) * parseFloat(handlingFeePercent)) / 100;
    
    console.log('Recording transaction in database');
    const { data: transactionData, error: transactionError } = await supabase
      .from('jetshare_transactions')
      .insert({
        offer_id: offerId,
        payer_user_id: userId,
        recipient_user_id: offerData.user_id,
        amount: offerData.requested_share_amount,
        handling_fee: handlingFee,
        payment_method: paymentMethod,
        payment_status: 'pending',
        transaction_date: new Date().toISOString()
      })
      .select();
    
    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
    } else {
      console.log('Transaction recorded successfully');
    }
    
    // Refetch offer to verify the change
    const { data: verifiedOffer, error: verifyError } = await supabase
      .from('jetshare_offers')
      .select('id, status, matched_user_id')
      .eq('id', offerId)
      .single();
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Offer accepted through admin endpoint',
      data: {
        update_result: updateData,
        transaction: transactionData?.[0],
        verified_offer: verifiedOffer,
        original_offer: offerData
      }
    });
  } catch (error) {
    console.error('Error in admin accept offer:', error);
    return NextResponse.json(
      { error: 'Admin operation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 