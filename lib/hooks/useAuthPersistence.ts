'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';

/**
 * Hook to maintain authentication persistence across page changes
 * Performs session refresh at appropriate times
 */
export function useAuthPersistence() {
  const { user, session, refreshSession } = useAuth();
  const pathname = usePathname();
  const lastRefreshPath = useRef<string | null>(null);
  const refreshTimeouts = useRef<NodeJS.Timeout[]>([]);
  
  // Clear all stored timeouts when unmounting
  useEffect(() => {
    return () => {
      refreshTimeouts.current.forEach(clearTimeout);
      refreshTimeouts.current = [];
    };
  }, []);
  
  // On path change, check if we need to refresh the session
  useEffect(() => {
    // Skip if we don't have a session or we're already on this path
    if (!session || pathname === lastRefreshPath.current) return;
    
    // Only refresh on significant navigation (not just query param changes)
    const shouldRefresh = !lastRefreshPath.current || 
                          (pathname && !pathname.startsWith(lastRefreshPath.current));
    
    if (shouldRefresh) {
      console.log('Path changed, scheduling session refresh');
      
      // Store current path
      lastRefreshPath.current = pathname;
      
      // Perform a refresh after a short delay
      const timeoutId = setTimeout(() => {
        console.log('Refreshing session after path change');
        refreshSession();
      }, 1000);
      
      refreshTimeouts.current.push(timeoutId);
    }
  }, [pathname, session, refreshSession]);
  
  // Check for localStorage token consistency
  useEffect(() => {
    if (!user) return;
    
    try {
      // Ensure localStorage has consistent user ID
      const storedUserId = localStorage.getItem('jetstream_user_id');
      const storedEmail = localStorage.getItem('jetstream_user_email');
      
      if (!storedUserId || storedUserId !== user.id) {
        console.log('Syncing user ID to localStorage');
        localStorage.setItem('jetstream_user_id', user.id);
      }
      
      if (!storedEmail || storedEmail !== user.email) {
        console.log('Syncing user email to localStorage');
        localStorage.setItem('jetstream_user_email', user.email || '');
      }
      
      localStorage.setItem('jetstream_session_time', Date.now().toString());
    } catch (e) {
      console.warn('Error accessing localStorage in persistence hook:', e);
    }
  }, [user]);
  
  // Return null for consistency with other hooks
  return null;
} 