// Nostr relay connection service

type RelayStatus = 'connected' | 'disconnected' | 'connecting';

interface RelayInfo {
  url: string;
  status: RelayStatus;
  lastConnected?: Date;
  errorCount: number;
}

class NostrRelayService {
  private relays: Map<string, RelayInfo> = new Map();
  private defaultRelays: string[] = [
    'wss://relay.damus.io',
    'wss://relay.snort.social',
    'wss://nos.lol',
    'wss://relay.nostr.band'
  ];
  private isInitialized: boolean = false;
  private statusListeners: ((relays: Map<string, RelayInfo>) => void)[] = [];
  private activeConnections: Map<string, WebSocket> = new Map();

  constructor() {
    // Initialize default relays
    this.defaultRelays.forEach(url => {
      this.relays.set(url, {
        url,
        status: 'disconnected',
        errorCount: 0
      });
    });
  }

  async initialize() {
    if (this.isInitialized) return;
    
    if (typeof window === 'undefined') {
      console.log('NostrRelayService: Running in server context, skipping initialization');
      return;
    }

    console.log('NostrRelayService: Initializing relay connections');
    
    try {
      // Connect to all default relays
      for (const url of this.defaultRelays) {
        this.connectToRelay(url);
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('NostrRelayService: Error initializing relay connections', error);
    }
  }

  private connectToRelay(url: string) {
    if (typeof window === 'undefined') return;
    
    try {
      const relay = this.relays.get(url);
      if (!relay) return;
      
      // Update status
      relay.status = 'connecting';
      this.relays.set(url, relay);
      this.notifyStatusListeners();
      
      // Create WebSocket connection
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        const updatedRelay = this.relays.get(url);
        if (updatedRelay) {
          updatedRelay.status = 'connected';
          updatedRelay.lastConnected = new Date();
          updatedRelay.errorCount = 0;
          this.relays.set(url, updatedRelay);
          this.activeConnections.set(url, ws);
          this.notifyStatusListeners();
          console.log(`NostrRelayService: Connected to relay ${url}`);
        }
      };
      
      ws.onclose = () => {
        const updatedRelay = this.relays.get(url);
        if (updatedRelay) {
          updatedRelay.status = 'disconnected';
          this.relays.set(url, updatedRelay);
          this.activeConnections.delete(url);
          this.notifyStatusListeners();
          console.log(`NostrRelayService: Disconnected from relay ${url}`);
          
          // Try to reconnect after a delay if error count is low
          if (updatedRelay.errorCount < 5) {
            setTimeout(() => this.connectToRelay(url), 5000);
          }
        }
      };
      
      ws.onerror = (error) => {
        const updatedRelay = this.relays.get(url);
        if (updatedRelay) {
          updatedRelay.status = 'disconnected';
          updatedRelay.errorCount += 1;
          this.relays.set(url, updatedRelay);
          this.notifyStatusListeners();
          console.error(`NostrRelayService: Error connecting to relay ${url}`, error);
        }
      };
      
    } catch (error) {
      console.error(`NostrRelayService: Error setting up connection to relay ${url}`, error);
      const relay = this.relays.get(url);
      if (relay) {
        relay.status = 'disconnected';
        relay.errorCount += 1;
        this.relays.set(url, relay);
        this.notifyStatusListeners();
      }
    }
  }
  
  addRelay(url: string) {
    if (!this.relays.has(url)) {
      this.relays.set(url, {
        url,
        status: 'disconnected',
        errorCount: 0
      });
      this.connectToRelay(url);
    }
  }
  
  removeRelay(url: string) {
    const connection = this.activeConnections.get(url);
    if (connection) {
      connection.close();
      this.activeConnections.delete(url);
    }
    this.relays.delete(url);
    this.notifyStatusListeners();
  }
  
  getRelayStatus(): Map<string, RelayInfo> {
    return new Map(this.relays);
  }
  
  getConnectedRelays(): string[] {
    return Array.from(this.relays.entries())
      .filter(([_, info]) => info.status === 'connected')
      .map(([url, _]) => url);
  }
  
  isConnectedToAny(): boolean {
    return this.getConnectedRelays().length > 0;
  }
  
  ensureConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isConnectedToAny()) {
        resolve(true);
        return;
      }
      
      // Try to connect to all relays
      for (const url of this.defaultRelays) {
        this.connectToRelay(url);
      }
      
      // Set a timeout to resolve after a reasonable wait time
      setTimeout(() => {
        resolve(this.isConnectedToAny());
      }, 3000);
    });
  }
  
  publishEvent(event: any): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.isConnectedToAny()) {
        console.error('NostrRelayService: No connected relays to publish event');
        resolve(false);
        return;
      }
      
      let successCount = 0;
      let attemptCount = 0;
      const connectedRelays = this.getConnectedRelays();
      
      for (const url of connectedRelays) {
        const ws = this.activeConnections.get(url);
        if (ws && ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify(['EVENT', event]));
            successCount++;
          } catch (error) {
            console.error(`NostrRelayService: Error publishing event to relay ${url}`, error);
          }
        }
        attemptCount++;
        
        // If we've tried all relays, resolve with success status
        if (attemptCount === connectedRelays.length) {
          resolve(successCount > 0);
        }
      }
    });
  }
  
  subscribeToStatusUpdates(callback: (relays: Map<string, RelayInfo>) => void): () => void {
    this.statusListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.statusListeners = this.statusListeners.filter(cb => cb !== callback);
    };
  }
  
  private notifyStatusListeners() {
    for (const listener of this.statusListeners) {
      listener(this.relays);
    }
  }
  
  // Clean up connections when service is destroyed
  cleanup() {
    for (const [url, ws] of this.activeConnections.entries()) {
      try {
        ws.close();
      } catch (error) {
        console.error(`NostrRelayService: Error closing connection to relay ${url}`, error);
      }
    }
    this.activeConnections.clear();
    this.statusListeners = [];
    this.isInitialized = false;
  }
}

// Create singleton instance
export const nostrRelayService = new NostrRelayService();

// Export types
export type { RelayStatus, RelayInfo }; 