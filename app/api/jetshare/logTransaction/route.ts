import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { logJetShareTransaction, calculateHandlingFee } from '@/lib/services/jetshare';
import { z } from 'zod';

// Create a schema for validating the request body
const logTransactionSchema = z.object({
  offer_id: z.string().uuid(),
  payment_method: z.enum(['fiat', 'crypto']),
  payment_status: z.enum(['pending', 'completed', 'failed']),
  transaction_reference: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse and validate the request body
    const body = await request.json();
    const validationResult = logTransactionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { offer_id, payment_method, payment_status, transaction_reference } = validationResult.data;
    
    // Get the offer details
    const { data: offer, error: offerError } = await supabase
      .from('jetshare_offers')
      .select('*')
      .eq('id', offer_id)
      .single();
      
    if (offerError || !offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }
    
    // Ensure the user is either the original purchaser or the accepting user
    if (user.id !== offer.user_id && user.id !== offer.matched_user_id) {
      return NextResponse.json(
        { error: 'Unauthorized - you are not a party to this offer' },
        { status: 403 }
      );
    }
    
    // Determine payer and recipient
    const payerUserId = offer.matched_user_id;
    const recipientUserId = offer.user_id;
    
    if (!payerUserId) {
      return NextResponse.json(
        { error: 'Offer has not been accepted yet' },
        { status: 400 }
      );
    }
    
    // Calculate handling fee
    const amount = offer.requested_share_amount;
    const handlingFee = await calculateHandlingFee(amount);
    
    // Log the transaction
    const transaction = await logJetShareTransaction({
      offer_id,
      amount,
      payment_method,
      payment_status,
      transaction_reference,
      payer_user_id: payerUserId,
      recipient_user_id: recipientUserId,
      handling_fee: handlingFee
    });
    
    return NextResponse.json({
      success: true,
      transaction,
      receiptUrl: transaction.receipt_url || null
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error logging JetShare transaction:', error);
    return NextResponse.json(
      { error: 'Failed to log transaction', message: (error as Error).message },
      { status: 500 }
    );
  }
} 