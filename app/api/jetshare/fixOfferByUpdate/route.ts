import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createSBClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Create supabase client
    const supabase = await createClient();
    
    // Get offer ID from query parameters
    const url = new URL(request.url);
    const offerId = url.searchParams.get('id') || 'a2772e66-54ce-418b-a212-6bd872b761a9';
    const userId = url.searchParams.get('userId') || '4c2487a1-171f-4968-afe4-5298b32f456b';
    const resetStatus = url.searchParams.get('reset') === 'true';
    
    // First, check the current offer status
    console.log(`Checking offer ${offerId}`);
    const { data: offerData, error: offerError } = await supabase
      .from('jetshare_offers')
      .select('id, status, matched_user_id, user_id')
      .eq('id', offerId)
      .single();
    
    if (offerError) {
      console.error('Error retrieving offer:', offerError);
      return NextResponse.json({ error: 'Offer not found', details: offerError.message }, { status: 404 });
    }
    
    console.log('Current offer status:', offerData);
    
    // If reset parameter is set, reset the offer status to 'open'
    if (resetStatus) {
      console.log('Resetting offer status to open');
      const { data: resetData, error: resetError } = await supabase
        .from('jetshare_offers')
        .update({
          status: 'open',
          matched_user_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', offerId)
        .select();
      
      if (resetError) {
        console.error('Error resetting offer:', resetError);
        return NextResponse.json(
          { error: 'Failed to reset offer', details: resetError.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Offer reset successfully',
        data: resetData
      });
    }

    // Attempt to directly execute an update statement to set status to 'accepted'
    console.log('Updating offer status to accepted through direct update');
    const query = supabase
      .from('jetshare_offers')
      .update({
        status: 'accepted',
        matched_user_id: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', offerId)
      .eq('status', 'open')
      .select();
      
    console.log('Executing update query for offer', offerId);
    
    const { data: updateData, error: updateError } = await query;
    
    if (updateError) {
      console.error('Error updating offer:', updateError);
      return NextResponse.json(
        { error: 'Failed to update offer', details: updateError.message },
        { status: 500 }
      );
    }
    
    if (!updateData || updateData.length === 0) {
      console.log('No offer was updated, possibly already in different status');
      return NextResponse.json({
        success: false,
        message: 'No offer was updated. It may not be in open status.',
        current: offerData
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Offer accepted successfully',
      data: updateData
    });
  } catch (error) {
    console.error('Error updating offer:', error);
    return NextResponse.json(
      { error: 'Update operation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// A direct API endpoint to fix offers with a mismatched status
export async function POST(request: NextRequest) {
  try {
    // Get request parameters
    const { offerId, targetStatus } = await request.json();
    
    if (!offerId) {
      return NextResponse.json({ error: 'Missing offer ID' }, { status: 400 });
    }
    
    if (!targetStatus || !['open', 'accepted', 'completed'].includes(targetStatus)) {
      return NextResponse.json({ 
        error: 'Invalid target status. Must be one of: open, accepted, completed' 
      }, { status: 400 });
    }
    
    // Create Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
    }
    
    // Create service client
    const serviceClient = createSBClient(supabaseUrl, supabaseServiceKey);
    
    // First try to update using the direct RPC function
    try {
      const { error: rpcError } = await serviceClient.rpc('force_update_offer_status', {
        p_offer_id: offerId,
        p_status: targetStatus
      });
      
      if (rpcError) {
        console.error('Error updating offer status via RPC:', rpcError);
        
        // If RPC fails, try direct database update
        const { error: updateError } = await serviceClient
          .from('jetshare_offers')
          .update({
            status: targetStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', offerId);
        
        if (updateError) {
          return NextResponse.json({ 
            error: 'Failed to update offer status', 
            details: updateError 
          }, { status: 500 });
        }
      }
      
      // Get the updated offer
      const { data: offer, error: getError } = await serviceClient
        .from('jetshare_offers')
        .select('*')
        .eq('id', offerId)
        .single();
      
      if (getError) {
        return NextResponse.json({ 
          error: 'Failed to retrieve updated offer', 
          details: getError 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `Offer status updated to ${targetStatus}`,
        offer
      });
      
    } catch (error) {
      console.error('Unexpected error fixing offer:', error);
      return NextResponse.json({ 
        error: 'Failed to update offer status', 
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error processing fix offer request:', error);
    return NextResponse.json({ 
      error: 'Failed to process request', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 