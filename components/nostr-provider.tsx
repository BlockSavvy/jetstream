'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { NostrEvent, NostrKeyPair, NostrProfile, RelayInfo, NostrEventKind } from '@/types/nostr';
import * as NostrUtils from '@/lib/services/nostr';
import { toast } from 'sonner';
import useLocalStorage from '@/hooks/useLocalStorage';

interface NostrContextType {
  isEnabled: boolean;
  hasExtension: boolean;
  isConnected: boolean;
  pubkey: string | null;
  npub: string | null;
  relays: RelayInfo[];
  connecting: boolean;
  error: string | null;
  connectExtension: () => Promise<boolean>;
  disconnectNostr: () => void;
  publishEvent: (event: NostrEvent) => Promise<boolean>;
  signEvent: (event: Omit<NostrEvent, 'id' | 'sig'>) => Promise<NostrEvent | null>;
  generateKeypair: () => Promise<NostrKeyPair>;
  connectRelay: (url: string) => Promise<boolean>;
  disconnectRelay: (url: string) => void;
  addRelay: (url: string) => Promise<boolean>;
  removeRelay: (url: string) => void;
  verifyNip05: (address: string) => Promise<boolean>;
  getNostrProfile: () => NostrProfile | null;
  updateNostrProfile: (profile: Partial<NostrProfile>) => Promise<boolean>;
}

const NostrContext = createContext<NostrContextType | undefined>(undefined);

