import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { generateGoogleWalletPass } from '@/lib/services/wallet';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id;
    const verificationCode = request.nextUrl.searchParams.get('code');
    
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
    
    // Verify the ticket code if provided
    if (verificationCode && ticket.ticket_code !== verificationCode) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 403 }
      );
    }
    
    // Generate the Google Wallet pass URL
    // In a production environment, this would integrate with the Google Pay API
    // Here, we'll just return a success page with the ticket details
    try {
      const googleWalletUrl = await generateGoogleWalletPass(ticket, ticket.flights);
      
      // For this implementation, we'll redirect to a success page
      // In a real implementation, this would redirect to the actual Google Wallet
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const successUrl = `${baseUrl}/flights/tickets/${ticketId}?wallet=google&added=true`;
      
      return NextResponse.redirect(successUrl);
    } catch (error) {
      console.error('Error generating Google Wallet pass:', error);
      return NextResponse.json(
        { error: 'Failed to generate Google Wallet pass' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing Google Wallet request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 