'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const offerId = searchParams.get('offer_id');
  const paymentIntentId = searchParams.get('payment_intent_id');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function completePayment() {
      if (!offerId || !paymentIntentId) {
        setError('Missing required parameters');
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch('/api/jetshare/completeTestPayment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            offer_id: offerId,
            payment_intent_id: paymentIntentId,
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || data.error || 'Payment completion failed');
        }
        
        // Payment completed successfully
        setIsLoading(false);
      } catch (err) {
        console.error('Error completing payment:', err);
        setError((err as Error).message || 'Failed to complete payment');
        setIsLoading(false);
      }
    }
    
    completePayment();
  }, [offerId, paymentIntentId]);
  
  const viewTransaction = () => {
    if (offerId) {
      router.push(`/jetshare/transaction/${offerId}`);
    } else {
      router.push('/jetshare/dashboard');
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <Skeleton className="h-8 w-full max-w-[250px] mx-auto mb-2" />
            <Skeleton className="h-4 w-full max-w-[200px] mx-auto" />
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-4">
            <Skeleton className="h-16 w-16 rounded-full mb-4" />
            <Skeleton className="h-4 w-full max-w-[280px] mb-2" />
            <Skeleton className="h-4 w-full max-w-[220px]" />
          </CardContent>
          <CardFooter className="flex justify-center">
            <Skeleton className="h-10 w-full max-w-[180px]" />
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card className="border-red-200">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Payment Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center pt-4">
            <div className="bg-red-50 p-6 rounded-full inline-flex items-center justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <p className="text-gray-700 mb-2">There was a problem completing your payment:</p>
            <p className="text-red-600 font-medium">{error}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              onClick={() => router.push('/jetshare/dashboard')}
            >
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <Card className="border-green-200">
        <CardHeader className="text-center">
          <CardTitle className="text-green-600">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center pt-4">
          <div className="bg-green-50 p-6 rounded-full inline-flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <p className="text-gray-700 mb-2">Your JetShare payment has been processed successfully.</p>
          <p className="text-gray-500 text-sm">
            A confirmation has been sent to your email with all the flight details.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={viewTransaction}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            View Transaction
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 