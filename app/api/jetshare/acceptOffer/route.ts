import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { acceptJetShareOffer } from '@/lib/services/jetshare';
import { ensureUserProfile } from '@/app/jetshare/utils/ensureUserProfile';
import { z } from 'zod';

// Create a schema for validating the request body
const acceptOfferSchema = z.object({
  offer_id: z.string().uuid(),
  payment_method: z.enum(['fiat', 'crypto']),
});

export async function POST(request: NextRequest) {
  console.log('acceptOffer API endpoint called');
  const supabase = await createClient();

  // Log request details
  const headers = Object.fromEntries(request.headers.entries());
  console.log('Request headers:', {
    cookie: headers.cookie ? `Present (length: ${headers.cookie.length})` : 'Missing',
    'content-type': headers['content-type'],
    authorization: headers.authorization || 'Missing',
    host: headers.host,
    origin: headers.origin,
    referer: headers.referer,
  });
  console.log('Cookie header present:', request.headers.has('cookie'), request.headers.has('cookie') ? `Length: ${request.headers.get('cookie')?.length}` : '');
  const cookieValue = request.headers.get('cookie') || '';
  const cookieNames = cookieValue.split(';').map(c => c.split('=')[0].trim()).filter(Boolean);
  console.log('Cookie names present:', cookieNames);


  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Authentication error in acceptOffer:', authError);
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  console.log('Authenticated user:', user.id, user.email);

  try {
    const body = await request.json();
    console.log('Request body:', body);
    const { offer_id, payment_method } = body; // Assuming these are passed

    if (!offer_id) {
      return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 });
    }
    // Optional: Ensure user profile exists
    await ensureUserProfile(supabase, user);
    console.log('User profile confirmed, proceeding to accept offer');


    // --- Core Logic ---
    // Fetch the offer to check status and ownership
    console.log(`Fetching offer ${offer_id} for acceptance by user ${user.id}`);
    const { data: offerData, error: fetchError } = await supabase
      .from('jetshare_offers')
      .select('id, user_id, status, matched_user_id')
      .eq('id', offer_id)
      .single();

    if (fetchError || !offerData) {
        console.error(`Error fetching offer ${offer_id} or not found:`, fetchError);
        return NextResponse.json({ error: 'Offer not found or cannot be accepted' }, { status: 404 });
    }
     console.log(`Offer details for accepting:`, {
        id: offerData.id,
        status: offerData.status,
        offerUserId: offerData.user_id,
        currentMatchedUserId: offerData.matched_user_id ?? 'none',
        acceptingUserId: user.id,
     });


    // Validation checks
    if (offerData.user_id === user.id) {
        console.warn(`User ${user.id} cannot accept their own offer ${offer_id}`);
        return NextResponse.json({ error: 'You cannot accept your own offer' }, { status: 400 });
    }
    if (offerData.status !== 'open') {
        console.warn(`Offer ${offer_id} is not open (status: ${offerData.status}). Cannot accept.`);
        return NextResponse.json({ error: `Offer is no longer available (status: ${offerData.status})` }, { status: 400 });
    }
    if (offerData.matched_user_id) {
         console.warn(`Offer ${offer_id} already has a matched user (${offerData.matched_user_id}). Cannot accept.`);
        return NextResponse.json({ error: 'Offer has already been accepted' }, { status: 409 }); // Conflict
    }


    // Perform the update
    console.log(`Attempting to update offer ${offer_id}: set status=accepted, matched_user_id=${user.id}`);
    const { data: updatedOffer, error: updateError } = await supabase
        .from('jetshare_offers')
        .update({
            status: 'accepted',
            matched_user_id: user.id,
        })
        .eq('id', offer_id)
        .eq('status', 'open') // Ensure it's still open (atomic check)
        .is('matched_user_id', null) // Ensure it wasn't matched concurrently
        .select() // Return the updated record
        .single(); // Expect a single row

    if (updateError || !updatedOffer) {
        console.error(`Failed to update offer ${offer_id} to accepted state:`, updateError);
         // Check if it was because the status/match changed concurrently
       if (updateError?.code === 'PGRST116') { // PostgREST code for "Matching row not found"
         console.warn(`Offer ${offer_id} likely accepted or status changed concurrently.`);
         // Refetch to provide accurate error message
         const { data: currentOfferState } = await supabase.from('jetshare_offers').select('status, matched_user_id').eq('id', offer_id).single();
         return NextResponse.json({ error: `Offer could not be accepted. Current status: ${currentOfferState?.status ?? 'unknown'}. Please refresh.` }, { status: 409 }); // Conflict
       }
        return NextResponse.json({ error: 'Failed to accept offer', details: updateError?.message }, { status: 500 });
    }

    console.log(`Offer ${offer_id} updated successfully to accepted state by user ${user.id}. Updated data:`, updatedOffer);

    // Return success response, potentially including the updated offer data
    return NextResponse.json({ success: true, offer: updatedOffer, message: 'Offer accepted. Proceed to payment.' });

  } catch (error: any) {
    console.error('Unexpected error in acceptOffer:', error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}

// Add OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
} 