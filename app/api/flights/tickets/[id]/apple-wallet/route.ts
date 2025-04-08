import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { generateAppleWalletPass } from '@/lib/services/wallet';
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
    
    // Generate the Apple Wallet pass
    const passBuffer = await generateAppleWalletPass(ticket, ticket.flights);
    
    if (!passBuffer) {
      return NextResponse.json(
        { error: 'Failed to generate Apple Wallet pass' },
        { status: 500 }
      );
    }
    
    // Return the pass as a downloadable file
    return new NextResponse(passBuffer, {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="ticket-${ticketId}.pkpass"`,
      },
    });
  } catch (error) {
    console.error('Error generating Apple Wallet pass:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}; 