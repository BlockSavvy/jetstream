'use client';

import { ReactNode, useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import JetShareHeader from './components/JetShareHeader';
import { useAuth } from '@/components/auth-provider';
import { useAuthSync } from '@/hooks/useAuthSync';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';

// Routes that should have AuthGuard applied
// Also protect /jetshare/payment/* routes
const PROTECTED_ROUTES = [
  '/jetshare/dashboard',
  '/jetshare/listings/manage',
  '/jetshare/offer/edit',
  '/jetshare/offer/new'
];

export default function JetShareLayout({ children }: { children: ReactNode }) {
  const { user, session, loading: authLoading, refreshSession } = useAuth();
  const { refreshSessionToken } = useAuthSync();
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const redirectAttempted = useRef(false);
  const tokenRefreshed = useRef(false);
  const authCheckCompleted = useRef(false);
  const [isMobile, setIsMobile] = useState(false);
  const lastAuthCheck = useRef<number>(0);
  const AUTH_CHECK_COOLDOWN = 60000; // 1 minute between auth checks
  const authNotificationDisplayed = useRef<boolean>(false);
  
  // Determine if current path needs authentication
  const isPaymentPath = pathname ? pathname.startsWith('/jetshare/payment/') : false;
  const isDashboardPath = pathname ? pathname.startsWith('/jetshare/dashboard') : false;
  const isOfferPath = pathname ? (
    pathname.startsWith('/jetshare/offer/') && 
    (pathname.includes('/new') || pathname.includes('/edit'))
  ) : false;
  
  // NEVER require auth for payment paths - they'll handle their own auth
  const needsAuth = pathname ? (
    PROTECTED_ROUTES.some(route => pathname.startsWith(route)) && 
    !isPaymentPath
  ) : false;
  
  // Local function to sync tokens to localStorage
  const syncTokenToLocalStorage = () => {
    if (!user || !session) return;
    
    try {
      console.log('Layout: Storing auth data in localStorage');
      
      // Store tokens in localStorage if available
      if (session.access_token && session.refresh_token) {
        const storageData = {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user: {
            id: user.id,
            email: user.email,
          }
        };
        
        localStorage.setItem('sb-vjhrmizwqhmafkxbmfwa-auth-token', JSON.stringify(storageData));
        localStorage.setItem('jetstream_user_id', user.id);
        localStorage.setItem('jetstream_user_email', user.email || '');
        localStorage.setItem('auth_last_authenticated', 'true');
        localStorage.setItem('jetstream_session_time', Date.now().toString());
        
        console.log('Auth tokens synchronized to localStorage');
      }
    } catch (error) {
      console.warn('Error syncing tokens to localStorage:', error);
    }
  };
  
  // Diagnostic logging for auth state
  useEffect(() => {
    console.log('JetShare Layout Auth State:', { 
      pathname, 
      isAuthenticated: !!user, 
      authLoading, 
      isProtectedRoute: needsAuth,
      isPaymentPath,
      isDashboardPath,
      isOfferPath
    });
  }, [pathname, user, authLoading, needsAuth, isPaymentPath, isDashboardPath, isOfferPath]);

  // Enhanced authentication check that runs once on initial load
  useEffect(() => {
    const checkAndRefreshAuth = async () => {
      // Skip if already completed or still loading
      if (authCheckCompleted.current || authLoading) {
        return;
      }

      console.log('JetShare: Running enhanced auth check');
      
      // Try to get user ID from localStorage if available
      let localUserId = null;
      let localTokenData = null;
      try {
        // Attempt to get user_id from localStorage
        const storedUserId = localStorage.getItem('jetstream_user_id');
        const tokenData = localStorage.getItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
        
        if (storedUserId) {
          localUserId = storedUserId;
          console.log('JetShare: Found user_id in localStorage:', localUserId);
        } 
        
        if (tokenData) {
          localTokenData = tokenData;
          console.log('JetShare: Found token data in localStorage');
          
          // Try to extract user ID from token data if not already set
          if (!localUserId) {
            try {
              const parsed = JSON.parse(tokenData);
              if (parsed && parsed.user && parsed.user.id) {
                localUserId = parsed.user.id;
                // Store for future use
                localStorage.setItem('jetstream_user_id', localUserId);
                console.log('JetShare: Extracted user_id from token data:', localUserId);
              } else if (parsed && parsed.access_token) {
                // We have an access token, but no user info, try to decode JWT
                try {
                  // Attempt to restore session with this token
                  const supabase = createClient();
                  const { data, error } = await supabase.auth.setSession({
                    access_token: parsed.access_token,
                    refresh_token: parsed.refresh_token || ''
                  });
                  
                  if (!error && data.session?.user?.id) {
                    localUserId = data.session.user.id;
                    localStorage.setItem('jetstream_user_id', localUserId);
                    console.log('JetShare: Retrieved user_id from token:', localUserId);
                  }
                } catch (tokenError) {
                  console.warn('JetShare: Error decoding token:', tokenError);
                }
              }
            } catch (parseErr) {
              console.warn('JetShare: Error parsing token data:', parseErr);
            }
          }
        }
      } catch (storageErr) {
        console.warn('JetShare: Error accessing localStorage:', storageErr);
      }

      // If we have a local user ID but no user object, or we're on a protected route
      if ((localUserId || localTokenData) && (!user || needsAuth)) {
        console.log('JetShare: Have local auth data but no user object, or on protected route. Refreshing session...');
        
        // Special handling for payment/dashboard paths - show toast and attempt refresh
        if (isPaymentPath || isDashboardPath || isOfferPath) {
          // Provide user feedback while we attempt to restore the session
          toast.loading('Restoring your session...', { id: 'auth-refresh' });
        }
        
        try {
          // First try regular refresh through auth provider
          const refreshResult = await refreshSession();
          
          if (refreshResult) {
            console.log('JetShare: Session refreshed successfully via AuthProvider');
            toast.success('Session restored', { id: 'auth-refresh' });
            
            // Ensure tokens are properly stored
            syncTokenToLocalStorage();
          } else if (localTokenData) {
            // If standard refresh failed but we have token data, try direct approach
            console.log('JetShare: Standard refresh failed, trying with stored token...');
            
            try {
              // Parse token data and attempt to set session directly
              const parsed = JSON.parse(localTokenData);
              if (parsed && parsed.access_token && parsed.refresh_token) {
                const supabase = createClient();
                const { data, error } = await supabase.auth.setSession({
                  access_token: parsed.access_token,
                  refresh_token: parsed.refresh_token
                });
                
                if (!error && data.session) {
                  console.log('JetShare: Session restored successfully via stored token');
                  toast.success('Session restored', { id: 'auth-refresh' });
                  
                  // Wait for auth state to update
                  await new Promise(resolve => setTimeout(resolve, 800));
                } else {
                  console.warn('JetShare: Error restoring session with stored token:', error);
                }
              }
            } catch (tokenError) {
              console.warn('JetShare: Error using stored token:', tokenError);
            }
          }
          
          // Modify the final redirect check
          // Only redirect if it's a protected route *other than payment*,
          // and auth has truly failed (not just loading or recoverable error)
          const isNonPaymentProtectedRoute = needsAuth && !isPaymentPath;

          // Add a delay to ensure we don't redirect too early during page transition
          // Only redirect if still not authenticated after a short grace period
          if (isNonPaymentProtectedRoute && !user && !authLoading && !redirectAttempted.current) {
            console.log('JetShare: Auth failed for protected route, considering redirect...');
            
            // Add a short delay before deciding to redirect to account for auth state catching up
            setTimeout(async () => {
              // Check again after delay - user might be authenticated by now
              const supabase = createClient();
              const { data } = await supabase.auth.getSession();
              if (!data.session) {
                console.log('JetShare: Still no auth after delay, redirecting to login');
                redirectAttempted.current = true;
                
                // Store current path for redirect back after login
                try {
                  sessionStorage.setItem('auth_redirect_url', pathname || '/jetshare');
                } catch (e) {
                  console.warn('JetShare: Could not set redirect URL:', e);
                }
                
                toast.error('Please sign in to continue', { id: 'auth-refresh' });
                router.push(`/auth/login?returnUrl=${encodeURIComponent(pathname || '/jetshare')}&t=${Date.now()}`);
              } else {
                console.log('JetShare: Auth restored after delay, no redirect needed');
                toast.success('Session restored', { id: 'auth-refresh' });
              }
            }, 1500); // 1.5 second delay
          }
        } catch (refreshError) {
          console.error('JetShare: Error during auth refresh:', refreshError);
          toast.error('Authentication error', { id: 'auth-refresh' });
        }
      }
      
      // Mark auth check as completed
      authCheckCompleted.current = true;
    };
    
    checkAndRefreshAuth();
  }, [user, authLoading, needsAuth, pathname, refreshSession, router, isPaymentPath, isDashboardPath, isOfferPath]);
  
  // Add mobile detection in a new useEffect
  useEffect(() => {
    // Detect if the user is on a mobile device
    const checkMobile = () => {
      const isMobileDevice = typeof window !== 'undefined' && 
        (window.innerWidth <= 768 || 
         /Android/i.test(navigator.userAgent) ||
         /iPhone|iPad|iPod/i.test(navigator.userAgent));
      
      setIsMobile(!!isMobileDevice);
      
      // Store preference to reduce unnecessary computations
      try {
        localStorage.setItem('jetstream_is_mobile', isMobileDevice ? 'true' : 'false');
      } catch (e) {
        console.warn('Could not store mobile preference:', e);
      }
    };
    
    // Run on mount
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Replace the payment page token refresh to reduce refresh calls
  useEffect(() => {
    if (isPaymentPath && user) {
      const now = Date.now();
      
      // Only refresh if we haven't checked recently
      if (now - lastAuthCheck.current > AUTH_CHECK_COOLDOWN && !tokenRefreshed.current) {
        console.log('Payment page detected, checking auth token freshness');
        
        // Just use the existing AuthProvider refresh mechanism
        refreshSession().then(success => {
          if (success) {
            console.log('Auth token refreshed for payment page');
            tokenRefreshed.current = true;
            lastAuthCheck.current = now;
          } else {
            console.warn('Auth token refresh failed, payment may encounter issues');
          }
        });
        
        // Store user ID in localStorage for redundancy in case auth completely fails
        try {
          console.log('Storing user ID in localStorage for payment backup');
          localStorage.setItem('jetstream_user_id', user.id || '');
        } catch (e) {
          console.warn('Error storing user ID in localStorage:', e);
        }
      } else {
        console.log('Skipping auth refresh due to cooldown or already refreshed');
      }
    }
  }, [isPaymentPath, user, refreshSession]);
  
  // Use AuthSync hook to ensure auth state is maintained
  useAuthSync();
  
  useEffect(() => {
    // NEVER redirect payment paths - they'll handle auth internally
    if (isPaymentPath) {
      console.log('JetShare: Payment path detected, bypassing auth redirect check');
      return;
    }
    
    // Only redirect if authentication is required for this route
    if (!authLoading && needsAuth && !user && !redirectAttempted.current) {
      console.log(`JetShare: Protected route ${pathname} requires login`);
      // Allow redirection only once per page load
      redirectAttempted.current = true;
      // Redirect to login with return URL
      router.push(`/auth/login?returnUrl=${encodeURIComponent(pathname || '/jetshare')}&t=${Date.now()}`);
      return;
    }
    
    // Reset loading state when auth check is complete
    if (!authLoading && loading) {
      setLoading(false);
    }
  }, [user, authLoading, needsAuth, router, loading, pathname, isPaymentPath]);
  
  return (
    <main className={`min-h-screen bg-background dark ${isMobile ? 'jetstream-mobile' : ''}`}>
      <JetShareHeader />
      <div className={`jetshare-content-container ${isMobile ? 'px-2 py-2' : 'px-4 py-4'}`}>
        {(!needsAuth || user || loading) ? children : null}
      </div>
    </main>
  );
} 