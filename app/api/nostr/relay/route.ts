import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

/**
 * List of default Nostr relays used by GDY·UP
 */
const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.snort.social',
  'wss://relay.current.fyi',
  'wss://nos.lol',
  'wss://relay.nostr.band'
];

/**
 * API endpoint to get Nostr relay information and user settings
 * 
 * @param req Request
 * @returns JSON with relay configuration
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check if user is authenticated
    const { data: session } = await supabase.auth.getSession();
    
    if (!session?.session?.user) {
      return NextResponse.json({ 
        isAuthenticated: false,
        defaultRelays: DEFAULT_RELAYS,
        userRelays: [],
        nostrEnabled: false
      });
    }
    
    // Get user profile and settings
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('nostr_pubkey, nip05, nostr_settings, nostr_relays')
      .eq('user_id', session.session.user.id)
      .single();
    
    // Get app settings for global relay configuration
    const { data: appSettings } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'nostr_default_relays')
      .single();
    
    // Parse app settings if available
    let systemRelays = DEFAULT_RELAYS;
    if (appSettings?.value) {
      try {
        const parsed = JSON.parse(appSettings.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          systemRelays = parsed;
        }
      } catch (e) {
        console.warn('Error parsing global relay settings:', e);
      }
    }
    
    // Use user's relays if available, otherwise use default
    let userRelays: string[] = [];
    if (profile?.nostr_relays) {
      try {
        const parsed = typeof profile.nostr_relays === 'string' 
          ? JSON.parse(profile.nostr_relays) 
          : profile.nostr_relays;
          
        if (Array.isArray(parsed)) {
          userRelays = parsed;
        }
      } catch (e) {
        console.warn('Error parsing user relay settings:', e);
      }
    }
    
    return NextResponse.json({
      isAuthenticated: true,
      nostrEnabled: profile?.nostr_settings?.enabled || false,
      hasNip05: !!profile?.nip05,
      pubkey: profile?.nostr_pubkey || null,
      nip05: profile?.nip05 || null,
      settings: profile?.nostr_settings || {
        enabled: false,
        broadcast_offers: true,
        receive_messages: true,
        enable_zaps: true,
        private_mode: false,
        auto_connect: true
      },
      defaultRelays: systemRelays,
      userRelays: userRelays.length > 0 ? userRelays : systemRelays
    });
  } catch (error) {
    console.error('Error fetching relay information:', error);
    return NextResponse.json({ 
      error: 'Failed to get relay information',
      defaultRelays: DEFAULT_RELAYS
    }, { status: 500 });
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