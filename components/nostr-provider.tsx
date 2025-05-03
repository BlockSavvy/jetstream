'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  const [relayConnections, setRelayConnections] = useState<Map<string, WebSocket>>(new Map());
  const [keypair, setKeypair] = useLocalStorage<NostrKeyPair | null>('gdyup_nostr_keypair', null);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  
  // Check if Nostr is enabled in user profile
  const isEnabled = !!profile?.nostr_settings?.enabled || false;
  
  // Handle messages from relays
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
        
        // Handle based on event kind
        switch (event.kind) {
          case NostrEventKind.EncryptedDirectMessage:
            // Handle direct message (will be implemented in messaging component)
            console.log(`Received DM on relay ${relayUrl}:`, event.id);
            break;
            
          case NostrEventKind.JetShareOffer:
            // Handle JetShare offer (will be implemented in offer component)
            console.log(`Received JetShare offer on relay ${relayUrl}:`, event.id);
            break;
            
          case NostrEventKind.Zap:
          case NostrEventKind.ZapRequest:
            // Handle zap event (will be implemented in payment component)
            console.log(`Received Zap on relay ${relayUrl}:`, event.id);
            break;
        }
        break;
      }
      
      case 'NOTICE': {
        // Handle relay notices
        if (rest.length < 1) return;
        const message = rest[0];
        console.log(`Notice from relay ${relayUrl}:`, message);
        break;
      }
      
      case 'EOSE': {
        // End of stored events
        console.log(`End of stored events from relay ${relayUrl}`);
        break;
      }
      
      case 'OK': {
        // Confirmation of event publish
        if (rest.length < 3) return;
        const [eventId, success, message] = rest;
        if (success) {
          console.log(`Event ${eventId} published successfully to ${relayUrl}`);
        } else {
          console.error(`Failed to publish event ${eventId} to ${relayUrl}: ${message}`);
        }
        break;
      }
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
  
  // Connect to relays when component mounts or when relays change
  useEffect(() => {
    const connectToRelays = async () => {
      if (!isConnected || !isEnabled) return;
      
      // Close existing connections first
      relayConnections.forEach((socket) => {
        socket.close();
      });
      
      // Get relay URLs from profile or use defaults
      const relayUrls = relays.map(r => r.url);
      
      // Create new connections using the fallback mechanism
      const connections = new Map<string, WebSocket>();
      
      // Try to connect to at least one relay
      const connectedRelay = await NostrUtils.getConnectedRelayWithFallback(relayUrls);
      
      if (connectedRelay) {
        const relayUrl = relayUrls.find(url => 
          connectedRelay.url.includes(url.replace('wss://', ''))
        ) || connectedRelay.url;
        
        connections.set(relayUrl, connectedRelay);
        
        // Update relay status
        setRelays(prev => prev.map(relay => 
          relay.url === relayUrl 
            ? { ...relay, status: 'connected' }
            : relay
        ));
        
        // Add message handler
        connectedRelay.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);
            handleRelayMessage(data, relayUrl);
          } catch (error) {
            console.error(`Error parsing message from relay ${relayUrl}:`, error);
          }
        });
        
        // Try connecting to other relays in the background
        setTimeout(() => {
          relayUrls.forEach(async (url) => {
            // Skip already connected relay
            if (url === relayUrl) return;
            
            try {
              const socket = NostrUtils.connectToRelay(url);
              
              // Add event listeners
              socket.addEventListener('open', () => {
                console.log(`Connected to additional relay: ${url}`);
                connections.set(url, socket);
                
                // Update relay status
                setRelays(prev => prev.map(r => 
                  r.url === url ? { ...r, status: 'connected' } : r
                ));
                
                // Add message handler
                socket.addEventListener('message', (event) => {
                  try {
                    const data = JSON.parse(event.data);
                    handleRelayMessage(data, url);
                  } catch (error) {
                    console.error(`Error parsing message from relay ${url}:`, error);
                  }
                });
              });
              
              socket.addEventListener('error', () => {
                setRelays(prev => prev.map(r => 
                  r.url === url ? { ...r, status: 'error' } : r
                ));
              });
              
              socket.addEventListener('close', () => {
                setRelays(prev => prev.map(r => 
                  r.url === url ? { ...r, status: 'disconnected' } : r
                ));
                connections.delete(url);
              });
            } catch (error) {
              console.error(`Error connecting to relay ${url}:`, error);
              setRelays(prev => prev.map(r => 
                r.url === url ? { ...r, status: 'error' } : r
              ));
            }
          });
        }, 1000); // Wait 1 second before trying other relays
      } else {
        // No relays connected, show error
        setError('Failed to connect to any relay. Please try again later.');
      }
      
      setRelayConnections(connections);
    };
    
    connectToRelays();
    
    // Cleanup function
    return () => {
      // Close all relay connections
      relayConnections.forEach((socket) => {
        socket.close();
      });
      setRelayConnections(new Map());
    };
  }, [isConnected, isEnabled, relays, handleRelayMessage, relayConnections]);
  
  // Connect to a Nostr extension
  const connectExtension = async (): Promise<boolean> => {
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
  };
  
  // Disconnect from Nostr
  const disconnectNostr = () => {
    setPubkey(null);
    setNpub(null);
    setIsConnected(false);
    
    // Close all relay connections
    relayConnections.forEach((socket) => {
      socket.close();
    });
    setRelayConnections(new Map());
    
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
        setRelayConnections(prev => {
          const next = new Map(prev);
          next.delete(url);
          return next;
        });
      });
      
      // Store the connection
      setRelayConnections(prev => {
        const next = new Map(prev);
        next.set(url, socket);
        return next;
      });
      
      return true;
    } catch (err) {
      console.error(`Error connecting to relay ${url}:`, err);
      setRelays(prev => prev.map(r => r.url === url ? { ...r, status: 'error' } : r));
      return false;
    }
  };
  
  // Disconnect from a relay
  const disconnectRelay = (url: string) => {
    const socket = relayConnections.get(url);
    if (socket) {
      socket.close();
      setRelayConnections(prev => {
        const next = new Map(prev);
        next.delete(url);
        return next;
      });
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
    const connectedRelays = [...relayConnections.values()].filter(
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
    relayConnections.forEach((socket, url) => {
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