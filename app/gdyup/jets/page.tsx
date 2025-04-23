'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PlusCircle, Plane, Settings, AlertTriangle, LogIn, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/auth-provider';
import GdyupHeader from '@/app/gdyup/components/GdyupHeader';
import { createClient } from '@/lib/supabase';
import '../gdyup.css';

interface Jet {
  id: string;
  manufacturer: string;
  model: string;
  year: string;
  tail_number: string;
  capacity: string;
  status: string;
  image_url: string;
  home_base_airport: string;
  category: string;
}

export default function GdyupJets() {
  const router = useRouter();
  const { user, session, loading: authLoading, refreshSession } = useAuth();
  const [jets, setJets] = useState<Jet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [retries, setRetries] = useState(0);
  const [isRetryingAuth, setIsRetryingAuth] = useState(false);
  const authAttemptsRef = useRef(0);
  const MAX_AUTH_ATTEMPTS = 3;

  // GDY UP brand colors
  const primaryColor = "#DAFF0D"; 
  const secondaryColor = "#FF4B47";
  const backgroundColor = "#000000";

  // Modify the fetchJets function to use the correct API endpoint
  const fetchJets = useCallback(async () => {
    // Set a flag in localStorage to detect and prevent retry loops
    const now = Date.now();
    const lastFetchAttempt = parseInt(localStorage.getItem('gdyup_jets_last_fetch') || '0', 10);
    const fetchCount = parseInt(localStorage.getItem('gdyup_jets_fetch_count') || '0', 10);
    
    // If we've tried fetching too many times in a short period, use cached data or empty state
    const TEN_SECONDS = 10000;
    if (now - lastFetchAttempt < TEN_SECONDS && fetchCount > 3) {
      console.warn('Detected potential fetch loop - using cached data or empty state');
      
      // Try to get cached data from localStorage first
      try {
        const cachedJets = localStorage.getItem('gdyup_jets_cache');
        if (cachedJets) {
          const parsedJets = JSON.parse(cachedJets);
          console.log('Using cached jets data', parsedJets);
          setJets(parsedJets);
          setLoading(false);
          // Reset the counter after a successful use of cache
          localStorage.setItem('gdyup_jets_fetch_count', '0');
          return;
        }
      } catch (e) {
        console.error('Error parsing cached jets', e);
      }
      
      // If no cache, show empty state
      console.log('No cached data available, showing empty state');
      setJets([]);
      setLoading(false);
      return;
    }
    
    // Update fetch attempt tracking
    localStorage.setItem('gdyup_jets_last_fetch', now.toString());
    localStorage.setItem('gdyup_jets_fetch_count', (fetchCount + 1).toString());
    
    setLoading(true);
    setError(null);
    
    // Add initial delay before any fetch attempt
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      // Get the user ID from various sources
      const userId = user?.id || localStorage.getItem('jetstream_user_id');
      
      if (!userId) {
        console.error("No user ID available to fetch jets");
        setError("User ID required to fetch jets");
        setLoading(false);
        return;
      }
      
      console.log(`Starting jets fetch for user ID: ${userId}`);
      
      // Using the gdyup API endpoint
      const timestamp = Date.now();
      const url = `/api/gdyup/jets?userId=${userId}&t=${timestamp}`;
      
      console.log(`Fetching jets from URL: ${url}`);
      
      // First check if we have an auth token to include
      let authToken = null;
      try {
        const tokenStr = localStorage.getItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
        if (tokenStr) {
          const tokenData = JSON.parse(tokenStr);
          if (tokenData?.access_token) {
            authToken = tokenData.access_token;
          }
        }
      } catch (e) {
        console.warn('Could not parse auth token from localStorage', e);
      }
      
      // Prepare headers with or without auth token
      const headers: Record<string, string> = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Content-Type': 'application/json',
      };
      
      // Add auth header if available
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      // Use fetch with timeout to prevent infinite waiting
      const fetchPromise = fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include', // Send cookies
      });
      
      // Set a timeout of 10 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 10000);
      });
      
      // Race the fetch against the timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      
      if (!response.ok) {
        if (response.status === 401) {
          // Auth error - try again with a fallback approach
          console.log('Authentication error, trying alternative fetch method');
          
          // Direct fetch without auth to our modified endpoint - still using gdyup endpoint
          const fallbackResponse = await fetch(`/api/gdyup/jets?userId=${userId}&t=${Date.now()}`, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Content-Type': 'application/json',
            },
          });
          
          if (!fallbackResponse.ok) {
            throw new Error(`Failed to fetch jets: ${fallbackResponse.status}`);
          }
          
          const fallbackData = await fallbackResponse.json();
          if (fallbackData && fallbackData.data && Array.isArray(fallbackData.data)) {
            console.log(`Loaded ${fallbackData.data.length} jets from API (fallback method)`);
            // Cache the successful response
            localStorage.setItem('gdyup_jets_cache', JSON.stringify(fallbackData.data));
            setJets(fallbackData.data);
            // Reset the fetch counter after success
            localStorage.setItem('gdyup_jets_fetch_count', '0');
            setLoading(false);
            return;
          } else {
            throw new Error('Invalid response format from fallback API call');
          }
        } else {
          throw new Error(`Failed to fetch jets: ${response.status}`);
        }
      }
      
      const data = await response.json();
      console.log('Jets API response:', data);
      
      if (data && data.data && Array.isArray(data.data)) {
        console.log(`Loaded ${data.data.length} jets from API`);
        // Cache the successful response
        localStorage.setItem('gdyup_jets_cache', JSON.stringify(data.data));
        setJets(data.data);
        // Reset the fetch counter after success
        localStorage.setItem('gdyup_jets_fetch_count', '0');
      } else if (data && data.error) {
        console.error(`API returned error: ${data.error}`);
        setError(data.message || data.error);
      } else {
        console.error('Unexpected API response format', data);
        setError('Received invalid response format from API');
      }
    } catch (err) {
      console.error('Error fetching jets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch jets');
      
      // Try to use cached data first before showing empty state
      try {
        const cachedJets = localStorage.getItem('gdyup_jets_cache');
        if (cachedJets) {
          const parsedJets = JSON.parse(cachedJets);
          console.log('Error occurred, using cached jets data', parsedJets);
          setJets(parsedJets);
        } else {
          // No cached data, show empty state
          console.log('No cached data available, showing empty state');
          setJets([]);
        }
      } catch (e) {
        console.error('Error using cache, showing empty state', e);
        setJets([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add a cleanup function to reset fetch attempt tracking
  useEffect(() => {
    return () => {
      // Reset fetch counters when component unmounts
      localStorage.setItem('gdyup_jets_fetch_count', '0');
    };
  }, []);

  // Fix the useEffect that checks for auth to be less aggressive with redirects
  useEffect(() => {
    if (!authLoading) {
      const checkAuth = async () => {
        if (!user) {
          console.log("No user found, checking local storage");
          // Try to get user ID from localStorage to validate we have some auth
          try {
            const userId = localStorage.getItem('jetstream_user_id');
            const tokenData = localStorage.getItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
            
            console.log("Local storage check:", { 
              hasUserId: !!userId, 
              hasTokenData: !!tokenData,
              authAttempts: authAttemptsRef.current
            });
            
            // If we have stored data, attempt to fetch regardless of auth state
            if (userId) {
              console.log("Found user ID in localStorage, attempting to fetch jets");
              setIsAuthenticated(true); // Consider user authenticated if we have an ID
              fetchJets(); // Fetch jets directly, which now has a fallback mechanism
              return;
            }
            
            // If we have tokenData but no userId, try to refresh
            if (tokenData && !userId) {
              console.log("Attempting to refresh auth from stored token");
              setIsRetryingAuth(true);
              
              try {
                // First try built-in refresh
                const result = await refreshSession();
                console.log("Auth refresh result:", result);
                
                if (!result) {
                  // If that fails, try direct Supabase refresh
                  const supabase = createClient();
                  const { data, error } = await supabase.auth.refreshSession();
                  
                  if (error && error.message !== 'Auth session missing') {
                    console.error("Failed to refresh session:", error);
                    authAttemptsRef.current++;
                  } else if (data?.session) {
                    console.log("Successfully refreshed session");
                    setIsAuthenticated(true);
                    setTimeout(() => fetchJets(), 500); // Fetch after a small delay
                    return;
                  }
                } else {
                  setIsAuthenticated(true);
                  setTimeout(() => fetchJets(), 500); // Fetch after a small delay
                  return;
                }
              } catch (error) {
                console.error("Error refreshing auth:", error);
                authAttemptsRef.current++;
              } finally {
                setIsRetryingAuth(false);
              }
            }
            
            // Only redirect if we've tried multiple times and still no auth
            if (authAttemptsRef.current >= MAX_AUTH_ATTEMPTS) {
              console.log("Max auth attempts reached, redirecting to login");
              // Before redirecting, try one last attempt with fallback
              try {
                console.log("Making one last attempt to fetch jets before redirecting");
                await fetchJets();
                // If we got here without an error, we can show jets
                return;
              } catch (e) {
                console.error("Last attempt failed:", e);
                // Now redirect
                window.location.href = `/auth/login?returnUrl=${encodeURIComponent('/gdyup/jets')}&authFailure=true&t=${Date.now()}`;
                return;
              }
            } else {
              // No stored auth data, but don't redirect immediately
              // Instead show UI for unauthenticated user with mock data in dev
              setIsAuthenticated(false);
              if (process.env.NODE_ENV === 'development') {
                console.log('Development mode: Loading mock data for unauthenticated user');
                setJets([]);
              }
            }
          } catch (error) {
            console.error("Error checking local storage:", error);
          }
        } else {
          console.log("User authenticated:", user.email);
          // User is authenticated, set state and fetch jets
          setIsAuthenticated(true);
          fetchJets();
        }
      };
      
      checkAuth();
    }
  }, [user, authLoading, refreshSession, fetchJets]);

  useEffect(() => {
    // Only attempt to fetch if authenticated
    if (isAuthenticated === true) {
      fetchJets();
    } else if (isAuthenticated === false || isAuthenticated === null) {
      setLoading(false);
    }
  }, [fetchJets, isAuthenticated, authLoading]);

  // Auto retry if we have an error and fewer than 3 retries
  useEffect(() => {
    if (error && retries < 3) {
      const retryTimer = setTimeout(() => {
        console.log(`Auto-retrying jets fetch (attempt ${retries + 1}/3)...`);
        fetchJets();
      }, 3000 * retries); // Increasing delay for each retry
      
      return () => clearTimeout(retryTimer);
    }
  }, [error, retries]);

  // Function to get status color based on jet status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-600';
      case 'maintenance':
        return 'bg-amber-600';
      case 'reserved':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  // Function for handling navigation
  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  // Logic to determine if we should show an error page or empty state
  const shouldShowErrorPage = (error: string | null) => {
    if (!error) return false;
    
    // Network errors should show error page with retry
    const networkErrorPatterns = [
      'network',
      'fetch',
      'timeout',
      'offline',
      'failed to fetch',
      'connection',
      'cors',
      '500',
      '503'
    ];
    
    for (const pattern of networkErrorPatterns) {
      if (error.toLowerCase().includes(pattern)) {
        return true;
      }
    }
    
    // For other errors (especially "no jets found" type errors),
    // we should just show an empty state
    return false;
  };

  // UI rendering based on authentication and data states
  if (loading) {
    return (
      <div className="grid h-[70vh] place-content-center">
        <p>Loading jets...</p>
      </div>
    );
  }

  // Show empty state - No jets
  return (
    <div className="bg-black min-h-screen text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">My Jets</h2>
          <Button
            onClick={() => navigateTo('/gdyup/jets/models')}
            className="bg-[#DAFF0D] hover:brightness-105 text-black"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Jet
          </Button>
        </div>
        
        {/* Auth loading state */}
        {(authLoading || isRetryingAuth) && (
          <div>
            <div className="flex flex-col justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mb-4" style={{ borderColor: primaryColor }}></div>
              <p className="text-gray-400 text-sm">
                {isRetryingAuth ? "Refreshing authentication..." : "Checking authentication..."}
              </p>
            </div>
          </div>
        )}

        {/* Error state (not auth related) - only for network issues */}
        {error && user && shouldShowErrorPage(error) && (
          <div className="bg-[#0D0D0D] border-gray-800 p-6 text-center rounded-lg">
            <div className="flex flex-col items-center py-10">
              <div className="rounded-full bg-red-900/30 p-4 mb-4">
                <AlertTriangle className="h-10 w-10 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-red-400">Connection Error</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                {error}
              </p>
              <Button
                onClick={() => {
                  // Reset flags so we don't trigger fallbacks
                  localStorage.setItem('gdyup_jets_fetch_count', '0');
                  setRetryCount(0);
                  fetchJets();
                }}
                className="bg-[#DAFF0D] hover:brightness-105 text-black"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Empty state - No jets */}
        {!authLoading && !isRetryingAuth && user && !loading && (!error || !shouldShowErrorPage(error)) && jets.length === 0 && (
          <div>
            <Card className="bg-[#0D0D0D] border-gray-800 p-6 text-center">
              <div className="flex flex-col items-center py-10">
                <div className="rounded-full bg-gray-900 p-4 mb-4">
                  <Plane className="h-10 w-10" style={{ color: primaryColor }} />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Jets Added Yet</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  You haven't added any jets to your profile. Add your first jet to start managing your aircraft in GDY UP.
                </p>
                <Button
                  onClick={() => navigateTo('/gdyup/jets/models')}
                  className="bg-[#DAFF0D] hover:brightness-105 text-black"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Browse Aircraft Models
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Jets list */}
        {!authLoading && !isRetryingAuth && user && !loading && (!error || !shouldShowErrorPage(error)) && jets.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jets.map((jet) => (
              <Card key={jet.id} className="bg-[#0D0D0D] border-gray-800 overflow-hidden">
                <div className="aspect-video relative">
                  {jet.image_url ? (
                    <Image
                      src={jet.image_url}
                      alt={`${jet.manufacturer} ${jet.model}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-gray-900">
                      <Plane className="h-12 w-12 text-gray-600" />
                    </div>
                  )}
                  <Badge className={`${getStatusColor(jet.status)} absolute top-2 right-2`}>
                    {jet.status}
                  </Badge>
                </div>
                
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="font-bold text-lg">
                      {jet.manufacturer} {jet.model}
                    </CardTitle>
                    <Badge variant="outline" className="bg-gray-900/80 border-gray-700">
                      {jet.category}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tail Number</span>
                      <span className="text-gray-200 font-medium">{jet.tail_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Year</span>
                      <span className="text-gray-200 font-medium">{jet.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Capacity</span>
                      <span className="text-gray-200 font-medium">{jet.capacity} seats</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Home Base</span>
                      <span className="text-gray-200 font-medium">{jet.home_base_airport}</span>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="border-t border-gray-800 pt-4">
                  <div className="flex space-x-2 w-full">
                    <Button
                      variant="outline"
                      onClick={() => navigateTo(`/gdyup/jets/${jet.id}`)}
                      className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigateTo(`/gdyup/jets/${jet.id}/edit`)}
                      className="border-gray-700 hover:bg-gray-800"
                    >
                      <Settings className="h-4 w-4" style={{ color: primaryColor }} />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 