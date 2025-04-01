'use client';

// Force dynamic rendering to prevent client-side code execution during static generation
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import JetShareDashboard from '../components/JetShareDashboard';
import { toast } from 'sonner';

export default function JetShareDashboardPage() {
  const { user, loading, refreshSession } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialTab, setInitialTab] = useState<'dashboard' | 'offers' | 'bookings' | 'transactions'>('dashboard');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);
  const [loadingTimeout, setLoadingTimeout] = useState<boolean>(false);
  const [authCheckComplete, setAuthCheckComplete] = useState<boolean>(false);
  const [redirectAttempted, setRedirectAttempted] = useState<boolean>(false);

  // Set a timeout to prevent endless loading - much longer to allow for auth
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 10000); // 10 seconds timeout
    
    return () => clearTimeout(timer);
  }, []);
  
  // Also try to refresh the session when the component mounts
  useEffect(() => {
    if (loading) {
      const attemptRefresh = async () => {
        console.log("Attempting to refresh session on dashboard mount");
        await refreshSession();
      };
      
      attemptRefresh();
    }
  }, []);

  // Get params from URL
  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab === 'offers' || tab === 'myOffers') {
      setInitialTab('offers');
    } else if (tab === 'bookings' || tab === 'myBookings') {
      setInitialTab('bookings');
    } else if (tab === 'transactions') {
      setInitialTab('transactions');
    }

    // Check for booking completion redirect
    const bookedOfferId = searchParams?.get('booked');
    if (bookedOfferId) {
      // If redirected from successful booking, show booking tab
      setInitialTab('bookings');
      setSuccessMessage(`Your booking has been completed successfully! Your ticket and boarding pass are now available.`);
      
      // Store the booking information for highlighting
      if (typeof window !== 'undefined') {
        localStorage.setItem('last_completed_booking', bookedOfferId);
        localStorage.setItem('booking_completed_at', Date.now().toString());
      }
      
      toast.success('Flight booked successfully!', {
        description: 'Your ticket and boarding pass are now available',
        duration: 5000
      });
    }

    const error = searchParams?.get('error');
    if (error) setErrorMessage(error);

    const message = searchParams?.get('message');
    if (message) setSuccessMessage(message);
  }, [searchParams]);

  // Handle authentication with a delay to prevent premature redirect
  useEffect(() => {
    if (loading) return; // Don't do anything while still loading
    
    setAuthCheckComplete(true);
    
    if (!user && !redirectAttempted) {
      console.log('User not authenticated, waiting briefly before redirecting to login');
      
      // Set a short timer before redirecting to make sure loading is really complete
      const redirectTimer = setTimeout(() => {
        console.log('Redirecting to login after grace period');
        setRedirectAttempted(true);
        router.push('/auth/login?returnUrl=/jetshare/dashboard');
      }, 2000); // 2 second grace period
      
      return () => clearTimeout(redirectTimer);
    }
  }, [user, loading, router, redirectAttempted]);

  // Check for payment completion from localStorage/sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Check multiple storage locations
        const paymentComplete = 
          sessionStorage.getItem('payment_complete') === 'true' || 
          localStorage.getItem('jetstream_last_action') === 'payment_complete';
          
        const offerId = 
          localStorage.getItem('jetstream_last_payment_offer_id') || 
          sessionStorage.getItem('current_payment_offer_id');
        
        if (paymentComplete) {
          // Show success message
          toast.success('Payment completed successfully!');
          
          // Clear the storage flags
          sessionStorage.removeItem('payment_complete');
          localStorage.removeItem('jetstream_last_action');
          localStorage.removeItem('jetstream_last_payment_offer_id');
          sessionStorage.removeItem('current_payment_offer_id');
          
          console.log('Payment completion detected and cleared from storage');
        }
      } catch (e) {
        console.warn('Error checking payment completion status:', e);
      }
    }
  }, []);

  // Show loading state with helpful message
  if ((loading && !loadingTimeout) || (!authCheckComplete && !loadingTimeout)) {
    return (
      <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Loading your dashboard...</h1>
        <p className="text-muted-foreground">Please wait while we retrieve your information.</p>
        <p className="text-sm text-muted-foreground mt-2">This may take a moment if you're logging in for the first time.</p>
      </div>
    );
  }
  
  // If loading timeout occurred, show dashboard anyway with warning
  if (loading && loadingTimeout) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-700">
            Still working on loading your information. You can try refreshing the page if data doesn't appear.
            If you continue to see this message, you may need to <a href="/auth/login?returnUrl=/jetshare/dashboard" className="underline">sign in again</a>.
          </p>
        </div>
        <JetShareDashboard 
          initialTab={initialTab} 
          errorMessage={errorMessage || "We're having trouble loading your data. Your session may have expired."} 
          successMessage={successMessage}
        />
      </div>
    );
  }

  // User is authenticated, render dashboard
  if (user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <JetShareDashboard 
          initialTab={initialTab} 
          errorMessage={errorMessage} 
          successMessage={successMessage}
        />
      </div>
    );
  }

  // When loading times out but there's no user, don't render the dashboard component
  if (loading && loadingTimeout && !user) {
    return (
      <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
        <p className="text-muted-foreground mb-4">Please log in to view your dashboard.</p>
        <a 
          href="/auth/login?returnUrl=/jetshare/dashboard"
          className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded"
        >
          Sign In
        </a>
      </div>
    );
  }

  // Long timeout - if we get here, auth failed but we'll still show the dashboard with a warning
  if (loadingTimeout && !loading && !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">
            You appear to be logged out. Some features may not work correctly.
            <a href="/auth/login?returnUrl=/jetshare/dashboard" className="ml-2 underline">Sign in now</a>
          </p>
        </div>
        <JetShareDashboard 
          initialTab={initialTab} 
          errorMessage={errorMessage || "Authentication required. Please log in to view your complete dashboard."} 
          successMessage={successMessage}
        />
      </div>
    );
  }

  // Final fallback if nothing else worked
  return (
    <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[50vh]">
      <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
      <p className="text-muted-foreground mb-4">Please log in to view your dashboard.</p>
      <a 
        href="/auth/login?returnUrl=/jetshare/dashboard"
        className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded"
      >
        Sign In
      </a>
    </div>
  );
} 