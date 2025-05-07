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

// Define flight group interface
export interface NostrFlightGroup {
  offerId: string;
  relayUrls: string[];
  isConnected: boolean;
  participants: {
    pubkey: string;
    name?: string;
    nip05?: string;
  }[];
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
  flightGroups: Record<string, NostrFlightGroup>;
  settings: NostrSettings;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  publishEvent: (eventKind: number, content: string, tags?: string[][]) => Promise<string | null>;
  updateSettings: (newSettings: Partial<NostrSettings>) => Promise<boolean>;
  zapRequest: (receiverPubkey: string, amount: number, comment?: string, offerId?: string) => Promise<string | null>;
  joinFlightGroup: (offerId: string, customRelays?: string[]) => Promise<boolean>;
  leaveFlightGroup: (offerId: string) => void;
  sendFlightGroupMessage: (offerId: string, content: string) => Promise<string | null>;
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
  flightGroups: {},
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
  zapRequest: async () => null,
  joinFlightGroup: async () => false,
  leaveFlightGroup: () => {},
  sendFlightGroupMessage: async () => null
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
  const [flightGroups, setFlightGroups] = useState<Record<string, NostrFlightGroup>>({});
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
        setFlightGroups({});
        return;
      }
      
      try {
        // First try to get data from user profile directly - this has the most accurate NIP-05
        let userProfile = null;
        try {
          const profileResponse = await fetch(`/api/gdyup/profile?userId=${user.id}`);
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            userProfile = profileData.profile;
            
            // Log the profile NIP-05 data
            console.log('Profile NIP-05:', userProfile?.nip05);
            
            // If we have a NIP-05 from the profile and it's not the default, use it
            if (userProfile?.nip05 && userProfile.nip05 !== 'dev@gdyup.xyz') {
              setNip05(userProfile.nip05);
              setHasNip05(!!userProfile.nip05);
            }
            
            // If we have a pubkey from the profile, use it
            if (userProfile?.nostr_pubkey) {
              setPubkey(userProfile.nostr_pubkey);
            }
          }
        } catch (profileError) {
          console.error('Error fetching user profile for Nostr data:', profileError);
        }
        
        // Add a timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/api/nostr/relay', {
          signal: controller.signal,
          credentials: 'include' // Ensure cookies are sent
        });
        
        clearTimeout(timeoutId);
        
        // Handle response
        if (!response.ok) {
          console.error('Failed to fetch Nostr relay info', response.statusText);
          setIsInitialized(true);
          setIsEnabled(false);
          return;
        }
        
        const data = await response.json();
        
        // Configure state based on relay response
        setIsInitialized(true);
        setIsEnabled(data.nostrEnabled || false);
        
        // Only set pubkey from relay data if we don't already have one from profile
        if (!pubkey && data.pubkey) {
          setPubkey(data.pubkey);
        }
        
        // Only set NIP-05 from relay data if:
        // 1. We don't already have one from profile
        // 2. It's not the default dev@gdyup.xyz (which may be incorrect)
        if (!nip05 && data.nip05 && data.nip05 !== 'dev@gdyup.xyz') {
          setNip05(data.nip05);
          setHasNip05(!!data.nip05);
        }
        
        const defaultRelays = data.relays || [];
        const userRelays = data.userRelays || [];
        const allRelays = [...new Set([...defaultRelays, ...userRelays])];
        
        setRelays(allRelays);
        
        // Connect to relays if pubkey is available
        if ((pubkey || data.pubkey) && allRelays.length > 0 && data.nostrEnabled) {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        console.error('Error initializing Nostr context:', error);
        setIsInitialized(true);
        setIsEnabled(false);
      }
    };
    
    initializeNostr();
  }, [user, pubkey, nip05]);
  
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
    
    // Also disconnect from all flight groups
    setFlightGroups({});
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
    comment?: string,
    offerId?: string
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
      
      console.log('Creating zap request:', { receiverPubkey, amount, comment, offerId });
      
      // Prepare tags
      const zapTags = [
        ['p', receiverPubkey],
        ['amount', amount.toString()],
        ['relays', ...relays],
      ];
      
      // Add offer ID tag if provided
      if (offerId) {
        zapTags.push(['e', offerId, 'offer']);
      }
      
      // Publish the zap request event
      const zapEventId = await publishEvent(9734, comment || '', zapTags);
      
      // If successful, store the zap receipt in our database
      if (zapEventId && user?.id) {
        try {
          await fetch('/api/gdyup/nostr/zap', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              zapEventId,
              amount,
              senderPubkey: pubkey,
              recipientPubkey: receiverPubkey,
              offerId,
              comment,
              userId: user.id
            }),
          });
        } catch (error) {
          console.error('Error storing zap receipt:', error);
          // Continue even if storing fails
        }
      }
      
      return zapEventId;
    } catch (error) {
      console.error('Error creating zap request:', error);
      toast.error('Failed to create zap request');
      return null;
    }
  }, [isConnected, pubkey, settings.enable_zaps, publishEvent, relays, user?.id]);
  
  // Join a flight-specific Nostr group
  const joinFlightGroup = useCallback(async (
    offerId: string,
    customRelays?: string[]
  ): Promise<boolean> => {
    if (!isConnected || !pubkey) {
      console.warn('Cannot join flight group: not connected or missing pubkey');
      return false;
    }
    
    // Check if already joined
    if (flightGroups[offerId]?.isConnected) {
      console.log(`Already joined flight group for offer ${offerId}`);
      return true;
    }
    
    try {
      // Determine relay URLs for this flight group
      const flightRelays = customRelays || relays;
      
      // In a real implementation, you would:
      // 1. Subscribe to events specific to this flight group
      // 2. Set up event listeners for messages/zaps
      // 3. Fetch historical messages
      
      console.log(`Joining flight group for offer ${offerId}`);
      
      // Update flight groups state
      setFlightGroups(prev => ({
        ...prev,
        [offerId]: {
          offerId,
          relayUrls: flightRelays,
          isConnected: true,
          participants: [
            {
              pubkey,
              name: user?.user_metadata?.full_name || 'You',
              nip05: nip05 || undefined
            }
          ]
        }
      }));
      
      // Publish a "joined" event
      await publishEvent(1, 'Joined the flight group', [
        ['e', offerId, 'offer'],
        ['t', 'gdyup-flight']
      ]);
      
      return true;
    } catch (error) {
      console.error('Error joining flight group:', error);
      toast.error('Failed to join flight group');
      return false;
    }
  }, [isConnected, pubkey, relays, flightGroups, publishEvent, user?.user_metadata?.full_name, nip05]);
  
  // Leave a flight-specific Nostr group
  const leaveFlightGroup = useCallback((offerId: string) => {
    if (!flightGroups[offerId]) {
      return;
    }
    
    try {
      // In a real implementation, you would:
      // 1. Unsubscribe from events for this flight group
      // 2. Remove event listeners
      // 3. Publish a "left" event
      
      console.log(`Leaving flight group for offer ${offerId}`);
      
      // Update flight groups state
      setFlightGroups(prev => {
        const newGroups = { ...prev };
        delete newGroups[offerId];
        return newGroups;
      });
      
      // Try to publish a "left" event, but don't wait for it
      publishEvent(1, 'Left the flight group', [
        ['e', offerId, 'offer'],
        ['t', 'gdyup-flight']
      ]).catch(console.error);
    } catch (error) {
      console.error('Error leaving flight group:', error);
    }
  }, [flightGroups, publishEvent]);
  
  // Send a message to a flight group
  const sendFlightGroupMessage = useCallback(async (
    offerId: string,
    content: string
  ): Promise<string | null> => {
    if (!isConnected || !pubkey || !flightGroups[offerId]?.isConnected) {
      console.warn('Cannot send flight group message: not connected, missing pubkey, or not in group');
      return null;
    }
    
    try {
      // Publish a message event to the flight group
      return await publishEvent(1, content, [
        ['e', offerId, 'offer'],
        ['t', 'gdyup-flight-message']
      ]);
    } catch (error) {
      console.error('Error sending flight group message:', error);
      toast.error('Failed to send message');
      return null;
    }
  }, [isConnected, pubkey, flightGroups, publishEvent]);
  
  // Create context value
  const contextValue = useMemo(() => ({
    isInitialized,
    isEnabled,
    isConnected,
    hasNip05,
    pubkey,
    nip05,
    relays,
    flightGroups,
    settings,
    connect,
    disconnect,
    publishEvent,
    updateSettings,
    zapRequest,
    joinFlightGroup,
    leaveFlightGroup,
    sendFlightGroupMessage
  }), [
    isInitialized,
    isEnabled,
    isConnected,
    hasNip05,
    pubkey,
    nip05,
    relays,
    flightGroups,
    settings,
    connect,
    disconnect,
    publishEvent,
    updateSettings,
    zapRequest,
    joinFlightGroup,
    leaveFlightGroup,
    sendFlightGroupMessage
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