import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createClient } from '@/lib/supabase';

/**
 * List of default Nostr relays used by GDY·UP
 */
const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.snort.social',
  'wss://relay.current.fyi',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://nostr-pub.wellorder.net'
];

/**
 * API endpoint to get Nostr relay information and user settings
 * 
 * @param req Request
 * @returns JSON with relay configuration
 */
export async function GET(request: NextRequest) {
  try {
    // Get the Supabase client with cookies from the request
    const cookieStore = cookies();
    const supabase = createClient();

    // Get the user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error in Nostr relay API:', sessionError);
      return NextResponse.json(
        { error: 'Authentication failed', code: 'auth_error' },
        { status: 401 }
      );
    }
    
    if (!session || !session.user) {
      console.log('No authenticated user in Nostr relay API request');
      return NextResponse.json(
        { error: 'Authentication required', code: 'not_authenticated' },
        { status: 401 }
      );
    }
    
    const user_id = session.user.id;
    
    // Get user's Nostr profile if it exists
    const { data: nostrProfile, error: nostrError } = await supabase
      .from('user_nostr_profiles')
      .select('pubkey, nip05, relays, settings')
      .eq('user_id', user_id)
      .single();
      
    if (nostrError && nostrError.code !== 'PGRST116') { // Not found is ok, other errors are not
      console.error('Error fetching Nostr profile:', nostrError);
      return NextResponse.json(
        { error: 'Failed to fetch Nostr profile', code: 'db_error' },
        { status: 500 }
      );
    }
    
    // If no profile exists, return sensible defaults
    if (!nostrProfile) {
      console.log(`No Nostr profile found for user ${user_id}`);
      return NextResponse.json({
        nostrEnabled: false,
        pubkey: null,
        nip05: null,
        hasNip05: false,
        defaultRelays: DEFAULT_RELAYS,
        userRelays: [],
        relays: DEFAULT_RELAYS,
        settings: {
          enabled: false,
          broadcast_offers: true,
          receive_messages: true,
          enable_zaps: true,
          private_mode: false,
          auto_connect: true
        }
      });
    }
    
    // Parse relays from JSON or use defaults
    let userRelays = DEFAULT_RELAYS;
    try {
      if (nostrProfile.relays) {
        if (typeof nostrProfile.relays === 'string') {
          userRelays = JSON.parse(nostrProfile.relays);
        } else if (Array.isArray(nostrProfile.relays)) {
          userRelays = nostrProfile.relays;
        }
      }
    } catch (e) {
      console.error('Error parsing relays:', e);
    }
    
    // Parse settings from JSON or use defaults
    let settings = {
      enabled: true,
      broadcast_offers: true,
      receive_messages: true,
      enable_zaps: true,
      private_mode: false,
      auto_connect: true
    };
    
    try {
      if (nostrProfile.settings) {
        if (typeof nostrProfile.settings === 'string') {
          settings = JSON.parse(nostrProfile.settings);
        } else if (typeof nostrProfile.settings === 'object') {
          settings = {
            ...settings,
            ...nostrProfile.settings
          };
        }
      }
    } catch (e) {
      console.error('Error parsing settings:', e);
    }
    
    // Return user's Nostr profile data
    return NextResponse.json({
      nostrEnabled: !!nostrProfile.pubkey,
      pubkey: nostrProfile.pubkey,
      nip05: nostrProfile.nip05,
      hasNip05: !!nostrProfile.nip05,
      defaultRelays: DEFAULT_RELAYS,
      userRelays,
      relays: userRelays,
      settings
    });
  } catch (error) {
    console.error('Unhandled error in Nostr relay API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', code: 'server_error' },
      { status: 500 }
    );
  }
}

/**
 * API endpoint to update user's Nostr relay configuration
 * 
 * @param req Request with updated relay configuration
 * @returns JSON with updated settings
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check if user is authenticated
    const { data: session } = await supabase.auth.getSession();
    
    if (!session?.session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const body = await req.json();
    
    // Validate relays
    if (body.relays && (!Array.isArray(body.relays) || body.relays.some((r: unknown) => typeof r !== 'string'))) {
      return NextResponse.json({ error: 'Invalid relay format' }, { status: 400 });
    }
    
    // Validate settings if provided
    if (body.settings) {
      const requiredBooleanFields = ['enabled', 'broadcast_offers', 'receive_messages', 'enable_zaps', 'private_mode', 'auto_connect'];
      
      // Check all required fields are present and boolean
      const missingOrInvalidFields = requiredBooleanFields.filter(field => 
        typeof body.settings[field] !== 'boolean'
      );
      
      if (missingOrInvalidFields.length > 0) {
        return NextResponse.json({ 
          error: `Invalid settings format. The following fields are missing or not boolean: ${missingOrInvalidFields.join(', ')}` 
        }, { status: 400 });
      }
    }
    
    // Update user profile
    const updateData: Record<string, any> = {};
    
    if (body.relays) {
      updateData.nostr_relays = body.relays;
    }
    
    if (body.settings) {
      updateData.nostr_settings = body.settings;
    }
    
    // Only proceed if we have data to update
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', session.session.user.id);
        
      if (updateError) {
        throw updateError;
      }
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Nostr settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating relay settings:', error);
    return NextResponse.json({ 
      error: 'Failed to update Nostr settings'
    }, { status: 500 });
  }
} 