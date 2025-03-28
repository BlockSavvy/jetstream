import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getJetShareOfferById, logJetShareTransaction } from '@/lib/services/jetshare';

export async function POST(request: NextRequest) {
  console.log('completeTestPayment API called');
  
  // Set up consistent CORS headers for response
  const corsHeaders = getCorsHeaders(request);
  
  // Check if we have all required headers for better debugging
  const headers = Object.fromEntries(request.headers.entries());
  console.log('Request headers:', {
    cookie: headers.cookie ? 'Present (length: ' + headers.cookie.length + ')' : 'Missing',
    'content-type': headers['content-type'] || 'Missing',
    authorization: headers.authorization ? 'Present' : 'Missing',
    host: headers.host || 'Missing',
    origin: headers.origin || 'Missing',
    referer: headers.referer || 'Missing',
  });
  
  try {
    // Authentication check
    const supabase = await createClient();
    const { data, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ 
        error: 'Authentication failed', 
        message: 'Authentication error occurred', 
        details: authError.message 
      }, { status: 401, headers: corsHeaders });
    }
    
    if (!data.user) {
      console.error('No authenticated user found');
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'You must be logged in to complete a payment' 
      }, { status: 401, headers: corsHeaders });
    }
    
    const user = data.user;
    console.log('Authenticated user:', user.id, user.email || 'no email');
    
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
      console.log('Request body parsed successfully:', body);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body', message: 'Could not parse request JSON', details: (parseError as Error).message },
        { status: 400, headers: corsHeaders }
      );
    }
    
    const { offer_id, payment_intent_id, transaction_reference } = body;
    
    if (!offer_id || !(payment_intent_id || transaction_reference)) {
      console.error('Missing required fields in request body');
      return NextResponse.json(
        { error: 'Missing required fields', details: 'offer_id and payment_intent_id or transaction_reference are required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Get the offer details
    console.log('Getting offer details for:', offer_id);
    
    // First check if offer exists
    const { data: offerCheck, error: offerCheckError } = await supabase
      .from('jetshare_offers')
      .select('id, status, user_id, matched_user_id')
      .eq('id', offer_id)
      .single();
      
    if (offerCheckError) {
      console.error('Error checking offer existence:', offerCheckError);
      return NextResponse.json(
        { error: 'Failed to verify offer exists', message: offerCheckError.message },
        { status: 404, headers: corsHeaders }
      );
    }
    
    if (!offerCheck) {
      console.error('Offer not found with ID:', offer_id);
      return NextResponse.json(
        { error: 'Offer not found', message: 'The specified offer does not exist' },
        { status: 404, headers: corsHeaders }
      );
    }
    
    // Check if offer is already completed
    if (offerCheck.status === 'completed') {
      console.log('Offer already completed:', offer_id);
      return NextResponse.json(
        { error: 'Already paid', message: 'This offer has already been paid for' },
        { status: 409, headers: corsHeaders }
      );
    }
    
    // Check if user is authorized to pay for this offer
    let isAuthorized = false;

    // Case 1: User is already set as the matched_user_id
    if (offerCheck.matched_user_id === user.id) {
      console.log('User is already the matched user for this offer');
      isAuthorized = true;
    }
    // Case 2: Offer is open with no matched user yet
    else if (offerCheck.status === 'open' && !offerCheck.matched_user_id) {
      console.log('Offer is open with no matched user. Allowing current user to pay.');
      isAuthorized = true;
      
      // Update the matched_user_id to the current user before proceeding
      try {
        const { error: updateError } = await supabase
          .from('jetshare_offers')
          .update({ 
            status: 'accepted',
            matched_user_id: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', offer_id)
          .eq('status', 'open');
          
        if (updateError) {
          console.error('Failed to update offer with user as matched_user_id:', updateError);
          // Continue anyway as we'll treat the user as authorized for this payment
        } else {
          console.log('Successfully updated offer to set current user as matched_user_id');
        }
      } catch (updateError) {
        console.error('Exception during offer update:', updateError);
      }
    }
    // Case 3: User is not authorized
    else {
      console.error('User not authorized to pay for this offer:', {
        userId: user.id,
        offerMatchedUserId: offerCheck.matched_user_id || 'none',
        offerCreatorId: offerCheck.user_id,
        offerStatus: offerCheck.status
      });
      
      return NextResponse.json(
        { error: 'Not authorized', message: 'You are not authorized to pay for this offer' },
        { status: 403, headers: corsHeaders }
      );
    }
    
    // Get full offer details
    let offer;
    try {
      const { data: fullOffer, error: fullOfferError } = await supabase
        .from('jetshare_offers')
        .select('*')
        .eq('id', offer_id)
        .single();
        
      if (fullOfferError) {
        console.error('Error fetching full offer details:', fullOfferError);
        throw new Error('Failed to fetch offer details');
      }
      
      if (!fullOffer) {
        console.error('Full offer not found with ID:', offer_id);
        throw new Error('Offer not found');
      }
      
      offer = fullOffer;
    } catch (error) {
      console.error('Error getting full offer details:', error);
      return NextResponse.json(
        { error: 'Failed to fetch offer details', message: (error as Error).message },
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Process payment logic here
    console.log('Processing payment for offer:', offer_id);
    
    // Generate a transaction reference if not provided
    const finalTransactionReference = transaction_reference || payment_intent_id || `test_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    // Calculate the handling fee (default 7.5% if not specified in settings)
    const handlingFeePercentage = 0.075; // 7.5%
    const handlingFee = offer.requested_share_amount * handlingFeePercentage;
    
    // Log transaction
    let transactionData;
    let transactionComplete = false;
    
    try {
      console.log('Logging transaction with data:', {
        offer_id: offer.id,
        payer_user_id: user.id,
        recipient_user_id: offer.user_id,
        amount: offer.requested_share_amount,
        handling_fee: handlingFee,
        payment_status: 'completed'
      });
      
      // Insert transaction record
      const { data: newTransaction, error: transactionError } = await supabase
        .from('jetshare_transactions')
        .insert({
          offer_id: offer.id,
          payer_user_id: user.id,
          recipient_user_id: offer.user_id,
          amount: offer.requested_share_amount,
          handling_fee: handlingFee,
          payment_method: body.payment_method || 'fiat',
          payment_status: 'completed',
          transaction_reference: finalTransactionReference,
          transaction_date: new Date().toISOString()
        })
        .select()
        .single();
        
      if (transactionError) {
        console.error('Error logging transaction:', transactionError);
        
        // Create a fallback transaction object
        transactionData = {
          id: `fallback_${Date.now()}`,
          offer_id: offer.id,
          payer_user_id: user.id,
          recipient_user_id: offer.user_id,
          amount: offer.requested_share_amount,
          handling_fee: handlingFee,
          payment_method: body.payment_method || 'fiat',
          payment_status: 'completed',
          transaction_reference: finalTransactionReference,
          transaction_date: new Date().toISOString()
        };
        
        console.log('Using fallback transaction object:', transactionData);
      } else {
        console.log('Transaction logged successfully:', newTransaction.id);
        transactionData = newTransaction;
        transactionComplete = true;
      }
      
      // Update offer status to completed
      console.log('Updating offer status to completed');
      
      const { error: updateError } = await supabase
        .from('jetshare_offers')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', offer_id);
        
      if (updateError) {
        console.error('Error updating offer to completed status:', updateError);
        
        // Try a minimal update as fallback
        const { error: minimalUpdateError } = await supabase
          .from('jetshare_offers')
          .update({ status: 'completed' })
          .eq('id', offer_id);
          
        if (minimalUpdateError) {
          console.error('Minimal update also failed:', minimalUpdateError);
        } else {
          console.log('Minimal update to completed status succeeded');
        }
      } else {
        console.log('Successfully updated offer to completed status');
      }
      
      // Return success response
      return NextResponse.json({
        success: true,
        message: 'Payment completed successfully',
        transaction_id: transactionData.id,
        offer_id: offer.id,
        status: 'completed'
      }, { 
        status: 200, 
        headers: corsHeaders
      });
      
    } catch (error) {
      console.error('Error during payment processing:', error);
      
      // Try one final update to completed status
      try {
        await supabase
          .from('jetshare_offers')
          .update({ status: 'completed' })
          .eq('id', offer_id);
      } catch (finalError) {
        console.error('Final status update attempt failed:', finalError);
      }
      
      return NextResponse.json(
        { 
          error: 'Payment processing error', 
          message: (error as Error).message 
        },
        { status: 500, headers: corsHeaders }
      );
    }
    
  } catch (error) {
    console.error('Unexpected error in completeTestPayment:', error);
    return NextResponse.json(
      { error: 'Server error', message: (error as Error).message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Helper function to get consistent CORS headers
function getCorsHeaders(request: NextRequest) {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Add OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(request),
  });
}