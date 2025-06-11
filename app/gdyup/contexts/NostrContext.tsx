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
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';

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

// Create custom toast functions with themed styles
type ThemedTextVariant = "primary" | "secondary" | "destructive" | "muted" | "inverse" | "success" | undefined;

const createThemedToast = (getThemedTextClasses: (variant?: ThemedTextVariant) => string) => {
  const themedToast = {
    error: (message: string) => {
      toast.error(message, {
        className: cn("border-red-800 bg-red-950/80", getThemedTextClasses())
      });
    },
    success: (message: string) => {
      toast.success(message, {
        className: cn("border-green-800 bg-green-950/80", getThemedTextClasses())
      });
    },
    info: (message: string) => {
      toast.info(message, {
        className: cn("border-blue-800 bg-blue-950/80", getThemedTextClasses())
      });
    }
  };
  
  return themedToast;
};

// Create the provider component
export function NostrProvider({ children }: NostrProviderProps) {
  const { user } = useAuth();
  const { getThemedTextClasses, getThemedBackgroundClasses } = useGdyupTheme();
  const themedToast = createThemedToast(getThemedTextClasses);
  
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
  
  // New state variables for connection handling
  const [initAttempts, setInitAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [lastFetchAttempt, setLastFetchAttempt] = useState(0);
  const [connectionErrors, setConnectionErrors] = useState(0);
  
  // Default relays to use as fallback
  const DEFAULT_FALLBACK_RELAYS = [
    'wss://relay.damus.io',
    'wss://relay.snort.social',
    'wss://nos.lol'
  ];
  
  // Global circuit breaker to prevent request flood
  useEffect(() => {
    // Check if there's a global circuit breaker active
    const checkGlobalCircuitBreaker = () => {
      try {
        const circuitBreaker = localStorage.getItem('nostr_circuit_breaker');
        if (circuitBreaker) {
          const { timestamp, count } = JSON.parse(circuitBreaker);
          // If circuit breaker was activated less than 5 minutes ago and had more than 5 failures
          if (Date.now() - timestamp < 5 * 60 * 1000 && count > 5) {
            console.log('[Nostr] Global circuit breaker active, preventing API calls');
            return true;
          }
        }
        return false;
      } catch (e) {
        return false;
      }
    };
    
    // Update the circuit breaker when connection errors increase
    if (connectionErrors > 3) {
      try {
        // Activate the circuit breaker
        localStorage.setItem('nostr_circuit_breaker', JSON.stringify({
          timestamp: Date.now(),
          count: connectionErrors
        }));
        console.warn('[Nostr] Circuit breaker activated due to connection errors');
      } catch (e) {
        // Ignore storage errors
      }
    }
    
    // If circuit breaker is active, set a safe state
    if (checkGlobalCircuitBreaker()) {
      setIsInitialized(true);
      setIsEnabled(true);
      setRelays(DEFAULT_FALLBACK_RELAYS);
      if (pubkey) {
        setIsConnected(true);
      }
    }
  }, [connectionErrors, DEFAULT_FALLBACK_RELAYS, pubkey]);
  
  // Function to fetch relay info with improved retry logic and memory caching
  const fetchRelayInfo = useCallback(async (retryCount = 0): Promise<any> => {
    // CHECK GLOBAL REQUEST COUNTER to prevent multiple tabs from flooding
    try {
      const now = Date.now();
      const requestCounter = localStorage.getItem('nostr_relay_requests');
      const requestHistory = requestCounter ? JSON.parse(requestCounter) : [];
      
      // Keep only requests in the last 60 seconds
      const recentRequests = requestHistory.filter((time: number) => now - time < 60000);
      
      // Add current request time
      recentRequests.push(now);
      
      // Store updated request history
      localStorage.setItem('nostr_relay_requests', JSON.stringify(recentRequests));
      
      // If too many recent requests (more than 5 in last minute), use cache or default
      if (recentRequests.length > 5 && retryCount === 0) {
        console.warn('[Nostr] Too many relay requests across tabs, using cache or defaults');
        
        // Try to use cached data regardless of age
        try {
          const cachedData = sessionStorage.getItem('nostr_relay_cache') || localStorage.getItem('nostr_relay_cache');
          if (cachedData) {
            const parsedCache = JSON.parse(cachedData);
            console.log('[Nostr] Using cached relay data due to global rate limiting');
            return parsedCache.data;
          }
        } catch (e) {
          // If cache reading fails, use defaults
          return {
            nostrEnabled: true,
            pubkey: null,
            relays: DEFAULT_FALLBACK_RELAYS,
            userRelays: [],
            success: true,
            error: 'Using defaults due to global rate limiting'
          };
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    
    // Check for circuit breaker
    try {
      const circuitBreaker = localStorage.getItem('nostr_circuit_breaker');
      if (circuitBreaker) {
        const { timestamp, count } = JSON.parse(circuitBreaker);
        // If circuit breaker is active, don't make API calls
        if (Date.now() - timestamp < 5 * 60 * 1000 && count > 5) {
          console.log('[Nostr] Circuit breaker active, using cached data or defaults');
          
          // Try to use cached data regardless of age
          try {
            const cachedData = sessionStorage.getItem('nostr_relay_cache') || localStorage.getItem('nostr_relay_cache');
            if (cachedData) {
              const parsedCache = JSON.parse(cachedData);
              return parsedCache.data;
            }
          } catch (e) {
            // If cache reading fails, use defaults
          }
          
          // Return default data
          return {
            nostrEnabled: true,
            pubkey: null,
            relays: DEFAULT_FALLBACK_RELAYS,
            userRelays: [],
            success: true,
            error: 'Using defaults due to circuit breaker'
          };
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    
    // First try to use cached data if available
    try {
      // First try sessionStorage for current tab data
      const cachedData = sessionStorage.getItem('nostr_relay_cache');
      if (cachedData) {
        const parsedCache = JSON.parse(cachedData);
        // Use cache if it's less than 15 minutes old (increased from 5)
        const cacheAge = Date.now() - parsedCache.timestamp;
        if (cacheAge < 15 * 60 * 1000) {
          console.log('[Nostr] Using cached relay data (age: ' + Math.round(cacheAge/1000) + 's)');
          return parsedCache.data;
        }
      }
      
      // Then try localStorage for shared cache across tabs
      const sharedCachedData = localStorage.getItem('nostr_relay_cache');
      if (sharedCachedData) {
        const parsedCache = JSON.parse(sharedCachedData);
        // Use cache if it's less than 15 minutes old
        const cacheAge = Date.now() - parsedCache.timestamp;
        if (cacheAge < 15 * 60 * 1000) {
          console.log('[Nostr] Using shared cached relay data (age: ' + Math.round(cacheAge/1000) + 's)');
          // Also update session storage for faster access
          sessionStorage.setItem('nostr_relay_cache', sharedCachedData);
          return parsedCache.data;
        }
      }
    } catch (cacheError) {
      console.warn('[Nostr] Error reading cache:', cacheError);
    }
    
    // More aggressive debounce: Use a much longer cool-down period between attempts
    const now = Date.now();
    const cooldownPeriod = 30000; // 30 seconds between attempts (increased from 10s)
    
    if (now - lastFetchAttempt < cooldownPeriod && retryCount === 0) {
      console.log('[Nostr] Request throttled, using cached data or waiting...');
      // Try to use cached data even if older than 15 minutes
      try {
        const cachedData = sessionStorage.getItem('nostr_relay_cache') || localStorage.getItem('nostr_relay_cache');
        if (cachedData) {
          const parsedCache = JSON.parse(cachedData);
          // Use older cache during throttling
          console.log('[Nostr] Using throttled cache fallback');
          return parsedCache.data;
        }
      } catch (e) {} // Silently continue if cache read fails
      
      // If no cache is available, return defaults instead of waiting
      console.log('[Nostr] No cache available, using defaults to avoid waiting');
      return {
        nostrEnabled: true,
        pubkey: null,
        relays: DEFAULT_FALLBACK_RELAYS,
        userRelays: [],
        success: true,
        error: 'Using defaults due to throttling'
      };
    }
    
    // Update last fetch timestamp
    setLastFetchAttempt(now);
    
    // Add cache busting to prevent browser caching
    const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    
    // Configure request timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Reduced from 15s to 8s
    
    try {
      console.log(`[Nostr] Fetching relay info, attempt ${retryCount + 1}`);
      
      // Make the request with proper error handling
      const response = await fetch(`/api/nostr/relay?_cb=${cacheBuster}`, {
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          'X-Request-Time': Date.now().toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Fetch-ID': `nostr-relay-${cacheBuster}`,
          'X-Retry': retryCount > 0 ? 'true' : 'false'
        },
        // Use keepalive to maintain the connection
        keepalive: true
      });
      
      // Clear timeout as soon as response is received
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 429) {
          // Special handling for rate limiting
          console.warn('[Nostr] Rate limited by the server (429)');
          setConnectionErrors(prev => prev + 2); // Count rate limits more severely
          throw new Error('Rate limited by server');
        }
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[Nostr] Relay info fetched successfully');
      
      // Reset error counter on success
      setConnectionErrors(0);
      setIsRetrying(false);
      
      // Cache the successful response in memory AND localStorage
      const responseCache = {
        timestamp: Date.now(),
        data: data
      };
      const responseCacheJson = JSON.stringify(responseCache);
      sessionStorage.setItem('nostr_relay_cache', responseCacheJson);
      try {
        localStorage.setItem('nostr_relay_cache', responseCacheJson); // Also in localStorage for cross-tab sharing
      } catch (e) {
        // Ignore localStorage errors
      }
      
      // Success - reset circuit breaker if it exists
      try {
        localStorage.removeItem('nostr_circuit_breaker');
      } catch (e) {
        // Ignore localStorage errors
      }
      
      return data;
    } catch (error) {
      // Clean up timeout
      clearTimeout(timeoutId);
      
      // Increment error counter
      setConnectionErrors(prev => prev + 1);
      
      console.error(`[Nostr] Error fetching relay info (attempt ${retryCount + 1}):`, error);
      
      // Try to use cached data if available, regardless of age during errors
      try {
        const cachedData = sessionStorage.getItem('nostr_relay_cache') || localStorage.getItem('nostr_relay_cache');
        if (cachedData) {
          const parsedCache = JSON.parse(cachedData);
          console.log('[Nostr] Using cached relay data due to connection issues');
          return parsedCache.data;
        }
      } catch (cacheError) {
        console.warn('[Nostr] Error reading cache:', cacheError);
      }
      
      // NEVER retry on 429 errors
      if (
        (error instanceof Error && (
          error.message.includes('429') || 
          error.message.includes('Rate limited')
        )) || 
        (typeof error === 'object' && error !== null && 
         'message' in error && typeof error.message === 'string' && (
           error.message.includes('429') || 
           error.message.includes('Rate limited')
         ))
      ) {
        console.warn('[Nostr] Not retrying due to rate limiting');
        
        // Update circuit breaker
        try {
          localStorage.setItem('nostr_circuit_breaker', JSON.stringify({
            timestamp: Date.now(),
            count: connectionErrors + 1
          }));
        } catch (e) {
          // Ignore localStorage errors
        }
        
        // Return defaults
        return {
          nostrEnabled: true,
          pubkey: null,
          relays: DEFAULT_FALLBACK_RELAYS,
          userRelays: [],
          success: false,
          error: 'Rate limited by server'
        };
      }
      
      // Implement retry with exponential backoff and larger max delay
      // Disable retries completely if we have too many errors
      if (retryCount < 1 && connectionErrors < 3) { // Maximum 1 retry attempt
        const backoffDelay = Math.min(5000 * Math.pow(2, retryCount), 15000);
        console.log(`[Nostr] Retrying in ${backoffDelay}ms...`);
        
        setIsRetrying(true);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        
        return fetchRelayInfo(retryCount + 1);
      }
      
      setIsRetrying(false);
      
      // Update circuit breaker on repeated failures
      if (connectionErrors > 3) {
        try {
          localStorage.setItem('nostr_circuit_breaker', JSON.stringify({
            timestamp: Date.now(),
            count: connectionErrors
          }));
        } catch (e) {
          // Ignore localStorage errors
        }
      }
      
      // Instead of throwing, just return default fallback data
      return {
        nostrEnabled: true,
        pubkey: null,
        relays: DEFAULT_FALLBACK_RELAYS,
        userRelays: [],
        success: false,
        error: 'Failed after multiple retry attempts'
      };
    }
  }, [lastFetchAttempt, DEFAULT_FALLBACK_RELAYS, connectionErrors]);
  
  // Initialize Nostr state when user is available
  useEffect(() => {
    // NUCLEAR CIRCUIT BREAKER FOR CAPACITOR ENVIRONMENT
    // Skip ALL Nostr initialization in Capacitor to prevent network crashes
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      console.log('[Nostr] Capacitor environment detected - using safe offline mode');
      
      // Set safe defaults without any network calls
      setIsInitialized(true);
      setIsEnabled(true);
      setRelays(DEFAULT_FALLBACK_RELAYS);
      setIsConnected(false); // Stay disconnected to avoid WebSocket issues
      
      // Set basic user data if available
      if ((user as any)?.nostr_pubkey) {
        setPubkey((user as any).nostr_pubkey);
      }
      if ((user as any)?.nip05 && (user as any).nip05 !== 'dev@gdyup.xyz') {
        setNip05((user as any).nip05);
        setHasNip05(true);
      }
      
      return; // Exit early - no network operations in Capacitor
    }
    
    // Skip if already initializing
    if (isInitializing) return;
    
    const initializeNostr = async () => {
      // Skip if no user
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
      
      // Skip initialization if we've already tried multiple times
      if (initAttempts > 1) { // Reduced to only 1 retry
        console.log('[Nostr] Maximum initialization attempts reached, using current state');
        // Still set initialized to true to prevent UI hanging
        setIsInitialized(true);
        return;
      }
      
      // Check if another initialization is happening in another tab (in the last 10 seconds)
      try {
        const lastInit = localStorage.getItem('nostr_last_init');
        if (lastInit && Date.now() - parseInt(lastInit, 10) < 10000) {
          console.log('[Nostr] Another initialization is happening in another tab, waiting');
          
          // Mark as initialized to avoid hanging UI
          setIsInitialized(true);
          
          // Set a timer to retry after the other tab has finished
          setTimeout(() => {
            // Only increment if we really need another try
            if (!isConnected) {
              setInitAttempts(prev => prev + 0.5); // Only count as half an attempt
            }
          }, 10000);
          
          return;
        }
        
        // Mark our initialization
        localStorage.setItem('nostr_last_init', Date.now().toString());
      } catch (e) {
        // Ignore localStorage errors
      }
      
      // Check for circuit breaker
      try {
        const circuitBreaker = localStorage.getItem('nostr_circuit_breaker');
        if (circuitBreaker) {
          const { timestamp, count } = JSON.parse(circuitBreaker);
          // If circuit breaker is active, use safe defaults
          if (Date.now() - timestamp < 5 * 60 * 1000 && count > 5) {
            console.log('[Nostr] Circuit breaker active, using safe defaults');
            setIsInitialized(true);
            setIsEnabled(true);
            setRelays(DEFAULT_FALLBACK_RELAYS);
            if (pubkey) {
              setIsConnected(true);
            }
            return;
          }
        }
      } catch (e) {
        // Ignore localStorage errors
      }
      
      setIsInitializing(true);
      
      try {
        console.log('[Nostr] Initializing Nostr context for user:', user.id);
        
        // Set initialized early to avoid UI hanging
        // This will allow the UI to render while we continue initializing
        setIsInitialized(true);
        
        // Add a larger delay on initial mount to prevent rapid reconnection attempts
        // This helps avoid the throttling and resource issues
        await new Promise(resolve => setTimeout(resolve, 3000)); // Increased from 2000ms
        
        // Initialize with fallback values first so UI can render with something
        setRelays(DEFAULT_FALLBACK_RELAYS);
        
        // Start with a basic connected state if we have a pubkey from previous session
        if (pubkey) {
          setIsEnabled(true);
          setIsConnected(true);
        }
        
        // Try to get profile data first for NIP-05 and pubkey using cached data if available
        let userProfile = null;
        try {
          // Check for cached profile data first in multiple storages
          const cachedProfile = sessionStorage.getItem(`profile_cache_${user.id}`) || 
                               localStorage.getItem(`profile_cache_${user.id}`);
          
          if (cachedProfile) {
            try {
              const parsedProfile = JSON.parse(cachedProfile);
              const cacheAge = Date.now() - parsedProfile.timestamp;
              
              // Use cache if less than 30 minutes old (increased from 5)
              if (cacheAge < 30 * 60 * 1000) {
                console.log('[Nostr] Using cached profile data');
                userProfile = parsedProfile.data;
                
                // Update state with profile data
                if (userProfile?.nip05 && userProfile.nip05 !== 'dev@gdyup.xyz') {
                  setNip05(userProfile.nip05);
                  setHasNip05(true);
                }
                
                if (userProfile?.nostr_pubkey) {
                  setPubkey(userProfile.nostr_pubkey);
                }
              }
            } catch (e) {
              console.warn('[Nostr] Error parsing cached profile:', e);
            }
          }
          
          // Only fetch profile if no valid cache and no circuit breaker
          const shouldSkipFetch = (() => {
            try {
              const circuitBreaker = localStorage.getItem('nostr_circuit_breaker');
              if (circuitBreaker) {
                const { timestamp, count } = JSON.parse(circuitBreaker);
                return Date.now() - timestamp < 5 * 60 * 1000 && count > 5;
              }
              return false;
            } catch (e) {
              return false;
            }
          })();
          
          if (!userProfile && !shouldSkipFetch) {
            // Make profile request with timeout
            const profileController = new AbortController();
            const profileTimeout = setTimeout(() => profileController.abort(), 5000); // Reduced from 8000
            
            const profileResponse = await fetch(`/api/gdyup/profile?userId=${user.id}`, {
              signal: profileController.signal,
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache',
                'X-Request-Time': Date.now().toString()
              }
            });
            
            clearTimeout(profileTimeout);
            
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              userProfile = profileData.profile;
              
              // Cache the profile data in multiple storages
              if (userProfile) {
                const profileCache = JSON.stringify({
                  timestamp: Date.now(),
                  data: userProfile
                });
                
                sessionStorage.setItem(`profile_cache_${user.id}`, profileCache);
                try {
                  localStorage.setItem(`profile_cache_${user.id}`, profileCache);
                } catch (e) {
                  // Ignore localStorage errors
                }
              }
              
              // Update state with profile data if available
              if (userProfile?.nip05 && userProfile.nip05 !== 'dev@gdyup.xyz') {
                setNip05(userProfile.nip05);
                setHasNip05(true);
              }
              
              if (userProfile?.nostr_pubkey) {
                setPubkey(userProfile.nostr_pubkey);
              }
              
              console.log('[Nostr] Retrieved profile data:', { 
                nip05: userProfile?.nip05,
                pubkey: userProfile?.nostr_pubkey 
              });
            }
          }
        } catch (profileError) {
          console.warn('[Nostr] Failed to get profile data:', profileError);
          // Continue with initialization - don't let this stop us
        }
        
        // Check for circuit breaker again before fetching relay config
        const hasCircuitBreaker = (() => {
          try {
            const circuitBreaker = localStorage.getItem('nostr_circuit_breaker');
            if (circuitBreaker) {
              const { timestamp, count } = JSON.parse(circuitBreaker);
              return Date.now() - timestamp < 5 * 60 * 1000 && count > 5;
            }
            return false;
          } catch (e) {
            return false;
          }
        })();
        
        // Only fetch relay configuration if we don't already have relays
        // or if we have a low connection error count (avoid excessive retries)
        if (!hasCircuitBreaker && (relays.length <= DEFAULT_FALLBACK_RELAYS.length || connectionErrors < 2)) {
          try {
            // Try to fetch relay configuration with automatic fallback
            console.log('[Nostr] Attempting to fetch relay configuration');
            const relayData = await fetchRelayInfo();
            
            // Update state with relay data (will have fallbacks even on failure)
            if (relayData) {
              // Update settings from relay data if available
              if (relayData.nostrEnabled !== undefined) {
                setIsEnabled(relayData.nostrEnabled);
              } else {
                // Default to enabled
                setIsEnabled(true);
              }
              
              // Update pubkey if we don't already have one
              if (!pubkey && relayData.pubkey) {
                setPubkey(relayData.pubkey);
              }
              
              // Update NIP-05 if needed
              if (!nip05 && relayData.nip05 && relayData.nip05 !== 'dev@gdyup.xyz') {
                setNip05(relayData.nip05);
                setHasNip05(true);
              }
              
              // Combine default and user relays
              const defaultRelays = relayData.relays || DEFAULT_FALLBACK_RELAYS;
              const userRelays = relayData.userRelays || [];
              const combinedRelays = [...new Set([...defaultRelays, ...userRelays])];
              
              if (combinedRelays.length > 0) {
                setRelays(combinedRelays);
                console.log('[Nostr] Set relays:', combinedRelays);
              }
              
              // Mark as connected if we have enough information
              if ((pubkey || relayData.pubkey) && combinedRelays.length > 0) {
                setIsConnected(true);
                console.log('[Nostr] Connection established');
              }
            }
          } catch (relayError) {
            console.warn('[Nostr] Failed relay configuration fetch:', relayError);
            // Continue with fallback approach
          }
        } else {
          console.log('[Nostr] Using existing relay configuration, skipping fetch to avoid looping');
        }
      } catch (error) {
        console.error('[Nostr] Initialization failed:', error);
        
        // Keep enabled if we have pubkey
        if (pubkey) {
          setIsEnabled(true);
          setIsConnected(true);
          console.log('[Nostr] Recovered with partial configuration');
        } else {
          setIsEnabled(false);
          setIsConnected(false);
        }
      } finally {
        setIsInitializing(false);
        setInitAttempts(prev => prev + 1);
        
        // Clear the initialization marker
        try {
          localStorage.removeItem('nostr_last_init');
        } catch (e) {
          // Ignore localStorage errors
        }
      }
    };
    
    // Initialize immediately, but with a short delay to prevent immediate loads
    setTimeout(initializeNostr, 1000); 
    
    // Return cleanup function
    return () => {
      setIsInitializing(false);
    };
  }, [user, pubkey, nip05, fetchRelayInfo, initAttempts, isInitializing, DEFAULT_FALLBACK_RELAYS, relays.length, connectionErrors, isConnected]);
  
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
      themedToast.error('Failed to connect to Nostr network');
      return false;
    }
  };
  
  // Connect to Nostr network
  const connect = useCallback(async (): Promise<boolean> => {
    if (!settings.enabled || !pubkey) {
      themedToast.error('Nostr is not enabled or missing pubkey');
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
      themedToast.error('Failed to update Nostr settings');
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
      themedToast.error('Failed to create zap request');
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
      
      themedToast.success('Joined flight group chat');
      return true;
    } catch (error) {
      console.error('Error joining flight group:', error);
      themedToast.error('Failed to join flight group');
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
      
      themedToast.info('Left flight group chat');
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
      themedToast.error('Failed to send message');
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