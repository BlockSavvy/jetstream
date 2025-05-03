/**
 * Nostr protocol utility functions
 */

import { NostrEvent, NostrFilter, NostrKeyPair, NostrJetShareOffer, NostrEventKind } from '@/types/nostr';
import * as secp from '@noble/secp256k1';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils';
import { sha256 } from '@noble/hashes/sha256';
import { hmac } from '@noble/hashes/hmac';

// Bech32 library for encoding/decoding npub, etc.
import { bech32 } from '@scure/base';

// Add this to ensure the hmac function is available for signing
secp.etc.hmacSha256Sync = (key, ...messages) => {
  const message = secp.etc.concatBytes(...messages);
  return hmac(sha256, key, message);
};

/**
 * Generate a Nostr keypair
 */
export function generateNostrKeypair(): NostrKeyPair {
  // Generate a random 32-byte private key
  const privateKey = secp.etc.randomBytes(32);
  const privateKeyHex = bytesToHex(privateKey);
  
  // Derive the public key
  const publicKey = secp.getPublicKey(privateKey);
  const publicKeyHex = bytesToHex(publicKey);
  
  return {
    privateKey: privateKeyHex,
    publicKey: publicKeyHex,
  };
}

/**
 * Convert a hex public key to npub format
 */
export function hexToNpub(hex: string): string {
  try {
    const data = bech32.toWords(hexToBytes(hex));
    return bech32.encode('npub', data);
  } catch (error) {
    console.error('Error converting hex to npub:', error);
    throw error;
  }
}

/**
 * Convert an npub to hex format
 */
export function npubToHex(npub: string): string {
  try {
    const { words } = bech32.decode(npub as `${string}1${string}`);
    const data = bech32.fromWords(words);
    return bytesToHex(new Uint8Array(data));
  } catch (error) {
    console.error('Error converting npub to hex:', error);
    throw error;
  }
}

/**
 * Create a Nostr event ID (NIP-01)
 */
export function createEventId(event: Omit<NostrEvent, 'id' | 'sig'>): string {
  const eventData = [
    0, // NIP-01 prefix
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content,
  ];
  
  // Serialize and hash the event data
  const serialized = JSON.stringify(eventData);
  const hash = sha256(utf8ToBytes(serialized));
  
  return bytesToHex(hash);
}

/**
 * Sign a Nostr event
 */
export async function signEvent(event: Omit<NostrEvent, 'id' | 'sig'> & { id?: string }, privateKeyHex: string): Promise<NostrEvent> {
  const eventId = event.id || createEventId(event);
  
  // Use the secp.sign API which returns a Signature object
  const signature = await secp.sign(eventId, privateKeyHex);
  
  return {
    ...event,
    id: eventId,
    sig: signature.toCompactHex(),
  };
}

/**
 * Verify a Nostr event signature
 */
