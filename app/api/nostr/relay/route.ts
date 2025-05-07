import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Default relays for GDY·UP Nostr integration
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
 * API endpoint to get Nostr relay configuration
 */
export async function GET(request: NextRequest) {
  // Check for dev mode header set by middleware
  const isDevMode = request.headers.get('x-dev-mode') === 'true';
  
  try {
    if (!isDevMode) {
      // In production, we need to authenticate the user
      const supabase = createRouteHandlerClient({ cookies });
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No authenticated user in Nostr relay API request');
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      
      // TODO: Get user's specific relay configuration from database
      // For now, return defaults
    } else {
      console.log('DEV MODE: Bypassing authentication for Nostr relay API');
    }
    
    // Return relay configuration
    return NextResponse.json({
      nostrEnabled: true,
      relays: DEFAULT_RELAYS,
      userRelays: [],
      canAddCustomRelays: true
    });
  } catch (error) {
    console.error('Error in Nostr relay API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const supabase = createRouteHandlerClient({ cookies });
    
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