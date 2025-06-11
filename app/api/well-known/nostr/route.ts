import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Ensure the response is not cached
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Fetch profiles with nip05 identifiers and nostr pubkeys
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('nip05, nostr_pubkey')
      .filter('nip05', 'not.is', null)
      .filter('nostr_pubkey', 'not.is', null);
    
    if (error) {
      console.error('Error fetching profiles for nostr.json:', error);
      return NextResponse.json(
        { error: 'Failed to generate nostr.json' },
        { status: 500 }
      );
    }
    
    // Build the names object for nostr.json
    const names: Record<string, string> = {};
    
    profiles?.forEach((profile: { nip05: string; nostr_pubkey: string }) => {
      if (profile.nip05 && profile.nostr_pubkey) {
        // Extract the local part of the nip05 identifier (before the @)
        const localPart = profile.nip05.split('@')[0];
        if (localPart) {
          names[localPart] = profile.nostr_pubkey;
        }
      }
    });
    
    // Return the nostr.json response
    return NextResponse.json(
      { names },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'Access-Control-Allow-Origin': '*', // Allow cross-origin requests
        },
      }
    );
  } catch (error) {
    console.error('Error generating nostr.json:', error);
    return NextResponse.json(
      { error: 'Failed to generate nostr.json' },
      { status: 500 }
    );
  }
} 