'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-provider';

/**
 * DEPRECATED: This hook is provided for backward compatibility only.
 * Use useAuth() instead to access authentication state and functions.
 * 
 * This hook now simply forwards to the useAuth hook from our consolidated auth provider.
 */
export function useAuthSync() {
  // Log a deprecation warning in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'useAuthSync is deprecated and will be removed in a future release. ' +
        'Use useAuth() from @/lib/auth-provider directly instead.'
      );
    }
  }, []);
  
  // Safely get user and loading state - handle any potential errors
  try {
    const { user, loading } = useAuth();
    
    return {
      user,
      loading
    };
  } catch (error) {
    console.error('Error in useAuthSync:', error);
    
    // Return a safe fallback if useAuth fails
    return {
      user: null,
      loading: false
    };
  }
} 