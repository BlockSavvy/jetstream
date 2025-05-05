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
  Clock,
  Pencil
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
    images?: string[];
    category?: string;
    capacity?: number;
    range_nm?: number;
    cruise_speed_kts?: number;
    tail_number?: string;
    description?: string;
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
    <div className="bg-black rounded-full w-20 h-20 flex items-center justify-center mb-6 border-2 border-gdyup-primary shadow-[0_0_20px_rgba(218,255,13,0.3)]">
      <Plane className="h-10 w-10 gdyup-primary" />
    </div>
    <h3 className="text-xl font-bold mb-3 text-white">No Flight Shares Available</h3>
    <p className="text-white max-w-md mb-6">
      There are no flight shares available that match your criteria. Try adjusting your filters or check back later.
    </p>
    <Button 
      onClick={() => window.location.reload()} 
      className="bg-gdyup-primary text-black hover:bg-gdyup-primary/90 border-0 font-medium shadow-md"
    >
      <RefreshCw className="h-4 w-4 mr-2" />
      Refresh Listings
    </Button>
  </div>
);

// Skeleton loader for cards
const SkeletonCard = () => (
  <Card className="overflow-hidden bg-gray-900 border border-gray-800">
    <CardHeader className="pb-2">
      <Skeleton className="h-6 w-3/4 mb-2 bg-gray-800" />
      <Skeleton className="h-4 w-1/2 bg-gray-800" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full bg-gray-800" />
          <Skeleton className="h-4 w-1/3 bg-gray-800" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full bg-gray-800" />
          <Skeleton className="h-4 w-1/3 bg-gray-800" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full bg-gray-800" />
          <Skeleton className="h-4 w-1/3 bg-gray-800" />
        </div>
      </div>
    </CardContent>
    <CardFooter>
      <Skeleton className="h-10 w-full rounded-md bg-gray-800" />
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
    setIsAccepting(true);
    
    // Ensure we have a selected offer
    if (!selectedOffer) {
      toast.error('No offer selected');
      setIsAccepting(false);
      return;
    }
    
    try {
      const apiUrl = `/api/jetshare/acceptOffer`;
      console.log(`Attempting to accept offer ${selectedOffer.id} via ${apiUrl}`);
      
      // Make API request to accept the offer
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offer_id: selectedOffer.id,
          accept_type: 'full',
        }),
      });
      
      // Parse the response JSON
      let apiData;
      try {
        apiData = await response.json();
      } catch (jsonError) {
        console.error('Error parsing response JSON:', jsonError);
        throw new Error('Failed to parse server response');
      }
      
      console.log('Accept offer API response:', apiData);
      
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
          
          // Instead of direct navigation which might cause issues, use router.push first
          // with a fallback to direct navigation
          try {
            router.push(`/gdyup/payment/${selectedOffer.id}?t=${Date.now()}&from=listing_direct`);
            
            // Add fallback direct navigation after a short delay
            setTimeout(() => {
              window.location.href = `/gdyup/payment/${selectedOffer.id}?t=${Date.now()}&from=listing_direct`;
            }, 300);
          } catch (navError) {
            console.error('Navigation error:', navError);
            // Ultimate fallback - direct location change
            window.location.href = `/gdyup/payment/${selectedOffer.id}?t=${Date.now()}&from=listing_direct`;
          }
          return;
        }
        
        throw new Error(apiData.message || 'Failed to accept offer');
      }
      
      // Handle successful response
      console.log('Offer acceptance successful:', apiData);
      
      // Use the redirect URL from the API if available
      let redirectUrl = apiData.data?.redirect_url || `/gdyup/payment/${selectedOffer.id}?from=accept`;
      
      // Add timestamp to prevent caching issues
      if (!redirectUrl.includes('?')) {
        redirectUrl += `?t=${Date.now()}`;
      } else if (!redirectUrl.includes('t=')) {
        redirectUrl += `&t=${Date.now()}`;
      }
      
      // Store essential data for recovery
      try {
        localStorage.setItem('current_payment_offer_id', selectedOffer.id);
        localStorage.setItem('last_accepted_offer_id', selectedOffer.id);
        localStorage.setItem('last_action', 'offer_accepted');
      } catch (e) {
        console.warn('Error storing offer ID in localStorage:', e);
      }
      
      toast.success('Proceeding to payment...');
      
      // Use router.push first for cleaner navigation
      try {
        router.push(redirectUrl);
        
        // Fallback to direct navigation after a short delay
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 300);
      } catch (navError) {
        console.error('Navigation error:', navError);
        // Ultimate fallback - direct location change
        window.location.href = redirectUrl;
      }
      
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to accept offer');
      
      // Reset UI state
      setIsAccepting(false);
      setShowConfirmDialog(false);
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
    console.log(`Getting image for offer ${offer.id}`);
    
    // Priority 1: Direct image_url from the offer itself
    if (offer.image_url) {
      console.log(`Using direct image_url from offer: ${offer.image_url}`);
      return offer.image_url;
    }
    
    // Priority 2: Get from the jet relation
    if (offer.jet) {
      // Check for direct image_url on the jet - this should be the main source
      if (offer.jet.image_url) {
        console.log(`Using image_url from jet object: ${offer.jet.image_url}`);
        return offer.jet.image_url;
      }
      
      // Check for images array on the jet (alternative field)
      if (offer.jet.images && offer.jet.images.length > 0) {
        console.log(`Using first image from jet.images array: ${offer.jet.images[0]}`);
        return offer.jet.images[0];
      }
      
      // If we have manufacturer and model but no image, use simple path construction
      if (offer.jet.manufacturer && offer.jet.model) {
        // Use proper case for manufacturer (capitalize first letter)
        const manufacturer = offer.jet.manufacturer.trim().toLowerCase();
        const manufacturerFormatted = manufacturer.charAt(0).toUpperCase() + manufacturer.slice(1);
        
        // Use model directly, preserving case and spacing
        const model = offer.jet.model.trim();
        
        // Try with different capitalizations
        const paths = [
          `/images/jets/${manufacturerFormatted}/${model}.jpg`,
          `/images/jets/${manufacturer}/${model}.jpg`,
          `/images/jets/${manufacturer.toLowerCase()}/${model}.jpg`
        ];
        
        console.log(`Trying multiple paths for manufacturer/model: ${paths[0]}`);
        return paths[0]; // Return the first path, but the img tag will have onerror handler
      }
    }
    
    // Priority 3: Use aircraft_model field to build a path
    if (offer.aircraft_model) {
      try {
        const parts = offer.aircraft_model.split(' ');
        if (parts.length > 1) {
          // Get manufacturer and capitalize first letter
          const manufacturer = parts[0].trim();
          const manufacturerProper = manufacturer.charAt(0).toUpperCase() + manufacturer.slice(1);
          
          // Get model (rest of the string) preserving original format
          const model = parts.slice(1).join(' ').trim();
          
          // Standard path format
          const path = `/images/jets/${manufacturerProper}/${model}.jpg`;
          console.log(`Using aircraft_model path: ${path}`);
          return path;
        }
      } catch (e) {
        console.warn('Error building path from aircraft_model:', e);
      }
    }
    
    // Final fallback - use a standard default image that exists in the project
    console.log('No specific image found, using default');
    return '/images/placeholder-jet.jpg';
  };
  
  // Render flight share cards
  const renderOfferCard = (offer: EnhancedJetShareOfferWithUser) => (
    <Card 
      key={offer.id} 
      className="bg-gray-900 border-gray-800 overflow-hidden hover:border-gray-700 transition-all cursor-pointer hover:shadow-md gdyup-form"
      onClick={() => {
        setSelectedOffer(offer);
        setShowDetailDialog(true);
      }}
    >
      <div className="flex flex-col h-full">
        {/* Card hero - with background image and info overlay */}
        <div className="relative h-40 bg-gray-800 overflow-hidden">
          {/* Background image with fallback handling */}
          <img
            src={getJetImageUrl(offer)}
            alt={offer.aircraft_model || "Private Jet"}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              // If the specific image fails, try a series of fallbacks
              const target = e.currentTarget;
              
              // Try some known fallbacks that might exist
              const fallbacks = [
                '/images/jets/gulfstream/G650.jpg',
                '/images/jets/gulfstream/g650.jpg',
                '/images/jets/Gulfstream/G650.jpg',
                '/images/placeholder-jet.jpg'
              ];
              
              // If not already on the last fallback, try the next one
              const currentIndex = fallbacks.indexOf(target.src);
              if (currentIndex < fallbacks.length - 1) {
                console.log(`Image failed to load: ${target.src}, trying fallback`);
                target.src = fallbacks[currentIndex + 1];
              } else {
                // If all fallbacks failed, use a gradient background instead
                console.log('All image fallbacks failed, using gradient');
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.classList.add('bg-gradient-to-br', 'from-gray-700', 'to-gray-900');
                }
              }
            }}
          />
          
          {/* Gradient overlay for better text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent pointer-events-none"></div>
          
          {/* Own offer badge */}
          {offer.isOwnOffer && (
            <div className="absolute top-2 right-2 z-20">
              <Badge className="bg-gdyup-primary text-black border-transparent text-xs">Your Offer</Badge>
            </div>
          )}
        </div>
        
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base font-semibold gdyup-text-primary">
                {offer.departure_location} to {offer.arrival_location}
              </CardTitle>
              <CardDescription className="text-gray-400 text-sm">
                {new Date(offer.flight_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="gdyup-primary font-medium">${offer.requested_share_amount.toLocaleString()}</p>
              <p className="text-xs text-gray-400">
                {offer.available_seats && offer.available_seats > 1
                  ? `${offer.available_seats} seats left`
                  : '1 seat left'}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="py-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-start space-x-2">
              <Users className="h-4 w-4 mt-0.5 text-gray-400" />
              <div>
                <p className="text-white font-medium">
                  {((offer.requested_share_amount / offer.total_flight_cost) * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-gray-400">Share</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Plane className="h-4 w-4 mt-0.5 text-gray-400" />
              <div>
                <p className="text-white font-medium">
                  {offer.aircraft_model 
                    ? offer.aircraft_model.split(' ').slice(0, 2).join(' ') 
                    : offer.jet?.model || 'Private Jet'}
                </p>
                <p className="text-xs text-gray-400">Aircraft</p>
              </div>
            </div>
          </div>
        </CardContent>
        
        <div className="mt-auto">
          <CardFooter className="pt-2">
            {offer.isOwnOffer ? (
              <div className="w-full grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gdyup-button-secondary"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card onClick from firing
                    router.push(`/gdyup/offer/edit/${offer.id}`);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2 gdyup-icon" />
                  Edit
                </Button>
                <Button 
                  className="gdyup-button-primary" 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card onClick from firing
                    setSelectedOffer(offer);
                    setShowDetailDialog(true);
                  }}
                >
                  <Info className="h-4 w-4 mr-2 gdyup-icon" />
                  Details
                </Button>
              </div>
            ) : (
              <Button 
                className="w-full gdyup-button-primary" 
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
      <div className="bg-gray-900 rounded-lg shadow-md border border-gray-800 p-3 mb-4 gdyup-form">
        <div className="flex flex-col gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white" />
            <Input
              placeholder="Search locations..."
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 justify-between">
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-[130px] bg-gray-800 border-gray-700 text-white text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="date-asc">Date (Earliest)</SelectItem>
                <SelectItem value="date-desc">Date (Latest)</SelectItem>
                <SelectItem value="price-asc">Price (Low-High)</SelectItem>
                <SelectItem value="price-desc">Price (High-Low)</SelectItem>
              </SelectContent>
            </Select>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gdyup-button-primary">
                  <Filter className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Filters</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-gray-900 border-gray-800 text-white gdyup-form">
                <SheetHeader>
                  <SheetTitle className="text-white">Filters</SheetTitle>
                  <SheetDescription className="text-white">
                    Narrow down flight shares based on your preferences
                  </SheetDescription>
                </SheetHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">From</label>
                    <Input
                      placeholder="E.g. New York"
                      value={departureFilter}
                      onChange={(e) => setDepartureFilter(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-300"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">To</label>
                    <Input
                      placeholder="E.g. Miami"
                      value={arrivalFilter}
                      onChange={(e) => setArrivalFilter(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-300"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Price Range</label>
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="Min"
                        type="number"
                        value={minPriceFilter}
                        onChange={(e) => setMinPriceFilter(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-300"
                      />
                      <span className="text-white">to</span>
                      <Input
                        placeholder="Max"
                        type="number"
                        value={maxPriceFilter}
                        onChange={(e) => setMaxPriceFilter(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-300"
                      />
                    </div>
                  </div>
                </div>
                
                <SheetFooter>
                  <Button variant="outline" onClick={clearFilters} className="gdyup-button-secondary">
                    <X className="h-4 w-4 mr-2 gdyup-icon" />
                    <span>Clear</span>
                  </Button>
                  <SheetClose asChild>
                    <Button className="gdyup-button-primary">Apply</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        {/* Active filters display */}
        {(departureFilter || arrivalFilter || minPriceFilter || maxPriceFilter) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {departureFilter && (
              <UIBadge variant="secondary" className="flex items-center gap-1 bg-gray-800 text-white">
                From: {departureFilter}
                <X
                  className="h-3 w-3 cursor-pointer text-white hover:text-white"
                  onClick={() => setDepartureFilter('')}
                />
              </UIBadge>
            )}
            
            {arrivalFilter && (
              <UIBadge variant="secondary" className="flex items-center gap-1 bg-gray-800 text-white">
                To: {arrivalFilter}
                <X
                  className="h-3 w-3 cursor-pointer text-white hover:text-white"
                  onClick={() => setArrivalFilter('')}
                />
              </UIBadge>
            )}
            
            {(minPriceFilter || maxPriceFilter) && (
              <UIBadge variant="secondary" className="flex items-center gap-1 bg-gray-800 text-white">
                ${minPriceFilter || '0'} - ${maxPriceFilter || 'Any'}
                <X
                  className="h-3 w-3 cursor-pointer text-white hover:text-white"
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
              className="h-6 text-xs gdyup-button-secondary"
              onClick={clearFilters}
            >
              Clear All
            </Button>
          </div>
        )}
      </div>
      
      {/* Main content */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold gdyup-text-primary flex items-center">
            Available Flights
            {!isLoading && filteredOffers.length > 0 && (
              <Badge className="ml-2 text-xs bg-gdyup-primary text-black gdyup-badge">
                {filteredOffers.length}
              </Badge>
            )}
          </h2>
          <div className="flex gap-2">
            <Button onClick={() => router.push('/gdyup/offer')} className="gdyup-button-primary">
              Create Offer
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array(6).fill(0).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredOffers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* We have {filteredOffers.length} offers to display */}
            {filteredOffers.map((offer, index) => (
              <Fragment key={offer.id || index}>
                {renderOfferCard(offer)}
              </Fragment>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState />
            {error && (
              <p className="text-center text-red-400 mt-2">{error}</p>
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
          className="sm:max-w-md bg-gray-900 border-gray-800 text-white gdyup-dialog gdyup-form" 
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
                <DialogTitle className="text-white">Confirm Flight Share</DialogTitle>
                <DialogDescription className="text-gray-300">
                  You are about to book a shared flight from {selectedOffer.departure_location} to {selectedOffer.arrival_location} for ${selectedOffer.requested_share_amount.toLocaleString()}.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                    <div>
                      <span className="text-sm text-gray-400">From</span>
                      <p className="font-medium text-white">{selectedOffer.departure_location}</p>
                    </div>
                    <Plane className="h-5 w-5 mx-4 transform rotate-90 gdyup-primary" />
                    <div className="text-right">
                      <span className="text-sm text-gray-400">To</span>
                      <p className="font-medium text-white">{selectedOffer.arrival_location}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 gdyup-primary" />
                        <span className="text-sm text-gray-400">Flight Date</span>
                      </div>
                      <p className="font-medium text-white">{new Date(selectedOffer.flight_date).toLocaleDateString()}</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 gdyup-primary" />
                        <span className="text-sm text-gray-400">Your Share Cost</span>
                      </div>
                      <p className="font-medium gdyup-primary">${selectedOffer.requested_share_amount.toLocaleString()}</p>
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
                  className="gdyup-button-secondary"
                >
                  Cancel
                </Button>
                
                <Button 
                  onClick={() => confirmOfferAccept()}
                  disabled={isAccepting}
                  className="gdyup-button-primary"
                >
                  {isAccepting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin gdyup-icon" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4 gdyup-icon" />
                      <span>Book This Flight</span>
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
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800 text-white gdyup-dialog gdyup-form">
          {selectedOffer && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">Flight Share Details</DialogTitle>
                <DialogDescription className="text-gray-300">
                  Review the details of this flight share offer.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-3">
                <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                  <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4 gdyup-primary" />
                    <span className="font-medium text-white">{selectedOffer.departure_location}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                  <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4 gdyup-primary rotate-90" />
                    <span className="font-medium text-white">{selectedOffer.arrival_location}</span>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Date</p>
                    <p className="font-medium text-white">{new Date(selectedOffer.flight_date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Requested Share</p>
                    <p className="font-medium gdyup-primary">${selectedOffer.requested_share_amount.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Flight Cost</p>
                    <p className="font-medium text-white">${selectedOffer.total_flight_cost.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Share Percentage</p>
                    <p className="font-medium text-white">
                      {((selectedOffer.requested_share_amount / selectedOffer.total_flight_cost) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-gray-700">
                  <p className="text-sm text-gray-400">Offered by</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar>
                      <AvatarFallback className="bg-gray-800 text-gray-100">
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
                      <p className="font-medium text-white">
                        {selectedOffer.user?.first_name ? 
                          `${selectedOffer.user.first_name} ${selectedOffer.user.last_name || ''}` : 
                          'Jet Owner'}
                        {(selectedOffer.user as UserWithVerification)?.verification_status === 'verified' && (
                          <CheckCircle className="h-3.5 w-3.5 gdyup-primary inline ml-1" />
                        )}
                      </p>
                      <p className="text-xs text-gray-400">
                        This flight share is offered by a verified JetShare user. The requested share amount is
                        {' '}{((selectedOffer.requested_share_amount / selectedOffer.total_flight_cost) * 100).toFixed(0)}%
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
                      className="w-full gdyup-button-primary" 
                      onClick={() => confirmOfferAccept()}
                      disabled={isAccepting}
                    >
                      {isAccepting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin gdyup-icon" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <ArrowRight className="mr-2 h-4 w-4 gdyup-icon" />
                          <span>Book This Flight</span>
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
                    className="gdyup-button-secondary"
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