export function NostrProvider({ children }: { children: ReactNode }) {
  const { profile, updateProfile } = useUserProfile();
  const [hasExtension, setHasExtension] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [npub, setNpub] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [relays, setRelays] = useState<RelayInfo[]>([]);
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [subscriptions, setSubscriptions] = useState<Record<string, any>>({});
  const [keypair, setKeypair] = useLocalStorage<NostrKeyPair | null>('gdyup_nostr_keypair', null);
  
  // Use ref for relay connections to avoid state updates causing loops
  const relayConnectionsRef = useRef<Map<string, WebSocket>>(new Map());
  
  // Check if Nostr is enabled in user profile
  const isEnabled = !!profile?.nostr_settings?.enabled || false;
  
  // First, memoize the handleRelayMessage function with useCallback
  const handleRelayMessage = useCallback((data: any, relayUrl: string) => {
    if (!Array.isArray(data) || data.length < 2) {
      return;
    }
    
    const [type, ...rest] = data;
    
    // Handle different message types
    switch (type) {
      case 'EVENT': {
        // Process incoming event
        if (rest.length < 1) return;
        
        const event = rest[0] as NostrEvent;
        if (!event || !event.id || !event.kind) return;
        
        // Store the event in events array, not relays
        setEvents(prevEvents => {
          // Check if we already have this event to avoid duplicates
          if (prevEvents.some(e => e.id === event.id)) {
            return prevEvents;
          }
          return [...prevEvents, event];
        });
        
        // Update subscription state
        setSubscriptions(currentSubs => {
          // Make a stable copy that we can modify
          const subsCopy = {...currentSubs};
          
          // For each active subscription, check if this event matches criteria
          Object.keys(subsCopy).forEach(subId => {
            const sub = subsCopy[subId];
            if (sub) {
              // Check if this event matches this subscription's filters
              const matchesFilters = sub.filters.some((filter: any) => {
                // Check each filter
                return (
                  (!filter.ids || filter.ids.includes(event.id)) &&
                  (!filter.kinds || filter.kinds.includes(event.kind)) &&
                  (!filter.authors || filter.authors.includes(event.pubkey)) &&
                  // Additional filter checks as needed
                  true
                );
              });
              
              if (matchesFilters && Array.isArray(sub.matchedEvents)) {
                sub.matchedEvents.push(event);
              }
            }
          });
          
          return subsCopy;
        });
        
        break;
      }
      
      case 'EOSE': {
        // End of stored events
        if (rest.length < 1) return;
        
        const subId = rest[0] as string;
        
        setSubscriptions(currentSubs => {
          // Only update if subscription exists
          if (!currentSubs[subId]) return currentSubs;
          
          return {
            ...currentSubs,
            [subId]: {
              ...currentSubs[subId],
              eose: true
            }
          };
        });
        
        break;
      }
      
      case 'NOTICE': {
        // Handle relay notices
        if (rest.length < 1) return;
        const notice = rest[0] as string;
        console.log(`Relay notice from ${relayUrl}: ${notice}`);
        break;
      }
      
      default:
        // Unknown message type
        break;
    }
  }, []);
  
  // Utility to get the user's Nostr profile from the UserProfile
  const getNostrProfile = (): NostrProfile | null => {
    if (!profile) return null;
    
    return {
      npub: profile.npub || null,
      nip05: profile.nip05 || null,
      lud16: profile.lud16 || null,
      nostr_pubkey: profile.nostr_pubkey || null,
      nostr_relays: profile.nostr_relays || NostrUtils.getDefaultRelays(),
      nostr_settings: profile.nostr_settings || {
        enabled: false,
        broadcast_offers: false,
        receive_messages: false,
        enable_zaps: false,
        private_mode: true,
        auto_connect: false
      },
      nostr_signature: profile.nostr_signature || null
    };
  };
  
  // Check for Nostr extension on mount
  useEffect(() => {
    const checkExtension = () => {
      const extension = NostrUtils.hasNostrExtension();
      setHasExtension(extension);
      return extension;
    };
    
    if (checkExtension() && profile?.nostr_settings?.auto_connect) {
      connectExtension();
    }
    
    // Also check from localStorage keypair if we have one
    if (keypair && keypair.publicKey) {
      setPubkey(keypair.publicKey);
      try {
        setNpub(NostrUtils.hexToNpub(keypair.publicKey));
      } catch (e) {
        console.error('Error converting pubkey to npub:', e);
      }
    }
    
    // Initialize relays from profile
    if (profile?.nostr_relays && profile.nostr_relays.length > 0) {
      setRelays(
        profile.nostr_relays.map(url => ({
          url,
          status: 'disconnected',
          read: true,
          write: true
        }))
      );
    } else {
      // Use default relays
      setRelays(
        NostrUtils.getDefaultRelays().map(url => ({
          url,
          status: 'disconnected',
          read: true,
          write: true
        }))
      );
    }
  }, [profile]);
  
  // Update relay connections with proper dependency management
  useEffect(() => {
    // Skip connection process if not enabled or connected
    if (!isConnected || !isEnabled) return;
    
    // Don't do anything if no relays
    if (!relays || relays.length === 0) return;
    
    // Function to connect to relays
    const connectToRelays = async () => {
      // Get relay URLs from profile or use defaults
      const relayUrls = relays.map(r => r.url);
      
      // Connect to each relay in the list if not already connected
      for (const url of relayUrls) {
        // Skip if already connected
        if (relayConnectionsRef.current.has(url) && 
            relayConnectionsRef.current.get(url)?.readyState === WebSocket.OPEN) {
          continue;
        }
        
        try {
          const socket = new WebSocket(url);
          
          // Store in our ref (not in state!)
          relayConnectionsRef.current.set(url, socket);
          
          // Set up event handlers
          socket.addEventListener('message', (event) => {
            try {
              const data = JSON.parse(event.data);
              handleRelayMessage(data, url);
            } catch (err) {
              console.error(`Error parsing message from relay ${url}:`, err);
            }
          });
          
          socket.addEventListener('open', () => {
            console.log(`Connected to relay: ${url}`);
            // Update relay status without modifying the connections array
            setRelays(prev => prev.map(relay => 
              relay.url === url ? { ...relay, status: 'connected' } : relay
            ));
          });
          
          socket.addEventListener('close', () => {
            console.log(`Disconnected from relay: ${url}`);
            // Update relay status without modifying the connections array
            setRelays(prev => prev.map(relay => 
              relay.url === url ? { ...relay, status: 'disconnected' } : relay
            ));
            // Remove from our ref (not state!)
            relayConnectionsRef.current.delete(url);
          });
          
          socket.addEventListener('error', () => {
            // Update relay status without modifying the connections array
            setRelays(prev => prev.map(relay => 
              relay.url === url ? { ...relay, status: 'error' } : relay
            ));
          });
        } catch (err) {
          console.error(`Error connecting to relay ${url}:`, err);
        }
      }
    };
    
    // Connect to relays
    connectToRelays();
    
    // Cleanup function to close connections on unmount or relay change
    return () => {
      // Close all connections that are no longer in the relays list
      relayConnectionsRef.current.forEach((socket: WebSocket, url: string) => {
        if (!relays.some(r => r.url === url)) {
          socket.close();
          relayConnectionsRef.current.delete(url);
        }
      });
    };
  }, [isConnected, isEnabled, relays, handleRelayMessage]);
  
  // Memoize the connectExtension function
  const connectExtension = useCallback(async (): Promise<boolean> => {
    if (!NostrUtils.hasNostrExtension()) {
      setError('No Nostr extension found. Please install one like Alby or nos2x.');
      return false;
    }
    
    setConnecting(true);
    setError(null);
    
    try {
      const publicKey = await NostrUtils.requestPublicKey();
      
      if (!publicKey) {
        setError('Could not get public key from extension');
        setConnecting(false);
        return false;
      }
      
      setPubkey(publicKey);
      const calculatedNpub = NostrUtils.hexToNpub(publicKey);
      setNpub(calculatedNpub);
      setIsConnected(true);
      
      // Update user profile with this npub if not already set
      if (profile && (!profile.npub || profile.npub !== calculatedNpub)) {
        const currentSettings = profile.nostr_settings || {
          enabled: false,
          broadcast_offers: false,
          receive_messages: false,
          enable_zaps: false,
          private_mode: true,
          auto_connect: false
        };
        
        updateProfile({
          npub: calculatedNpub,
          nostr_pubkey: publicKey,
          nostr_settings: {
            ...currentSettings,
            enabled: true
          }
        });
      }
      
      toast.success('Connected to Nostr extension');
      return true;
    } catch (err) {
      console.error('Error connecting to Nostr extension:', err);
      setError(err instanceof Error ? err.message : 'Unknown error connecting to Nostr');
      setConnecting(false);
      return false;
    } finally {
      setConnecting(false);
    }
  }, [profile, updateProfile]);
  
  // Memoize the disconnectNostr function
  // Disconnect from Nostr
  const disconnectNostr = () => {
    setPubkey(null);
    setNpub(null);
    setIsConnected(false);
    
    // Close all relay connections
    relayConnectionsRef.current.forEach((socket: WebSocket) => {
      socket.close();
    });
    relayConnectionsRef.current.clear();
    
    // Update relays status
    setRelays(
      relays.map(relay => ({
        ...relay,
        status: 'disconnected'
      }))
    );
    
    // Update user profile if needed
    if (profile?.nostr_settings?.enabled) {
      updateProfile({
        nostr_settings: {
          ...profile.nostr_settings,
          enabled: false
        }
      });
    }
    
    toast.success('Disconnected from Nostr');
  };
  
  // Generate a new keypair
  const generateKeypair = async (): Promise<NostrKeyPair> => {
    const newKeypair = NostrUtils.generateNostrKeypair();
    setKeypair(newKeypair);
    setPubkey(newKeypair.publicKey);
    setNpub(NostrUtils.hexToNpub(newKeypair.publicKey));
    setIsConnected(true);
    
    // Update user profile
    if (profile) {
      const currentSettings = profile.nostr_settings || {
        enabled: false,
        broadcast_offers: false,
        receive_messages: false,
        enable_zaps: false,
        private_mode: true,
        auto_connect: false
      };
      
      updateProfile({
        npub: NostrUtils.hexToNpub(newKeypair.publicKey),
        nostr_pubkey: newKeypair.publicKey,
        nostr_settings: {
          ...currentSettings,
          enabled: true
        }
      });
    }
    
    return newKeypair;
  };
  
  // Sign an event
  const signEvent = async (event: Omit<NostrEvent, 'id' | 'sig'>): Promise<NostrEvent | null> => {
    if (hasExtension && isConnected) {
      try {
        return await NostrUtils.signEventWithExtension(event as Partial<NostrEvent>);
      } catch (err) {
        console.error('Error signing event with extension:', err);
        setError(err instanceof Error ? err.message : 'Unknown error signing event');
        return null;
      }
    } else if (keypair && keypair.privateKey) {
      try {
        return await NostrUtils.signEvent(event, keypair.privateKey);
      } catch (err) {
        console.error('Error signing event with local keypair:', err);
        setError(err instanceof Error ? err.message : 'Unknown error signing event');
        return null;
      }
    } else {
      setError('No Nostr keypair or extension available');
      return null;
    }
  };
  
  // Connect to a relay
  const connectRelay = async (url: string): Promise<boolean> => {
    if (!url.startsWith('wss://')) {
      setError('Relay URL must start with wss://');
      return false;
    }
    
    try {
      // Update relay status to connecting
      setRelays(prev => prev.map(r => r.url === url ? { ...r, status: 'connecting' } : r));
      
      // Create WebSocket connection
      const socket = NostrUtils.connectToRelay(url);
      
      // Set up event handlers
      socket.addEventListener('open', () => {
        setRelays(prev => prev.map(r => r.url === url ? { ...r, status: 'connected' } : r));
      });
      
      socket.addEventListener('error', () => {
        setRelays(prev => prev.map(r => r.url === url ? { ...r, status: 'error' } : r));
      });
      
      socket.addEventListener('close', () => {
        setRelays(prev => prev.map(r => r.url === url ? { ...r, status: 'disconnected' } : r));
        relayConnectionsRef.current.delete(url);
      });
      
      // Store the connection in ref
      relayConnectionsRef.current.set(url, socket);
      
      return true;
    } catch (err) {
      console.error(`Error connecting to relay ${url}:`, err);
      setRelays(prev => prev.map(r => r.url === url ? { ...r, status: 'error' } : r));
      return false;
    }
  };
  
  // Disconnect from a relay
  const disconnectRelay = (url: string) => {
    const socket = relayConnectionsRef.current.get(url);
    if (socket) {
      socket.close();
      relayConnectionsRef.current.delete(url);
      setRelays(prev => prev.map(r => r.url === url ? { ...r, status: 'disconnected' } : r));
    }
  };
  
  // Add a new relay
  const addRelay = async (url: string): Promise<boolean> => {
    if (!url.startsWith('wss://')) {
      setError('Relay URL must start with wss://');
      return false;
    }
    
    // Check if relay already exists
    if (relays.some(r => r.url === url)) {
      return connectRelay(url);
    }
    
    // Add new relay
    setRelays(prev => [
      ...prev,
      {
        url,
        status: 'disconnected',
        read: true,
        write: true
      }
    ]);
    
    // Update user profile
    if (profile) {
      const updatedRelays = [...(profile.nostr_relays || [])];
      if (!updatedRelays.includes(url)) {
        updatedRelays.push(url);
      }
      
      await updateProfile({
        nostr_relays: updatedRelays
      });
    }
    
    // Connect to the relay
    return connectRelay(url);
  };
  
  // Remove a relay
  const removeRelay = (url: string) => {
    // Disconnect first
    disconnectRelay(url);
    
    // Remove from relay list
    setRelays(prev => prev.filter(r => r.url !== url));
    
    // Update user profile
    if (profile && profile.nostr_relays) {
      const updatedRelays = profile.nostr_relays.filter(r => r !== url);
      updateProfile({
        nostr_relays: updatedRelays
      });
    }
  };
  
  // Publish an event to all connected relays
  const publishEvent = async (event: NostrEvent): Promise<boolean> => {
    let published = false;
    
    // Check that we have at least one connected relay
    const connectedRelays = Array.from(relayConnectionsRef.current.values()).filter(
      socket => socket.readyState === WebSocket.OPEN
    );
    
    if (connectedRelays.length === 0) {
      // Try to connect to default relays first
      const connected = await Promise.all(
        relays
          .filter(r => r.status !== 'connected' && r.write)
          .map(r => connectRelay(r.url))
      );
      
      if (!connected.some(c => c)) {
        setError('No connected relays to publish to');
        return false;
      }
    }
    
    // Publish to all connected relays
    relayConnectionsRef.current.forEach((socket: WebSocket, url: string) => {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          NostrUtils.publishEvent(socket, event);
          published = true;
        } catch (err) {
          console.error(`Error publishing event to relay ${url}:`, err);
        }
      }
    });
    
    return published;
  };
  
  // Verify NIP-05 identifier
  const verifyNip05 = async (address: string): Promise<boolean> => {
    try {
      if (!address || !address.includes('@')) {
        return false;
      }
      
      const [name, domain] = address.split('@');
      if (!name || !domain) {
        return false;
      }
      
      // Fetch the well-known JSON file
      const response = await fetch(`https://${domain}/.well-known/nostr.json`);
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      
      // Check if the name exists in the names object
      if (!data.names || !data.names[name]) {
        return false;
      }
      
      // Get the public key for this name
      const nip05PubKey = data.names[name];
      
      // Verify that this matches the user's pubkey
      return nip05PubKey === pubkey;
    } catch (err) {
      console.error('Error verifying NIP-05 identifier:', err);
      return false;
    }
  };
  
  // Update user's Nostr profile
  const updateNostrProfile = async (nostrProfile: Partial<NostrProfile>): Promise<boolean> => {
    try {
      if (!profile) {
        return false;
      }
      
      // Prepare the update object
      const updateObj: Partial<NostrProfile> & Record<string, any> = {};
      
      // Copy over the fields
      if (nostrProfile.npub !== undefined) updateObj.npub = nostrProfile.npub;
      if (nostrProfile.nip05 !== undefined) updateObj.nip05 = nostrProfile.nip05;
      if (nostrProfile.lud16 !== undefined) updateObj.lud16 = nostrProfile.lud16;
      if (nostrProfile.nostr_pubkey !== undefined) updateObj.nostr_pubkey = nostrProfile.nostr_pubkey;
      if (nostrProfile.nostr_relays !== undefined) updateObj.nostr_relays = nostrProfile.nostr_relays;
      if (nostrProfile.nostr_signature !== undefined) updateObj.nostr_signature = nostrProfile.nostr_signature;
      
      // Handle nostr_settings separately to merge with existing settings
      if (nostrProfile.nostr_settings) {
        updateObj.nostr_settings = {
          ...profile.nostr_settings || {},
          ...nostrProfile.nostr_settings
        };
      }
      
      // Update the profile
      const result = await updateProfile(updateObj);
      
      return !result.error;
    } catch (err) {
      console.error('Error updating Nostr profile:', err);
      return false;
    }
  };
  
  const contextValue: NostrContextType = {
    isEnabled,
    hasExtension,
    isConnected,
    pubkey,
    npub,
    relays,
    connecting,
    error,
    connectExtension,
    disconnectNostr,
    publishEvent,
    signEvent,
    generateKeypair,
    connectRelay,
    disconnectRelay,
    addRelay,
    removeRelay,
    verifyNip05,
    getNostrProfile,
    updateNostrProfile
  };
  
  return (
    <NostrContext.Provider value={contextValue}>
      {children}
    </NostrContext.Provider>
  );
}

export function useNostr() {
  const context = useContext(NostrContext);
  
  if (context === undefined) {
    throw new Error('useNostr must be used within a NostrProvider');
  }
  
  return context;
} 