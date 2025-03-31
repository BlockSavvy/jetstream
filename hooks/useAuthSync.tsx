'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/auth-provider';
import { createClient } from '@/lib/supabase';

/**
 * Hook to synchronize authentication session and user profile with the server
 * This ensures persistence of auth across pages and proper creation of profiles
 */
export function useAuthSync() {
  const { user, session } = useAuth();
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const refreshAttempts = useRef(0);
  const MAX_REFRESH_ATTEMPTS = 2;
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if we're in the initialization phase to prevent unnecessary refreshes
  const isInitializingRef = useRef(true);
  
  useEffect(() => {
    // Wait a short time after component mounts to consider initialization complete
    const timer = setTimeout(() => {
      isInitializingRef.current = false;
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Refresh the session token
  const refreshSessionToken = async () => {
    // Skip refresh during initialization phase
    if (isInitializingRef.current) {
      return false;
    }
    
    // Limit refresh attempts to prevent infinite loops
    if (refreshAttempts.current >= MAX_REFRESH_ATTEMPTS) {
      console.log('Max refresh attempts reached, skipping');
      return false;
    }
    
    refreshAttempts.current += 1;
    
    try {
      console.log('Refreshing session token...');
      const supabase = createClient();
      
      // Attempt to refresh the token
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.warn('Failed to refresh session token:', error);
        return false;
      }
      
      if (data?.session) {
        console.log('Session token refreshed successfully');
        setLastSynced(new Date());
        return true;
      }
    } catch (err) {
      console.error('Error refreshing session token:', err);
    }
    
    return false;
  };

  // Reset refresh attempts when user changes
  useEffect(() => {
    refreshAttempts.current = 0;
  }, [user?.id]);
  
  // Set up a timer to periodically refresh the token when user is authenticated
  useEffect(() => {
    // Clear any existing timers
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    
    // Only set up timer if we have a valid session and user
    if (session && user && !isInitializingRef.current) {
      // If the session has an expiry, calculate refresh time based on that
      if (session.expires_at) {
        const expiryTime = new Date(session.expires_at * 1000);
        const now = new Date();
        const timeUntilExpiry = expiryTime.getTime() - now.getTime();
        const THIRTY_MINUTES = 30 * 60 * 1000;
        
        // If expiring in less than 30 minutes, refresh now
        if (timeUntilExpiry < THIRTY_MINUTES) {
          refreshSessionToken();
        }
        
        // Set up a regular refresh timer for every 30 minutes
        refreshTimerRef.current = setInterval(() => {
          refreshSessionToken();
        }, THIRTY_MINUTES);
      }
    }
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [session, user]);

  // Return the hook's API
  return {
    lastSynced,
    refreshSessionToken
  };
} 