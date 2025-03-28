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
        
        // Get session from our custom endpoint to ensure cookies are refreshed
        const sessionResponse = await fetch('/api/auth/session', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
          credentials: 'include',
        });
        
        if (!sessionResponse.ok) {
          console.warn('JetShareAuthWrapper: Session check failed, but continuing:', 
            sessionResponse.status, sessionResponse.statusText);
        } else {
          const sessionData = await sessionResponse.json();
          console.log('JetShareAuthWrapper: Session check result:', 
            sessionData.authenticated ? 'Authenticated' : 'Not authenticated');
        }
        
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