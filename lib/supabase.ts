import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Get supabase environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Use singleton pattern to prevent multiple client instances
let supabaseClient: SupabaseClient | null = null;

/**
 * Storage wrapper that works across browsers with various storage limitations
 * Handles localStorage access errors gracefully and provides fallbacks
 */
const createEnhancedStorage = () => {
  return {
    getItem: (key: string): string | null => {
      try {
        if (typeof window !== 'undefined') {
          // Try localStorage first (more persistent)
          try {
            return localStorage.getItem(key);
          } catch (error) {
            console.warn('Error getting from localStorage:', error);
          }
          
          // Fall back to sessionStorage
          try {
            return sessionStorage.getItem(key);
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
        if (typeof window !== 'undefined') {
          // Try to set in localStorage first
          try {
            localStorage.setItem(key, value);
          } catch (error) {
            console.warn('Error setting localStorage:', error);
            
            // Fall back to sessionStorage
            try {
              sessionStorage.setItem(key, value);
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
        if (typeof window !== 'undefined') {
          // Clear from localStorage
          try {
            localStorage.removeItem(key);
          } catch (error) {
            console.warn('Error removing from localStorage:', error);
          }
          
          // Also clear from sessionStorage
          try {
            sessionStorage.removeItem(key);
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

/**
 * Returns a Supabase client for client-side usage
 * Uses singleton pattern to prevent multiple instances
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  // Detect mobile browsers to optimize auth settings
  const isMobile = typeof window !== 'undefined' && 
    (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768);
    
  // Create enhanced storage that works consistently across devices
  const enhancedStorage = createEnhancedStorage();
  
  supabaseClient = createSupabaseClient(SUPABASE_URL, SUPABASE_KEY, {
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
  
  return supabaseClient;
}

/**
 * Legacy function for compatibility with existing code
 * @deprecated Use getSupabaseClient() instead
 */
export const createClient = getSupabaseClient; 