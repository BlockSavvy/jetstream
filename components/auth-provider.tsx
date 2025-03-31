'use client'

import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { type User, AuthError, Session } from '@supabase/supabase-js'
import { toast } from 'sonner'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null, session: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  refreshSession: () => Promise<boolean>
  sessionError: AuthError | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const isInitializing = useRef(true)
  const [profileSyncAttempted, setProfileSyncAttempted] = useState(false)
  const [profileSyncError, setProfileSyncError] = useState(false)
  const profileSyncAttempts = useRef(0)
  const MAX_PROFILE_SYNC_ATTEMPTS = 2
  const AUTH_SYNC_THROTTLE = 10000 // 10 seconds between sync attempts
  const lastRefreshAttempt = useRef<number>(0)
  const [sessionError, setSessionError] = useState<AuthError | null>(null)

  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  // Singleton pattern to ensure only one profile sync can run at a time
  const syncInProgress = useRef(false)
  
  // New function to help with session refreshing across the app
  const refreshSession = async (): Promise<boolean> => {
    console.log('Attempting to refresh auth session...');
    setSessionError(null); // Clear previous errors
    
    // Throttle refresh attempts to avoid spamming the auth service
    const now = Date.now();
    if (now - lastRefreshAttempt.current < 2000) {
      console.log('Throttling refresh attempt');
      return false;
    }
    
    lastRefreshAttempt.current = now;
    
    try {
      // First, try standard refresh method
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.warn('Error refreshing session via standard method:', error.message);
        setSessionError(error); // Store the error
        
        // *** CRITICAL FIX: Handle 400 Bad Request specifically ***
        if (error instanceof AuthError && error.status === 400) {
          console.error('Refresh token is invalid (400 Bad Request). Clearing session state.');
          // Clear local state and storage because the refresh token is bad
          setUser(null);
          setSession(null);
          try {
            localStorage.removeItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
            localStorage.removeItem('jetstream_user_id');
            localStorage.removeItem('jetstream_user_email');
            localStorage.setItem('auth_last_authenticated', 'false'); // Mark as not authenticated
            console.log('Cleared invalid session data from localStorage.');
          } catch (storageError) {
            console.warn('Error clearing localStorage after invalid refresh token:', storageError);
          }
          // Optionally trigger a sign-out process or inform the user
          // signOut(); // Consider if automatic sign-out is desired here
          return false; // Indicate refresh failed due to invalid token
        }
        
        // Try localStorage fallback ONLY if it wasn't a 400 error
        // (If it was 400, the localStorage token is likely the problem)
        if (!(error instanceof AuthError && error.status === 400)) {
          try {
            const tokenData = localStorage.getItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
            if (tokenData) {
              const parsedToken = JSON.parse(tokenData);
              if (parsedToken && parsedToken.access_token && parsedToken.refresh_token) {
                console.log('Attempting to restore session from localStorage token (non-400 error path)');
                const { data: localData, error: localError } = await supabase.auth.setSession({
                  access_token: parsedToken.access_token,
                  refresh_token: parsedToken.refresh_token
                });
                
                if (!localError && localData.session) {
                  console.log('Session restored successfully from localStorage tokens');
                  setUser(localData.session.user);
                  setSession(localData.session);
                  setSessionError(null); // Clear error on success
                  
                  // Re-store the tokens to ensure they're still available
                  try {
                    const storageData = {
                      access_token: localData.session.access_token,
                      refresh_token: localData.session.refresh_token,
                      expires_at: Math.floor(Date.now() / 1000) + 3600,
                      user: localData.session.user
                    };
                    localStorage.setItem('sb-vjhrmizwqhmafkxbmfwa-auth-token', JSON.stringify(storageData));
                    localStorage.setItem('auth_last_authenticated', 'true');
                    localStorage.setItem('jetstream_session_time', new Date().getTime().toString());
                    localStorage.setItem('jetstream_user_id', localData.session.user.id);
                    if (localData.session.user.email) {
                      localStorage.setItem('jetstream_user_email', localData.session.user.email);
                    }
                  } catch (storageError) {
                    console.warn('Error saving restored tokens to localStorage:', storageError);
                  }
                  
                  // Register a global fetch interceptor to automatically include auth headers
                  try {
                    const originalFetch = window.fetch;
                    window.fetch = async function(input, init) {
                      // Only add auth headers for same-origin API requests
                      const url = input instanceof Request ? input.url : String(input);
                      
                      // Don't add auth to cross-origin or non-API requests
                      // Check if we already have an Authorization header
                      let hasAuthHeader = false;
                      
                      if (init?.headers) {
                        if (init.headers instanceof Headers) {
                          hasAuthHeader = init.headers.has('Authorization');
                        } else if (typeof init.headers === 'object') {
                          // Use safe property access
                          hasAuthHeader = Object.keys(init.headers).some(key => 
                            key.toLowerCase() === 'authorization'
                          );
                        }
                      }
                      
                      if (url.startsWith('/api/') && !hasAuthHeader) {
                        init = init || {};
                        init.headers = init.headers || {};
                        
                        // Add the Authorization header with the bearer token
                        const headers = new Headers(init.headers);
                        if (localData.session && localData.session.access_token) {
                          headers.set('Authorization', `Bearer ${localData.session.access_token}`);
                          init.headers = Object.fromEntries(headers.entries());
                          
                          console.log('Fetch interceptor: Added auth header to API request');
                        }
                      }
                      
                      return originalFetch(input, init);
                    };
                  } catch (fetchInterceptError) {
                    console.warn('Error setting up fetch interceptor:', fetchInterceptError);
                  }
                  
                  return true;
                } else {
                  console.warn('Failed to restore session from localStorage tokens:', localError);
                  // If localStorage restore fails too, clear it
                  localStorage.removeItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
                }
              } else {
                localStorage.removeItem('sb-vjhrmizwqhmafkxbmfwa-auth-token'); // Clear if invalid structure
              }
            }
          } catch (localStorageError) {
            console.warn('Error accessing localStorage during refresh fallback:', localStorageError);
          }
        }
        
        // If we reach here, all refresh methods failed for non-400 reasons or 400 was handled
        return false;
      }
      
      // Standard refresh succeeded
      if (data.session) {
        console.log('Session refreshed successfully:', !!data.session.user.email);
        setUser(data.session.user);
        setSession(data.session);
        setSessionError(null); // Clear error on success
        
        // Always store the refreshed tokens in localStorage for redundancy
        try {
          const storageData = {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            user: data.session.user
          };
          localStorage.setItem('sb-vjhrmizwqhmafkxbmfwa-auth-token', JSON.stringify(storageData));
          localStorage.setItem('auth_last_authenticated', 'true');
          localStorage.setItem('jetstream_session_time', new Date().getTime().toString());
          localStorage.setItem('jetstream_user_id', data.session.user.id);
          
          if (data.session.user.email) {
            localStorage.setItem('jetstream_user_email', data.session.user.email);
          }
          
          console.log('Refreshed auth tokens stored in localStorage');
        } catch (storageError) {
          console.warn('Error storing refreshed auth data in localStorage:', storageError);
        }
        
        // Register a global fetch interceptor to automatically include auth headers
        try {
          const originalFetch = window.fetch;
          window.fetch = async function(input, init) {
            // Only add auth headers for same-origin API requests
            const url = input instanceof Request ? input.url : String(input);
            
            // Check if Authorization header already exists
            let hasAuthHeader = false;
            
            if (init?.headers) {
              if (init.headers instanceof Headers) {
                hasAuthHeader = init.headers.has('Authorization');
              } else if (typeof init.headers === 'object') {
                // Use safe property access
                hasAuthHeader = Object.keys(init.headers).some(key => 
                  key.toLowerCase() === 'authorization'
                );
              }
            }
            
            // Don't add auth to cross-origin or non-API requests
            if (url.startsWith('/api/') && !hasAuthHeader && data.session?.access_token) {
              init = init || {};
              init.headers = init.headers || {};
              
              // Add the Authorization header with the bearer token
              const headers = new Headers(init.headers);
              headers.set('Authorization', `Bearer ${data.session.access_token}`);
              init.headers = Object.fromEntries(headers.entries());
            }
            
            return originalFetch(input, init);
          };
        } catch (fetchInterceptError) {
          console.warn('Error setting up fetch interceptor:', fetchInterceptError);
        }
        
        return true;
      } else {
        console.log('Session refresh returned no session, but no error.');
        // This case might happen if cookies were cleared server-side?
        // Ensure local state is cleared
         setUser(null);
         setSession(null);
         try {
           localStorage.removeItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
         } catch (e) {}
        return false;
      }
    } catch (refreshError) {
      console.error('Unexpected error during session refresh:', refreshError);
      setSessionError(refreshError instanceof AuthError ? refreshError : new AuthError('Unexpected refresh error'));
      return false;
    }
  };
  
  // Profile sync function with retry limits to prevent infinite loops
  const syncProfile = async (userId: string) => {
    if (profileSyncAttempts.current >= MAX_PROFILE_SYNC_ATTEMPTS || profileSyncError) {
      console.log('Profile sync skipped - max attempts reached or previous error')
      return
    }
    
    // If sync is already in progress, skip this attempt
    if (syncInProgress.current) {
      console.log('Profile sync already in progress, skipping duplicate call')
      return
    }
    
    try {
      syncInProgress.current = true
      profileSyncAttempts.current += 1
      console.log(`Syncing profile, attempt: ${profileSyncAttempts.current}`)
      
      // Skip API call completely and use direct database query instead
      console.log('Using direct database query for profile sync')
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        
      if (error) {
        console.error('Error fetching profile:', error)
        setProfileSyncError(true)
        syncInProgress.current = false
        return
      }
      
      if (!data) {
        console.log('Profile not found, attempting to create')
        
        // Get user email from current user state
        const userEmail = user?.email || '';
        
        // Simple create profile without redirect
        const { error: createError } = await supabase
          .from('profiles')
          .insert([{ id: userId, email: userEmail }])
          
        if (createError) {
          console.error('Error creating profile:', createError)
          setProfileSyncError(true)
        } else {
          console.log('Profile created successfully')
          setProfileSyncAttempted(true)
        }
      } else {
        console.log('Profile found:', data)
        setProfileSyncAttempted(true)
      }
    } catch (error) {
      console.error('Error in profile sync:', error)
      setProfileSyncError(true)
    } finally {
      syncInProgress.current = false
    }
  }

  // Initialize user session
  useEffect(() => {
    let mounted = true
    let initTimeout: NodeJS.Timeout | null = null
    
    const initializeAuth = async () => {
      // If already initializing, skip
      if (!isInitializing.current) {
        console.log('Auth initialization already completed, skipping duplicate call')
        return
      }

      try {
        console.log('Initializing auth state')
        
        // First try to get data from localStorage to avoid waiting for network
        if (typeof window !== 'undefined') {
          try {
            const storedAuthData = localStorage.getItem('sb-vjhrmizwqhmafkxbmfwa-auth-token')
            if (storedAuthData) {
              console.log('Found auth data in localStorage')
            }
          } catch (err) {
            console.warn('Error accessing localStorage:', err)
          }
        }
        
        // Get session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error fetching session:', error.message)
          setUser(null)
          setSession(null)
          return
        }
        
        console.log('Session found:', !!session)
        if (session?.user && mounted) {
          console.log('User authenticated:', session.user.email)
          setUser(session.user)
          setSession(session)
          
          // Store session information in localStorage for redundant authentication
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem('auth_last_authenticated', 'true');
              localStorage.setItem('jetstream_session_time', new Date().getTime().toString());
              localStorage.setItem('jetstream_user_email', session.user.email || '');
              
              // For redundant auth checking in case cookies are lost
              const authToken = session.access_token;
              const refreshToken = session.refresh_token;
              if (authToken && refreshToken) {
                const storageData = {
                  access_token: authToken,
                  refresh_token: refreshToken,
                  expires_at: Math.floor(Date.now() / 1000) + 3600 // Default 1 hour expiry if not specified
                };
                localStorage.setItem('sb-vjhrmizwqhmafkxbmfwa-auth-token', JSON.stringify(storageData));
              }
            }
          } catch (storageErr) {
            console.warn('Error storing auth data in localStorage:', storageErr);
          }
          
          // Only attempt profile sync if we haven't tried too many times
          if (!profileSyncAttempted && !profileSyncError) {
            await syncProfile(session.user.id)
          }
        } else if (mounted) {
          // Try refreshing the session once as a final attempt
          try {
            console.log('No session found, attempting refresh')
            
            // First check if we have token data in localStorage we can try to use
            let localSuccess = false;
            try {
              if (typeof window !== 'undefined') {
                const tokenData = localStorage.getItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
                if (tokenData) {
                  try {
                    const parsedData = JSON.parse(tokenData);
                    if (parsedData && parsedData.access_token) {
                      console.log('Found token in localStorage, attempting to restore session');
                      const { data: localData, error: localError } = await supabase.auth.setSession({
                        access_token: parsedData.access_token,
                        refresh_token: parsedData.refresh_token
                      });
                      
                      if (!localError && localData.session) {
                        console.log('Session restored successfully from localStorage');
                        setUser(localData.session.user);
                        setSession(localData.session);
                        localSuccess = true;
                        
                        // Sync profile after successful session restore
                        if (!profileSyncAttempted && !profileSyncError && localData.session.user) {
                          await syncProfile(localData.session.user.id);
                        }
                      } else {
                        console.warn('Error restoring session from localStorage:', localError);
                      }
                    }
                  } catch (parseError) {
                    console.warn('Error parsing localStorage token:', parseError);
                  }
                }
              }
            } catch (storageError) {
              console.warn('Error accessing localStorage:', storageError);
            }
            
            // If local restore failed, try standard refresh
            if (!localSuccess) {
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
              
              if (refreshError) {
                console.warn('Session refresh failed:', refreshError)
                setUser(null)
                setSession(null)
              } else if (refreshData?.session) {
                console.log('Session refreshed successfully during initialization')
                setUser(refreshData.session.user)
                setSession(refreshData.session)
                
                // Store refreshed session in localStorage
                try {
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('auth_last_authenticated', 'true');
                    localStorage.setItem('jetstream_session_time', new Date().getTime().toString());
                    
                    // Store tokens
                    const authToken = refreshData.session.access_token;
                    const refreshToken = refreshData.session.refresh_token;
                    if (authToken && refreshToken) {
                      const storageData = {
                        access_token: authToken,
                        refresh_token: refreshToken,
                        expires_at: Math.floor(Date.now() / 1000) + 3600 // Default 1 hour expiry if not specified
                      };
                      localStorage.setItem('sb-vjhrmizwqhmafkxbmfwa-auth-token', JSON.stringify(storageData));
                    }
                  }
                } catch (storageErr) {
                  console.warn('Error storing refreshed auth data in localStorage:', storageErr);
                }
                
                // Sync profile after successful refresh
                if (!profileSyncAttempted && !profileSyncError && refreshData.session.user) {
                  await syncProfile(refreshData.session.user.id)
                }
              } else {
                console.log('No authenticated user after refresh attempt')
                setUser(null)
                setSession(null)
              }
            }
          } catch (refreshError) {
            console.error('Error during session refresh attempt:', refreshError)
            if (mounted) {
              setUser(null)
              setSession(null)
            }
          }
        }
      } catch (error) {
        console.error('Unexpected error during session check:', error)
        if (mounted) {
          setUser(null)
          setSession(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
          // After initialization is complete (success or failure), set the flag
          initTimeout = setTimeout(() => {
            isInitializing.current = false
          }, 300)
        }
      }
    }

    initializeAuth()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, !!session)
        
        if (session) {
          // Always set the user for any authenticated session
          setUser(session.user)
          setSession(session)
          console.log('User set in state:', session.user?.email || 'No email available')
          
          if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
            console.log('Successful auth event:', event)
            
            // Store auth state in localStorage for better persistence
            try {
              if (window && window.localStorage) {
                // Remember this is the last authenticated page to help with cookie handling
                localStorage.setItem('auth_last_authenticated', 'true')
                // Store the session in storage to help with state persistence
                localStorage.setItem('jetstream_session_time', new Date().getTime().toString())
                
                // Store tokens for redundant auth checking
                const authToken = session?.access_token;
                const refreshToken = session?.refresh_token;
                if (authToken && refreshToken) {
                  const storageData = {
                    access_token: authToken,
                    refresh_token: refreshToken,
                    expires_at: Math.floor(Date.now() / 1000) + 3600 // Default 1 hour expiry
                  };
                  localStorage.setItem('sb-vjhrmizwqhmafkxbmfwa-auth-token', JSON.stringify(storageData));
                  console.log('Auth tokens updated in localStorage');
                }
              }
            } catch (storageError) {
              console.warn('Could not access localStorage:', storageError)
            }
            
            // Wait a brief moment before syncing profile to avoid race conditions
            // But only if this is a SIGNED_IN event (don't sync on every refresh)
            if (event === 'SIGNED_IN' && !profileSyncAttempted && !profileSyncError && session?.user?.id) {
              setTimeout(() => {
                syncProfile(session.user.id)
              }, 1000)
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setSession(null)
          
          // Clear localStorage data
          try {
            localStorage.removeItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
            localStorage.removeItem('supabase-auth-token');
            localStorage.removeItem('auth_last_authenticated');
            localStorage.removeItem('jetstream_session_time');
          } catch (err) {
            console.warn('Error clearing localStorage on sign out:', err);
          }
        } else {
          // Handle other auth state changes
          if (event !== 'INITIAL_SESSION') {
            console.log('Auth state change without session:', event);
            
            // Try to recover from localStorage if session is lost
            if (['USER_DELETED', 'TOKEN_REFRESHED_FAILED', 'PASSWORD_RECOVERY'].includes(event)) {
              console.log('Attempting session recovery after', event);
              refreshSession().then(success => {
                console.log('Session recovery attempt result:', success ? 'successful' : 'failed');
              });
            }
          }
        }
        
        setLoading(false)
      }
    )

    return () => {
      console.log('Unsubscribing from auth state changes')
      subscription.unsubscribe()
      if (initTimeout) {
        clearTimeout(initTimeout)
      }
      mounted = false
    }
  }, [router])

  // Setup session refresh timer and localStorage sync
  useEffect(() => {
    // Only run this effect if we have a session
    if (!session) return
    
    // Refresh session more frequently (every 15 minutes) to avoid expiration issues
    const refreshInterval = 15 * 60 * 1000
    
    console.log('Setting up session refresh timer')
    const intervalId = setInterval(() => {
      console.log('Auto refreshing session')
      refreshSession()
    }, refreshInterval)
    
    // Also ensure the localStorage always has the latest token
    // This helps with the multi-layer auth approach
    try {
      if (session?.access_token && session?.refresh_token) {
        const storageData = {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: Math.floor(Date.now() / 1000) + 3600 // Default 1 hour expiry if not specified
        };
        localStorage.setItem('sb-vjhrmizwqhmafkxbmfwa-auth-token', JSON.stringify(storageData));
        localStorage.setItem('jetstream_user_email', session?.user?.email || '');
        localStorage.setItem('auth_last_authenticated', 'true');
        localStorage.setItem('jetstream_session_time', new Date().getTime().toString());
      }
    } catch (storageError) {
      console.warn('Error syncing session to localStorage:', storageError);
    }
    
    return () => {
      clearInterval(intervalId)
    }
  }, [session])

  // Get environment variables
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    try {
      // Use absolute URLs for redirects to ensure they work properly
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
        (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${appUrl}/auth/callback`,
          data: {
            email, // Include the email in user metadata
          }
        },
      })

      if (!error) {
        toast.success('Verification email sent. Please check your inbox.')
      } else {
        console.error('Sign up error:', error.message)
        toast.error(error.message || 'Failed to sign up')
      }

      return { error }
    } catch (err) {
      console.error('Unexpected error during signup:', err)
      toast.error('An unexpected error occurred during signup')
      return { error: err as AuthError }
    }
  }

  // CORS-safe sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting CORS-safe sign in for:', email)
      
      // Force clear ALL auth state
      try {
        // Clear localStorage
        localStorage.removeItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
        localStorage.removeItem('supabase-auth-token');
        
        // Clear sessionStorage
        sessionStorage.removeItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
        sessionStorage.removeItem('supabase-auth-token');
        
        // Clear all cookies
        document.cookie.split(";").forEach(cookie => {
          const [name] = cookie.trim().split("=");
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
        });
        
        console.log('Successfully cleared all auth state');
      } catch (err) {
        console.warn('Error clearing auth state:', err);
      }
      
      // First, try standard Supabase login
      console.log('Trying standard Supabase auth login first');
      try {
        const { data: standardData, error: standardError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (!standardError && standardData?.session) {
          console.log('Standard login successful');
          setUser(standardData.session.user);
          setSession(standardData.session);
          
          // Reset profile sync state
          profileSyncAttempts.current = 0;
          setProfileSyncAttempted(false);
          setProfileSyncError(false);
          
          // Sync profile
          if (standardData.session.user) {
            setTimeout(() => {
              syncProfile(standardData.session!.user.id);
            }, 800);
          }
          
          return { error: null, session: standardData.session };
        } else {
          console.log('Standard login failed, trying fallback method:', standardError?.message);
        }
      } catch (standardAuthError) {
        console.warn('Error during standard login:', standardAuthError);
      }
      
      // ==== FALLBACK DIRECT AUTH ====
      // When all else fails, use Supabase's most basic auth method
      console.log('Using basic auth method to avoid CORS issues');
      
      // Using manual fetch with no credentials
      // Construct the URL directly
      const authUrl = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
      
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
        },
        // Explicitly omit credentials
        body: JSON.stringify({ 
          email, 
          password 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Manual auth failed:', errorData);
        throw new Error(errorData.error_description || errorData.error || 'Authentication failed');
      }
      
      const authData = await response.json();
      console.log('Manual auth successful');
      
      // Store the tokens in localStorage immediately for redundancy
      try {
        const storageData = {
          access_token: authData.access_token,
          refresh_token: authData.refresh_token,
          expires_at: authData.expires_at
        };
        localStorage.setItem('sb-vjhrmizwqhmafkxbmfwa-auth-token', JSON.stringify(storageData));
        console.log('Auth tokens stored in localStorage');
      } catch (storageError) {
        console.warn('Could not store tokens in localStorage:', storageError);
      }
      
      // Use the token to setup the client session
      const { data, error } = await supabase.auth.setSession({
        access_token: authData.access_token,
        refresh_token: authData.refresh_token
      });
      
      if (error) {
        console.error('Error setting session:', error);
        toast.error(error.message || 'Error establishing session');
        return { error, session: null };
      }
      
      console.log('Session established successfully');
      setUser(data.session?.user || null);
      setSession(data.session);
      
      // Reset profile sync state
      profileSyncAttempts.current = 0;
      setProfileSyncAttempted(false);
      setProfileSyncError(false);
      
      // Sync profile
      if (data.session?.user) {
        setTimeout(() => {
          syncProfile(data.session!.user.id);
        }, 800);
      }
      
      return { error: null, session: data.session };
    } catch (err) {
      console.error('Auth error:', err);
      toast.error(err instanceof Error ? err.message : 'Authentication failed');
      return { error: err as AuthError, session: null };
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      console.log('Signing out user')
      await supabase.auth.signOut({ scope: 'local' }) // Only clear the local session, not global/server
      setUser(null)
      setSession(null)
      
      // Also clear local storage items to ensure clean logout
      try {
        localStorage.removeItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
        localStorage.removeItem('supabase-auth-token');
        localStorage.removeItem('auth_last_authenticated');
        localStorage.removeItem('jetstream_session_time');
      } catch (err) {
        console.warn('Error clearing localStorage on signout:', err);
      }
      
      // Redirect based on current path
      if (pathname?.startsWith('/jetshare')) {
        router.push('/jetshare')
      } else {
        router.push('/')
      }
    } catch (err) {
      console.error('Sign out error:', err)
      toast.error('An error occurred during sign out')
    }
  }

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
        (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/auth/callback?type=recovery`,
      })

      if (!error) {
        toast.success('Password reset email sent. Please check your inbox.')
      } else {
        console.error('Password reset error:', error.message)
        toast.error(error.message || 'Failed to send password reset email')
      }

      return { error }
    } catch (err) {
      console.error('Unexpected error during password reset:', err)
      toast.error('An unexpected error occurred while requesting password reset')
      return { error: err as AuthError }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      resetPassword,
      refreshSession,
      sessionError,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 