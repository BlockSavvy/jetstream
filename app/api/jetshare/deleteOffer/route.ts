import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { z } from 'zod';

// Validation schema for the request body
const deleteOfferSchema = z.object({
  offer_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  console.log('deleteOffer API called');
  
  try {
    // Get request body
    const body = await request.json();
    console.log('Request body:', body);
    
    // Validate request body
    try {
      deleteOfferSchema.parse(body);
    } catch (validationError) {
      console.error('Validation error:', validationError);
      return NextResponse.json({ error: 'Invalid request data', details: (validationError as Error).message }, { status: 400 });
    }
    
    const { offer_id } = body;
    
    // Get the authenticated user
    const supabase = await createClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !userData.user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ error: 'Authentication required', message: 'You must be signed in to delete an offer' }, { status: 401 });
    }
    
    const userId = userData.user.id;
    
    // Get the offer to check if the user is the owner and if it's in a deletable state
    const { data: offer, error: offerError } = await supabase
      .from('jetshare_offers')
      .select('*')
      .eq('id', offer_id)
      .maybeSingle();
      
    if (offerError) {
      console.error('Error fetching offer:', offerError);
      return NextResponse.json({ error: 'Failed to fetch offer details', message: offerError.message }, { status: 500 });
    }
    
    if (!offer) {
      console.error('Offer not found:', offer_id);
      return NextResponse.json({ error: 'Offer not found', message: 'The specified offer does not exist' }, { status: 404 });
    }
    
    // Check if user is the owner
    if (offer.user_id !== userId) {
      console.error('Unauthorized: User is not the offer owner');
      return NextResponse.json({ error: 'Unauthorized', message: 'You can only delete your own offers' }, { status: 403 });
    }
    
    // Check if offer is in a deletable state (only 'open' offers can be deleted)
    if (offer.status !== 'open') {
      console.error('Cannot delete offer with status:', offer.status);
      return NextResponse.json({
        error: 'Cannot delete offer',
        message: `Offers in '${offer.status}' status cannot be deleted. Only 'open' offers can be deleted.`
      }, { status: 400 });
    }
    
    // Delete the offer
    const { error: deleteError } = await supabase
      .from('jetshare_offers')
      .delete()
      .eq('id', offer_id);
      
    if (deleteError) {
      console.error('Error deleting offer:', deleteError);
      return NextResponse.json({ error: 'Failed to delete offer', message: deleteError.message }, { status: 500 });
    }
    
    console.log('Offer deleted successfully:', offer_id);
    return NextResponse.json({
      success: true,
      message: 'Offer deleted successfully'
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Unexpected error in deleteOffer:', error);
    return NextResponse.json({ error: 'Failed to delete offer', message: (error as Error).message }, { status: 500 });
  }
}

// Add OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
} 