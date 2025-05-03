'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, ArrowRight, BookOpen, MessageSquare, Ticket } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offerDetails, setOfferDetails] = useState<any>(null);
  const { user } = useAuth();
  
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        setIsLoading(true);
        
        // Get offer ID from query parameters
        const offerId = searchParams?.get('offer_id');
        const paymentIntentId = searchParams?.get('payment_intent_id');
        const invoiceId = searchParams?.get('invoiceId') || localStorage.getItem('btcpay_invoice_id');
        
        if (!offerId) {
          setError('Missing offer ID. Please try again.');
          setIsLoading(false);
          return;
        }
        
        const supabase = createClient();
        
        // Get the offer details
        const { data: offer, error: offerError } = await supabase
          .from('jetshare_offers')
          .select(`
            *,
            user:user_id (*),
            matched_user:matched_user_id (*)
          `)
          .eq('id', offerId)
          .single();
          
        if (offerError || !offer) {
          console.error('Error fetching offer:', offerError);
          setError('Could not fetch offer details.');
          setIsLoading(false);
          return;
        }
        
        // Check if the offer status indicates payment
        if (offer.status !== 'completed' && offer.status !== 'paid') {
          // If we have an invoice ID, check the status with BTCPay
          if (invoiceId) {
            try {
              const response = await fetch(`/api/jetshare/check-payment?offer_id=${offerId}&invoice_id=${invoiceId}`);
              if (!response.ok) {
                throw new Error('Failed to verify payment status');
              }
              
              const data = await response.json();
              
              if (data.status === 'paid' || data.status === 'completed') {
                // Payment is confirmed, update local state
                offer.status = 'completed';
                offer.payment_status = 'paid';
              }
            } catch (e) {
              console.error('Error checking payment status:', e);
              // Continue with what we have from the database
            }
          }
          
          // If still not paid, show appropriate message
          if (offer.status !== 'completed' && offer.status !== 'paid') {
            // If the payment hasn't been confirmed yet, we'll still show a success message
            // but alert the user that the confirmation might take some time
            console.log('Payment is still processing. Current status:', offer.status);
          }
        }
        
        setOfferDetails(offer);
        setIsLoading(false);
        
        // Clean up any payment-related local storage
        try {
          localStorage.removeItem('btcpay_invoice_id');
          localStorage.removeItem('pending_payment_id');
          localStorage.setItem('payment_complete', 'true');
        } catch (e) {
          console.warn('Error cleaning up local storage:', e);
        }
        
      } catch (error) {
        console.error('Error verifying payment:', error);
        setError('An error occurred while verifying payment.');
        setIsLoading(false);
      }
    };
    
    verifyPayment();
  }, [searchParams, user]);
  
  const handleNavigateToDashboard = () => {
    router.push('/gdyup/dashboard');
  };
  
  const handleNavigateToSeating = () => {
    router.push(`/gdyup/boardingpass/${offerDetails.id}`);
  };
  
  const handleNavigateToMessages = () => {
    // Redirect to the messaging interface
    router.push(`/gdyup/messages?offer=${offerDetails.id}`);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Verifying Payment</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-amber-500 mb-4" />
            <p className="text-center text-muted-foreground">
              Please wait while we verify your payment...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-red-600">Payment Verification Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">{error}</p>
            <p className="text-center text-muted-foreground">
              If you believe this is an error, please check your dashboard for the latest status.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleNavigateToDashboard}>
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Card className="border-green-200 shadow-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-700">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-lg mb-4">
            Your flight share has been confirmed.
          </p>
          
          <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-4 mb-6">
            <p className="font-medium mb-1">Flight Details:</p>
            <p className="text-muted-foreground mb-1">
              {offerDetails.departure_location} → {offerDetails.arrival_location}
            </p>
            <p className="text-muted-foreground">
              {new Date(offerDetails.flight_date).toLocaleDateString()}
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-col space-y-2">
              <Button 
                variant="outline" 
                className="flex items-center justify-center"
                onClick={handleNavigateToSeating}
              >
                <Ticket className="mr-2 h-4 w-4" />
                View Boarding Pass
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center justify-center"
                onClick={handleNavigateToMessages}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Message Jet Owner
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleNavigateToDashboard}
          >
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 