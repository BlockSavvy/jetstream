import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { JetShareOffer } from '@/types/jetshare'; // Adjust type path/name if needed

export async function POST(request: NextRequest) {
  console.log('completeTestPayment API called');
  const supabase = await createClient();

  // ... (existing logging for headers, cookies) ...

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Authentication error in completeTestPayment:', authError);
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  console.log('Authenticated user:', user.id, user.email);

  try {
    const body = await request.json();
    console.log('Request body parsed successfully:', body);
    const {
      offer_id,
      // payment_intent_id, // Use actual reference from payment details if available
      payment_method,
      payment_details,
      transaction_reference // Ensure this is passed from frontend if available, or generate one
    } = body;

    if (!offer_id || !payment_method || !transaction_reference) {
        return NextResponse.json({ error: 'Missing required payment details (offer_id, payment_method, transaction_reference)' }, { status: 400 });
    }


    // 1. Fetch the offer to get details (recipient ID, amount) and verify status
    console.log(`Getting offer details for: ${offer_id}`);
    const { data: offer, error: fetchError } = await supabase
      .from('jetshare_offers')
      .select('id, user_id, requested_share_amount, status, matched_user_id')
      .eq('id', offer_id)
      .single();

    if (fetchError || !offer) {
      console.error(`Error fetching offer ${offer_id} for payment completion:`, fetchError);
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Verify the offer is in the correct state ('accepted') and matched to the current user
    if (offer.status !== 'accepted') {
        console.warn(`Offer ${offer_id} is not in 'accepted' state (status: ${offer.status}). Cannot complete payment.`);
        return NextResponse.json({ error: `Offer payment cannot be completed. Status: ${offer.status}`}, { status: 400 });
    }
     if (offer.matched_user_id !== user.id) {
        console.warn(`User ${user.id} is not the matched user for offer ${offer_id} (matched: ${offer.matched_user_id}). Cannot complete payment.`);
        return NextResponse.json({ error: 'You are not authorized to pay for this offer'}, { status: 403 });
    }


    // 2. Calculate Handling Fee (Example: 7.5%)
    const handlingFeeRate = 0.075; // Make this configurable later
    const shareAmount = offer.requested_share_amount;
    const handlingFee = Math.round(shareAmount * handlingFeeRate * 100) / 100; // Calculate fee
    const totalAmountPaid = shareAmount + handlingFee; // Assuming payer covers fee

    // 3. Log the Transaction (with the CORRECT column name)
    const transactionData = {
      offer_id: offer.id,
      payer_user_id: user.id,
      recipient_user_id: offer.user_id, // The original creator
      amount: shareAmount, // Amount being shared/reimbursed
      handling_fee: handlingFee,
      payment_method: payment_method, // 'fiat' or 'crypto'
      payment_status: 'completed',
      // USE THE CORRECT COLUMN NAME:
      transaction_reference: transaction_reference,
      // transaction_date is usually handled by `now()` or `default` in DB
    };

    console.log('Logging transaction with data:', transactionData);

    const { data: transaction, error: transactionError } = await supabase
      .from('jetshare_transactions')
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) {
      // Log the specific error
      console.error('!!! Error logging transaction !!!:', {
          code: transactionError.code,
          message: transactionError.message,
          details: transactionError.details,
          hint: transactionError.hint,
      });
       // If it's the missing column error again, give a specific hint
       if (transactionError.message.includes('column') && transactionError.message.includes('does not exist')) {
            console.error("Hint: Double-check that the column names in `transactionData` object EXACTLY match the column names in your `jetshare_transactions` table in Supabase, including 'transaction_reference'.");
       }
      // Decide if you should still proceed or return an error
      // For now, let's return an error if logging fails critically
      return NextResponse.json({ error: 'Failed to record transaction', details: transactionError.message }, { status: 500 });
    } else {
      console.log('Transaction logged successfully:', transaction);
    }

    // 4. Update Offer Status to 'completed'
    console.log(`Updating offer ${offer_id} status to completed`);
    const { data: completedOffer, error: completeError } = await supabase
      .from('jetshare_offers')
      .update({ status: 'completed' })
      .eq('id', offer_id)
      .eq('status', 'accepted') // Ensure it was accepted before completing
      .eq('matched_user_id', user.id) // Ensure current user is the one who accepted
      .select()
      .single();

    if (completeError || !completedOffer) {
      console.error(`Failed to update offer ${offer_id} to completed status:`, completeError);
      // Consider how to handle this - payment succeeded but status update failed. Retry? Log for manual fix?
      // For now, return success but log the error prominently.
      return NextResponse.json({
           success: true,
           transaction: transaction,
           warning: 'Payment successful and transaction logged, but failed to update offer status to completed.',
           offer: offer // Return original fetched offer data
       }, { status: 200 }); // Return 200 as payment was ok, but include warning
    }

    console.log(`Successfully updated offer ${offer_id} to completed status:`, completedOffer);

    // Return success
    return NextResponse.json({ success: true, offer: completedOffer, transaction: transaction });

  } catch (error: any) {
    console.error('Unexpected error in completeTestPayment:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during payment completion', details: error.message }, { status: 500 });
  }
}

// ... existing OPTIONS handler ...