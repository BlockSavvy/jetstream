import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createSBClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Ensure the response is not cached
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('completeTestPayment API called');
  
  try {
    // Parse the request body
    const body = await request.json();
    console.log('Request body:', body);
    
    // Extract essential fields with defaults
    const { 
      offer_id, 
      payment_intent_id = `test_intent_${Date.now()}`,
      payment_method = 'card'
    } = body;
    
    // Basic validation
    if (!offer_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing offer ID' 
      }, { status: 400 });
    }
    
    // Get service role client for maximum reliability
    const supabase = await createClient();
    
    // Try standard auth first
    let authenticatedUserId = null;
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (user?.id) {
      authenticatedUserId = user.id;
      console.log('User authenticated via standard auth:', authenticatedUserId);
    } else {
      console.log('Standard auth failed:', authError?.message);
      
      // Extract user ID from headers if available (from middleware)
      const middlewareUserId = request.headers.get('x-user-id');
      if (middlewareUserId) {
        authenticatedUserId = middlewareUserId;
        console.log('User ID from middleware:', authenticatedUserId);
      }
      
      // Fall back to user_id in request body if provided
      if (!authenticatedUserId && body.user_id) {
        authenticatedUserId = body.user_id;
        console.log('Using user_id from request body:', authenticatedUserId);
      }
    }
    
    // First fetch the offer to get transaction details
    const { data: offer, error: offerError } = await supabase
      .from('jetshare_offers')
      .select('*')
      .eq('id', offer_id)
      .single();
    
    if (offerError || !offer) {
      console.error('Error fetching offer:', offerError);
      return NextResponse.json(
        { success: false, error: 'Offer not found' }, 
        { status: 404 }
      );
    }
    
    // If user ID wasn't found earlier, try getting it from the offer
    if (!authenticatedUserId && offer.matched_user_id) {
      authenticatedUserId = offer.matched_user_id;
      console.log('Using matched user ID from offer:', authenticatedUserId);
    }
    
    // Last resort: use direct service role access
    if (!authenticatedUserId) {
      console.warn('No authenticated user found - using service role fallback');
      // Proceed with service role (no user ID validation)
    } else {
      console.log('Authenticated user ID:', authenticatedUserId);
    }
    
    // Generate transaction ID
    const transactionId = uuidv4();
    
    // Service role direct access for maximum reliability
    console.log('Using direct service role for test payment completion');
    
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
    
    // Calculate handling fee (7.5%)
    const amount = offer.requested_share_amount; 
    const handlingFee = Math.round(amount * 0.075);
    
    // Insert transaction using service role
    const { data: transaction, error: transactionError } = await serviceClient
      .from('jetshare_transactions')
      .insert([{
        id: transactionId,
        offer_id,
        user_id: authenticatedUserId || offer.matched_user_id,
        amount,
        payment_method,
        status: 'completed',
        transaction_date: new Date().toISOString(),
        transaction_reference: payment_intent_id,
        handling_fee: handlingFee,
        metadata: {
          is_test_mode: true,
          payment_intent_id
        },
        notes: 'Test mode payment completion'
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
        updated_by: authenticatedUserId || offer.matched_user_id
      })
      .eq('id', offer_id);
    
    if (updateError) {
      console.error('Error updating offer status:', updateError);
      // Continue anyway - transaction was created
    }
    
    // Return success response
    console.log('Test payment successful, redirecting to success page');
    return NextResponse.json({
      success: true,
      message: 'Test payment completed successfully',
      data: {
        transaction_id: transactionId,
        offer_id,
        status: 'completed',
        redirect_url: `/jetshare/payment/success?offer_id=${offer_id}&payment_intent_id=${payment_intent_id}&t=${Date.now()}`,
      },
      test_mode: true
    }, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });
    
  } catch (error: any) {
    console.error('Error in completeTestPayment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to complete test payment', 
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { 
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
    }
  });
}