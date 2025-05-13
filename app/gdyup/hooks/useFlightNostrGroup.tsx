'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNostr } from '@/app/gdyup/contexts/NostrContext';
import { toast } from 'sonner';
import { useGdyupTheme } from './useGdyupTheme';
import { cn } from '@/lib/utils';

// Define message interface
export interface NostrMessage {
  id: string;
  pubkey: string;
  content: string;
  created_at: number;
  user?: {
    name?: string;
    nip05?: string;
    picture?: string;
  };
}

// Define zap interface
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

interface FlightNostrGroupState {
  messages: NostrMessage[];
  zaps: NostrZap[];
  participants: {
    pubkey: string;
    name?: string;
    nip05?: string;
    picture?: string;
  }[];
  isJoined: boolean;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}

interface UseFlightNostrGroupResult {
  isJoined: boolean;
  isLoading: boolean;
  messages: NostrMessage[];
  participants: {
    pubkey: string;
    name?: string;
    nip05?: string;
  }[];
  joinGroup: () => Promise<boolean>;
  leaveGroup: () => void;
  sendMessage: (content: string) => Promise<boolean>;
  sendZap: (recipientPubkey: string, amount: number, comment?: string) => Promise<string | null>;
  refreshData: () => Promise<void>;
  inviteToGroup: (email: string, pubkey?: string) => Promise<boolean>;
  isNostrReady: boolean;
  errorMessage?: string;
  nostrPubkey?: string;
  nostrNip05?: string;
}

