'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

// Global refresh lock to prevent multiple simultaneous refreshes
let refreshInProgress = false;
let lastRefreshTime = 0;
const REFRESH_COOLDOWN = 2000; // 2 seconds cooldown between refresh attempts

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null; session: Session | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null; session: Session | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  sessionError: AuthSessionError | null;
}

// Extend AuthError with additional properties for our specific error states
interface AuthSessionError {
  message: string;
  refresh_failed?: boolean;
  expires_soon?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<AuthSessionError | null>(null);
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

  // Session refresh function
  const refreshSession = async (): Promise<boolean> => {
    try {
      // Check if refresh is already in progress or was done very recently
      const now = Date.now();
      if (refreshInProgress) {
        console.log('Auth refresh already in progress, skipping duplicate request');
        return true; // Assume previous refresh will succeed
      }
      
      if (now - lastRefreshTime < REFRESH_COOLDOWN) {
        console.log(`Auth refresh attempted too soon (${now - lastRefreshTime}ms < ${REFRESH_COOLDOWN}ms), skipping`);
        return true; // Skip too-frequent refreshes
      }
      
      console.log('Attempting to refresh session...');
      refreshInProgress = true;
      
      // First try to get the current session to diagnose what's going on
      try {
        const { data: currentSession } = await supabase.auth.getSession();
        console.log('Current session before refresh:', 
          currentSession?.session ? 
          `Session exists (user: ${currentSession.session.user.id}, expires: ${new Date(currentSession.session.expires_at! * 1000).toISOString()})` : 
          'No active session'
        );
        
        // Check if we have tokens in localStorage as a fallback
        let localStorageToken = null;
        try {
          const tokenData = localStorage.getItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
          if (tokenData) {
            const parsed = JSON.parse(tokenData);
            localStorageToken = {
              expires_at: parsed?.expires_at,
              has_access: !!parsed?.access_token,
              has_refresh: !!parsed?.refresh_token
            };
            console.log('localStorage token info:', localStorageToken);
          } else {
            console.log('No token found in localStorage');
          }
        } catch (e) {
          console.warn('Error checking localStorage tokens:', e);
        }
      } catch (e) {
        console.warn('Error getting current session during refresh:', e);
      }
      
      // Now attempt the actual refresh
      const { error } = await supabase.auth.refreshSession();
      
      // Update refresh state
      lastRefreshTime = Date.now();
      refreshInProgress = false;
      
      if (error) {
        console.error('Refresh token is invalid (400 Bad Request). Clearing session state.');
        
        // Try an alternative approach - fully sign out and restore from localStorage if possible
        if (error.status === 400) {
          console.log('Attempting recovery after failed refresh...');
          
          // Fully sign out to clear any corrupted state
          await supabase.auth.signOut({ scope: 'local' });
          
          // Try to recover auth state if possible
          try {
            const tokenData = localStorage.getItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
            if (tokenData) {
              const parsed = JSON.parse(tokenData);
              
              // If we have an access token that might still be valid, try to re-establish session
              if (parsed?.access_token && parsed?.expires_at) {
                const expiry = new Date(parsed.expires_at * 1000);
                const now = new Date();
                
                if (expiry > now) {
                  console.log('Access token may still be valid, attempting to reuse it...');
                  // We'll set session state for UX continuity, but the user will need to re-login soon
                  setUser(parsed.user || null);
                  setSessionError({
                    message: 'Your session needs renewal, please sign in again soon.',
                    expires_soon: true
                  });
                  
                  return false; // Refresh failed but we're handling it gracefully
                }
              }
            }
          } catch (e) {
            console.warn('Recovery attempt failed:', e);
          }
          
          // If we got here, full recovery wasn't possible
          setSessionError({
            message: 'Your session has expired. Please sign in again.',
            refresh_failed: true
          });
          
          setTimeout(() => {
            window.location.href = `/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}&tokenExpired=true`;
          }, 2000);
          
          return false;
        }
        
        // For other errors, just set the session error
        setSessionError({ message: error.message });
        return false;
      }
      
      console.log('Session refreshed successfully');
      
      // Get the updated session and update our user state
      const { data } = await supabase.auth.getSession();
      
      if (data?.session) {
        setUser(data.session.user);
        setSessionError(null);
        return true;
      } else {
        console.warn('No session after successful refresh?');
        return false;
      }
    } catch (e) {
      console.error('Error in refreshSession:', e);
      setSessionError({ message: 'An unexpected error occurred refreshing your session.' });
      return false;
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setSessionError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setSessionError({ message: error.message });
        return { error, session: null };
      }

      setUser(data.user);
      setSession(data.session);
      return { error: null, session: data.session };
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      setSessionError({ message: 'An unexpected error occurred during sign in.' });
      return { error: error as AuthError, session: null };
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string) => {
    try {
      setSessionError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setSessionError({ message: error.message });
        return { error, session: null };
      }

      if (data.session) {
        setUser(data.user);
        setSession(data.session);
      }

      return { error: null, session: data.session };
    } catch (error) {
      console.error('Unexpected error during sign up:', error);
      setSessionError({ message: 'An unexpected error occurred during sign up.' });
      return { error: error as AuthError, session: null };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setSessionError(null);
    } catch (error) {
      console.error('Error signing out:', error);
      setSessionError({ message: 'Error signing out.' });
    }
  };

  // Function to handle session restoration
  const handleSessionRestoration = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      setUser(session.user);
      setLoading(false);
      toast({
        title: "Session restored",
        description: "Your session has been restored successfully.",
      });
    } else {
      setLoading(false);
      
      // Check if we're on a protected page before redirecting
      // This prevents unnecessary redirects on public pages
      const currentPath = window.location.pathname;
      const protectedRoutes = [
        '/dashboard',
        '/jetshare/offer',
        '/jetshare/offers',
        '/account',
        '/admin'
      ];
      
      // Only redirect if on a protected route
      const isProtectedRoute = protectedRoutes.some(route => 
        currentPath.startsWith(route)
      );
      
      if (isProtectedRoute) {
        toast({
          title: "Authentication required",
          description: "Please sign in to access this page.",
          variant: "destructive",
        });
        
        // Redirect to login with returnUrl
        router.push(`/auth/login?returnUrl=${encodeURIComponent(currentPath)}`);
      }
    }
  };

  // Update the useEffect that tracks auth state:
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }
        
        if (session) {
          setUser(session.user);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Unexpected error getting session:', error);
        setLoading(false);
      }
    };
    
    // Call the function
    getInitialSession();
    
    // Set up the auth state change listener 
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          // User signed in
          setUser(session.user);
          localStorage.setItem('supabase.auth.token', JSON.stringify(session));
        } else {
          // User signed out
          setUser(null);
          localStorage.removeItem('supabase.auth.token');
        }
        setLoading(false);
      }
    );
    
    // Set up a visibility change listener to handle tab/window focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When tab becomes visible again, check session
        handleSessionRestoration();
      }
    };
    
    // Add event listener for page visibility
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Add event listener for page loads (after refresh)
    window.addEventListener('load', handleSessionRestoration);
    
    // Cleanup
    return () => {
      subscription?.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('load', handleSessionRestoration);
    };
  }, []);

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshSession,
    sessionError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 