export function verifySignature(event: NostrEvent): boolean {
  try {
    if (!event.id || !event.sig || !event.pubkey) {
      return false;
    }
    
    return secp.verify(
      event.sig,
      event.id,
      event.pubkey
    );
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

/**
 * Check if browser has Nostr extension (NIP-07)
 */
export function hasNostrExtension(): boolean {
  return typeof window !== 'undefined' && 'nostr' in window;
}

/**
 * Request public key from Nostr extension
 */
export async function requestPublicKey(): Promise<string | null> {
  if (!hasNostrExtension()) {
    return null;
  }
  
  try {
    const pubkey = await window.nostr?.getPublicKey();
    return pubkey || null;
  } catch (error) {
    console.error('Error requesting public key from extension:', error);
    return null;
  }
}

/**
 * Sign event with Nostr extension
 */
export async function signEventWithExtension(event: Partial<NostrEvent>): Promise<NostrEvent | null> {
  if (!hasNostrExtension()) {
    return null;
  }
  
  try {
    const signedEvent = await window.nostr?.signEvent(event);
    return signedEvent || null;
  } catch (error) {
    console.error('Error signing event with extension:', error);
    return null;
  }
}

/**
 * Connect to a Nostr relay with WebSocket
 */
export function connectToRelay(relayUrl: string): WebSocket {
  const socket = new WebSocket(relayUrl);
  
  socket.addEventListener('open', () => {
    console.log(`Connected to relay: ${relayUrl}`);
  });
  
  socket.addEventListener('error', (error) => {
    console.error(`Error connecting to relay ${relayUrl}:`, error);
  });
  
  socket.addEventListener('close', () => {
    console.log(`Disconnected from relay: ${relayUrl}`);
  });
  
  return socket;
}

/**
 * Subscribe to events from a relay
 */
export function subscribeToEvents(socket: WebSocket, filters: NostrFilter[], subscriptionId?: string): string {
  const id = subscriptionId || Math.random().toString(36).substring(2, 15);
  
  const subscriptionMessage = JSON.stringify([
    'REQ',
    id,
    ...filters,
  ]);
  
  socket.send(subscriptionMessage);
  return id;
}

/**
 * Unsubscribe from events
 */
export function unsubscribeFromEvents(socket: WebSocket, subscriptionId: string): void {
  const unsubscriptionMessage = JSON.stringify([
    'CLOSE',
    subscriptionId,
  ]);
  
  socket.send(unsubscriptionMessage);
}

/**
 * Publish an event to a relay
 */
export function publishEvent(socket: WebSocket, event: NostrEvent): void {
  const publishMessage = JSON.stringify([
    'EVENT',
    event,
  ]);
  
  socket.send(publishMessage);
}

/**
 * Create a Nostr JetShare offer event
 */
export function createJetShareOfferEvent(
  pubkey: string,
  offer: NostrJetShareOffer
): Omit<NostrEvent, 'id' | 'sig'> {
  const tags = [
    ['t', 'jetshare'],
    ['t', 'gdyup'],
    ['t', 'charter'],
    ['d', offer.id],
    ['departure', offer.departure_location],
    ['arrival', offer.arrival_location],
    ['date', offer.flight_date],
    ['amount', offer.requested_share_amount.toString()],
  ];
  
  // Add Lightning address if available
  if (offer.creator_lud16) {
    tags.push(['lud16', offer.creator_lud16]);
  }
  
  // Add expiration if available
  if (offer.expires_at) {
    tags.push(['expiration', offer.expires_at]);
  }
  
  return {
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind: NostrEventKind.JetShareOffer,
    tags,
    content: JSON.stringify(offer),
  };
}

/**
 * Create a NIP-04 encrypted direct message
 */
export async function createEncryptedDirectMessage(
  senderPrivateKey: string,
  recipientPubkey: string,
  content: string
): Promise<Omit<NostrEvent, 'id' | 'sig'>> {
  // NIP-04 for message encryption
  // Implement ECDH + encryption or use the extension
  
  // For now using the extension if available
  if (hasNostrExtension()) {
    try {
      const encryptedContent = await window.nostr?.nip04.encrypt(recipientPubkey, content);
      
      const senderPubkey = bytesToHex(secp.getPublicKey(hexToBytes(senderPrivateKey)));
      
      return {
        pubkey: senderPubkey,
        created_at: Math.floor(Date.now() / 1000),
        kind: NostrEventKind.EncryptedDirectMessage,
        tags: [['p', recipientPubkey]],
        content: encryptedContent || '',
      };
    } catch (error) {
      console.error('Error encrypting message with extension:', error);
      throw error;
    }
  } else {
    // Fallback to our own encryption (would need to implement NIP-04)
    throw new Error('Nostr extension required for encrypted messages');
  }
}

/**
 * Decrypt a NIP-04 encrypted direct message
 */
export async function decryptDirectMessage(
  senderPubkey: string,
  encryptedContent: string
): Promise<string> {
  if (hasNostrExtension()) {
    try {
      const decrypted = await window.nostr?.nip04.decrypt(senderPubkey, encryptedContent);
      return decrypted || '';
    } catch (error) {
      console.error('Error decrypting message with extension:', error);
      throw error;
    }
  } else {
    // Fallback to our own decryption (would need to implement NIP-04)
    throw new Error('Nostr extension required for decrypting messages');
  }
}

/**
 * Get default recommended relays
 */
export function getDefaultRelays(): string[] {
  return [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://relay.nostr.band',
    'wss://relay.current.fyi',
    'wss://purplepag.es'
  ];
}

/**
 * Get a connected relay with fallback
 * Attempts to connect to relays in sequence until successful
 */
export async function getConnectedRelayWithFallback(
  customRelays?: string[]
): Promise<WebSocket | null> {
  // Use provided relays or defaults
  const relaysToTry = customRelays || getDefaultRelays();
  
  // Try each relay in sequence
  for (const relayUrl of relaysToTry) {
    try {
      const socket = connectToRelay(relayUrl);
      
      // Return a promise that resolves when connected or rejects on error
      const result = await new Promise<WebSocket | null>((resolve, reject) => {
        // Set timeout to avoid waiting too long (3 seconds)
        const timeout = setTimeout(() => {
          socket.removeEventListener('open', handleOpen);
          socket.removeEventListener('error', handleError);
          socket.close();
          resolve(null); // Resolve with null on timeout
        }, 3000);
        
        // Success handler
        const handleOpen = () => {
          clearTimeout(timeout);
          socket.removeEventListener('error', handleError);
          resolve(socket);
        };
        
        // Error handler
        const handleError = (err: Event) => {
          clearTimeout(timeout);
          socket.removeEventListener('open', handleOpen);
          reject(err);
        };
        
        // Add event listeners
        socket.addEventListener('open', handleOpen, { once: true });
        socket.addEventListener('error', handleError, { once: true });
      });
      
      // If we got a valid connection, return it
      if (result) {
        console.log(`Successfully connected to relay: ${relayUrl}`);
        return result;
      }
    } catch (error) {
      console.warn(`Failed to connect to relay ${relayUrl}, trying next...`);
    }
  }
  
  // If all relays failed, return null
  console.error('All relays failed to connect');
  return null;
}

/**
 * Create a NIP-57 zap request
 */
export function createZapRequest(
  pubkey: string,
  recipientPubkey: string,
  amount: number,
  comment: string = '',
  lnurl?: string,
  eventId?: string
): Omit<NostrEvent, 'id' | 'sig'> {
  const tags: string[][] = [
    ['p', recipientPubkey],
    ['amount', amount.toString()],
    ['relays', ...getDefaultRelays()],
  ];
  
  // Add event reference if provided
  if (eventId) {
    tags.push(['e', eventId]);
  }
  
  // Add lnurl if provided
  if (lnurl) {
    tags.push(['lnurl', lnurl]);
  }
  
  return {
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind: NostrEventKind.ZapRequest,
    tags,
    content: comment,
  };
} 