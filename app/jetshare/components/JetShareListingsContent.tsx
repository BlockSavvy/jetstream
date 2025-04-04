'use client';

import { useRef, useState, useEffect, Fragment, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { 
  Plane, 
  Calendar, 
  DollarSign, 
  Search, 
  Loader2, 
  Info,
  Filter,
  X,
  Badge,
  ArrowRight,
  BadgeCheck,
  CheckCircle,
  CreditCard,
  Bitcoin,
  MoveUp,
  MoveDown,
  MapPin,
  Users,
  MoreVertical,
  LoaderCircle,
  RefreshCw,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { JetShareOfferWithUser, JetShareOfferStatus } from '@/types/jetshare';
import { Badge as UIBadge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from '@supabase/supabase-js';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatCurrency, formatTime } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth-provider';

// Update the JetShareOfferWithUser type to include the isOwnOffer flag
interface EnhancedJetShareOfferWithUser extends JetShareOfferWithUser {
  isOwnOffer?: boolean;
  image_url?: string;
  jet_id?: string;
  jet?: {
    id?: string;
    manufacturer?: string;
    model?: string;
    image_url?: string;
    [key: string]: any;
  };
}

// Type for user profile with verification status
interface UserWithVerification {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string;
  verification_status?: string;
}

interface JetShareListingsContentProps {
  // User is already provided by useAuth(), so no need to pass it in
}

// Placeholder component for empty state
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full w-16 h-16 flex items-center justify-center mb-6">
      <Plane className="h-8 w-8 text-amber-500" />
    </div>
    <h3 className="text-xl font-bold mb-3">No Flight Shares Available</h3>
    <p className="text-muted-foreground max-w-md mb-6">
      There are no flight shares available that match your criteria. Try adjusting your filters or check back later.
    </p>
    <Button variant="outline" onClick={() => window.location.reload()}>
      Refresh Listings
    </Button>
  </div>
);

// Skeleton loader for cards
const SkeletonCard = () => (
  <Card className="overflow-hidden">
    <CardHeader className="pb-2">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    </CardContent>
    <CardFooter>
      <Skeleton className="h-10 w-full rounded-md" />
    </CardFooter>
  </Card>
);

export default function JetShareListingsContent() {
  const router = useRouter();
  const { user, refreshSession } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [offers, setOffers] = useState<EnhancedJetShareOfferWithUser[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<EnhancedJetShareOfferWithUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<EnhancedJetShareOfferWithUser | null>(null);
  const [sortOption, setSortOption] = useState('date-asc');
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [departureFilter, setDepartureFilter] = useState('');
  const [arrivalFilter, setArrivalFilter] = useState('');
  const [minPriceFilter, setMinPriceFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  const supabase = createClient();
  
  // Add a new effect to check for offer status changes when the component gains focus
  useEffect(() => {
    // Function to check if page visibility changes (user returns to the tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, refreshing offers');
        fetchOffers();
      }
    };

    // Function to handle when user navigates back to this page
    const handleFocus = () => {
      console.log('Window regained focus, refreshing offers');
      fetchOffers();
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Clean up event listeners
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  
  // Fetch offers from API
  const fetchOffers = async (
    status = 'open', 
    viewMode: 'marketplace' | 'dashboard' = 'marketplace',
    userId?: string,
    retry = 0
  ) => {
    console.log(`Fetching ${status} offers for ${viewMode} view (retry: ${retry})`);
    if (retry > 3) {
      console.error('Max retries reached, giving up');
      setError('Unable to load offers after multiple attempts. Please refresh the page.');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get auth token for API calls
      let authToken = null;
      let authUserId = userId;
      
      // Try to get token from supabase auth
      try {
        const supabase = createClient();
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session?.access_token) {
          authToken = sessionData.session.access_token;
          authUserId = authUserId || sessionData.session?.user?.id;
          console.log('Using current session auth token for listings');
        }
      } catch (sessionError) {
        console.warn('Error getting session:', sessionError);
      }
      
      // If no token from session, try localStorage
      if (!authToken) {
        try {
          const tokenData = localStorage.getItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
          if (tokenData) {
            try {
              const parsedToken = JSON.parse(tokenData);
              if (parsedToken && parsedToken.access_token) {
                authToken = parsedToken.access_token;
                console.log('Using token from localStorage');
                
                // Also try to get user ID from localStorage if not provided
                if (!authUserId) {
                  authUserId = localStorage.getItem('jetstream_user_id') || undefined;
                  if (authUserId) {
                    console.log('Using user_id from localStorage');
                  }
                }
              }
            } catch (parseError) {
              console.warn('Error parsing localStorage token:', parseError);
            }
          }
        } catch (storageError) {
          console.warn('Error accessing localStorage:', storageError);
        }
      }
      
      // Construct the API URL with query parameters
      let url = `/api/jetshare/getOffers?status=${status}&viewMode=${viewMode}`;
      
      // Add parameter to request jet details
      url += '&include_aircraft_details=true';
      
      // Always append a timestamp to bust cache
      url += `&t=${Date.now()}`;
      
      // Basic request headers
      const headers: Record<string, string> = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      };
      
      // Add auth token if available
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      // Add user_id as query param for private browsing mode
      if (authUserId && url.indexOf('user_id=') === -1) {
        url += `&user_id=${encodeURIComponent(authUserId)}`;
      }
      
      // Log request details for debugging
      console.log(`JetShare request URL: ${url.substring(0, 100)}${url.length > 100 ? '...' : ''}`);
      console.log('JetShare request headers:', Object.keys(headers).join(', '));
      
      // Add timeout with AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout (increased from 10)
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include', // Important for cookie-based auth
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Handle auth errors specifically
        if (response.status === 401 || response.status === 403) {
          console.error('Authentication error fetching offers:', response.status);
          
          // If this is already a retry, fail gracefully
          if (retry >= 2) {
            console.error('Max retries reached for auth error, giving up');
            setError('Authentication failed. Please try refreshing the page or logging in again.');
            setIsLoading(false);
            return;
          }
          
          // Try to refresh auth and retry
          try {
            console.log('Auth error, attempting to refresh session and retry...');
            const supabase = createClient();
            const { data } = await supabase.auth.refreshSession();
            
            if (data.session) {
              console.log('Session refreshed, retrying fetch...');
              // Wait a moment for auth to propagate
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Retry with incremented retry count
              return fetchOffers(status, viewMode, userId, retry + 1);
            }
          } catch (refreshError) {
            console.error('Error refreshing session:', refreshError);
          }
        } else if (response.status === 500) {
          // For server errors, wait and retry with backoff
          console.error('Server error (500) fetching offers. Retrying with backoff...');
          
          // Check response for specific database relationship error
          try {
            const errorData = await response.json();
            
            // Check for the specific relationship error
            if (errorData?.details?.includes('relationship between') &&
                errorData?.details?.includes('jetshare_profiles')) {
              console.log('Detected database relationship error with profiles. Continuing with empty results...');
              
              // Instead of retrying, just continue with empty results since we know it will fail again
              setOffers([]);
              setError('Unable to load user profiles. Basic listing information is still available.');
              setIsLoading(false);
              return;
            }
          } catch (parseError) {
            // If we can't parse the response, just continue with standard retry logic
            console.warn('Could not parse error response:', parseError);
          }
          
          const backoffTime = Math.min(1000 * (retry + 1), 5000); // Exponential backoff with max of 5 seconds
          
          setTimeout(() => {
            fetchOffers(status, viewMode, userId, retry + 1);
          }, backoffTime);
          
          return;
        }
        
        // General error handling
        let errorMessage = 'Failed to fetch offers';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.error('Error details:', errorData);
        } catch (e) {
          // If we can't parse JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        setError(errorMessage);
        
        // For all errors, show empty state after a few seconds rather than spinning forever
        setTimeout(() => {
          setIsLoading(false);
          setOffers([]);
        }, 2000);
        
        return;
      }
      
      // Process successful response
      const data = await response.json();
      
      if (!data.offers || !Array.isArray(data.offers)) {
        console.warn('Unexpected response format - missing offers array:', data);
        setOffers([]);
      } else {
        // Enhance offers with default user info if missing
        const enhancedOffers = data.offers.map((offer: JetShareOfferWithUser) => {
          // Mark offers created by current user
          const isOwnOffer = authUserId && offer.user_id === authUserId;
          
          // Extract image URL from jet relation if available
          let imageUrl = null;
          if (offer.jet && offer.jet.image_url) {
            imageUrl = offer.jet.image_url;
            console.log(`Extracted image URL from jet relation: ${imageUrl}`);
          }
          
          // Check if user info is missing and provide defaults
          if (!offer.user) {
            return {
              ...offer,
              isOwnOffer,
              image_url: imageUrl,
              user: {
                id: offer.user_id,
                first_name: "Jet",
                last_name: "Owner"
              }
            };
          }
          return {
            ...offer,
            isOwnOffer,
            image_url: imageUrl
          };
        });
        
        setOffers(enhancedOffers || []);
        console.log(`Fetched ${enhancedOffers?.length || 0} ${status} offers`);
      }
      
      setError(null);
    } catch (error) {
      console.error('Error fetching offers:', error);
      
      // Handle aborted requests separately
      if (error instanceof DOMException && error.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Failed to fetch offers. Please try again later.');
      }
      
      // For network errors, retry once after a delay
      if (error instanceof TypeError && error.message.includes('fetch') && retry < 2) {
        console.log('Network error, retrying after delay...');
        setTimeout(() => {
          fetchOffers(status, viewMode, userId, retry + 1);
        }, 2000);
        return;
      }
      
      // Set empty offers array on error to avoid showing stale data
      setOffers([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch offers on mount and at intervals
  useEffect(() => {
    // Execute fetch on component mount
    fetchOffers();
    
    // Set up a refresh interval to occasionally reload the offers
    const interval = setInterval(() => {
      fetchOffers();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, [user, router]);
  
  // Check for resumed offer acceptance after login
  useEffect(() => {
    // Only try to resume if user is authenticated
    if (user) {
      try {
        const resumeOfferId = sessionStorage.getItem('jetshare_resume_offer_acceptance');
        if (resumeOfferId) {
          console.log('Resuming offer acceptance after login:', resumeOfferId);
          
          // Clear from session storage to prevent repeated attempts
          sessionStorage.removeItem('jetshare_resume_offer_acceptance');
          
          // Find the offer in our loaded offers
          const offerToResume = offers.find(offer => offer.id === resumeOfferId);
          if (offerToResume) {
            // Trigger the confirmation dialog
            setSelectedOffer(offerToResume);
            setShowConfirmDialog(true);
          } else {
            // If we can't find the offer, refresh to see if it's still available
            console.log('Offer not found in current list, refreshing...');
            fetchOffers();
          }
        }
      } catch (e) {
        console.warn('Could not access sessionStorage:', e);
      }
    }
  }, [user, offers]);
  
  // Filter and sort offers
  useEffect(() => {
    console.log('Filter/sort effect running, offers length:', offers.length);
    let result = [...offers];
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(offer => 
        offer.departure_location.toLowerCase().includes(term) ||
        offer.arrival_location.toLowerCase().includes(term)
      );
    }
    
    // Apply departure filter
    if (departureFilter) {
      result = result.filter(offer => 
        offer.departure_location.toLowerCase().includes(departureFilter.toLowerCase())
      );
    }
    
    // Apply arrival filter
    if (arrivalFilter) {
      result = result.filter(offer => 
        offer.arrival_location.toLowerCase().includes(arrivalFilter.toLowerCase())
      );
    }
    
    // Apply price filters
    if (minPriceFilter) {
      const minPrice = parseFloat(minPriceFilter);
      if (!isNaN(minPrice)) {
        result = result.filter(offer => offer.requested_share_amount >= minPrice);
      }
    }
    
    if (maxPriceFilter) {
      const maxPrice = parseFloat(maxPriceFilter);
      if (!isNaN(maxPrice)) {
        result = result.filter(offer => offer.requested_share_amount <= maxPrice);
      }
    }
    
    // Apply sorting
    switch (sortOption) {
      case 'date-asc':
        result.sort((a, b) => new Date(a.flight_date).getTime() - new Date(b.flight_date).getTime());
        break;
      case 'date-desc':
        result.sort((a, b) => new Date(b.flight_date).getTime() - new Date(a.flight_date).getTime());
        break;
      case 'price-asc':
        result.sort((a, b) => a.requested_share_amount - b.requested_share_amount);
        break;
      case 'price-desc':
        result.sort((a, b) => b.requested_share_amount - a.requested_share_amount);
        break;
    }
    
    console.log('Setting filtered offers:', result.length);
    setFilteredOffers(result);
  }, [offers, searchTerm, sortOption, departureFilter, arrivalFilter, minPriceFilter, maxPriceFilter]);
  
  // Ensure auth session is fresh before making important API calls
  const ensureAuthSession = async (): Promise<boolean> => {
    console.log('Ensuring fresh auth session before API call...');
    
    // First try the standard refresh via auth context
    try {
      const refreshed = await refreshSession();
      if (refreshed) {
        console.log('Session refreshed successfully via auth context');
        return true;
      }
    } catch (refreshError) {
      console.warn('Error in standard session refresh:', refreshError);
    }
    
    // If that fails, try direct client refresh
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.refreshSession();
      
      if (!error && data.session) {
        console.log('Session refreshed successfully via direct client call');
        return true;
      } else if (error) {
        console.warn('Failed to refresh session via direct client call:', error);
      }
    } catch (directRefreshError) {
      console.warn('Error in direct session refresh:', directRefreshError);
    }
    
    // Try multiple sources for auth token - for improved reliability
    let authToken = null;
    let authTokenSource = '';
    
    // First try to get token from supabase auth
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.access_token) {
        authToken = sessionData.session.access_token;
        authTokenSource = 'current session';
      }
    } catch (sessionError) {
      console.warn('Error getting session:', sessionError);
    }
    
    // Then try localStorage JWT token if available
    if (!authToken) {
      try {
        const storedToken = localStorage.getItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
        if (storedToken) {
          const tokenData = JSON.parse(storedToken);
          if (tokenData?.access_token) {
            authToken = tokenData.access_token;
            authTokenSource = 'localStorage';
          }
        }
      } catch (e) {
        console.warn('Error accessing localStorage for auth token:', e);
      }
    }
    
    // If we still don't have a token, try refresh
    if (!authToken) {
      try {
        console.log('No auth token found, attempting to refresh session...');
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (refreshData?.session?.access_token) {
          authToken = refreshData.session.access_token;
          authTokenSource = 'refreshed session';
        }
      } catch (refreshError) {
        console.warn('Error refreshing session:', refreshError);
      }
    }
    
    return false;
  };

  const handleOfferAccept = async (offer: EnhancedJetShareOfferWithUser) => {
    setSelectedOffer(offer);
    
    // Instead of showing a confirmation dialog, go straight to details
    setShowDetailDialog(true);
    setShowConfirmDialog(false);
  };
  
  const confirmOfferAccept = async () => {
    // Early return if selectedOffer is null
    if (!selectedOffer) {
      console.error('Cannot accept offer: No offer selected');
      toast.error('Something went wrong. Please try again.');
      return;
    }

    try {
      // Show loading state immediately for better UX
      setIsAccepting(true);
      setError(null);
      
      // Get user ID from all possible sources for robustness
      const currentUserId: string | undefined = user?.id;
      let hasValidSession = !!user;
      let authToken = null;
      
      // Skip extensive auth recovery attempts if we already have a user ID
      if (!currentUserId) {
        // Try localStorage as a quick alternative
        try {
          const storedUserId = localStorage.getItem('jetstream_user_id');
          if (storedUserId) {
            console.log('Using cached user ID from localStorage:', storedUserId);
            // Use this userId instead of modifying currentUserId (which is const)
            // We'll use this in the payload directly
            const payload = { 
              offer_id: selectedOffer.id,
              payment_method: 'fiat', // Default to fiat payments
              user_id: storedUserId // Type-safe user ID from localStorage
            };
            
            console.log('Accepting offer with payload:', { offer_id: payload.offer_id, user_id: payload.user_id });
            
            // Make the API call to accept the offer - simplified headers
            const timestamp = Date.now();
            const requestId = Math.random().toString(36).substring(2, 15);
            
            const response = await fetch(`/api/jetshare/acceptOffer?t=${timestamp}&rid=${requestId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store'
              },
              body: JSON.stringify(payload),
              credentials: 'include', // Important for cookie-based auth
            });
            
            // Parse the API response
            const apiData = await response.json();
            
            // Continue with response handling as before
            // Handle API response
            if (!response.ok) {
              console.warn('Error from accept offer API:', apiData);
              
              // Special case for authentication errors
              if (response.status === 401) {
                console.log('Authentication needed for booking. Storing offer info and redirecting to payment page directly.');
                
                // Store the offer ID in localStorage for later recovery
                try {
                  localStorage.setItem('current_payment_offer_id', selectedOffer.id);
                } catch (e) {
                  console.warn('Error storing offer ID in localStorage:', e);
                }
                
                // Go directly to the payment page which handles authentication more gracefully
                window.location.href = `/jetshare/payment/${selectedOffer.id}?t=${Date.now()}&from=listing_direct`;
                return;
              }
              
              throw new Error(apiData.message || 'Failed to accept offer');
            }
            
            // Handle successful response
            console.log('Offer acceptance successful:', apiData);
            
            // Use the redirect URL from the API if available
            let redirectUrl = apiData.data?.redirect_url || `/jetshare/payment/${selectedOffer.id}?from=accept`;
            
            // Add timestamp to prevent caching issues
            if (!redirectUrl.includes('?')) {
              redirectUrl += `?t=${Date.now()}`;
            } else if (!redirectUrl.includes('t=')) {
              redirectUrl += `&t=${Date.now()}`;
            }
            
            // Store essential data for recovery
            try {
              localStorage.setItem('current_payment_offer_id', selectedOffer.id);
            } catch (e) {
              console.warn('Error storing offer ID in localStorage:', e);
            }
            
            toast.success('Proceeding to payment...');
            
            // Use window.location for a hard redirect
            window.location.href = redirectUrl;
            return;
          }
        } catch (e) {
          console.warn('Error reading localStorage user ID:', e);
        }

        // If still no user ID from localStorage, go directly to payment page 
        // which has better auth handling
        console.log('No user ID found, redirecting to payment page directly');
        try {
          localStorage.setItem('current_payment_offer_id', selectedOffer.id);
        } catch (e) {
          console.warn('Error storing offer ID in localStorage:', e);
        }
        
        // Go to payment page which will handle auth correctly
        window.location.href = `/jetshare/payment/${selectedOffer.id}?t=${Date.now()}&from=listing_direct_noauth`;
        return;
      }
      
      // If we have a currentUserId, continue with original flow
      const payload = { 
        offer_id: selectedOffer.id,
        payment_method: 'fiat', // Default to fiat payments
        user_id: currentUserId 
      };

      console.log('Accepting offer with payload:', { offer_id: payload.offer_id, user_id: payload.user_id });
      
      // Make the API call to accept the offer - simplified headers
      const timestamp = Date.now();
      const requestId = Math.random().toString(36).substring(2, 15);
      
      const response = await fetch(`/api/jetshare/acceptOffer?t=${timestamp}&rid=${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store'
        },
        body: JSON.stringify(payload),
        credentials: 'include', // Important for cookie-based auth
      });
      
      // Parse the API response
      const apiData = await response.json();
      
      // Handle API response
      if (!response.ok) {
        console.warn('Error from accept offer API:', apiData);
        
        // Special case for authentication errors
        if (response.status === 401) {
          console.log('Authentication needed for booking. Storing offer info and redirecting to payment page directly.');
          
          // Store the offer ID in localStorage for later recovery
          try {
            localStorage.setItem('current_payment_offer_id', selectedOffer.id);
          } catch (e) {
            console.warn('Error storing offer ID in localStorage:', e);
          }
          
          // Go directly to the payment page which handles authentication more gracefully
          window.location.href = `/jetshare/payment/${selectedOffer.id}?t=${Date.now()}&from=listing_direct`;
          return;
        }
        
        throw new Error(apiData.message || 'Failed to accept offer');
      }
      
      // Handle successful response
      console.log('Offer acceptance successful:', apiData);
      
      // Use the redirect URL from the API if available
      let redirectUrl = apiData.data?.redirect_url || `/jetshare/payment/${selectedOffer.id}?from=accept`;
      
      // Add timestamp to prevent caching issues
      if (!redirectUrl.includes('?')) {
        redirectUrl += `?t=${Date.now()}`;
      } else if (!redirectUrl.includes('t=')) {
        redirectUrl += `&t=${Date.now()}`;
      }
      
      // Store essential data for recovery
      try {
        localStorage.setItem('current_payment_offer_id', selectedOffer.id);
      } catch (e) {
        console.warn('Error storing offer ID in localStorage:', e);
      }
      
      toast.success('Proceeding to payment...');
      
      // Use window.location for a hard redirect
      window.location.href = redirectUrl;
    } catch (error) {
      console.error('Error accepting offer:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      toast.error('Failed to accept offer. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    setDepartureFilter('');
    setArrivalFilter('');
    setMinPriceFilter('');
    setMaxPriceFilter('');
    setSearchTerm('');
  };
  
  // Function to get a valid jet image URL with fallbacks
  const getJetImageUrl = (offer: EnhancedJetShareOfferWithUser): string => {
    const aircraft_model = offer.aircraft_model || '';
    
    console.log('Offer debug for image URL:', {
      id: offer.id,
      aircraft_model,
      jet_id: offer.jet_id,
      image_url: offer.image_url,
      has_jet: !!offer.jet,
      jet_details: offer.jet ? {
        id: offer.jet.id,
        manufacturer: offer.jet.manufacturer,
        model: offer.jet.model,
        image_url: offer.jet.image_url
      } : null
    });
    
    // First, check if the offer has a direct image_url property
    if (offer.image_url) {
      console.log(`Using direct image_url from offer: ${offer.image_url}`);
      return offer.image_url;
    }
    
    // Second, check if the offer has a jet object with image_url
    if (offer.jet && offer.jet.image_url) {
      console.log(`Using image_url from jet object: ${offer.jet.image_url}`);
      return offer.jet.image_url;
    }
    
    // Third, try to construct a URL from the aircraft_model property
    if (aircraft_model) {
      // Map common model names to known image files
      const modelImageMap: Record<string, string> = {
        'PC-12NGX': '/images/jets/pilatus/PC24.jpg',
        'PC-12': '/images/jets/pilatus/PC24.jpg',
        'PC-24': '/images/jets/pilatus/PC24.jpg',
        'King Air 350i': '/images/jets/beechcraft/KingAir350.jpg',
        'King Air': '/images/jets/beechcraft/KingAir350.jpg',
        'Gulfstream': '/images/jets/gulfstream/g600.jpg',
        'Gulfstream G650': '/images/jets/gulfstream/g600.jpg',
      };
      
      // Check if we have a direct mapping for this model
      const modelName = aircraft_model.trim();
      if (modelImageMap[modelName]) {
        console.log(`Using mapped image path for ${modelName}: ${modelImageMap[modelName]}`);
        return modelImageMap[modelName];
      }
      
      // Try manufacturer detection (less likely to work but worth a try)
      const manufacturerDetectionMap: Record<string, string> = {
        'Pilatus': 'pilatus',
        'PC': 'pilatus',
        'Beechcraft': 'beechcraft',
        'King': 'beechcraft',
        'Gulfstream': 'gulfstream',
        'G': 'gulfstream',
        'Cessna': 'cessna',
        'Citation': 'cessna',
        'Bombardier': 'bombardier',
        'Learjet': 'bombardier',
        'Challenger': 'bombardier',
        'Global': 'bombardier',
        'Embraer': 'embraer',
        'Phenom': 'embraer',
        'Legacy': 'embraer',
        'Dassault': 'dassault',
        'Falcon': 'dassault',
        'HondaJet': 'hondajet',
        'Honda': 'hondajet',
      };
      
      // Try to find a manufacturer match
      let manufacturer = '';
      const modelWords = aircraft_model.split(' ');
      for (const word of modelWords) {
        if (manufacturerDetectionMap[word]) {
          manufacturer = manufacturerDetectionMap[word];
          break;
        }
      }
      
      // If we found a manufacturer, try common filenames
      if (manufacturer) {
        // Try simplified name with just the first segment (e.g., "PC24" from "PC-24 NGX")
        const simplifiedName = modelName.split(' ')[0].replace(/[^\w]/g, '');
        const simplifiedUrl = `/images/jets/${manufacturer}/${simplifiedName}.jpg`;
        console.log(`Using simplified path: ${simplifiedUrl}`);
        return simplifiedUrl;
      }
    }
    
    // Final fallback
    console.log('No image path found, using placeholder');
    return '/images/placeholder-jet.jpg';
  };
  
  // Render flight share cards
  const renderOfferCard = (offer: EnhancedJetShareOfferWithUser) => (
    <Card 
      key={offer.id || `offer-${Math.random().toString(36).substring(2, 10)}`} 
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer relative"
      onClick={() => !offer.isOwnOffer && handleOfferAccept(offer)}
    >
      {/* Add background image based on aircraft model */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 z-0"
        style={{ 
          backgroundImage: `url(${getJetImageUrl(offer)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.7) contrast(1.1)'
        }}
        aria-hidden="true"
      />
      {/* Add semi-transparent gradient overlay for better text readability */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-gray-900/70 via-gray-800/60 to-gray-900/80 z-0"
        aria-hidden="true"
      />
      
      <div className="relative z-10">
        {offer.isOwnOffer && (
          <div className="absolute top-0 right-0 m-2 z-10">
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 font-semibold">
              Your Offer
            </Badge>
          </div>
        )}
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{offer.departure_location} to {offer.arrival_location}</CardTitle>
              <CardDescription>
                <div className="flex flex-col mt-1">
                  <div className="flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1 opacity-70" />
                    <span>{new Date(offer.flight_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <Clock className="h-3.5 w-3.5 mr-1 opacity-70" />
                    <span>{offer.departure_time ? formatTime(offer.departure_time) : formatTime(offer.flight_date)}</span>
                  </div>
                </div>
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">${offer.requested_share_amount.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                {((offer.requested_share_amount / offer.total_flight_cost) * 100).toFixed(0)}% of ${offer.total_flight_cost.toLocaleString()}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="flex items-center gap-2 mt-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {offer.user?.first_name?.[0] || 'U'}
                {offer.user?.last_name?.[0] || 'U'}
              </AvatarFallback>
              {offer.user?.avatar_url && (
                <AvatarImage src={offer.user.avatar_url} alt={`${offer.user?.first_name || 'User'} ${offer.user?.last_name || ''}`} />
              )}
            </Avatar>
            <span className="text-sm">
              {offer.isOwnOffer ? 'You' : (offer.user?.first_name ? `${offer.user.first_name} ${offer.user.last_name?.[0] || ''}` : 'Jet Owner')}
              {(offer.user as UserWithVerification)?.verification_status === 'verified' && (
                <CheckCircle className="h-3 w-3 text-green-500 inline ml-1" />
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{offer.available_seats} of {offer.total_seats} seats available</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Plane className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{offer.aircraft_model || 'Aircraft info unavailable'}</span>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          {offer.isOwnOffer ? (
            <div className="flex w-full gap-2">
              <Button 
                className="flex-1" 
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card onClick from firing
                  router.push(`/jetshare/create?edit=${offer.id}`);
                }}
              >
                Edit Offer
              </Button>
              <Button 
                className="flex-1" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card onClick from firing
                  setSelectedOffer(offer);
                  setShowDetailDialog(true);
                }}
              >
                View Details
              </Button>
            </div>
          ) : (
            <Button 
              className="w-full" 
              onClick={(e) => {
                e.stopPropagation(); // Prevent card onClick from firing
                setSelectedOffer(offer);
                if (user) {
                  setShowConfirmDialog(true);
                } else {
                  setShowDetailDialog(true);
                }
              }}
            >
              View Details
            </Button>
          )}
        </CardFooter>
      </div>
    </Card>
  );
  
  // DEBUG: Add a hidden function to run SQL fix if needed (triggered by keyboard shortcut)
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Alt+F10 will trigger the fix (obscure enough to not be triggered accidentally)
      if (e.altKey && e.key === 'F10') {
        console.log('Running SQL fix for status constraint issue...');
        
        try {
          const response = await fetch('/api/jetshare/runSql', {
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache' }
          });
          
          const result = await response.json();
          
          if (result.success) {
            console.log('SQL fix completed successfully');
            toast.success('Database fix applied successfully');
          } else {
            console.error('SQL fix error:', result);
            toast.error('Error applying database fix');
          }
        } catch (error) {
          console.error('Error running SQL fix:', error);
          toast.error('Failed to run database fix');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <div>
      {/* Debug state */}
      {/* {console.log('Rendering JetShareListingsContent, isLoading:', isLoading, 'filteredOffers:', filteredOffers.length)} */}
      {/* Search and filter bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by departure or arrival location..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-asc">Date (Earliest)</SelectItem>
                <SelectItem value="date-desc">Date (Latest)</SelectItem>
                <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                <SelectItem value="price-desc">Price (High to Low)</SelectItem>
              </SelectContent>
            </Select>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Options</SheetTitle>
                  <SheetDescription>
                    Narrow down flight shares based on your preferences.
                  </SheetDescription>
                </SheetHeader>
                
                <div className="space-y-4 py-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Departure Location</label>
                    <Input
                      placeholder="E.g. New York"
                      value={departureFilter}
                      onChange={(e) => setDepartureFilter(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Arrival Location</label>
                    <Input
                      placeholder="E.g. Miami"
                      value={arrivalFilter}
                      onChange={(e) => setArrivalFilter(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price Range</label>
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="Min"
                        type="number"
                        value={minPriceFilter}
                        onChange={(e) => setMinPriceFilter(e.target.value)}
                      />
                      <span>to</span>
                      <Input
                        placeholder="Max"
                        type="number"
                        value={maxPriceFilter}
                        onChange={(e) => setMaxPriceFilter(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <SheetFooter>
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                  <SheetClose asChild>
                    <Button>Apply Filters</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        {/* Active filters display */}
        {(departureFilter || arrivalFilter || minPriceFilter || maxPriceFilter) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {departureFilter && (
              <UIBadge variant="secondary" className="flex items-center gap-1">
                From: {departureFilter}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setDepartureFilter('')}
                />
              </UIBadge>
            )}
            
            {arrivalFilter && (
              <UIBadge variant="secondary" className="flex items-center gap-1">
                To: {arrivalFilter}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setArrivalFilter('')}
                />
              </UIBadge>
            )}
            
            {(minPriceFilter || maxPriceFilter) && (
              <UIBadge variant="secondary" className="flex items-center gap-1">
                Price: {minPriceFilter ? `$${minPriceFilter}` : '$0'} - {maxPriceFilter ? `$${maxPriceFilter}` : 'Any'}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setMinPriceFilter('');
                    setMaxPriceFilter('');
                  }}
                />
              </UIBadge>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={clearFilters}
            >
              Clear All
            </Button>
          </div>
        )}
      </div>
      
      {/* Main content */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center">
            Available Flight Shares
            {!isLoading && filteredOffers.length > 0 && (
              <Badge className="ml-2 text-xs">
                {filteredOffers.length} {filteredOffers.length === 1 ? 'offer' : 'offers'}
              </Badge>
            )}
          </h2>
          <div className="flex gap-2">
            <Button onClick={() => router.push('/jetshare/offer')}>
              Create Offer
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredOffers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* We have {filteredOffers.length} offers to display */}
            {filteredOffers.map((offer, index) => (
              <Fragment key={offer.id || index}>
                {renderOfferCard(offer)}
              </Fragment>
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState />
            {error && (
              <p className="text-center text-red-500 mt-2">{error}</p>
            )}
          </div>
        )}
      </div>
      
      {/* Payment confirmation dialog */}
      <Dialog 
        open={showConfirmDialog && selectedOffer !== null} 
        onOpenChange={(open) => {
          setShowConfirmDialog(open);
          if (!open) {
            // Allow time for the animation to complete before removing the offer
            setTimeout(() => {
              if (!isAccepting) {
                setSelectedOffer(null);
              }
            }, 300);
          }
        }}
      >
        <DialogContent 
          className="sm:max-w-md" 
          onInteractOutside={(e) => {
            // Prevent closing the dialog when accepting an offer
            if (isAccepting) {
              e.preventDefault();
            }
          }}
        >
          {selectedOffer && (
            <>
              <DialogHeader>
                <DialogTitle>Confirm Flight Share</DialogTitle>
                <DialogDescription>
                  You are about to book a shared flight from {selectedOffer.departure_location} to {selectedOffer.arrival_location} for ${selectedOffer.requested_share_amount.toLocaleString()}.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <div>
                      <span className="text-sm text-muted-foreground">From</span>
                      <p className="font-medium">{selectedOffer.departure_location}</p>
                    </div>
                    <Plane className="h-5 w-5 mx-4 transform rotate-90" />
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground">To</span>
                      <p className="font-medium">{selectedOffer.arrival_location}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Flight Date</span>
                      </div>
                      <p className="font-medium">{new Date(selectedOffer.flight_date).toLocaleDateString()}</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Your Share Cost</span>
                      </div>
                      <p className="font-medium">${selectedOffer.requested_share_amount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowConfirmDialog(false);
                    // Allow animation to complete before clearing selection
                    setTimeout(() => {
                      setSelectedOffer(null);
                      setIsAccepting(false);
                    }, 300);
                  }}
                  disabled={isAccepting}
                >
                  Cancel
                </Button>
                
                <Button 
                  onClick={() => confirmOfferAccept()}
                  disabled={isAccepting}
                  className="dialog-content"
                >
                  {isAccepting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Continue to Booking
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Offer details dialog */}
      <Dialog 
        open={selectedOffer !== null && !showConfirmDialog} 
        onOpenChange={(open) => {
          if (!open) {
            // Allow animation to complete before clearing selection
            setTimeout(() => setSelectedOffer(null), 300);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          {selectedOffer && (
            <>
              <DialogHeader>
                <DialogTitle>Flight Share Details</DialogTitle>
                <DialogDescription>
                  Review the details of this flight share offer.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-3">
                <div className="flex justify-between items-center border-b pb-3">
                  <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedOffer.departure_location}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 mx-2" />
                  <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4 text-muted-foreground rotate-90" />
                    <span className="font-medium">{selectedOffer.arrival_location}</span>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{new Date(selectedOffer.flight_date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Requested Share</p>
                    <p className="font-medium">${selectedOffer.requested_share_amount.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Flight Cost</p>
                    <p className="font-medium">${selectedOffer.total_flight_cost.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Share Percentage</p>
                    <p className="font-medium">
                      {((selectedOffer.requested_share_amount / selectedOffer.total_flight_cost) * 100).toFixed(0)}
                    </p>
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground">Offered by</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar>
                      <AvatarFallback>
                        {selectedOffer.user?.first_name?.[0] || 'U'}
                        {selectedOffer.user?.last_name?.[0] || 'U'}
                      </AvatarFallback>
                      {selectedOffer.user?.avatar_url && (
                        <AvatarImage 
                          src={selectedOffer.user.avatar_url} 
                          alt={`${selectedOffer.user?.first_name || 'User'} ${selectedOffer.user?.last_name || ''}`} 
                        />
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {selectedOffer.user?.first_name ? 
                          `${selectedOffer.user.first_name} ${selectedOffer.user.last_name || ''}` : 
                          'Jet Owner'}
                        {(selectedOffer.user as UserWithVerification)?.verification_status === 'verified' && (
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 inline ml-1" />
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        This flight share is offered by a verified JetShare user. The requested share amount is
                        {' '}{((selectedOffer.requested_share_amount / selectedOffer.total_flight_cost) * 100).toFixed(0)}
                        {' '}of the total flight cost.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {!selectedOffer.isOwnOffer ? (
                <DialogFooter className="sm:justify-start">
                  <div className="w-full space-y-2">
                    <Button 
                      className="w-full details-dialog" 
                      onClick={() => confirmOfferAccept()}
                      disabled={isAccepting}
                    >
                      {isAccepting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Book This Flight
                        </>
                      )}
                    </Button>
                  </div>
                </DialogFooter>
              ) : (
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      // Allow animation to complete before clearing selection
                      setTimeout(() => setSelectedOffer(null), 300);
                    }}
                    className="details-dialog"
                  >
                    Close
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 