'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import GdyupHeader from '@/app/gdyup/components/GdyupHeader';
import '@/app/gdyup/gdyup.css';
import JetsList from '@/components/jets-list';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';

export default function MyJets() {
  const { user, loading: authLoading, refreshSession } = useAuth();
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLocalAuth, setHasLocalAuth] = useState(false);
  const router = useRouter();

  // Check for local storage auth data
  useEffect(() => {
    try {
      const localUserId = localStorage.getItem('jetstream_user_id');
      const tokenData = localStorage.getItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
      
      if (localUserId && tokenData) {
        console.log("Found local storage auth data");
        setHasLocalAuth(true);
        
        // If we're in a refresh cycle or have auth redirect params, add auth header
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has('t') || searchParams.has('returnUrl')) {
          // Add auth header to help middleware recognize auth
          const headers = new Headers();
          headers.append('x-auth-token', tokenData);
          
          // Trigger immediate background auth refresh
          refreshSession();
        }
      }
    } catch (e) {
      console.warn("Error checking local storage:", e);
    }
  }, [refreshSession]);

  // Attempt to manually refresh the auth session when component mounts
  useEffect(() => {
    const attemptRefresh = async () => {
      console.log("MyJets: Attempting to refresh session");
      setIsLoading(true);
      
      try {
        // Try regular refresh first
        const refreshResult = await refreshSession();
        console.log("MyJets: Session refresh result:", refreshResult);
        
        if (!refreshResult && !user) {
          // If that fails, try a direct approach
          console.log("MyJets: Direct session refresh attempt");
          const supabase = createClient();
          const { data, error } = await supabase.auth.refreshSession();
          
          if (error) {
            console.error("MyJets: Direct refresh error:", error);
            // Try getting session directly as last resort
            const { data: sessionData } = await supabase.auth.getSession();
            setDebugInfo({
              hasSession: !!sessionData.session,
              hasUser: !!sessionData.session?.user,
              error: error.message
            });
            
            // If we couldn't restore the session, try to recover using localStorage
            if (!sessionData.session) {
              tryLocalStorageRecovery();
            }
          } else {
            console.log("MyJets: Direct refresh succeeded:", !!data.session);
            setDebugInfo({
              hasSession: !!data.session,
              hasUser: !!data.session?.user
            });
          }
        }
      } catch (e) {
        console.error("MyJets: Error during refresh:", e);
        setDebugInfo({ error: e instanceof Error ? e.message : String(e) });
        tryLocalStorageRecovery();
      } finally {
        setIsLoading(false);
      }
    };
    
    attemptRefresh();
  }, [refreshSession, user]);
  
  // Try to recover using localStorage if auth fails
  const tryLocalStorageRecovery = () => {
    try {
      const localUserId = localStorage.getItem('jetstream_user_id');
      const tokenData = localStorage.getItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
      
      if (localUserId && tokenData) {
        console.log("Attempting localStorage auth recovery with ID:", localUserId);
        
        // Only fetch jets if we have a user ID
        fetchUserJets(localUserId);
        setHasLocalAuth(true);
      }
    } catch (e) {
      console.warn("Error during localStorage recovery:", e);
    }
  };
  
  // Handle authentication redirect
  useEffect(() => {
    // Do not redirect during loading or if we have local auth
    if (authLoading || isLoading || hasLocalAuth) return;
    
    // Try to get user ID from localStorage as fallback
    const localUserId = typeof window !== 'undefined' ? localStorage.getItem('jetstream_user_id') : null;
    
    if (!user && !redirectAttempted && !localUserId) {
      console.log('MyJets: User not authenticated, preparing to redirect');
      
      // Add user feedback
      toast.warning("Authentication required", { 
        description: "Please sign in to view your jets",
        duration: 3000
      });
      
      // Set a short delay to avoid redirect loops
      const redirectTimer = setTimeout(() => {
        console.log('MyJets: Redirecting to login');
        setRedirectAttempted(true);
        
        // Add timestamp to prevent cache issues
        const timestamp = Date.now();
        // Add auth_retry param to prevent middleware redirect loops
        router.push(`/auth/login?returnUrl=/jets&t=${timestamp}&auth_retry=true`);
      }, 1500);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [user, authLoading, router, redirectAttempted, isLoading, hasLocalAuth]);

  // Handle login redirect with return URL to this page
  const handleLoginClick = () => {
    const timestamp = Date.now();
    window.location.href = `/auth/login?returnUrl=/jets&t=${timestamp}&auth_retry=true`;
  };

  // Fetch user jets using a function that includes user_id param
  const fetchUserJets = async (userId: string) => {
    try {
      console.log('MyJets: Fetching jets for user:', userId);
      
      // Add user_id to URL as fallback for server-side auth
      const response = await fetch(`/api/jets/user?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('sb-vjhrmizwqhmafkxbmfwa-auth-token') || ''
        },
        credentials: 'include' // Important: send cookies with the request
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('MyJets: Jets data received:', data);
        setFetchError(null);
      } else {
        const errorData = await response.json().catch(() => null);
        console.error('MyJets: Error fetching jets:', response.status, errorData);
        setFetchError(`Error fetching your jets: ${errorData?.error || response.statusText}`);
      }
    } catch (err) {
      console.error('MyJets: Failed to fetch jets:', err);
      setFetchError('Failed to load your jets. Please try again later.');
    }
  };
  
  // When user changes, fetch jets
  useEffect(() => {
    if (user && user.id) {
      fetchUserJets(user.id);
    }
  }, [user]);

  // Set up periodic token refresh
  useEffect(() => {
    // Run initial check
    const userId = user?.id || localStorage.getItem('jetstream_user_id');
    if (userId) {
      fetchUserJets(userId);
    }
    
    // Set up refresh interval (every 5 minutes)
    const intervalId = setInterval(() => {
      const currentUserId = user?.id || localStorage.getItem('jetstream_user_id');
      if (currentUserId) {
        refreshSession();
        fetchUserJets(currentUserId);
      }
    }, 5 * 60 * 1000);
    
    // Clean up listeners on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [refreshSession, user]);

  return (
    <div className="bg-gdyup-background min-h-screen">
      <GdyupHeader />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gdyup-primary">My Jets</h1>
        
        {/* Display authentication prompt if user not logged in */}
        {!authLoading && !isLoading && !user && !hasLocalAuth && (
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gdyup-primary">Authentication Required</h2>
            <p className="mb-4">You need to be signed in to view your jets.</p>
            <Button 
              onClick={handleLoginClick}
              className="bg-gdyup-primary hover:bg-gdyup-primary/90 text-white"
            >
              Sign In
            </Button>
            
            {debugInfo && (
              <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                <h3 className="font-bold mb-1">Debug Info:</h3>
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
        
        {/* Loading state */}
        {(authLoading || isLoading) && (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-64 w-full rounded-md" />
          </div>
        )}
        
        {/* Error state */}
        {fetchError && !authLoading && !isLoading && (user || hasLocalAuth) && (
          <div className="p-4 border border-red-200 bg-red-50 rounded-md mb-6">
            <p className="text-red-700">{fetchError}</p>
            <Button 
              onClick={() => {
                const userId = user?.id || localStorage.getItem('jetstream_user_id');
                if (userId) fetchUserJets(userId);
              }}
              className="mt-2 bg-red-500 hover:bg-red-600 text-white"
              size="sm"
            >
              Retry
            </Button>
          </div>
        )}
        
        {/* Display jets list when available */}
        {!authLoading && !isLoading && (user || hasLocalAuth) && !fetchError && (
          <JetsList />
        )}
      </div>
    </div>
  );
} 