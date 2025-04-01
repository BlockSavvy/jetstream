import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Get supabase environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Use singleton pattern to prevent multiple client instances
let clientInstance: SupabaseClient | null = null;

// Track auth state
let authMemoryStore: Record<string, string> = {};

// Create a more robust storage mechanism for browsers with restricted localStorage
const createEnhancedStorage = () => {
  return {
    getItem: (key: string): string | null => {
      try {
        // First try from memory cache (fastest)
        if (authMemoryStore[key]) {
          return authMemoryStore[key];
        }
        
        // Then try localStorage (more persistent)
        if (typeof window !== 'undefined') {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              // Update memory cache
              authMemoryStore[key] = value;
              return value;
            }
          } catch (error) {
            console.warn('Error getting from localStorage:', error);
          }
        }
        
        // Fallback to sessionStorage
        if (typeof window !== 'undefined') {
          try {
            const value = sessionStorage.getItem(key);
            if (value) {
              // Update memory cache
              authMemoryStore[key] = value;
              return value;
            }
          } catch (error) {
            console.warn('Error getting from sessionStorage:', error);
          }
        }
        
        return null;
      } catch (error) {
        console.error('Error in getItem:', error);
        return null;
      }
    },
    
    setItem: (key: string, value: string): void => {
      try {
        // Always update memory cache first (fastest)
        authMemoryStore[key] = value;
        
        // Then try to update localStorage for persistence
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(key, value);
            // Also store timestamp for debugging/tracking
            localStorage.setItem(`${key}_timestamp`, Date.now().toString());
          } catch (error) {
            console.warn('Error setting localStorage:', error);
            
            // If localStorage fails, try sessionStorage as fallback
            try {
              sessionStorage.setItem(key, value);
              sessionStorage.setItem(`${key}_timestamp`, Date.now().toString());
            } catch (sessionError) {
              console.warn('Error setting sessionStorage:', sessionError);
            }
          }
        }
      } catch (error) {
        console.error('Error in setItem:', error);
      }
    },
    
    removeItem: (key: string): void => {
      try {
        // Remove from memory cache
        delete authMemoryStore[key];
        
        // Remove from localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem(key);
            localStorage.removeItem(`${key}_timestamp`);
          } catch (error) {
            console.warn('Error removing from localStorage:', error);
          }
          
          // Also remove from sessionStorage
          try {
            sessionStorage.removeItem(key);
            sessionStorage.removeItem(`${key}_timestamp`);
          } catch (error) {
            console.warn('Error removing from sessionStorage:', error);
          }
        }
      } catch (error) {
        console.error('Error in removeItem:', error);
      }
    }
  };
};

// Create and export the supabase client
export const createClient = (): SupabaseClient => {
  // Return existing instance if available to prevent multiple instances
  if (clientInstance) {
    return clientInstance;
  }
  
  // Initialize localStorage with auth persistence settings
  if (typeof window !== 'undefined') {
    try {
      // Set a flag to indicate long auth persistence preferences
      localStorage.setItem('auth_persistence', 'long');
      localStorage.setItem('auth_persistence_days', '30');
    } catch (e) {
      console.warn('Could not set auth persistence in localStorage:', e);
    }
  }
  
  // Create enhanced storage that works consistently across devices
  const enhancedStorage = createEnhancedStorage();
  
  // Detect mobile browsers to optimize auth settings
  const isMobile = typeof window !== 'undefined' && 
    (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
     window.innerWidth < 768);
  
  // Create a new instance
  clientInstance = createSupabaseClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: true,
      storageKey: 'sb-vjhrmizwqhmafkxbmfwa-auth-token',
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      // Use custom storage implementation for better persistence
      storage: enhancedStorage
    },
    global: {
      headers: {
        'X-Client-Info': `supabase-js-v2${isMobile ? '-mobile' : ''}`
      }
    }
  });
  
  // Add event listener for auth state changes to maintain memory cache
  if (typeof window !== 'undefined') {
    clientInstance.auth.onAuthStateChange((event, session) => {
      try {
        if (session) {
          // Update memory store with user ID for faster access
          authMemoryStore['jetstream_user_id'] = session.user.id;
          
          // Also update localStorage for redundancy
          try {
            localStorage.setItem('jetstream_user_id', session.user.id);
            localStorage.setItem('jetstream_user_email', session.user.email || '');
            localStorage.setItem('jetstream_session_time', Date.now().toString());
          } catch (e) {
            console.warn('Error updating localStorage on auth change:', e);
          }
        } else if (event === 'SIGNED_OUT') {
          // Clear memory store
          authMemoryStore = {};
        }
      } catch (e) {
        console.warn('Error handling auth state change:', e);
      }
    });
  }
  
  return clientInstance;
}; 