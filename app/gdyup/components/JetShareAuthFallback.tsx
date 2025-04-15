'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';

export default function JetShareAuthFallback() {
  const { user, refreshSession } = useAuth();
  
  useEffect(() => {
    // If no user, try a single session refresh
    if (!user && refreshSession) {
      console.log('JetShareAuthFallback: No user found, attempting to refresh session...');
      refreshSession().then(success => {
        if (success) {
          console.log('JetShareAuthFallback: Session refreshed successfully');
        }
      }).catch(error => {
        console.warn('JetShareAuthFallback: Error refreshing session:', error);
      });
    }
  }, [user, refreshSession]);
  
  // This component doesn't render anything
  return null;
} 