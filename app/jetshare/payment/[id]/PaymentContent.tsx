'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import JetSharePaymentForm from '../../components/JetSharePaymentForm';
import { JetShareOfferWithUser } from '@/types/jetshare';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Helper function to recover offer ID from various storage methods
function recoverOfferId(providedId?: string): string | null {
  // If we have a valid ID, use it
  if (providedId && providedId.length > 10 && providedId !== 'undefined') {
    console.log('Using provided offer ID:', providedId);
    return providedId;
  }
  
  console.log('Invalid offer ID provided, attempting recovery...');
  
  try {
    // Try multiple storage locations in order of preference
    const storageLocations = [
      { type: 'sessionStorage', key: 'current_payment_offer_id' },
      { type: 'localStorage', key: 'current_payment_offer_id' },
      { type: 'sessionStorage', key: 'jetshare_offer_id' },
      { type: 'localStorage', key: 'jetstream_last_offer_id' },
      { type: 'sessionStorage', key: 'pending_payment_id' },
      { type: 'localStorage', key: 'pending_payment_id' },
      { type: 'sessionStorage', key: 'jetshare_pending_offer' }
    ];
    
    for (const location of storageLocations) {
      try {
        const storage = location.type === 'localStorage' ? localStorage : sessionStorage;
        const value = storage.getItem(location.key);
        
        if (value && value.length > 10 && value !== 'undefined') {
          console.log(`Recovered offer ID from ${location.type}.${location.key}:`, value);
          return value;
        }
      } catch (e) {
        console.warn(`Error accessing ${location.type}.${location.key}:`, e);
      }
    }
    
    // Try URL query parameters
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const offerIdFromQuery = urlParams.get('offer_id');
      
      if (offerIdFromQuery && offerIdFromQuery.length > 10) {
        console.log('Recovered offer ID from URL query parameter:', offerIdFromQuery);
        return offerIdFromQuery;
      }
      
      // Also try just 'offer' param
      const offerParam = urlParams.get('offer');
      if (offerParam && offerParam.length > 10) {
        console.log('Recovered offer ID from URL offer parameter:', offerParam);
        return offerParam;
      }
    } catch (e) {
      console.warn('Error accessing URL parameters:', e);
    }
    
    console.error('Failed to recover valid offer ID from any source');
    return null;
  } catch (e) {
    console.error('Error in recoverOfferId:', e);
    return null;
  }
}

