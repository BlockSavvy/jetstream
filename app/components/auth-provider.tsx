'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

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

// Global refresh lock to prevent multiple simultaneous refreshes
let refreshInProgress = false;
let lastRefreshTime = 0;
const REFRESH_COOLDOWN = 2000; // 2 seconds cooldown between refresh attempts

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<AuthSessionError | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  
  // Get the singleton Supabase client instance
  const supabase = getSupabaseClient();

  // Session refresh function with race condition protection
  const refreshSession = async (): Promise<boolean> => {
    try {
      // DEV MODE: Immediately return success in dev mode
      if (process.env.NEXT_PUBLIC_AUTH_DEV_MODE === 'true') {
        console.log('DEV MODE: Skipping session refresh');
        return true;
      }
      
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
      
      // Attempt the actual refresh
      const { error } = await supabase.auth.refreshSession();
      
      // Update refresh state
      lastRefreshTime = Date.now();
      refreshInProgress = false;
      
      if (error) {
        console.error('Error refreshing session:', error);
        setSessionError({ message: error.message });
        return false;
      }
      
      console.log('Session refreshed successfully');
      
      // Get the updated session
      const { data } = await supabase.auth.getSession();
      
      if (data?.session) {
        setUser(data.session.user);
        setSession(data.session);
        setSessionError(null);
        return true;
      } else {
        console.warn('No session after successful refresh?');
        return false;
      }
    } catch (e) {
      console.error('Error in refreshSession:', e);
      refreshInProgress = false;
      setSessionError({ message: 'An unexpected error occurred refreshing your session.' });
      return false;
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setSessionError(null);
      
      // DEV MODE: Return mock success in dev mode
      if (process.env.NEXT_PUBLIC_AUTH_DEV_MODE === 'true') {
        console.log('DEV MODE: Mocking successful sign in');
        const { data } = await supabase.auth.getSession();
        setUser(data.session?.user || null);
        setSession(data.session || null);
        return { error: null, session: data.session || null };
      }
      
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
      
      // DEV MODE: Return mock success in dev mode
      if (process.env.NEXT_PUBLIC_AUTH_DEV_MODE === 'true') {
        console.log('DEV MODE: Mocking successful sign up');
        const { data } = await supabase.auth.getSession();
        setUser(data.session?.user || null);
        setSession(data.session || null);
        return { error: null, session: data.session || null };
      }
      
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
      
      // Clear local storage if needed
      try {
        localStorage.removeItem('jetstream_user_id');
        localStorage.removeItem('jetstream_user_email');
        localStorage.removeItem('jetstream_session_time');
      } catch (e) {
        console.warn('Error clearing local storage during sign out:', e);
      }
      
    } catch (error) {
      console.error('Error signing out:', error);
      setSessionError({ message: 'Error signing out.' });
    }
  };

  // Initial auth state setup and auth state change listener
  useEffect(() => {
    const setupAuth = async () => {
      try {
        setLoading(true);
        
        // Check for DEV MODE
        if (process.env.NEXT_PUBLIC_AUTH_DEV_MODE === 'true') {
          console.log('DEV MODE: Setting up mock auth session');
          
          // Create a consistent mock user
          const mockUser = { 
            id: '26209e07-7600-4df6-ab1e-4b338f760aff', // Use the real test user ID for better compatibility
            email: 'dev@example.com',
            app_metadata: { provider: 'email' },
            user_metadata: { full_name: 'Dev User' },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            role: 'authenticated',
            updated_at: new Date().toISOString()
          } as User;
          
          // Create a mock session
          const mockSession = {
            user: mockUser,
            access_token: 'mock-token',
            refresh_token: 'mock-refresh-token',
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            expires_in: 3600,
            token_type: 'bearer'
          } as Session;
          
          // Set the mock user and session directly in state
          setUser(mockUser);
          setSession(mockSession);
          
          // Also store in localStorage for consistency
          try {
            localStorage.setItem('jetstream_user_id', mockUser.id);
            localStorage.setItem('jetstream_user_email', mockUser.email || '');
            localStorage.setItem('jetstream_session_time', Date.now().toString());
            
            // Store full token data
            const tokenData = {
              access_token: mockSession.access_token,
              refresh_token: mockSession.refresh_token,
              expires_at: mockSession.expires_at,
              user: mockUser
            };
            localStorage.setItem('sb-vjhrmizwqhmafkxbmfwa-auth-token', JSON.stringify(tokenData));
            
            console.log('DEV MODE: Stored mock auth data in localStorage');
          } catch (e) {
            console.warn('Error storing mock data in localStorage:', e);
          }
          
          setLoading(false);
          return;
        }
        
        // Real auth logic below (unchanged)
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }
        
        if (session) {
          setUser(session.user);
          setSession(session);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Unexpected error getting session:', error);
        setLoading(false);
      }
    };
    
    // Call the function
    setupAuth();
    
    // Skip listener setup in DEV MODE to prevent conflicting auth changes
    if (process.env.NEXT_PUBLIC_AUTH_DEV_MODE === 'true') {
      console.log('DEV MODE: Skipping auth state change listener');
      return () => {}; // Return empty cleanup function
    }
    
    // Set up the auth state change listener for real mode
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change event:', event);
        
        if (session) {
          // User signed in or token refreshed
          setUser(session.user);
          setSession(session);
          
          // Store session data for redundancy
          try {
            if (session.user) {
              localStorage.setItem('jetstream_user_id', session.user.id);
              localStorage.setItem('jetstream_user_email', session.user.email || '');
              localStorage.setItem('jetstream_session_time', Date.now().toString());
            }
          } catch (e) {
            console.warn('Error storing session data in localStorage:', e);
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
            console.warn('Error clearing localStorage on sign out:', e);
          }
        }
        
        setLoading(false);
      }
    );
    
    // Cleanup
    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase.auth]);

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