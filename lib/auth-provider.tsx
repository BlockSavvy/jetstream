'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { createDevSession, isDevAuthMode } from '@/lib/dev-auth';

// Enhanced auth error interface with our custom properties
interface AuthSessionError extends AuthError {
  refresh_failed?: boolean;
  expires_soon?: boolean;
}

// The shape of our auth context
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null; session: Session | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  refreshSession: () => Promise<boolean>;
  sessionError: AuthSessionError | null;
}

// Create context with undefined initial value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Global refresh state to prevent concurrent refreshes
let refreshInProgress = false;
let lastRefreshTime = 0;
const REFRESH_COOLDOWN = 5000; // 5 second cooldown between refreshes
const DEV_USER_ID = process.env.NEXT_PUBLIC_AUTH_DEV_USER_ID || '';
const DEV_USER_EMAIL = process.env.NEXT_PUBLIC_AUTH_DEV_USER_EMAIL || '';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<AuthSessionError | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isDevMode = isDevAuthMode();
  const isInitializing = useRef(true);
  const profileSyncAttempted = useRef(false);
  
  // Singleton supabase client
  const supabase = getSupabaseClient();
  
  /**
   * Session refresh with cooldown and race condition prevention
   */
  const refreshSession = async (): Promise<boolean> => {
    // In dev mode, use our development session
    if (isDevMode) {
      console.log('DEV MODE: Using development session instead of refreshing');
      const { user: devUser, session: devSession } = await createDevSession();
      
      if (devUser && devSession) {
        setUser(devUser);
        setSession(devSession);
        return true;
      }
      return false;
    }
    
    // Regular session refresh logic (unchanged)
    // Skip if refresh is already in progress
    if (refreshInProgress) {
      console.log('Auth refresh already in progress, skipping duplicate request');
      return true;
    }
    
    // Avoid too-frequent refreshes
    const now = Date.now();
    if (now - lastRefreshTime < REFRESH_COOLDOWN) {
      console.log('Auth refresh attempted too soon, using existing session state');
      return !!session;
    }
    
    try {
      console.log('Attempting to refresh auth session...');
      refreshInProgress = true;
      lastRefreshTime = now;
      
      // Real refresh through Supabase
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.warn('Session refresh failed:', error.message);
        // Create a properly typed error object
        const enhancedError = error as AuthSessionError;
        enhancedError.refresh_failed = true;
        setSessionError(enhancedError);
        refreshInProgress = false;
        return false;
      }
      
      if (data?.session) {
        console.log('Session refreshed successfully');
        setUser(data.session.user);
        setSession(data.session);
        setSessionError(null);
        
        // Also update some helper values in localStorage for redundancy
        try {
          localStorage.setItem('jetstream_user_id', data.session.user.id);
          localStorage.setItem('jetstream_user_email', data.session.user.email || '');
          localStorage.setItem('jetstream_session_time', Date.now().toString());
        } catch (e) {
          console.warn('Error updating localStorage on refresh:', e);
        }
        
        refreshInProgress = false;
        return true;
      }
      
      console.warn('No session after successful refresh');
      refreshInProgress = false;
      return false;
    } catch (e) {
      console.error('Unexpected error during session refresh:', e);
      refreshInProgress = false;
      
      // Use a simpler approach - just create a plain error object
      // and cast it without attempting to set protected properties
      const errorMessage = 'An unexpected error occurred during session refresh';
      const customError = {
        message: errorMessage,
        refresh_failed: true,
        name: 'AuthRefreshError',
      } as unknown as AuthSessionError;
      
      setSessionError(customError);
      return false;
    }
  };
  
  /**
   * Profile sync function to ensure user profile exists
   */
  const syncProfile = async (userId: string) => {
    if (profileSyncAttempted.current) return;
    
    try {
      console.log('Syncing user profile...');
      profileSyncAttempted.current = true;
      
      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileError) {
        console.error('Error checking profile:', profileError);
        return;
      }
      
      // Create profile if it doesn't exist
      if (!profile) {
        const userEmail = user?.email || '';
        console.log('Creating user profile for:', userEmail);
        
        // Extract name from email if available
        let firstName = 'User';  // Default value
        let lastName = '';
        
        if (userEmail) {
          const emailName = userEmail.split('@')[0];
          // Try to split on common separators
          const nameParts = emailName.split(/[._-]/);
          if (nameParts.length > 1) {
            firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
            lastName = nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1);
          } else {
            // Just use the email name as first name
            firstName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
          }
        }
        
        // Ensure first_name is never null
        if (!firstName || firstName.trim() === '') {
          firstName = 'User';
        }
        
        // Ensure last_name is never null
        if (!lastName || lastName.trim() === '') {
          lastName = userEmail ? userEmail.split('@')[0] : 'Profile';
        }
        
        const fullName = `${firstName} ${lastName}`.trim();
        console.log(`Creating profile with name: ${firstName} ${lastName}, email: ${userEmail}`);
        
        const { error: createError } = await supabase
          .from('profiles')
          .insert([{ 
            id: userId, 
            email: userEmail,
            first_name: firstName,
            last_name: lastName,
            full_name: fullName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            // Required fields from schema
            user_type: 'traveler',
            verification_status: 'pending',
            // Onboarding fields
            onboarding_completed: false,
            onboarding_step: 'profile',
            profile_visibility: 'public',
            has_jet: false
          }]);
          
        if (createError) {
          console.error('Error creating profile:', createError);
        } else {
          console.log('Profile created successfully');
        }
      } else {
        console.log('User profile exists:', profile.email);
      }
    } catch (error) {
      console.error('Error in profile sync:', error);
    }
  };
  
  // Initialize auth on mount
  useEffect(() => {
    let mounted = true;
    
    const setupAuth = async () => {
      try {
        setLoading(true);
        
        // In dev mode, use our development session
        if (isDevMode) {
          console.log('DEV MODE: Setting up development session');
          const { user: devUser, session: devSession } = await createDevSession();
          
          if (devUser && devSession && mounted) {
            setUser(devUser);
            setSession(devSession);
            setLoading(false);
            isInitializing.current = false;
            return;
          }
        }
        
        // Normal auth setup for production mode
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          if (mounted) {
            setLoading(false);
            setSessionError(error as AuthSessionError);
          }
          return;
        }
        
        if (initialSession) {
          console.log('Initial session found for user:', initialSession.user?.email || 'Unknown email');
          if (mounted) {
            setUser(initialSession.user);
            setSession(initialSession);
            
            // Store redundant info in localStorage
            try {
              localStorage.setItem('jetstream_user_id', initialSession.user.id);
              localStorage.setItem('jetstream_user_email', initialSession.user?.email || '');
              localStorage.setItem('jetstream_session_time', Date.now().toString());
            } catch (e) {
              console.warn('Error updating localStorage with session data:', e);
            }
            
            // Sync user profile after a short delay
            if (!profileSyncAttempted.current && initialSession.user.id) {
              setTimeout(() => {
                syncProfile(initialSession.user.id);
              }, 500);
            }
          }
        } else {
          console.log('No initial session found');
        }
        
        if (mounted) {
          setLoading(false);
          isInitializing.current = false;
        }
      } catch (e) {
        console.error('Error in setupAuth:', e);
        if (mounted) {
          setLoading(false);
          isInitializing.current = false;
        }
      }
    };
    
    // Call the setup function
    setupAuth();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      
      console.log('Auth state changed:', event);
      
      if (newSession) {
        console.log('New session established for user:', newSession.user?.email || 'Unknown email');
        setUser(newSession.user);
        setSession(newSession);
        
        // Store redundant info in localStorage
        try {
          localStorage.setItem('jetstream_user_id', newSession.user.id);
          localStorage.setItem('jetstream_user_email', newSession.user?.email || '');
          localStorage.setItem('jetstream_session_time', Date.now().toString());
        } catch (e) {
          console.warn('Error updating localStorage with new session data:', e);
        }
        
        // Sync profile for newly signed in users
        if (event === 'SIGNED_IN' && !profileSyncAttempted.current) {
          syncProfile(newSession.user.id);
        }
      } else {
        // User signed out
        setUser(null);
        setSession(null);
        
        // Clear localStorage
        try {
          localStorage.removeItem('jetstream_user_id');
          localStorage.removeItem('jetstream_user_email');
          localStorage.removeItem('jetstream_session_time');
        } catch (e) {
          console.warn('Error clearing localStorage on signout:', e);
        }
        
        // If signed out on a protected route, redirect to login
        if (event === 'SIGNED_OUT') {
          const isProtectedRoute = pathname?.startsWith('/gdyup/') || 
                                  pathname?.startsWith('/jetshare/dashboard') ||
                                  pathname?.startsWith('/jets');
                                  
          if (isProtectedRoute) {
            console.log('User signed out while on protected route, redirecting to login');
            
            // Add returnUrl to get back to this page after login
            const returnUrl = encodeURIComponent(window.location.pathname);
            router.push(`/auth/login?returnUrl=${returnUrl}`);
          }
        }
      }
      
      setLoading(false);
    });
    
    // Session refresh timer
    let refreshTimerId: NodeJS.Timeout | null = null;
    
    // Set up a refresh timer, but skip in dev mode
    if (!isDevMode && session) {
      // Refresh session every 10 minutes to prevent expiry
      refreshTimerId = setInterval(() => {
        console.log('Auto refreshing auth session');
        refreshSession();
      }, 10 * 60 * 1000); // 10 minutes
    }
    
    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (refreshTimerId) clearInterval(refreshTimerId);
    };
  // Use only stable dependencies to prevent re-rendering loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router]);
  
  /**
   * Sign up with email and password
   */
  const signUp = async (email: string, password: string) => {
    try {
      setSessionError(null);
      
      // Get the app URL for redirect - ensure it's a full absolute URL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
        (typeof window !== 'undefined' ? window.location.origin : 'https://gdyup.xyz');
      
      // Make sure we have a full URL with correct protocol
      const appUrlObj = new URL(appUrl.startsWith('http') ? appUrl : `https://${appUrl}`);
      const callbackUrl = `${appUrlObj.toString().replace(/\/$/, '')}/auth/callback`;
      
      // Add app parameter for cross-domain recognition
      const callbackUrlWithParams = new URL(callbackUrl);
      callbackUrlWithParams.searchParams.set('app', 'gdyup');
      
      console.log(`📧 Email signup using redirect URL: ${callbackUrlWithParams.toString()}`);
      
      // Mobile detection
      const isMobile = typeof window !== 'undefined' && 
        (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth < 768);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: callbackUrlWithParams.toString(),
          data: {
            email, // Include email in user metadata
            app_mode: 'gdyup', // Include app mode in user metadata
            is_mobile: isMobile
          }
        },
      });
      
      if (error) {
        console.error('Sign up error:', error.message);
        setSessionError(error as AuthSessionError);
        toast.error(error.message || 'Failed to sign up');
        return { error };
      }
      
      toast.success('Verification email sent. Please check your inbox.');
      return { error: null };
    } catch (err) {
      console.error('Unexpected error during signup:', err);
      const error = err as AuthError;
      setSessionError(error as AuthSessionError);
      toast.error('An unexpected error occurred during signup');
      return { error };
    }
  };
  
  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string) => {
    try {
      setSessionError(null);
      console.log('Attempting to sign in user:', email);
      
      // In dev mode, use development session
      if (isDevMode) {
        console.log('DEV MODE: Using development session for sign in');
        const { user: devUser, session: devSession } = await createDevSession();
        
        if (devUser && devSession) {
          // Store session state
          setUser(devUser);
          setSession(devSession);
          
          // Reset profile sync state
          profileSyncAttempted.current = false;
          
          // Sync profile for dev user too
          setTimeout(() => {
            if (devUser.id) syncProfile(devUser.id);
          }, 500);
          
          return { error: null, session: devSession };
        }
        
        // If dev session failed, show error
        const devError = {
          message: 'Development session setup failed',
          name: 'DevModeError'
        } as unknown as AuthError;
        
        setSessionError(devError as AuthSessionError);
        toast.error('Development mode sign in failed');
        return { error: devError, session: null };
      }
      
      // Real sign in for production mode
      const { data, error } = await supabase.auth.signInWithPassword({
        email, 
        password
      });
      
      if (error) {
        console.error('Sign in error:', error.message);
        setSessionError(error as AuthSessionError);
        toast.error(error.message || 'Sign in failed');
        return { error, session: null };
      }
      
      console.log('Sign in successful');
      
      // Store session state
      setUser(data.user);
      setSession(data.session);
      
      // Reset profile sync state for new sign-in
      profileSyncAttempted.current = false;
      
      // Sync profile
      if (data.user) {
        setTimeout(() => {
          syncProfile(data.user.id);
        }, 500);
      }
      
      return { error: null, session: data.session };
    } catch (err) {
      console.error('Unexpected error during sign in:', err);
      const error = err as AuthError;
      setSessionError(error as AuthSessionError);
      toast.error('An unexpected error occurred during sign in');
      return { error, session: null };
    }
  };
  
  /**
   * Sign out current user
   */
  const signOut = async () => {
    try {
      console.log('Signing out user');
      setSessionError(null);
      
      await supabase.auth.signOut({ scope: 'local' });
      
      // Clear auth state
      setUser(null);
      setSession(null);
      
      // Clear localStorage
      try {
        localStorage.removeItem('jetstream_user_id');
        localStorage.removeItem('jetstream_user_email');
        localStorage.removeItem('jetstream_session_time');
      } catch (e) {
        console.warn('Error clearing localStorage on signout:', e);
      }
      
      // Get app mode for redirection
      const appMode = process.env.NEXT_PUBLIC_APP_MODE || '';
      const isGdyup = appMode === 'gdyup';
      
      // Redirect based on current path and app mode
      if (isGdyup) {
        router.push('/gdyup');
      } else if (pathname?.startsWith('/jetshare')) {
        router.push('/jetshare');
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Sign out error:', err);
      toast.error('An error occurred during sign out');
    }
  };
  
  /**
   * Reset password
   */
  const resetPassword = async (email: string) => {
    try {
      setSessionError(null);

      // Get the app URL for redirect - ensure it's a full absolute URL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
        (typeof window !== 'undefined' ? window.location.origin : 'https://gdyup.xyz');
      
      // Make sure we have a full URL with correct protocol
      const appUrlObj = new URL(appUrl.startsWith('http') ? appUrl : `https://${appUrl}`);
      const callbackUrl = `${appUrlObj.toString().replace(/\/$/, '')}/auth/callback`;
      
      // Add app parameter for cross-domain recognition
      const callbackUrlWithParams = new URL(callbackUrl);
      callbackUrlWithParams.searchParams.set('app', 'gdyup');
      callbackUrlWithParams.searchParams.set('type', 'recovery');
      
      console.log(`📧 Password reset using redirect URL: ${callbackUrlWithParams.toString()}`);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: callbackUrlWithParams.toString(),
      });
      
      if (error) {
        console.error('Password reset error:', error.message);
        setSessionError(error as AuthSessionError);
        toast.error(error.message || 'Failed to send password reset email');
        return { error };
      }
      
      toast.success('Password reset email sent. Please check your inbox.');
      return { error: null };
    } catch (err) {
      console.error('Unexpected error during password reset:', err);
      const error = err as AuthError;
      setSessionError(error as AuthSessionError);
      toast.error('An unexpected error occurred while requesting password reset');
      return { error };
    }
  };
  
  // Construct the context value
  const contextValue: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshSession,
    sessionError,
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 