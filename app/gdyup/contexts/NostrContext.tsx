'use client';

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode,
  useCallback,
  useMemo
} from 'react';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';

// Define Nostr settings interface
export interface NostrSettings {
  enabled: boolean;
  broadcast_offers: boolean;
  receive_messages: boolean;
  enable_zaps: boolean;
  private_mode: boolean;
  auto_connect: boolean;
}

// Define the context state interface
interface NostrContextState {
  isInitialized: boolean;
  isEnabled: boolean;
  isConnected: boolean;
  hasNip05: boolean;
  pubkey: string | null;
  nip05: string | null;
  relays: string[];
  settings: NostrSettings;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  publishEvent: (eventKind: number, content: string, tags?: string[][]) => Promise<string | null>;
  updateSettings: (newSettings: Partial<NostrSettings>) => Promise<boolean>;
  zapRequest: (receiverPubkey: string, amount: number, comment?: string) => Promise<string | null>;
}

// Create the context with default values
const NostrContext = createContext<NostrContextState>({
  isInitialized: false,
  isEnabled: false,
  isConnected: false,
  hasNip05: false,
  pubkey: null,
  nip05: null,
  relays: [],
  settings: {
    enabled: false,
    broadcast_offers: true,
    receive_messages: true,
    enable_zaps: true,
    private_mode: false,
    auto_connect: true
  },
  connect: async () => false,
  disconnect: () => {},
  publishEvent: async () => null,
  updateSettings: async () => false,
  zapRequest: async () => null
});

// Define the provider props
interface NostrProviderProps {
  children: ReactNode;
}

