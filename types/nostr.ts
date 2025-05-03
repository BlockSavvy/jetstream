/**
 * Nostr protocol integration types
 */

// Basic Nostr Event kind types (partial list of relevant ones)
export enum NostrEventKind {
  Metadata = 0,
  Text = 1,
  RecommendRelay = 2,
  Contacts = 3,
  EncryptedDirectMessage = 4,
  EventDeletion = 5,
  Reaction = 7,
  ChannelCreation = 40,
  ChannelMetadata = 41,
  ChannelMessage = 42, 
  ChannelHideMessage = 43,
  ChannelMuteUser = 44,
  Bookmarks = 10000,
  ProfileCategorization = 10001,
  InterestsList = 10002,
  UserStatuses = 30315,
  JetShareOffer = 30023, // Custom for GDY·UP
  ZapRequest = 9734,
  Zap = 9735
}

// Nostr Event as per NIP-01
export interface NostrEvent {
  id?: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig?: string;
}

// Event subscription filter as per NIP-01
export interface NostrFilter {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  '#e'?: string[]; // event ids
  '#p'?: string[]; // pubkeys
  '#t'?: string[]; // tags
  since?: number;
  until?: number;
  limit?: number;
}

// Key pair for Nostr operations
export interface NostrKeyPair {
  privateKey: string;
  publicKey: string;
}

// Application-specific Nostr settings
export interface NostrSettings {
  enabled: boolean;
  broadcast_offers: boolean;
  receive_messages: boolean;
  enable_zaps: boolean;
  private_mode: boolean;
  auto_connect: boolean;
}

// User Nostr Profile sections in our application
export interface NostrProfile {
  npub: string | null;
  nip05: string | null;
  lud16: string | null;
  nostr_pubkey: string | null;
  nostr_relays: string[];
  nostr_settings: NostrSettings;
  nostr_signature?: string | null;
}

// Interface for NostrConnect-compatible extensions (NIP-07)
export interface NostrWindow extends Window {
  nostr?: {
    getPublicKey: () => Promise<string>;
    signEvent: (event: Partial<NostrEvent>) => Promise<NostrEvent>;
    getRelays: () => Promise<Record<string, { read: boolean; write: boolean }>>;
    nip04: {
      encrypt: (pubkey: string, plaintext: string) => Promise<string>;
      decrypt: (pubkey: string, ciphertext: string) => Promise<string>;
    };
  };
}

// Relay information
export interface RelayInfo {
  url: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  read: boolean;
  write: boolean;
}

// Type for JetShare offer published to Nostr
export interface NostrJetShareOffer {
  id: string;
  departure_location: string;
  arrival_location: string;
  flight_date: string;
  departure_time: string;
  requested_share_amount: number;
  total_flight_cost: number;
  aircraft_model?: string;
  total_seats?: number;
  available_seats?: number;
  creator_npub: string;
  creator_lud16?: string;
  expires_at?: string;
}

// NIP-57 Zap request
export interface ZapRequest {
  kind: NostrEventKind.ZapRequest;
  pubkey: string;
  content: string;
  tags: string[][];
  created_at: number;
}

// Feature flags for Nostr features
export interface NostrFeatureFlags {
  enable_nostr_identity: boolean;
  enable_nostr_messages: boolean;
  enable_nostr_offers: boolean;
  enable_nostr_zaps: boolean;
}

// Add global type extension for the nostr window object
declare global {
  interface Window {
    nostr?: {
      getPublicKey: () => Promise<string>;
      signEvent: (event: Partial<NostrEvent>) => Promise<NostrEvent>;
      getRelays: () => Promise<Record<string, { read: boolean; write: boolean }>>;
      nip04: {
        encrypt: (pubkey: string, plaintext: string) => Promise<string>;
        decrypt: (pubkey: string, ciphertext: string) => Promise<string>;
      };
    };
  }
} 