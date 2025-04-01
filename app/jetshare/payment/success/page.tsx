'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, ArrowRight, AlertCircle, Plane } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { toast } from 'sonner';

// Loading component to use in Suspense
function LoadingCard() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <Card className="jetstream-card dark:border-gray-700">
        <CardHeader className="text-center">
          <Skeleton className="h-8 w-full max-w-[250px] mx-auto mb-2 dark:bg-gray-700" />
          <Skeleton className="h-4 w-full max-w-[200px] mx-auto dark:bg-gray-700" />
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center pt-4">
          <Skeleton className="h-16 w-16 rounded-full mb-4 dark:bg-gray-700" />
          <Skeleton className="h-4 w-full max-w-[280px] mb-2 dark:bg-gray-700" />
          <Skeleton className="h-4 w-full max-w-[220px] dark:bg-gray-700" />
        </CardContent>
        <CardFooter className="flex justify-center">
          <Skeleton className="h-10 w-full max-w-[180px] dark:bg-gray-700" />
        </CardFooter>
      </Card>
    </div>
  );
}

// Error card component with better dark mode support
function ErrorCard({ error, onReturn }: { error: string, onReturn: () => void }) {
  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <Card className="border-red-200 dark:border-red-700 dark:bg-red-900/20 jetstream-card">
        <CardHeader className="text-center">
          <CardTitle className="text-red-600 dark:text-red-400">Payment Error</CardTitle>
        </CardHeader>
        <CardContent className="text-center pt-4">
          <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-full inline-flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-2">There was a problem completing your payment:</p>
          <p className="text-red-600 dark:text-red-300 font-medium">{error}</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={onReturn}
            className="dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
          >
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Success card with improved contrast
function SuccessCard({ 
  offerDetails, 
  paymentIntentId, 
  isRedirecting, 
  onViewDetails, 
  onDashboard 
}: { 
  offerDetails: any, 
  paymentIntentId: string | null, 
  isRedirecting: boolean, 
  onViewDetails: () => void, 
  onDashboard: () => void 
}) {
  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <Card className="border-green-200 dark:border-green-700 dark:bg-green-900/10 jetstream-card dark:futuristic-border">
        <CardHeader className="text-center">
          <CardTitle className="text-green-600 dark:text-green-400">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center pt-4">
          <div className="bg-green-50 dark:bg-green-900/30 p-6 rounded-full inline-flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500 dark:text-green-400" />
          </div>
          
          {offerDetails ? (
            <div className="mb-4">
              <div className="flex items-center justify-center text-gray-700 dark:text-gray-200 mb-2">
                <p className="font-medium dark:text-high-contrast">Your flight from {offerDetails.departure_location} to {offerDetails.arrival_location} is booked!</p>
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                <Plane className="h-4 w-4" /> 
                <span>
                  {new Date(offerDetails.departure_date || offerDetails.flight_date).toLocaleDateString()} 
                  {offerDetails.departure_time && ` at ${offerDetails.departure_time}`}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 dark:text-gray-200 mb-2">Your JetShare payment has been processed successfully.</p>
          )}
          
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            A confirmation has been sent to your email with all the flight details.
          </p>
          
          {paymentIntentId && (
            <div className="mt-4 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 rounded p-2 border border-gray-100 dark:border-gray-700">
              Transaction ID: {paymentIntentId.substring(0, 8)}...
            </div>
          )}
          
          {isRedirecting && (
            <div className="mt-4 animate-pulse">
              <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                Redirecting to your booking...
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center gap-3">
          <Button 
            onClick={onViewDetails}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white"
          >
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline"
            onClick={onDashboard}
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Dashboard
          </Button>
        </CardFooter>
      </Card>
      
      <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
        <p className="mb-2">Have questions about your booking?</p>
        <Link href="/jetshare/support" className="text-blue-600 dark:text-blue-400 hover:underline">
          Contact Support
        </Link>
      </div>
    </div>
  );
}

// Component that uses search params
function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const offerId = searchParams.get('offer_id');
  const paymentIntentId = searchParams.get('payment_intent_id') || searchParams.get('txn');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offerDetails, setOfferDetails] = useState<any>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [bookingFinalized, setBookingFinalized] = useState(false);
  
  // Store successful booking info
  useEffect(() => {
    if (!offerId) return;
    
    // Store booking data in localStorage for recovery
    try {
      localStorage.setItem('last_completed_booking', offerId);
      localStorage.setItem('booking_completed_at', Date.now().toString());
      localStorage.setItem('jetstream_last_action', 'payment_complete');
    } catch (e) {
      console.warn('Failed to update localStorage:', e);
    }
  }, [offerId]);
  
  // Get offer details for better display
  useEffect(() => {
    async function getOfferDetails() {
      if (!offerId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/jetshare/offer?id=${offerId}`);
        
        if (response.ok) {
          const data = await response.json();
          setOfferDetails(data.offer);
        }
      } catch (err) {
        console.warn('Could not fetch offer details:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    getOfferDetails();
  }, [offerId]);
  
  // Finalize the booking and create tickets
  useEffect(() => {
    async function finalizeBooking() {
      if (!offerId || bookingFinalized) return;
      
      try {
        console.log('Finalizing booking for offer:', offerId);
        const response = await fetch('/api/jetshare/offer-completed', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            offer_id: offerId,
            user_id: localStorage.getItem('jetstream_user_id') || undefined
          }),
        });
        
        const data = await response.json();
        if (response.ok && data.success) {
          console.log('Booking finalized successfully:', data);
          setBookingFinalized(true);
          toast.success('Booking finalized successfully!');
        } else {
          console.error('Error finalizing booking:', data);
        }
      } catch (err) {
        console.error('Exception finalizing booking:', err);
      }
    }
    
    // Call finalization API
    finalizeBooking();
  }, [offerId, bookingFinalized]);
  
  const viewTransaction = () => {
    if (offerId) {
      const testParam = searchParams.get('test') === 'true' ? '&test=true' : '';
      router.push(`/jetshare/transaction/${offerId}?from=payment&payment_complete=true${testParam}&t=${Date.now()}`);
    } else {
      router.push('/jetshare/dashboard');
    }
  };
  
  const goToDashboard = () => {
    router.push(`/jetshare/dashboard?booked=${offerId}&t=${Date.now()}`);
  };
  
  if (isLoading) {
    return <LoadingCard />;
  }
  
  if (error) {
    return <ErrorCard error={error} onReturn={() => router.push('/jetshare/dashboard')} />;
  }
  
  return (
    <SuccessCard 
      offerDetails={offerDetails}
      paymentIntentId={paymentIntentId}
      isRedirecting={isRedirecting}
      onViewDetails={viewTransaction}
      onDashboard={goToDashboard}
    />
  );
}

// Main component with Suspense boundary
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingCard />}>
      <PaymentSuccessContent />
    </Suspense>
  );
} 