// Create the provider component
export function NostrProvider({ children }: NostrProviderProps) {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasNip05, setHasNip05] = useState(false);
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [nip05, setNip05] = useState<string | null>(null);
  const [relays, setRelays] = useState<string[]>([]);
  const [settings, setSettings] = useState<NostrSettings>({
    enabled: false,
    broadcast_offers: true,
    receive_messages: true,
    enable_zaps: true,
    private_mode: false,
    auto_connect: true
  });
  
  // Initialize Nostr state when user is available
  useEffect(() => {
    const initializeNostr = async () => {
      if (!user) {
        // Reset state when user logs out
        setIsInitialized(false);
        setIsEnabled(false);
        setIsConnected(false);
        setPubkey(null);
        setNip05(null);
        setRelays([]);
        return;
      }
      
      try {
        // Add a timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/api/nostr/relay', {
          signal: controller.signal,
          credentials: 'include' // Ensure cookies are sent
        });
        
        // Clear the timeout since the request completed
        clearTimeout(timeoutId);
        
        // Handle non-OK responses properly
        if (!response.ok) {
          if (response.status === 401) {
            console.log('Nostr: Authentication required, using default settings');
            // Set initialized but not enabled for unauthorized users
            setIsInitialized(true);
            setIsEnabled(false);
            setIsConnected(false);
            setPubkey(null);
            setNip05(null);
            setRelays([]);
            return;
          }
          
          throw new Error(`Nostr API returned ${response.status}: ${response.statusText}`);
        }
        
        // Only try to parse JSON for successful responses
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Expected JSON response but got ${contentType}`);
        }
        
        const data = await response.json();
        
        if (data.pubkey) {
          console.log('Nostr: Successfully initialized');
          setIsInitialized(true);
          setIsEnabled(true);
          setPubkey(data.pubkey);
          setNip05(data.nip05 || null);
          setRelays(data.relays || []);
          setIsConnected(true);
        } else {
          console.log('Nostr: Initialized but no pubkey available');
          setIsInitialized(true);
          setIsEnabled(false);
        }
      } catch (error) {
        console.error('Error initializing Nostr:', error);
        
        // Provide fallback for various error conditions
        setIsInitialized(true);
        setIsEnabled(false);
        setIsConnected(false);
        toast.error('Failed to initialize NOSTR', {
          id: 'nostr-init-failed',
          duration: 3000,
        });
      }
    };
    
    initializeNostr();
  }, [user, toast]);
  
  // Connect to Nostr relays
  const connectToRelays = async (relayUrls: string[] = relays): Promise<boolean> => {
    if (!pubkey || relayUrls.length === 0) {
      console.warn('Cannot connect to relays: missing pubkey or relay URLs');
      return false;
    }
    
    try {
      // This is where you would implement actual relay connection
      // For now, we'll just simulate a successful connection
      console.log('Connecting to Nostr relays:', relayUrls);
      
      // In a real implementation, we'd initiate WebSocket connections
      // to each relay and set up event listeners
      
      setIsConnected(true);
      return true;
    } catch (error) {
      console.error('Error connecting to Nostr relays:', error);
      toast.error('Failed to connect to Nostr network');
      return false;
    }
  };
  
  // Connect to Nostr network
  const connect = useCallback(async (): Promise<boolean> => {
    if (!settings.enabled || !pubkey) {
      toast.error('Nostr is not enabled or missing pubkey');
      return false;
    }
    
    return await connectToRelays();
  }, [settings.enabled, pubkey, relays]);
  
  // Disconnect from Nostr network
  const disconnect = useCallback(() => {
    // This is where you would close WebSocket connections
    console.log('Disconnecting from Nostr relays');
    setIsConnected(false);
  }, []);
  
  // Publish an event to Nostr network
  const publishEvent = useCallback(async (
    eventKind: number, 
    content: string, 
    tags: string[][] = []
  ): Promise<string | null> => {
    if (!isConnected || !pubkey) {
      console.warn('Cannot publish event: not connected or missing pubkey');
      return null;
    }
    
    try {
      // This is where you would implement actual event publication
      // In a real implementation, we'd:
      // 1. Create an event object with the provided parameters
      // 2. Sign it with the user's private key
      // 3. Send it to connected relays
      
      console.log('Publishing Nostr event:', { kind: eventKind, content, tags });
      
      // Return a mock event ID
      return `mock-event-id-${Date.now()}`;
    } catch (error) {
      console.error('Error publishing Nostr event:', error);
      return null;
    }
  }, [isConnected, pubkey]);
  
  // Update Nostr settings
  const updateSettings = useCallback(async (newSettings: Partial<NostrSettings>): Promise<boolean> => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const response = await fetch('/api/nostr/relay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: updatedSettings
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update settings: ${response.statusText}`);
      }
      
      setSettings(updatedSettings);
      
      // If enabled status changed, connect or disconnect
      if (newSettings.enabled !== undefined) {
        setIsEnabled(newSettings.enabled);
        
        if (newSettings.enabled && updatedSettings.auto_connect) {
          await connectToRelays();
        } else if (!newSettings.enabled && isConnected) {
          disconnect();
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error updating Nostr settings:', error);
      toast.error('Failed to update Nostr settings');
      return false;
    }
  }, [settings, isConnected, disconnect]);
  
  // Create a zap request
  const zapRequest = useCallback(async (
    receiverPubkey: string, 
    amount: number, 
    comment?: string
  ): Promise<string | null> => {
    if (!isConnected || !pubkey || !settings.enable_zaps) {
      console.warn('Cannot create zap request: not connected, missing pubkey, or zaps disabled');
      return null;
    }
    
    try {
      // This is where you would implement actual zap request creation
      // In a real implementation, we'd:
      // 1. Create a zap request event (kind 9734)
      // 2. Include the receiver pubkey, amount, and optional comment
      // 3. Sign and publish it to connected relays
      
      console.log('Creating zap request:', { receiverPubkey, amount, comment });
      
      // Publish the zap request event
      const zapEventId = await publishEvent(9734, comment || '', [
        ['p', receiverPubkey],
        ['amount', amount.toString()],
        ['relays', ...relays],
      ]);
      
      return zapEventId;
    } catch (error) {
      console.error('Error creating zap request:', error);
      toast.error('Failed to create zap request');
      return null;
    }
  }, [isConnected, pubkey, settings.enable_zaps, publishEvent, relays]);
  
  // Create context value
  const contextValue = useMemo(() => ({
    isInitialized,
    isEnabled,
    isConnected,
    hasNip05,
    pubkey,
    nip05,
    relays,
    settings,
    connect,
    disconnect,
    publishEvent,
    updateSettings,
    zapRequest
  }), [
    isInitialized,
    isEnabled,
    isConnected,
    hasNip05,
    pubkey,
    nip05,
    relays,
    settings,
    connect,
    disconnect,
    publishEvent,
    updateSettings,
    zapRequest
  ]);
  
  return (
    <NostrContext.Provider value={contextValue}>
      {children}
    </NostrContext.Provider>
  );
}

// Custom hook to use the Nostr context
export function useNostr() {
  const context = useContext(NostrContext);
  
  if (context === undefined) {
    throw new Error('useNostr must be used within a NostrProvider');
  }
  
  return context;
} 