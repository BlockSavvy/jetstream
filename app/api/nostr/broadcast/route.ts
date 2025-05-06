import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

/**
 * API endpoint to broadcast events to Nostr relays
 * 
 * @param req Request with event data
 * @returns JSON with result of the broadcast operation
 */
export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const supabase = createClient();
    const { data: session } = await supabase.auth.getSession();
    
    if (!session?.session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const body = await req.json();
    
    // Validate required fields
    if (!body.content || !body.pubkey || !Array.isArray(body.relays) || body.relays.length === 0) {
      return NextResponse.json({ 
        error: 'Missing required fields: content, pubkey, and relays are required' 
      }, { status: 400 });
    }
    
    // In a real implementation, this would connect to the Nostr relays
    // and broadcast the event. For now, we'll simulate a successful operation.
    console.log('Broadcasting Nostr event:', body);
    
    // Get user profile to check if Nostr is enabled
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('nostr_settings')
      .eq('user_id', session.session.user.id)
      .single();
      
    if (!profile?.nostr_settings?.enabled) {
      return NextResponse.json({ 
        error: 'Nostr is not enabled for this user',
        status: 'disabled'
      }, { status: 403 });
    }
    
    // Generate a mock event ID
    const mockEventId = `mock-event-id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Log the broadcast in the database
    await supabase.from('nostr_events').insert({
      user_id: session.session.user.id,
      pubkey: body.pubkey,
      kind: body.kind || 1,
      content: body.content,
      tags: body.tags || [],
      event_id: mockEventId,
      relays: body.relays,
      status: 'sent',
      created_at: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: true,
      eventId: mockEventId,
      message: 'Event broadcast initiated',
      relays: body.relays,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error broadcasting Nostr event:', error);
    return NextResponse.json({ 
      error: 'Failed to broadcast Nostr event',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 