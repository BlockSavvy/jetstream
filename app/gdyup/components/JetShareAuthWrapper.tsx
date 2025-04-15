'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';

// This wrapper ensures auth state is properly refreshed on the client
export const JetShareAuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // First check session to ensure cookies are properly set
        console.log('JetShareAuthWrapper: Checking auth session...');
        
        // Check session on client side
        const checkSession = async () => {
          try {
            // Add timestamp to prevent caching
            const timestamp = new Date().getTime();
            const requestId = Math.random().toString(36).substring(2, 10);
            
            const sessionResponse = await fetch('/api/auth/session', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
              },
              // Don't include credentials as it can cause CORS issues
              // Supabase handles auth via cookies automatically
            });
            
            if (!sessionResponse.ok) {
              console.warn('JetShareAuthWrapper: Session check failed, but continuing:', 
                sessionResponse.status, sessionResponse.statusText);
            } else {
              const sessionData = await sessionResponse.json();
              console.log('JetShareAuthWrapper: Session check result:', 
                sessionData.authenticated ? 'Authenticated' : 'Not authenticated');
            }
          } catch (error) {
            console.error('JetShareAuthWrapper: Error checking session:', error);
          }
        };
        
        await checkSession();
        
        // Now check auth state directly with Supabase
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.warn('JetShareAuthWrapper: Auth error:', error);
        } else if (data?.user) {
          console.log('JetShareAuthWrapper: User authenticated:', data.user.id);
        } else {
          console.log('JetShareAuthWrapper: No user found, not authenticated');
        }
      } catch (error) {
        console.error('JetShareAuthWrapper: Error checking auth:', error);
      } finally {
        setIsAuthChecked(true);
      }
    };
    
    checkAuthStatus();
  }, [supabase]);
  
  // Simply render children - this component just ensures auth is checked
  return <>{children}</>;
}; 