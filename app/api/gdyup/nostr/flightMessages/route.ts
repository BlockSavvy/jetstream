import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// Define interfaces for the data types
interface NostrUser {
  name?: string;
  nip05?: string;
  picture?: string | null;
}

interface NostrMessage {
  id: string;
  pubkey: string;
  content: string;
  created_at: number;
  user?: NostrUser;
}

interface NostrZap {
  id: string;
  amount: number;
  sender: {
    pubkey: string;
    name?: string;
    nip05?: string;
  };
  recipient: {
    pubkey: string;
    name?: string;
    nip05?: string;
  };
  comment?: string;
  created_at: number;
}

interface NostrParticipant {
  pubkey: string;
  name?: string;
  nip05?: string;
  picture?: string | null;
}

export async function GET(request: NextRequest) {
  try {
    // Get the offer ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const offerId = searchParams.get('offerId');
    
    if (!offerId) {
      return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 });
    }
    
    // Create Supabase client
    const supabase = createClient();
    
    // For now, we'll return mock data since this is just scaffolding
    // In a real implementation, this would fetch real messages from the database
    
    // Generate sample participants
    const participants: NostrParticipant[] = [
      {
        pubkey: 'npub1participant1',
        name: 'Alex',
        nip05: 'alex@nostr.com',
        picture: null
      },
      {
        pubkey: 'npub1participant2',
        name: 'Taylor',
        nip05: 'taylor@nostr.com',
        picture: null
      },
      {
        pubkey: 'npub1host',
        name: 'Flight Host',
        nip05: 'host@gdyup.com',
        picture: null
      }
    ];
    
    // Generate sample messages
    const welcomeMessage: NostrMessage = {
      id: `welcome-${offerId}`,
      pubkey: 'npub1host',
      content: `Welcome to Flight Group ${offerId.substring(0, 6)}! This is a private, encrypted chat for all participants on this flight. Feel free to coordinate, ask questions, or just chat.`,
      created_at: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
      user: {
        name: 'Flight Host',
        nip05: 'host@gdyup.com',
        picture: null
      }
    };
    
    const messages: NostrMessage[] = [
      welcomeMessage,
      {
        id: `msg-${offerId}-1`,
        pubkey: 'npub1participant1',
        content: 'Hi everyone! Looking forward to the flight!',
        created_at: Math.floor(Date.now() / 1000) - 43200, // 12 hours ago
        user: {
          name: 'Alex',
          nip05: 'alex@nostr.com',
          picture: null
        }
      },
      {
        id: `msg-${offerId}-2`,
        pubkey: 'npub1participant2',
        content: 'Hello! Anyone know what the weather will be like at our destination?',
        created_at: Math.floor(Date.now() / 1000) - 21600, // 6 hours ago
        user: {
          name: 'Taylor',
          nip05: 'taylor@nostr.com',
          picture: null
        }
      },
      {
        id: `msg-${offerId}-3`,
        pubkey: 'npub1host',
        content: 'The weather at the destination looks great! Clear skies and 75°F / 24°C.',
        created_at: Math.floor(Date.now() / 1000) - 18000, // 5 hours ago
        user: {
          name: 'Flight Host',
          nip05: 'host@gdyup.com',
          picture: null
        }
      }
    ];
    
    // In a real implementation, we'd also fetch any zaps related to this flight
    const zaps: NostrZap[] = [];
    
    return NextResponse.json({
      success: true,
      offerId,
      participants,
      messages,
      zaps
    });
  } catch (error) {
    console.error('Error fetching flight messages:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch flight messages',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 