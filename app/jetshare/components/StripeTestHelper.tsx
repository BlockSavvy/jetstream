'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, CheckCircle, AlertCircle, RefreshCw, Copy, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

const TEST_CARDS = [
  { 
    number: '4242 4242 4242 4242', 
    description: 'Succeeds and immediately processes the payment',
    brand: 'Visa'
  },
  { 
    number: '4000 0025 0000 3155', 
    description: 'Requires authentication (3D Secure)',
    brand: 'Visa'
  },
  { 
    number: '4000 0000 0000 9995', 
    description: 'Declined payment (insufficient funds)',
    brand: 'Visa'
  },
  { 
    number: '4000 0000 0000 0127', 
    description: 'Declined payment (stolen card)',
    brand: 'Visa'
  }
];

export default function StripeTestHelper({ offerId, paymentIntentId }: { offerId: string, paymentIntentId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [statusDetail, setStatusDetail] = useState<string | null>(null);

  const copyCardNumber = (cardNumber: string) => {
    navigator.clipboard.writeText(cardNumber);
    toast.success('Card number copied to clipboard');
  };

  const completeTestPayment = async () => {
    if (!offerId) {
      setErrorMessage('Missing required data: offer ID');
      toast.error('Cannot process payment: Missing offer ID');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    setPaymentStatus('processing');
    setStatusDetail('Initiating test payment process...');
    
    const timestamp = Date.now();
    const requestId = Math.random().toString(36).substring(2, 15);
    
    try {
      // First try the standardized endpoint
      setStatusDetail('Sending payment request to server...');
      const response = await fetch(`/api/jetshare/process-payment?t=${timestamp}&rid=${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offer_id: offerId,
          payment_method: 'card',
          payment_details: {
            test_mode: true
          }
        }),
      });
      
      const responseData = await response.json();
      console.log('Test payment response:', responseData);
      
      if (!response.ok) {
        // If standard endpoint fails, try the test-specific endpoint
        setStatusDetail('Primary endpoint failed, trying test payment endpoint...');
        
        const testResponse = await fetch(`/api/jetshare/completeTestPayment?t=${timestamp}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            offer_id: offerId,
            payment_intent_id: paymentIntentId || `test_intent_${Date.now()}`,
            payment_method: 'card'
          }),
        });
        
        const testResponseData = await testResponse.json();
        console.log('Fallback test payment response:', testResponseData);
        
        if (!testResponse.ok) {
          throw new Error(testResponseData.message || testResponseData.error || 'Failed to complete test payment');
        }
        
        // Success with test endpoint
        setStatusDetail('Payment processed successfully via test endpoint!');
        setPaymentStatus('success');
        
        // Redirect using the URL from the response if available
        if (testResponseData.data?.redirect_url) {
          setTimeout(() => {
            window.location.href = testResponseData.data.redirect_url;
          }, 1000);
        } else {
          // Default redirect
          setTimeout(() => {
            router.push(`/jetshare/dashboard?t=${timestamp}`);
          }, 1000);
        }
        
        return;
      }
      
      // Success with primary endpoint
      setStatusDetail('Payment processed successfully!');
      setPaymentStatus('success');
      toast.success('Test payment completed successfully!');
      
      // Redirect to success page or dashboard
      if (responseData.data?.redirect_url) {
        setTimeout(() => {
          window.location.href = responseData.data.redirect_url;
        }, 1000);
      } else {
        setTimeout(() => {
          router.push(`/jetshare/dashboard?t=${timestamp}`);
        }, 1000);
      }
      
    } catch (error) {
      console.error('Error completing test payment:', error);
      const errorMsg = error instanceof Error ? error.message : 'Payment processing failed';
      setErrorMessage(errorMsg);
      setPaymentStatus('error');
      setStatusDetail('Payment failed. Please try again.');
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusDisplay = () => {
    switch (paymentStatus) {
      case 'processing':
        return (
          <div className="flex items-center justify-center space-x-2 text-amber-600 dark:text-amber-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>{statusDetail || 'Processing payment...'}</span>
          </div>
        );
      case 'success':
        return (
          <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span>{statusDetail || 'Payment successful!'}</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center justify-center space-x-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span>{statusDetail || 'Payment failed'}</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-6 border-yellow-200 dark:border-yellow-800">
      <CardHeader className="bg-yellow-50 dark:bg-yellow-900/30">
        <CardTitle className="flex items-center text-amber-800 dark:text-amber-300">
          <CreditCard className="h-5 w-5 mr-2" />
          Stripe Test Mode Helper
        </CardTitle>
        <CardDescription>
          Use these test cards to simulate different payment scenarios
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        {paymentStatus !== 'idle' && (
          <div className="mb-4 p-2 rounded-md bg-gray-50 dark:bg-gray-800">
            {getStatusDisplay()}
          </div>
        )}
        
        <Tabs defaultValue="cards">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cards">Test Cards</TabsTrigger>
            <TabsTrigger value="complete">Complete Test</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cards" className="space-y-4 mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              In Stripe test mode, use these card numbers with any future expiration date, any 3-digit CVC, and any postal code:
            </p>
            
            <div className="space-y-3 mt-4">
              {TEST_CARDS.map((card, index) => (
                <div 
                  key={index} 
                  className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 relative group hover:border-amber-300 transition-colors"
                >
                  <div className="font-mono text-base flex items-center justify-between">
                    {card.number}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyCardNumber(card.number)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {card.description}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {card.brand}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="complete" className="space-y-4 mt-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
              <h3 className="font-medium flex items-center mb-2">
                <AlertCircle className="h-4 w-4 mr-2 text-amber-600 dark:text-amber-400" />
                Skip Payment Form
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                In test mode, you can use this button to instantly complete the payment without entering card details.
                This simulates a successful payment.
              </p>
              
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-2 mb-4 bg-amber-100 dark:bg-amber-900/40 p-2 rounded">
                <p>Payment Intent ID: {paymentIntentId || 'Will be auto-generated'}</p>
                <p>Offer ID: {offerId || 'Not available'}</p>
              </div>
              
              <Button 
                onClick={completeTestPayment}
                disabled={isLoading || !offerId || paymentStatus === 'success'}
                className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : paymentStatus === 'success' ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Payment Completed
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete Test Payment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="bg-yellow-50 dark:bg-yellow-900/30 text-xs text-gray-500 dark:text-gray-400 px-6 py-3">
        <div>
          Using Stripe Test Mode - No real payments will be processed
        </div>
      </CardFooter>
    </Card>
  );
} 