// Component now receives offerId as a prop directly from the server component
export default function PaymentContent({ offerId: propOfferId }: { offerId: string }) {
  const [offerId, setOfferId] = useState<string | null>(propOfferId);
  const router = useRouter();
  const { user, loading: authLoading, sessionError, refreshSession } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [offer, setOffer] = useState<JetShareOfferWithUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // On mount, attempt to refresh the session to ensure we have fresh tokens
  useEffect(() => {
    const syncAuthState = async () => {
      console.log('PaymentContent: Attempting to refresh session on mount');
      try {
        // First check if we already have auth issues
        if (sessionError && ('refresh_failed' in sessionError || sessionError.message?.includes('expired'))) {
          console.log('PaymentContent: Session already has refresh failure, skipping refresh attempt');
          return;
        }
        
        // Check local storage for tokens
        let hasLocalTokens = false;
        try {
          const tokenData = localStorage.getItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
          if (tokenData) {
            const parsed = JSON.parse(tokenData);
            hasLocalTokens = !!(parsed?.access_token && parsed?.refresh_token);
            console.log('PaymentContent: localStorage has tokens:', hasLocalTokens);
          }
        } catch (e) {
          console.warn('PaymentContent: Error checking localStorage tokens:', e);
        }
        
        // Only attempt refresh if we seem to have tokens
        if (hasLocalTokens) {
          const refreshResult = await refreshSession();
          if (refreshResult) {
            console.log('PaymentContent: Session refresh successful');
          } else {
            console.warn('PaymentContent: Session refresh failed, may need to login');
            // We'll show login UI via sessionError from auth provider
          }
        } else {
          console.log('PaymentContent: No tokens found, user likely needs to login');
        }
      } catch (e) {
        console.warn('PaymentContent: Session refresh failed with error:', e);
      }
    };
    
    syncAuthState();
  }, [refreshSession, sessionError]);
  
  // Validate the offer ID param and recover if needed
  useEffect(() => {
    if (!propOfferId || propOfferId === 'undefined' || propOfferId.length < 10) {
      console.warn("Invalid offerId prop received, attempting recovery...");
      const recovered = recoverOfferId();
      
      if (recovered) {
        setOfferId(recovered);
        
        // If we're on the wrong URL, redirect to the correct one
        if (recovered !== propOfferId) {
          window.location.href = `/jetshare/payment/${recovered}?t=${Date.now()}&recovered=true`;
        }
      } else {
        // Failed to recover, redirect to listings
        toast.error('Unable to find offer details. Redirecting to listings.');
        setTimeout(() => {
          window.location.href = '/jetshare/listings';
        }, 3000);
      }
    }
  }, [propOfferId]);
  
  // Store the current offer ID in multiple locations for recovery purposes
  useEffect(() => {
    if (offerId) {
      try {
        // Use a consistent key name across the app
        localStorage.setItem('current_payment_offer_id', offerId);
        sessionStorage.setItem('current_payment_offer_id', offerId);
        
        // Remove any outdated keys
        localStorage.removeItem('jetstream_pending_offer_id');
        localStorage.removeItem('pending_payment_id');
        sessionStorage.removeItem('pending_payment_id');
        sessionStorage.removeItem('jetshare_offer_id');
        
        console.log('Saved current payment offer ID:', offerId);
      } catch (e) {
        console.warn('Failed to save offer ID to storage:', e);
      }
    }
  }, [offerId]);
  
  // Load offer data
  useEffect(() => {
    const loadOfferData = async () => {
      setIsLoading(true);
      setError(null); // Clear previous errors

      if (!offerId) {
        console.error('Payment page: No valid offer ID to load.');
        setError('Unable to load offer details: Missing ID.');
        setIsLoading(false);
        return;
      }

      // Create Supabase client
      const supabase = createClient();

      try {
        console.log('Payment page: Fetching offer data for ID:', offerId);

        // Prepare headers - include auth if available, but don't fail if not
        const headers: Record<string, string> = {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        };
        
        // Try to get auth token from multiple sources
        let localAuthToken: string | null = null;
        try {
          // First try to get token from auth context via Supabase
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.access_token) {
            localAuthToken = sessionData.session.access_token;
            console.log('Using active session token for API call');
          } else {
            // Fallback to localStorage
            const tokenData = localStorage.getItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
            if (tokenData) {
              const parsed = JSON.parse(tokenData);
              if (parsed?.access_token) {
                localAuthToken = parsed.access_token;
                console.log('Using localStorage token as fallback');
              }
            }
          }
        } catch (e) {
          console.warn('Error accessing auth token:', e);
        }

        if (localAuthToken) {
          headers['Authorization'] = `Bearer ${localAuthToken}`;
        }
        
        const localUserId = localStorage.getItem('jetstream_user_id') || user?.id;
        if (localUserId) {
          headers['X-User-ID'] = localUserId;
        }

        // Use fetch to call the API with optimal caching disabled
        const apiUrl = `/api/jetshare/getOfferById?id=${offerId}&t=${Date.now()}&u=${localUserId || 'anonymous'}`;
        const offerResponse = await fetch(apiUrl, {
          method: 'GET',
          headers,
          credentials: 'include', // Important for cookie auth fallback in API
        });

        if (!offerResponse.ok) {
          // Try direct DB access as fallback (using anon key, relies on RLS)
          console.warn(`API fetch failed (${offerResponse.status}), trying direct DB lookup.`);
          const { data: directOffer, error: directError } = await supabase
            .from('jetshare_offers')
            .select('*')
            .eq('id', offerId)
            .maybeSingle();

          if (directError || !directOffer) {
            console.error('Direct DB fallback also failed:', directError);
            throw new Error(`Failed to load offer details (Status: ${offerResponse.status})`);
          }
          console.log('Direct DB fallback succeeded.');
          setOffer(directOffer as JetShareOfferWithUser);
        } else {
          const offerData = await offerResponse.json();
          console.log('Payment page: Received offer data via API:', offerData);
          if (!offerData.offer) {
            throw new Error('Offer data not found in API response');
          }
          // Attach user/matched_user if present in response
          const loadedOffer = offerData.offer;
          if(offerData.user) loadedOffer.user = offerData.user;
          if(offerData.matched_user) loadedOffer.matched_user = offerData.matched_user;
          setOffer(loadedOffer as JetShareOfferWithUser);
        }

        setError(null); // Clear error on success
      } catch (fetchError) {
        console.error('Payment page: Error fetching offer data:', fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load offer details. Please try again.');
        setOffer(null); // Clear offer data on error
      } finally {
        setIsLoading(false);
      }
    };

    loadOfferData();
    // Depend only on offerId. Auth state changes shouldn't trigger data reload here.
  }, [offerId, user?.id]);
  
  // Check for a "partial" flag in the URL which indicates a partial acceptance
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const isPartialAccept = url.searchParams.get('partial') === 'true';
      
      if (isPartialAccept && offerId) {
        console.log('Detected partial offer acceptance, attempting to fix offer status');
        
        // Attempt to fix the offer status directly
        const fixOfferStatus = async () => {
          try {
            const supabase = createClient();
            
            // Try using the RPC function
            const { error } = await supabase.rpc('force_update_offer_status', {
              p_offer_id: offerId,
              p_status: 'accepted'
            });
            
            if (error) {
              console.warn('Failed to fix offer status via RPC:', error);
              
              // Try the API as fallback
              const response = await fetch('/api/jetshare/fixOfferByUpdate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  offerId, 
                  targetStatus: 'accepted' 
                })
              });
              
              if (!response.ok) {
                console.warn('Failed to fix offer status via API, proceeding anyway');
              } else {
                console.log('Successfully fixed offer status via API');
              }
            } else {
              console.log('Successfully fixed offer status via RPC');
            }
          } catch (e) {
            console.warn('Error fixing offer status:', e);
          }
        };
        
        fixOfferStatus();
      }
      
      if (offerId) {
        try {
          // Use consistent key names across the app
          localStorage.setItem('current_payment_offer_id', offerId);
          sessionStorage.setItem('current_payment_offer_id', offerId);
          
          // Clean up any previous temporary storage
          sessionStorage.removeItem('jetshare_payment_redirect');
          sessionStorage.removeItem('jetshare_resume_offer_acceptance');
          sessionStorage.removeItem('pending_payment_id');
          localStorage.removeItem('pending_payment_id');
          
          console.log('Saved current payment offer ID:', offerId);
        } catch (e) {
          console.warn('Failed to save offer ID to storage:', e);
        }
      }
    } catch (e) {
      console.warn('Error parsing URL or handling partial acceptance:', e);
    }
  }, [offerId]);
  
  // Show loading state IF the main data is loading OR if auth is initially loading
  if (isLoading || (authLoading && !offer)) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Loading Payment...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <CardTitle>Error Loading Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">{error}</p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => router.push('/jetshare/listings')} 
              autoFocus
            >
              Return to Listings
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If offer data failed to load (should be caught by error state, but belt-and-suspenders)
  if (!offer) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Offer Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">The details for this offer could not be loaded.</p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => router.push('/jetshare/listings')} 
              autoFocus
            >
              Return to Listings
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If we have the offer, render the payment form
  // The form itself will handle the final auth check before submitting payment
  return (
    <div className="container mx-auto px-4 py-8">
      <JetSharePaymentForm offer={offer} />
      {/* Display session error prominently if it exists */}
      {sessionError && (
        <Card className="mt-4 max-w-md mx-auto border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600 text-center">Authentication Issue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-red-700">{sessionError.message}</p>
            <p className="text-center text-muted-foreground mt-2">You may need to sign in again to complete the payment.</p>
            <Button className="w-full mt-4" onClick={async () => {
              // Try to refresh the session first
              try {
                const supabase = createClient();
                const { data, error } = await supabase.auth.refreshSession();
                
                if (!error && data.session) {
                  // Session refreshed successfully
                  toast.success('Session restored');
                  console.log('Session restored through refresh');
                  
                  // Update auth state and reload the page
                  try {
                    localStorage.setItem('jetstream_user_id', data.session.user.id);
                    if (data.session.user.email) {
                      localStorage.setItem('jetstream_user_email', data.session.user.email);
                    }
                    // Force reload to pick up the new session
                    window.location.reload();
                    return;
                  } catch (e) {
                    console.warn('Failed to update local storage:', e);
                  }
                } else {
                  console.log('Session refresh failed, redirecting to login');
                }
              } catch (e) {
                console.error('Error refreshing session:', e);
              }
              
              // If refresh fails or errors, redirect to login
              // Store state and redirect to login
              try { 
                sessionStorage.setItem('pending_payment_id', offer.id); 
              } catch(e){}
              
              // Use window.location instead of router.push for a clean state transition
              window.location.href = `/auth/login?returnUrl=${encodeURIComponent(`/jetshare/payment/${offer.id}`)}`;
            }}>
              Restore Session
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 