export function useFlightNostrGroup(offerId: string): UseFlightNostrGroupResult {
  const { 
    isEnabled,
    isConnected,
    pubkey,
    nip05,
    flightGroups,
    joinFlightGroup, 
    leaveFlightGroup,
    sendFlightGroupMessage,
    zapRequest
  } = useNostr();
  
  const { getThemedTextClasses } = useGdyupTheme();
  
  const [state, setState] = useState<FlightNostrGroupState>({
    messages: [],
    zaps: [],
    participants: [],
    isJoined: false,
    isLoading: true,
    isError: false
  });
  
  // Check if Nostr is ready for use
  const isNostrReady = isEnabled && isConnected && !!pubkey;
  
  // Create themed toast notifications
  const showErrorToast = useCallback((message: string) => {
    toast.error(message, {
      className: cn("border-red-800 bg-red-950/80", getThemedTextClasses())
    });
  }, [getThemedTextClasses]);

  const showSuccessToast = useCallback((message: string) => {
    toast.success(message, {
      className: cn("border-green-800 bg-green-950/80", getThemedTextClasses())
    });
  }, [getThemedTextClasses]);
  
  // Update state when flight groups change
  useEffect(() => {
    if (flightGroups[offerId]) {
      setState(prev => ({
        ...prev,
        isJoined: true,
        participants: flightGroups[offerId].participants
      }));
    } else {
      setState(prev => ({
        ...prev,
        isJoined: false
      }));
    }
  }, [flightGroups, offerId]);
  
  // Load initial messages when joining group
  useEffect(() => {
    if (state.isJoined && pubkey) {
      fetchFlightMessages();
    }
  }, [state.isJoined, pubkey]);
  
  // Fetch flight messages
  const fetchFlightMessages = useCallback(async () => {
    if (!isNostrReady || !offerId) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // In a real implementation, this would be fetched from Nostr relays
      // For now, we'll use a simulated API call
      const response = await fetch(`/api/gdyup/nostr/flightMessages?offerId=${offerId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch flight messages');
      }
      
      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        messages: data.messages || [],
        zaps: data.zaps || [],
        isLoading: false
      }));
    } catch (error) {
      console.error('Error fetching flight messages:', error);
      setState(prev => ({
        ...prev,
        isError: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error fetching messages',
        isLoading: false
      }));
    }
  }, [isNostrReady, offerId]);
  
  // Join flight group
  const joinGroup = useCallback(async () => {
    if (!isNostrReady) {
      showErrorToast('Nostr not connected or enabled');
      return false;
    }
    
    try {
      const joined = await joinFlightGroup(offerId);
      
      if (joined) {
        showSuccessToast('Joined flight group');
        setState(prev => ({ ...prev, isJoined: true }));
      }
      
      return joined;
    } catch (error) {
      console.error('Error joining flight group:', error);
      showErrorToast('Failed to join flight group');
      return false;
    }
  }, [isNostrReady, joinFlightGroup, offerId, showErrorToast, showSuccessToast]);
  
  // Leave flight group
  const leaveGroup = useCallback(() => {
    if (!isNostrReady || !state.isJoined) {
      return;
    }
    
    try {
      leaveFlightGroup(offerId);
      setState(prev => ({ ...prev, isJoined: false }));
      showSuccessToast('Left flight group');
    } catch (error) {
      console.error('Error leaving flight group:', error);
      showErrorToast('Failed to leave flight group');
    }
  }, [isNostrReady, state.isJoined, leaveFlightGroup, offerId, showErrorToast, showSuccessToast]);
  
  // Send message to flight group
  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!isNostrReady || !state.isJoined || !content.trim()) {
      return false;
    }
    
    try {
      const messageId = await sendFlightGroupMessage(offerId, content);
      
      if (messageId) {
        // Add the message to local state for immediate display
        const newMessage: NostrMessage = {
          id: messageId,
          pubkey: pubkey!,
          content,
          created_at: Math.floor(Date.now() / 1000),
          user: {
            name: 'You',
            nip05: nip05 || undefined
          }
        };
        
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, newMessage]
        }));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error sending message:', error);
      showErrorToast('Failed to send message');
      return false;
    }
  }, [isNostrReady, state.isJoined, sendFlightGroupMessage, offerId, pubkey, nip05, showErrorToast]);
  
  // Send a zap to a participant
  const sendZap = useCallback(async (
    recipientPubkey: string, 
    amount: number, 
    comment?: string
  ): Promise<string | null> => {
    if (!isNostrReady || !pubkey) {
      showErrorToast('Nostr not connected or enabled');
      return null;
    }
    
    try {
      const zapId = await zapRequest(recipientPubkey, amount, comment, offerId);
      
      if (zapId) {
        // Add the zap to local state
        const newZap: NostrZap = {
          id: zapId,
          amount,
          sender: {
            pubkey: pubkey,
            name: 'You',
            nip05: nip05 || undefined
          },
          recipient: {
            pubkey: recipientPubkey
          },
          comment,
          created_at: Math.floor(Date.now() / 1000)
        };
        
        setState(prev => ({
          ...prev,
          zaps: [...prev.zaps, newZap]
        }));
        
        showSuccessToast(`Zapped ${amount} sats!`);
      }
      
      return zapId;
    } catch (error) {
      console.error('Error sending zap:', error);
      showErrorToast('Failed to send zap');
      return null;
    }
  }, [isNostrReady, pubkey, nip05, zapRequest, offerId, showErrorToast, showSuccessToast]);
  
  // Refresh data
  const refreshData = useCallback(async () => {
    if (!isNostrReady || !state.isJoined) {
      return;
    }
    
    await fetchFlightMessages();
  }, [isNostrReady, state.isJoined, fetchFlightMessages]);
  
  // Invite someone to the group
  const inviteToGroup = useCallback(async (email: string, pubkey?: string): Promise<boolean> => {
    if (!isNostrReady || !state.isJoined) {
      return false;
    }
    
    try {
      // In a real implementation, this would:
      // 1. Check if the user exists in the system
      // 2. Send them an invitation via email or Nostr DM
      // 3. Provide them with a link to join the group
      
      // For now, we'll simulate success
      showSuccessToast(`Invitation sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error inviting to group:', error);
      showErrorToast('Failed to send invitation');
      return false;
    }
  }, [isNostrReady, state.isJoined, showErrorToast, showSuccessToast]);
  
  return {
    isJoined: state.isJoined,
    isLoading: state.isLoading,
    messages: state.messages,
    participants: state.participants,
    joinGroup,
    leaveGroup,
    sendMessage,
    sendZap,
    refreshData,
    inviteToGroup,
    isNostrReady,
    errorMessage: state.errorMessage,
    nostrPubkey: pubkey || undefined,
    nostrNip05: nip05 || undefined
  };
} 