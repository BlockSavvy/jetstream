import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createClientBrowser } from '@/lib/supabase';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Admin-level API endpoint to accept an offer with service role access
 * Used specifically for authentication recovery when normal accept fails
 */
export async function POST(req: NextRequest) {
  try {
    console.log("[API] adminAcceptOffer: Starting service role offer acceptance");
    
    // Extract data from request
    const { offer_id, user_id, payment_method = 'fiat', recovery = false } = await req.json();
    
    // Validate required fields
    if (!offer_id) {
      return NextResponse.json({ 
        success: false, 
        message: 'Offer ID is required' 
      }, { status: 400 });
    }
    
    // Get user ID from multiple sources for resiliency
    const headersList = await headers();
    const headerUserId = headersList.get('X-User-ID');
    const recoveryRequest = headersList.get('X-Recovery-Request') === 'true';
    
    // Determine final user ID
    const finalUserId = user_id || headerUserId || null;
    
    if (!finalUserId) {
      return NextResponse.json({ 
        success: false, 
        message: 'User ID is required' 
      }, { status: 400 });
    }
    
    console.log(`[API] adminAcceptOffer: Processing offer ${offer_id} for user ${finalUserId} (recovery: ${recovery})`);
    
    // Get admin supabase client (service role)
    const supabase = await createClient();
    
    // First check if the offer exists and is available
    const { data: offerData, error: offerError } = await supabase
      .from('jetshare_offers')
      .select('*')
      .eq('id', offer_id)
      .eq('status', 'open')
      .single();
    
    if (offerError || !offerData) {
      console.error("[API] adminAcceptOffer: Offer not found or not available:", offerError);
      return NextResponse.json({ 
        success: false, 
        message: 'Offer not found or not available',
        error: offerError?.message
      }, { status: 404 });
    }
    
    // Make sure the user isn't trying to accept their own offer
    if (offerData.user_id === finalUserId) {
      return NextResponse.json({ 
        success: false, 
        message: 'You cannot accept your own offer'
      }, { status: 400 });
    }
    
    // Update the offer status to accepted and set the matched user
    const { data: updateData, error: updateError } = await supabase
      .from('jetshare_offers')
      .update({ 
        matched_user_id: finalUserId,
        status: 'accepted', 
        accepted_at: new Date().toISOString()
      })
      .eq('id', offer_id)
      .select()
      .single();
    
    if (updateError) {
      console.error("[API] adminAcceptOffer: Error updating offer:", updateError);
      
      // Special handling for constraint errors
      if (updateError.message.includes('violates foreign key constraint') ||
          updateError.message.includes('violates check constraint')) {
        
        console.log("[API] adminAcceptOffer: Constraint error detected, trying partial update");
        
        // Try partial update (just matched_user_id first)
        const { error: partialError } = await supabase
          .from('jetshare_offers')
          .update({ matched_user_id: finalUserId })
          .eq('id', offer_id);
        
        if (partialError) {
          return NextResponse.json({ 
            success: false, 
            message: 'Failed to accept offer: database constraint error',
            error: partialError.message
          }, { status: 500 });
        }
        
        console.log("[API] adminAcceptOffer: Partial update succeeded. Trying status update separately");
        
        // Now try to update status separately
        const { error: statusError } = await supabase
          .from('jetshare_offers')
          .update({ 
            status: 'accepted',
            accepted_at: new Date().toISOString()
          })
          .eq('id', offer_id);
        
        if (statusError) {
          console.warn("[API] adminAcceptOffer: Status update failed but user was matched:", statusError);
          // We'll return partial success as the user was at least matched
        }
      } else {
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to accept offer',
          error: updateError.message
        }, { status: 500 });
      }
    }
    
    // Create a transaction record
    const { error: transactionError } = await supabase
      .from('jetshare_transactions')
      .insert({
        offer_id: offer_id,
        payer_user_id: finalUserId,
        recipient_user_id: offerData.user_id,
        amount: offerData.requested_share_amount,
        payment_method: payment_method,
        payment_status: 'pending',
        transaction_date: new Date().toISOString(),
        // Adding metadata for diagnostic purposes
        metadata: {
          recovery_request: recovery,
          admin_acceptance: true
        }
      });
    
    if (transactionError) {
      console.error("[API] adminAcceptOffer: Error creating transaction:", transactionError);
      // Not returning an error as the acceptance was successful
    }
    
    // Determine next steps/redirect
    const redirectUrl = `/jetshare/payment/${offer_id}?from=accept&recovery=${recovery ? 'true' : 'false'}&t=${Date.now()}`;
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Offer accepted successfully',
      data: {
        offer_id,
        status: 'accepted',
        redirect_url: redirectUrl
      }
    });
    
  } catch (error) {
    console.error("[API] adminAcceptOffer: Unexpected error:", error);
    return NextResponse.json({ 
      success: false, 
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 