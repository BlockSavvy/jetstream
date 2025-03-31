'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';

/**
 * Hook to synchronize authentication state between localStorage and cookies
 * Provides methods to refresh tokens and ensure consistent auth state
 */
export function useAuthSync() {
  const [isInitialized, setIsInitialized] = useState(false);
  const { user, session, refreshSession } = useAuth();
  const lastRefresh = useRef<number>(0);
  const lastSynced = useRef<Date | null>(null);
  const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
  
  // Store auth data in localStorage for redundancy
  const syncTokenToLocalStorage = () => {
    if (!session) return;
    
    try {
      console.log('syncTokenToLocalStorage: Storing auth data in localStorage');
      
      // Store tokens in localStorage
      const storageData = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: {
          id: session.user.id,
          email: session.user.email,
        }
      };
      
      localStorage.setItem('sb-vjhrmizwqhmafkxbmfwa-auth-token', JSON.stringify(storageData));
      localStorage.setItem('jetstream_user_id', session.user.id);
      localStorage.setItem('jetstream_user_email', session.user.email || '');
      localStorage.setItem('auth_last_authenticated', 'true');
      localStorage.setItem('jetstream_session_time', Date.now().toString());
      
      lastSynced.current = new Date();
      
      console.log('Auth tokens synchronized to localStorage');
    } catch (error) {
      console.warn('Error syncing tokens to localStorage:', error);
    }
  };
  
  // Manually refresh session token with rate limiting
  const refreshSessionToken = async (): Promise<boolean> => {
    const now = Date.now();
    
    // Rate limit refreshes to avoid excessive API calls
    if (now - lastRefresh.current < 10000) { // 10 seconds minimum between refreshes
      console.log('Token refresh skipped - rate limited');
      return false;
    }
    
    lastRefresh.current = now;
    console.log('Manually refreshing auth session...');
    
    try {
      // Try the auth provider's refresh first
      const refreshResult = await refreshSession();
      
      if (refreshResult) {
        console.log('Successfully refreshed session via auth provider');
        syncTokenToLocalStorage();
        return true;
      }
      
      // If that fails, try direct Supabase refresh
      console.log('Auth provider refresh failed, trying direct Supabase refresh');
      const supabase = createClient();
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Failed to refresh session:', error.message);
        return false;
      }
      
      if (data.session) {
        console.log('Successfully refreshed session via Supabase');
        syncTokenToLocalStorage();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error during token refresh:', error);
      return false;
    }
  };
  
  // Initialize on first load
  useEffect(() => {
    if (isInitialized) return;
    
    const initializeAuthSync = async () => {
      console.log('Initializing auth sync...');
      
      // Initial token sync if user/session exists
      if (session && user) {
        syncTokenToLocalStorage();
      }
      
      setIsInitialized(true);
    };
    
    initializeAuthSync();
  }, [isInitialized, session, user]);
  
  // Periodic session refresh
  useEffect(() => {
    if (!isInitialized) return;
    
    console.log('Setting up periodic session refresh');
    
    const intervalId = setInterval(() => {
      if (session) {
        refreshSessionToken();
      }
    }, REFRESH_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [isInitialized, session]);
  
  // Sync tokens whenever session changes
  useEffect(() => {
    if (!isInitialized || !session) return;
    
    syncTokenToLocalStorage();
  }, [isInitialized, session]);
  
  return {
    lastSynced: lastSynced.current,
    refreshSessionToken,
    syncTokenToLocalStorage,
  };
} 