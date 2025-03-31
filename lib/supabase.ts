import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseClientOptions } from '@supabase/supabase-js';

// Get supabase environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Use singleton pattern to prevent multiple client instances
let clientInstance: SupabaseClient | null = null;

// Create and export the supabase client
export const createClient = () => {
  // Return existing instance if available to prevent multiple instances
  if (clientInstance) {
    return clientInstance;
  }

  // Add debug output to help diagnose auth issues
  if (process.env.NODE_ENV !== 'production' && !clientInstance) {
    console.log('Creating Supabase client in development mode with enhanced storage persistence');
  }
  
  // Set cookie options if supported in this version
  if (typeof window !== 'undefined') {
    // Store auth state in localStorage for better persistence
    try {
      localStorage.setItem('auth_last_authenticated', 'true');
      localStorage.setItem('jetstream_session_refresh_time', new Date().getTime().toString());
    } catch (storageError) {
      console.warn('Could not access localStorage:', storageError);
    }
  }

  // Create the client only once (singleton pattern)
  if (!clientInstance) {
    // Create the client
    clientInstance = createSupabaseClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: {
          getItem: (key) => {
            if (typeof window === 'undefined') {
              return null;
            }
            
            // Try to get from localStorage first
            let data = null;
            try {
              data = localStorage.getItem(key);
              if (data) {
                console.log(`Found ${key} in localStorage`);
                return data;
              }
            } catch (e) {
              console.warn('Could not access localStorage:', e);
            }
            
            // Fallback to sessionStorage if needed
            try {
              data = sessionStorage.getItem(key);
              if (data) {
                console.log(`Found ${key} in sessionStorage`);
                return data;
              }
            } catch (e) {
              console.warn('Could not access sessionStorage:', e);
            }
            
            return null;
          },
          setItem: (key, value) => {
            if (typeof window === 'undefined') {
              return;
            }
            
            // Try to set in both storages for redundancy
            try {
              localStorage.setItem(key, value);
              console.log(`Set ${key} in localStorage`);
            } catch (e) {
              console.warn('Could not write to localStorage:', e);
            }
            
            try {
              sessionStorage.setItem(key, value);
              console.log(`Set ${key} in sessionStorage`);
            } catch (e) {
              console.warn('Could not write to sessionStorage:', e);
            }
          },
          removeItem: (key) => {
            if (typeof window === 'undefined') {
              return;
            }
            
            // Remove from both storages
            try {
              localStorage.removeItem(key);
            } catch (e) {
              console.warn('Could not remove from localStorage:', e);
            }
            
            try {
              sessionStorage.removeItem(key);
            } catch (e) {
              console.warn('Could not remove from sessionStorage:', e);
            }
          }
        }
      },
      global: {
        // Completely bypass CORS issues by disabling credentials mode
        // This is a last-resort nuclear option
        fetch: (url, options) => {
          const headers = new Headers(options?.headers || {});
          
          // Add cache control headers
          headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
          headers.set('Pragma', 'no-cache');
          
          // Create new options without credentials to prevent CORS issues
          const safeOptions = { ...options, headers };
          
          // NUCLEAR OPTION: Force remove credentials mode completely
          // This deliberately breaks cookie-based auth but prevents CORS issues
          // We'll need to rely on localStorage token instead
          delete safeOptions.credentials;
          
          console.log(`Safe fetch: ${url.toString().split("?")[0]}`);
          
          return fetch(url, safeOptions);
        }
      }
    });
    
    // Enable more verbose debugging in development
    if (process.env.NODE_ENV !== 'production') {
      // Log when the client is created
      console.log('Creating Supabase client with site URL:', typeof window !== 'undefined' ? window.location.origin : 'unknown');
    }
  }

  return clientInstance;
}; 