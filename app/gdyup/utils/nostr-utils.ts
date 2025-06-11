import { JetShareOfferWithUser } from '@/types/jetshare';
import { createClient } from '@/lib/supabase';

/**
 * Broadcasts a JetShare offer to Nostr relays
 * 
 * @param offer The offer to broadcast
 * @param pubkey The user's Nostr public key
 * @param relays The relays to broadcast to
 * @returns The event ID if successful, null otherwise
 */
export async function broadcastOfferToNostr(
  offer: JetShareOfferWithUser,
  pubkey: string,
  relays: string[]
): Promise<string | null> {
  try {
    if (!offer || !pubkey || !relays.length) {
      console.warn('Missing required parameters for Nostr broadcast');
      return null;
    }
    
    // Create the event content
    const content = JSON.stringify({
      type: 'gdyup_offer',
      id: offer.id,
      title: `Flight Share: ${offer.departure_location} to ${offer.arrival_location}`,
      from: offer.departure_location,
      to: offer.arrival_location,
      date: offer.flight_date,
      cost: offer.requested_share_amount,
      total_cost: offer.total_flight_cost,
      seats: offer.available_seats,
      aircraft: offer.aircraft_model || 'Private Jet',
      url: `${window.location.origin}/gdyup/offer/${offer.id}`,
      created_at: new Date().toISOString()
    });
    
    // Create tags for the event
    const tags = [
      ['e', offer.id],
      ['t', 'gdyup'],
      ['t', 'jetcharter'],
      ['t', 'privatejet'],
      ['from', offer.departure_location],
      ['to', offer.arrival_location],
      ['price', offer.requested_share_amount.toString()],
      ['aircraft', offer.aircraft_model || 'Private Jet']
    ];
    
    // We don't have direct access to the Nostr APIs in this utility,
    // so we'll make an API call to our server to handle the broadcast
    const response = await fetch('/api/nostr/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kind: 1, // Regular text note
        content,
        tags,
        pubkey,
        relays
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to broadcast offer: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Save the event ID to the database for future reference
    if (result.eventId) {
      const supabase = createClient();
      const offerData = offer as any; // Type assertion to avoid property access issues
      await supabase.from('jetshare_offers').update({
        nostr_event_id: result.eventId,
        metadata: {
          ...(offerData.metadata || {}),
          nostr_broadcast: {
            timestamp: new Date().toISOString(),
            relays,
            success: true
          }
        }
      }).eq('id', offer.id);
    }
    
    return result.eventId || null;
  } catch (error) {
    console.error('Error broadcasting offer to Nostr:', error);
    return null;
  }
}

/**
 * Create a zap request for a JetShare offer
 * 
 * @param offerId The ID of the offer
 * @param receiverPubkey The receiver's Nostr public key
 * @param amount The amount to zap in sats
 * @param comment Optional comment to include with the zap
 */
export async function createOfferZapRequest(
  offerId: string,
  receiverPubkey: string,
  amount: number,
  comment?: string
): Promise<string | null> {
  try {
    // Get the offer details
    const supabase = createClient();
    const { data: offer, error } = await supabase
      .from('jetshare_offers')
      .select('*')
      .eq('id', offerId)
      .single();
      
    if (error || !offer) {
      throw new Error(`Failed to fetch offer details: ${error?.message || 'Offer not found'}`);
    }
    
    // Create a zap request through our API
    const response = await fetch('/api/nostr/zap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receiver: receiverPubkey,
        amount,
        comment: comment || `Zap for JetShare offer: ${offerId}`,
        tags: [
          ['e', offerId],
          ['t', 'gdyup_zap'],
          ['t', 'jetcharter'],
          ['description', `Payment for flight from ${offer.departure_location} to ${offer.arrival_location}`]
        ]
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create zap request: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.zapRequestId || null;
  } catch (error) {
    console.error('Error creating zap request:', error);
    return null;
  }
}

/**
 * Format a Nostr NIP-05 identifier for display
 * 
 * @param nip05 The NIP-05 identifier (e.g., name@domain.com)
 * @returns Formatted display string
 */
export function formatNip05(nip05: string | null): string {
  if (!nip05) return 'Anonymous';
  
  // Split the NIP-05 identifier into name and domain
  const parts = nip05.split('@');
  if (parts.length !== 2) return nip05;
  
  const [name, domain] = parts;
  
  // If the domain is well-known, just show the name
  const wellKnownDomains = ['nostr.band', 'nostr.com', 'nostr.social', 'primal.net', 'damus.io'];
  if (wellKnownDomains.includes(domain)) {
    return name;
  }
  
  // Otherwise, show the full identifier
  return nip05;
}

/**
 * Get a truncated display version of a Nostr public key
 * 
 * @param pubkey The Nostr public key (hex)
 * @returns Truncated display version
 */
export function formatPubkey(pubkey: string | null): string {
  if (!pubkey) return '';
  if (pubkey.length < 20) return pubkey;
  
  return `${pubkey.substring(0, 8)}...${pubkey.substring(pubkey.length - 8)}`;
} 