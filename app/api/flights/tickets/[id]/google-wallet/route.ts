import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { generateGoogleWalletPass } from '@/lib/services/wallet';
import { GetRouteHandler, IdParam } from '@/lib/types/route-types';

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
    
    // Get the ticket with flight information
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*, flights(*)')
      .eq('id', ticketId)
      .single();
    
    if (error || !ticket) {
      console.error('Error fetching ticket:', error);
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }
    
    // Generate the Google Wallet pass
    const passObject = await generateGoogleWalletPass(ticket, ticket.flights);
    
    if (!passObject) {
      return NextResponse.json(
        { error: 'Failed to generate Google Wallet pass' },
        { status: 500 }
      );
    }
    
    // Return the pass as JSON
    return NextResponse.json(passObject);
  } catch (error) {
    console.error('Error generating Google Wallet pass:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}; 