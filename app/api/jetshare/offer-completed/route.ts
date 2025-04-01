import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

/**
 * Finalizes the offer completion process
 * This is called from the payment success page to ensure tickets are created
 * and all post-payment processes are completed
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API] offer-completed: Starting finalization process');
    
    const body = await request.json();
    const { offer_id, user_id } = body;
    
    if (!offer_id) {
      return NextResponse.json({ 
        success: false, 
        message: 'Offer ID is required' 
      }, { status: 400 });
    }
    
    console.log(`[API] offer-completed: Processing offer ${offer_id}`);
    
    // Get Supabase client
    const supabase = await createClient();
    
    // Get the offer details
    const { data: offer, error: offerError } = await supabase
      .from('jetshare_offers')
      .select(`
        *,
        user:user_id (id, first_name, last_name, email),
        matched_user:matched_user_id (id, first_name, last_name, email)
      `)
      .eq('id', offer_id)
      .single();
    
    if (offerError || !offer) {
      console.error('[API] offer-completed: Error fetching offer:', offerError);
      return NextResponse.json({ 
        success: false, 
        message: 'Offer not found' 
      }, { status: 404 });
    }
    
    // 1. Ensure the offer is marked as completed
    const { error: updateError } = await supabase
      .from('jetshare_offers')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        tickets_generated: true
      })
      .eq('id', offer_id);
    
    if (updateError) {
      console.error('[API] offer-completed: Error updating offer status:', updateError);
      // Continue anyway, as this is not critical
    }
    
    // 2. Check if tickets already exist
    const { data: existingTickets, error: ticketsError } = await supabase
      .from('jetshare_tickets')
      .select('id')
      .eq('offer_id', offer_id);
    
    if (!ticketsError && existingTickets && existingTickets.length > 0) {
      console.log(`[API] offer-completed: Tickets already exist for offer ${offer_id}`);
      return NextResponse.json({
        success: true,
        message: 'Offer already finalized',
        tickets: existingTickets,
        offer_id
      });
    }
    
    // 3. Create tickets for both users
    const ticketIds = [];
    
    // Users to create tickets for
    const users = [
      { id: offer.user_id, name: `${offer.user.first_name} ${offer.user.last_name}` },
      { id: offer.matched_user_id, name: `${offer.matched_user.first_name} ${offer.matched_user.last_name}` }
    ];
    
    for (const user of users) {
      // Skip if user is undefined/null
      if (!user.id) continue;
      
      try {
        const ticketId = uuidv4();
        const ticketCode = `JS-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        
        const { data: ticket, error: ticketError } = await supabase
          .from('jetshare_tickets')
          .insert([{
            id: ticketId,
            offer_id: offer_id,
            user_id: user.id,
            ticket_code: ticketCode,
            passenger_name: user.name,
            seat_number: user.id === offer.user_id ? '1A' : '1B', // Different seats for each user
            boarding_time: new Date(offer.flight_date).toISOString(),
            gate: `A${Math.floor(Math.random() * 20) + 1}`,
            status: 'active',
            booking_status: 'confirmed',
            created_at: new Date().toISOString(),
            metadata: {
              departure_location: offer.departure_location,
              arrival_location: offer.arrival_location,
              aircraft_model: offer.aircraft_model
            }
          }])
          .select()
          .single();
        
        if (ticketError) {
          console.error(`[API] offer-completed: Error creating ticket for user ${user.id}:`, ticketError);
        } else {
          console.log(`[API] offer-completed: Created ticket ${ticket.id} for user ${user.id}`);
          ticketIds.push(ticket.id);
        }
      } catch (e) {
        console.error(`[API] offer-completed: Exception creating ticket for user ${user.id}:`, e);
      }
    }
    
    console.log(`[API] offer-completed: Created ${ticketIds.length} tickets for offer ${offer_id}`);
    
    return NextResponse.json({
      success: true,
      message: 'Offer finalized successfully',
      data: {
        tickets: ticketIds,
        offer_id
      }
    });
    
  } catch (error) {
    console.error('[API] offer-completed: Unhandled error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 