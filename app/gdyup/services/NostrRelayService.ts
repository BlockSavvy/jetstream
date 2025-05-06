'use client';

// We need to install nostr-tools package
// import { Event, Filter, Relay, relayInit } from 'nostr-tools';
import { NostrEvent } from '@/types/nostr';

// Define types from nostr-tools until we install the package
interface Event {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

interface Filter {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  since?: number;
  until?: number;
  limit?: number;
  [key: string]: any;
}

interface Relay {
  url: string;
  status: number;
  connect: () => Promise<void>;
  close: () => Promise<void>;
  sub: (filter: Filter | Filter[]) => {
    on: (event: string, callback: (event: any) => void) => void;
    unsub: () => void;
  };
  publish: (event: NostrEvent) => Promise<void>;
  on: (event: string, callback: (data: any) => void) => void;
}

// Mock relayInit function until we install the package
function relayInit(url: string): Relay {
  return {
    url,
    status: 0,
    connect: async () => {},
    close: async () => {},
    sub: () => ({
      on: () => {},
      unsub: () => {}
    }),
    publish: async () => {},
    on: () => {}
  };
}

// Default relays if none are provided
const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://relay.snort.social'
];

export interface RelayStatus {
  url: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  error?: string;
}

export class NostrRelayService {
  private relays: Map<string, Relay> = new Map();
  private connectionPromises: Map<string, Promise<boolean>> = new Map();
  private status: Map<string, RelayStatus> = new Map();
  private autoReconnect: boolean = true;
  private reconnectInterval: number = 10000; // 10 seconds
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  private maxReconnectAttempts: number = 3;
  private reconnectAttempts: Map<string, number> = new Map();

  constructor(relayUrls?: string[]) {
    const urls = relayUrls && relayUrls.length > 0 ? relayUrls : DEFAULT_RELAYS;
    urls.forEach(url => {
      this.initRelay(url);
    });
  }

