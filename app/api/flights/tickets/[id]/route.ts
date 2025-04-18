import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { GetRouteHandler, PostRouteHandler, PatchRouteHandler, DeleteRouteHandler, PutRouteHandler, IdParam } from '@/lib/types/route-types';

export const GET: GetRouteHandler<{ id: string }> = async (
  request: NextRequest,
  context: IdParam
) => {
  try {
    const { id } = await context.params;
const ticketId = id;
    
    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Get the ticket with all related information
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*, bookings(*), flights(*, jets(*), origin:airports!flights_origin_airport_fkey(*), destination:airports!flights_destination_airport_fkey(*))')
      .eq('id', ticketId)
      .single();
    
    if (error) {
      console.error('Error fetching ticket:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ticket' },
        { status: 500 }
      );
    }
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      ticket
    });
  } catch (error) {
    console.error('Error processing ticket request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
};