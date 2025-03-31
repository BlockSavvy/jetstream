import { useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { createClient } from '@/lib/supabase';

/**
 * Custom hook to enhance authentication persistence across the app
 * This helps solve issues where the user gets logged out unexpectedly
 */
export function useAuthPersistence() {
  const { user, refreshSession } = useAuth();
  
  useEffect(() => {
    // Setup instance ID if not present for tracking client sessions
    if (typeof window !== 'undefined' && !localStorage.getItem('jetstream_instance_id')) {
      // Generate a UUID for instance tracking
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      localStorage.setItem('jetstream_instance_id', uuid);
      console.log('Created new instance ID for session tracking:', uuid);
    }
    
    // Set up authentication refresh interval
    const handleAuthRefresh = async () => {
      // Don't attempt refresh if user is already authenticated
      if (user) {
        // Store user ID in localStorage for redundancy
        try {
          localStorage.setItem('jetstream_user_id', user.id);
          localStorage.setItem('jetstream_user_email', user.email || '');
          localStorage.setItem('jetstream_last_active', new Date().toISOString());
        } catch (err) {
          console.warn('Error storing user data in localStorage:', err);
        }
        return;
      }
      
      console.log('Running periodic auth refresh check...');
      
      try {
        // Check if we have tokens in localStorage
        const tokenData = localStorage.getItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
        if (!tokenData) return;
        
        // Parse token data
        const parsedToken = JSON.parse(tokenData);
        if (!parsedToken?.access_token) return;
        
        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (parsedToken.expires_at && parsedToken.expires_at > now + 600) {
          // Token still valid for more than 10 minutes, no need to refresh
          return;
        }
        
        // Attempt to refresh the session
        console.log('Attempting to refresh auth session');
        await refreshSession();
      } catch (err) {
        console.warn('Error during auth refresh:', err);
      }
    };
    
    // Run initial check
    handleAuthRefresh();
    
    // Set up refresh interval (every 5 minutes)
    const intervalId = setInterval(handleAuthRefresh, 5 * 60 * 1000);
    
    // Set up activity tracking to refresh token more aggressively when user is active
    const trackActivity = () => {
      localStorage.setItem('jetstream_last_active', new Date().toISOString());
      
      // If it's been more than 15 minutes since our last refresh attempt, try again
      const lastRefresh = localStorage.getItem('jetstream_last_refresh_attempt');
      if (lastRefresh) {
        const lastRefreshTime = new Date(lastRefresh).getTime();
        const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
        
        if (lastRefreshTime < fifteenMinutesAgo) {
          handleAuthRefresh();
          localStorage.setItem('jetstream_last_refresh_attempt', new Date().toISOString());
        }
      } else {
        // No record of last refresh, so try now
        handleAuthRefresh();
        localStorage.setItem('jetstream_last_refresh_attempt', new Date().toISOString());
      }
    };
    
    // Track user activity events
    window.addEventListener('mousemove', trackActivity);
    window.addEventListener('keydown', trackActivity);
    window.addEventListener('click', trackActivity);
    
    // Set up a window focus event listener
    const handleWindowFocus = () => {
      console.log('Window focused, checking auth...');
      handleAuthRefresh();
    };
    
    window.addEventListener('focus', handleWindowFocus);
    
    // Clean up listeners on unmount
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('mousemove', trackActivity);
      window.removeEventListener('keydown', trackActivity);
      window.removeEventListener('click', trackActivity);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [user, refreshSession]);
  
  return null;
} 