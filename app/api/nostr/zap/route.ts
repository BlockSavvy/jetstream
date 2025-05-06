import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

/**
 * Generate a random hex string of the specified length
 */
function getRandomHex(length: number): string {
  const characters = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * API endpoint to create and process Nostr zap requests
 * 
 * @param req Request with zap data
 * @returns JSON with result of the zap request operation
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
    if (!body.receiver || !body.amount || body.amount <= 0) {
      return NextResponse.json({ 
        error: 'Missing required fields: receiver and amount > 0 are required' 
      }, { status: 400 });
    }
    
    // Get user profile to check if Nostr and zaps are enabled
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('nostr_settings, nostr_pubkey')
      .eq('user_id', session.session.user.id)
      .single();
      
    if (!profile?.nostr_settings?.enabled || !profile?.nostr_settings?.enable_zaps) {
      return NextResponse.json({ 
        error: 'Nostr zaps are not enabled for this user',
        status: 'disabled'
      }, { status: 403 });
    }
    
    if (!profile.nostr_pubkey) {
      return NextResponse.json({ 
        error: 'User does not have a Nostr public key',
        status: 'missing_pubkey'
      }, { status: 400 });
    }
    
    // Get relays to use for the zap request
    const { data: relaySettings } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'nostr_default_relays')
      .single();
      
    let relays: string[] = [
      'wss://relay.damus.io',
      'wss://relay.snort.social',
      'wss://nos.lol'
    ];
    
    if (relaySettings?.value) {
      try {
        const parsedRelays = JSON.parse(relaySettings.value);
        if (Array.isArray(parsedRelays) && parsedRelays.length > 0) {
          relays = parsedRelays;
        }
      } catch (e) {
        console.warn('Error parsing relay settings:', e);
      }
    }
    
    // In a real implementation, this would:
    // 1. Create a zap request event (kind 9734)
    // 2. Sign it with the user's private key
    // 3. Broadcast it to relays
    // 4. Return the invoice and other details
    
    // For now, we'll simulate a successful operation
    console.log('Creating zap request:', {
      sender: profile.nostr_pubkey,
      receiver: body.receiver,
      amount: body.amount,
      comment: body.comment,
      tags: body.tags
    });
    
    // Generate a mock zap request ID and invoice
    const mockZapRequestId = `zapid-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const mockInvoice = `lnbc${body.amount}n1p${getRandomHex(15)}xjmt5w508d6qejxtdg4y5r3zarvary0c5xw7k${getRandomHex(20)}enp0d2skwetl`;
    
    // Log the zap request in the database
    await supabase.from('nostr_zaps').insert({
      user_id: session.session.user.id,
      sender_pubkey: profile.nostr_pubkey,
      receiver_pubkey: body.receiver,
      amount: body.amount,
      comment: body.comment || '',
      tags: body.tags || [],
      zap_request_id: mockZapRequestId,
      invoice: mockInvoice,
      status: 'created',
      created_at: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: true,
      zapRequestId: mockZapRequestId,
      invoice: mockInvoice,
      receiver: body.receiver,
      amount: body.amount,
      status: 'created',
      relays,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating zap request:', error);
    return NextResponse.json({ 
      error: 'Failed to create zap request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 