  /**
   * Initialize a relay connection
   */
  private initRelay(url: string): void {
    try {
      if (this.relays.has(url)) return;
      
      const relay = relayInit(url);
      this.relays.set(url, relay);
      this.status.set(url, { url, status: 'connecting' });
      this.reconnectAttempts.set(url, 0);
      
      relay.on('connect', () => {
        console.log(`Connected to relay: ${url}`);
        this.status.set(url, { url, status: 'connected' });
        this.reconnectAttempts.set(url, 0);
      });
      
      relay.on('disconnect', () => {
        console.log(`Disconnected from relay: ${url}`);
        this.status.set(url, { url, status: 'disconnected' });
        
        if (this.autoReconnect) {
          this.scheduleReconnect(url);
        }
      });
      
      relay.on('error', (error: unknown) => {
        console.error(`Error from relay ${url}:`, error);
        this.status.set(url, { 
          url, 
          status: 'error', 
          error: error instanceof Error ? error.message : String(error) 
        });
        
        if (this.autoReconnect) {
          this.scheduleReconnect(url);
        }
      });
    } catch (error) {
      console.error(`Failed to initialize relay ${url}:`, error);
      this.status.set(url, { 
        url, 
        status: 'error', 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(url: string): void {
    // Clear any existing reconnect timer
    if (this.reconnectTimers.has(url)) {
      clearTimeout(this.reconnectTimers.get(url)!);
    }
    
    const attempts = this.reconnectAttempts.get(url) || 0;
    
    if (attempts >= this.maxReconnectAttempts) {
      console.warn(`Max reconnect attempts reached for ${url}`);
      return;
    }
    
    // Schedule reconnection with exponential backoff
    const delay = this.reconnectInterval * Math.pow(1.5, attempts);
    
    this.reconnectTimers.set(url, setTimeout(() => {
      console.log(`Attempting to reconnect to ${url}`);
      this.reconnectAttempts.set(url, attempts + 1);
      this.connect(url).catch(err => {
        console.error(`Failed to reconnect to ${url}:`, err);
      });
    }, delay));
  }

  /**
   * Connect to a relay
   */
  async connect(url?: string): Promise<boolean> {
    if (url) {
      // Connect to a specific relay
      if (!this.relays.has(url)) {
        this.initRelay(url);
      }
      
      const relay = this.relays.get(url)!;
      
      // If we already have a connection promise for this relay, return it
      if (this.connectionPromises.has(url)) {
        return this.connectionPromises.get(url)!;
      }
      
      // Create a new connection promise
      const connectionPromise = new Promise<boolean>((resolve, reject) => {
        try {
          relay.connect().then(() => {
            this.status.set(url, { url, status: 'connected' });
            this.connectionPromises.delete(url);
            resolve(true);
          }).catch((err: unknown) => {
            this.status.set(url, { 
              url, 
              status: 'error', 
              error: err instanceof Error ? err.message : String(err) 
            });
            this.connectionPromises.delete(url);
            reject(err);
          });
        } catch (err) {
          this.status.set(url, { 
            url, 
            status: 'error', 
            error: err instanceof Error ? err.message : String(err) 
          });
          this.connectionPromises.delete(url);
          reject(err);
        }
      });
      
      this.connectionPromises.set(url, connectionPromise);
      return connectionPromise;
    } else {
      // Connect to all relays
      const promises = Array.from(this.relays.keys()).map(relayUrl => this.connect(relayUrl));
      const results = await Promise.allSettled(promises);
      
      // Return true if at least one relay connected successfully
      return results.some(result => result.status === 'fulfilled' && result.value === true);
    }
  }

  /**
   * Disconnect from a relay or all relays
   */
  async disconnect(url?: string): Promise<void> {
    if (url) {
      // Disconnect from a specific relay
      const relay = this.relays.get(url);
      if (relay) {
        await relay.close();
        this.status.set(url, { url, status: 'disconnected' });
      }
    } else {
      // Disconnect from all relays
      const promises = Array.from(this.relays.entries()).map(async ([url, relay]) => {
        await relay.close();
        this.status.set(url, { url, status: 'disconnected' });
      });
      
      await Promise.allSettled(promises);
    }
  }

  /**
   * Get the status of all relays or a specific relay
   */
  getStatus(url?: string): RelayStatus | RelayStatus[] {
    if (url) {
      return this.status.get(url) || { url, status: 'disconnected' };
    } else {
      return Array.from(this.status.values());
    }
  }

  /**
   * Check if at least one relay is connected
   */
  isConnected(): boolean {
    for (const status of this.status.values()) {
      if (status.status === 'connected') {
        return true;
      }
    }
    return false;
  }

  /**
   * Set auto reconnect behavior
   */
  setAutoReconnect(enabled: boolean): void {
    this.autoReconnect = enabled;
  }

  /**
   * Set reconnect interval
   */
  setReconnectInterval(interval: number): void {
    this.reconnectInterval = interval;
  }

  /**
   * Publish an event to a relay or all relays
   */
  async publish(event: NostrEvent, relayUrl?: string): Promise<string[]> {
    if (relayUrl) {
      // Publish to a specific relay
      const relay = this.relays.get(relayUrl);
      if (!relay) {
        throw new Error(`Relay ${relayUrl} not found`);
      }
      
      if (relay.status !== 1) { // 1 = connected
        await this.connect(relayUrl);
      }
      
      await relay.publish(event);
      return [relayUrl];
    } else {
      // Publish to all connected relays
      const connectedRelays: string[] = [];
      
      for (const [url, relay] of this.relays.entries()) {
        if (relay.status === 1) { // 1 = connected
          try {
            await relay.publish(event);
            connectedRelays.push(url);
          } catch (error) {
            console.error(`Failed to publish to ${url}:`, error);
          }
        }
      }
      
      return connectedRelays;
    }
  }

  /**
   * Subscribe to events from a relay or all relays
   */
  subscribe(
    filter: Filter | Filter[],
    onEvent: (event: Event) => void,
    onEose?: () => void,
    relayUrl?: string
  ): () => void {
    if (relayUrl) {
      // Subscribe to a specific relay
      const relay = this.relays.get(relayUrl);
      if (!relay) {
        throw new Error(`Relay ${relayUrl} not found`);
      }
      
      const sub = relay.sub(filter);
      sub.on('event', onEvent);
      if (onEose) sub.on('eose', onEose);
      
      return () => sub.unsub();
    } else {
      // Subscribe to all connected relays
      const unsubFunctions: (() => void)[] = [];
      
      for (const [url, relay] of this.relays.entries()) {
        if (relay.status === 1) { // 1 = connected
          try {
            const sub = relay.sub(filter);
            sub.on('event', onEvent);
            if (onEose) sub.on('eose', onEose);
            
            unsubFunctions.push(() => sub.unsub());
          } catch (error) {
            console.error(`Failed to subscribe to ${url}:`, error);
          }
        }
      }
      
      // Return a function that unsubscribes from all relays
      return () => unsubFunctions.forEach(unsub => unsub());
    }
  }

  /**
   * Add a new relay to the service
   */
  addRelay(url: string): void {
    if (!this.relays.has(url)) {
      this.initRelay(url);
      this.connect(url).catch(err => {
        console.error(`Failed to connect to new relay ${url}:`, err);
      });
    }
  }

  /**
   * Remove a relay from the service
   */
  async removeRelay(url: string): Promise<void> {
    const relay = this.relays.get(url);
    if (relay) {
      await relay.close();
      this.relays.delete(url);
      this.status.delete(url);
      
      if (this.reconnectTimers.has(url)) {
        clearTimeout(this.reconnectTimers.get(url)!);
        this.reconnectTimers.delete(url);
      }
      
      this.reconnectAttempts.delete(url);
    }
  }
} 