import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { z } from 'zod';

const updateOfferSchema = z.object({
  offer_id: z.string().uuid(),
  departure_location: z.string().min(1),
  arrival_location: z.string().min(1),
  flight_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total_flight_cost: z.number().positive(),
  requested_share_amount: z.number().positive(),
  aircraft_model: z.string().optional(),
  total_seats: z.number().positive().optional(),
  available_seats: z.number().positive().optional()
});

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !userData.user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ error: 'Authentication required', message: 'You must be signed in to update an offer' }, { status: 401 });
    }
    
    const userId = userData.user.id;
    
    // Get and validate request body
    const body = await request.json();
    
    try {
      updateOfferSchema.parse(body);
    } catch (validationError) {
      console.error('Validation error:', validationError);
      return NextResponse.json({ error: 'Invalid request data', details: (validationError as Error).message }, { status: 400 });
    }
    
    const { 
      offer_id, 
      departure_location, 
      arrival_location, 
      flight_date, 
      total_flight_cost, 
      requested_share_amount,
      aircraft_model,
      total_seats,
      available_seats
    } = body;
    
    // Get the offer to verify ownership and status
    const { data: offer, error: offerError } = await supabase
      .from('jetshare_offers')
      .select('*')
      .eq('id', offer_id)
      .maybeSingle();
      
    if (offerError) {
      console.error('Error fetching offer:', offerError);
      return NextResponse.json({ error: 'Failed to verify offer details', message: offerError.message }, { status: 500 });
    }
    
    if (!offer) {
      console.error('Offer not found:', offer_id);
      return NextResponse.json({ error: 'Offer not found', message: 'The specified offer does not exist' }, { status: 404 });
    }
    
    // Verify ownership
    if (offer.user_id !== userId) {
      console.error('Unauthorized: User is not the offer owner');
      return NextResponse.json({ error: 'Unauthorized', message: 'You can only update your own offers' }, { status: 403 });
    }
    
    // Verify offer is in 'open' status
    if (offer.status !== 'open') {
      console.error('Cannot update offer with status:', offer.status);
      return NextResponse.json({
        error: 'Cannot update offer',
        message: `Offers in '${offer.status}' status cannot be updated. Only 'open' offers can be updated.`
      }, { status: 400 });
    }
    
    // Update the offer
    const { data: updatedOffer, error: updateError } = await supabase
      .from('jetshare_offers')
      .update({
        departure_location,
        arrival_location,
        flight_date,
        total_flight_cost,
        requested_share_amount,
        aircraft_model,
        total_seats,
        available_seats,
        updated_at: new Date().toISOString()
      })
      .eq('id', offer_id)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error updating offer:', updateError);
      return NextResponse.json({ error: 'Failed to update offer', message: updateError.message }, { status: 500 });
    }
    
    console.log('Offer updated successfully:', offer_id);
    return NextResponse.json({
      success: true,
      message: 'Offer updated successfully',
      offer: updatedOffer
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Unexpected error in updateOffer:', error);
    return NextResponse.json({ error: 'Failed to update offer', message: (error as Error).message }, { status: 500 });
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