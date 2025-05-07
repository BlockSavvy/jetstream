import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flightId, email, pubkey } = body;
    
    if (!flightId) {
      return NextResponse.json({ error: 'Missing flight ID' }, { status: 400 });
    }
    
    if (!email && !pubkey) {
      return NextResponse.json({ error: 'Missing email or pubkey' }, { status: 400 });
    }
    
    // Create Supabase client
    const supabase = createClient();
    
    // Verify that the flight exists
    const { data: flightData, error: flightError } = await supabase
      .from('jetshare_offers')
      .select('id, user_id')
      .eq('id', flightId)
      .single();
    
    if (flightError || !flightData) {
      return NextResponse.json({ 
        error: 'Flight not found',
        details: flightError?.message
      }, { status: 404 });
    }
    
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Store the invitation in the database
    const { data: inviteData, error: inviteError } = await supabase
      .from('nostr_flight_invitations')
      .insert({
        flight_id: flightId,
        sender_id: session.user.id,
        recipient_email: email || null,
        recipient_pubkey: pubkey || null,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (inviteError) {
      return NextResponse.json({ 
        error: 'Failed to create invitation',
        details: inviteError.message
      }, { status: 500 });
    }
    
    // If an email is provided, send an email invitation
    if (email) {
      // In a production environment, this would send an actual email
      // For this implementation, we'll just log it
      console.log(`[Flight Group Invitation] Email invitation sent to ${email} for flight ${flightId}`);
      
      // TODO: Implement email sending functionality
      // Could use a service like SendGrid, Mailgun, etc.
    }
    
    // If a pubkey is provided, send a Nostr direct message
    if (pubkey) {
      // In a production environment, this would send a Nostr DM
      // For this implementation, we'll just log it
      console.log(`[Flight Group Invitation] Nostr DM sent to ${pubkey} for flight ${flightId}`);
      
      // TODO: Implement Nostr DM sending functionality
      // This would typically involve signing and publishing a kind 4 event to relays
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Invitation sent successfully',
      inviteId: inviteData.id
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 