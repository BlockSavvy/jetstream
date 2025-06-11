'use client';

import { NostrRelayService } from './NostrRelayService';
import { NostrEvent } from '@/types/nostr';

// Types for offer broadcasting
interface OfferData {
  id: string;
  departure_location: string;
  arrival_location: string;
  departure_time: string;
  aircraft_model?: string;
  total_seats?: number;
  available_seats?: number;
  total_flight_cost: number;
  requested_share_amount: number;
  status: string;
  user_id: string;
}

interface BroadcastResult {
  success: boolean;
  relaysPublished: string[];
  errors: string[];
}

// Default GDY·UP Nostr groups (example group IDs - replace with real ones)
const GDYUP_GROUPS = [
  'gdyup-jet-sharing-main',
  'gdyup-flight-offers', 
  'gdyup-private-aviation'
];

export class NostrOfferBroadcaster {
  private relayService: NostrRelayService;

  constructor(relayUrls?: string[]) {
    this.relayService = new NostrRelayService(relayUrls);
  }

  /**
   * Broadcast a new offer to configured Nostr groups
   */
  async broadcastOffer(
    offerData: OfferData, 
    userPubkey: string,
    privateKey?: string,
    groups?: string[]
  ): Promise<BroadcastResult> {
    const result: BroadcastResult = {
      success: false,
      relaysPublished: [],
      errors: []
    };

    try {
      // Ensure we're connected to relays
      const connected = await this.relayService.connect();
      if (!connected) {
        throw new Error('Failed to connect to any Nostr relays');
      }

      const targetGroups = groups || GDYUP_GROUPS;
      
      // Create the offer announcement event
      const offerEvent = this.createOfferEvent(offerData, userPubkey, targetGroups);
      
      // Sign the event if private key is provided
      if (privateKey) {
        // Note: In production, you'd use proper nostr-tools signing
        // For now, we'll create a mock signed event
        offerEvent.sig = 'mock_signature_' + Date.now();
      }

      // Broadcast to all connected relays
      const publishedRelays = await this.relayService.publish(offerEvent);
      
      result.relaysPublished = publishedRelays;
      result.success = publishedRelays.length > 0;

      console.log(`✈️ [Nostr] Offer ${offerData.id} broadcasted to ${publishedRelays.length} relays:`, publishedRelays);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(errorMessage);
      console.error('❌ [Nostr] Failed to broadcast offer:', errorMessage);
      return result;
    }
  }

  /**
   * Create a formatted Nostr event for the offer
   */
  private createOfferEvent(
    offerData: OfferData, 
    userPubkey: string, 
    groups: string[]
  ): NostrEvent {
    // Format the offer message
    const message = this.formatOfferMessage(offerData);
    
    // Create tags for groups and metadata
    const tags: string[][] = [
      ['t', 'gdyup'],
      ['t', 'jetshare'],
      ['t', 'privateaviation'],
      ['client', 'GDY·UP'],
      ['offer_id', offerData.id],
      ['departure', offerData.departure_location],
      ['arrival', offerData.arrival_location],
      ['seats', String(offerData.available_seats || 0)],
      ['cost', String(offerData.requested_share_amount)]
    ];

    // Add group tags
    groups.forEach(group => {
      tags.push(['h', group]); // 'h' tag for groups
    });

    return {
      id: this.generateEventId(),
      pubkey: userPubkey,
      created_at: Math.floor(Date.now() / 1000),
      kind: 1, // Text note kind
      tags,
      content: message,
      sig: '' // Will be filled when signing
    };
  }

  /**
   * Format the offer into a readable message
   */
  private formatOfferMessage(offerData: OfferData): string {
    const departureDate = new Date(offerData.departure_time).toLocaleDateString();
    const departureTime = new Date(offerData.departure_time).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Calculate available seats for the message  
    const availableSeats = offerData.available_seats || 0;
    const totalSeats = offerData.total_seats || 0;
    const costPerSeat = Math.round(offerData.requested_share_amount / (availableSeats || 1));
    const occupancyText = availableSeats > 0 ? `${availableSeats} seats available` : 'Fully booked';

    return `✈️ **NEW JET SHARE AVAILABLE** ✈️

🛫 Route: ${offerData.departure_location} → ${offerData.arrival_location}
📅 Date: ${departureDate} at ${departureTime}
🛩️ Aircraft: ${offerData.aircraft_model || 'Private Jet'}
💺 Available Seats: ${occupancyText}
💰 Cost per Seat: $${costPerSeat.toLocaleString()}
💳 Your Share: $${offerData.requested_share_amount.toLocaleString()}

📋 Offer ID: ${offerData.id}
🌐 Book on GDY·UP: https://gdyup.xyz/gdyup/offer/${offerData.id}

#GDYUp #JetShare #PrivateAviation #BitcoinTravel`;
  }

  /**
   * Generate a unique event ID (mock implementation)
   */
  private generateEventId(): string {
    return 'gdyup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Announce offer update (e.g., when seats are booked)
   */
  async broadcastOfferUpdate(
    offerData: OfferData, 
    updateType: 'booked' | 'cancelled' | 'completed',
    userPubkey: string,
    bookedSeats?: number
  ): Promise<BroadcastResult> {
    const result: BroadcastResult = {
      success: false,
      relaysPublished: [],
      errors: []
    };

    try {
      let message = '';
      switch (updateType) {
        case 'booked':
          const remainingSeats = (offerData.available_seats || 0) - (bookedSeats || 0);
          message = `🎉 **SEATS BOOKED** - Flight ${offerData.departure_location} → ${offerData.arrival_location}
${bookedSeats} seat(s) booked! ${remainingSeats} seats remaining.
Offer ID: ${offerData.id}`;
          break;
        case 'cancelled':
          message = `❌ **OFFER CANCELLED** - Flight ${offerData.departure_location} → ${offerData.arrival_location}
This offer has been cancelled by the host.
Offer ID: ${offerData.id}`;
          break;
        case 'completed':
          message = `✅ **FLIGHT COMPLETED** - ${offerData.departure_location} → ${offerData.arrival_location}
Safe travels completed! Thanks for using GDY·UP.
Offer ID: ${offerData.id}`;
          break;
      }

      const updateEvent: NostrEvent = {
        id: this.generateEventId(),
        pubkey: userPubkey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 1,
        tags: [
          ['t', 'gdyup'],
          ['t', 'jetshare'],
          ['t', 'update'],
          ['offer_id', offerData.id],
          ['update_type', updateType]
        ],
        content: message,
        sig: 'mock_signature_' + Date.now()
      };

      const publishedRelays = await this.relayService.publish(updateEvent);
      
      result.relaysPublished = publishedRelays;
      result.success = publishedRelays.length > 0;

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(errorMessage);
      return result;
    }
  }

  /**
   * Get relay connection status
   */
  getRelayStatus() {
    return this.relayService.getStatus();
  }

  /**
   * Cleanup resources
   */
  async disconnect() {
    await this.relayService.disconnect();
  }
} 