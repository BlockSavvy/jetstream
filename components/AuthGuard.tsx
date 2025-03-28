'use client';

import { useEffect, ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { createClient } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [checkAttempts, setCheckAttempts] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    // Maximum number of session check attempts
    const MAX_CHECK_ATTEMPTS = 3;
    
    const checkSession = async () => {
      // If we've already checked successfully, don't check again
      if (sessionChecked) return;
      
      // Skip if we already have a user from the auth provider
      if (user) {
        console.log('AuthGuard: User already present from auth provider');
        setLoading(false);
        setSessionChecked(true);
        return;
      }

      // If we've reached max attempts, stop trying
      if (checkAttempts >= MAX_CHECK_ATTEMPTS) {
        console.log(`AuthGuard: Reached max check attempts (${MAX_CHECK_ATTEMPTS})`);
        setLoading(false);
        
        // If we're on a protected route and still don't have auth after max attempts, redirect
        if (pathname?.startsWith('/jetshare') && !pathname?.startsWith('/jetshare/listings') && pathname !== '/jetshare') {
          console.log('AuthGuard: No session after max attempts, redirecting to login');
          const returnUrl = encodeURIComponent(window.location.href);
          router.push(`/auth/login?returnUrl=${returnUrl}`);
        }
        return;
      }

      // Only check if the auth provider has finished loading
      if (!authLoading) {
        try {
          // Double-check session directly with Supabase
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session && pathname?.startsWith('/jetshare') && !pathname?.startsWith('/jetshare/listings') && pathname !== '/jetshare') {
            console.log('AuthGuard: No session found, redirecting to login');
            // No session, redirect to login with return URL
            const returnUrl = encodeURIComponent(window.location.href);
            router.push(`/auth/login?returnUrl=${returnUrl}`);
            return;
          }
          
          // We have a session or we're not on a protected route
          setSessionChecked(true);
          setLoading(false);
        } catch (error) {
          console.error('Auth guard session check error:', error);
          
          // Increment check attempts and try again after a delay
          setCheckAttempts(prev => prev + 1);
          setTimeout(() => {
            setSessionChecked(false); // Reset session checked to force another check
          }, 1000); // 1 second delay before retrying
          
          setLoading(false);
        }
      } else {
        // Still loading from auth provider
        setLoading(authLoading);
      }
    };

    checkSession();
  }, [authLoading, user, router, pathname, sessionChecked, checkAttempts, supabase.auth]);

  // Show loading indicator while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not loading and either user exists or session checked passed, render children
  return <>{children}</>;
} 