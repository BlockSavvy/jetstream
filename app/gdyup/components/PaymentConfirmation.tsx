"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentConfirmationProps {
  clientSecret: string;
}

export default function PaymentConfirmation({ clientSecret }: PaymentConfirmationProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stripe || !clientSecret) {
      console.log('Stripe or client secret not available yet');
      return;
    }

    // Check the payment intent status
    setIsLoading(true);
    setError(null);

    console.log('Retrieving payment intent with client secret');
    
    stripe.retrievePaymentIntent(clientSecret)
      .then(({ paymentIntent }) => {
        console.log('Payment intent retrieved:', {
          id: paymentIntent?.id,
          status: paymentIntent?.status,
          amount: paymentIntent?.amount,
        });
        
        switch (paymentIntent?.status) {
          case "succeeded":
            setMessage("Payment succeeded! You'll be redirected to the dashboard shortly.");
            setTimeout(() => {
              router.push('/jetshare/dashboard');
            }, 2000);
            break;
          case "processing":
            setMessage("Your payment is processing.");
            break;
          case "requires_payment_method":
            setMessage("Please provide your payment details.");
            break;
          default:
            setMessage("Ready to process your payment.");
            break;
        }
      })
      .catch(err => {
        console.error('Error retrieving payment intent:', err);
        setError('Unable to load payment details. Please try again or use the test payment option below.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [stripe, clientSecret, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.error('Stripe or elements not available');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('Confirming payment with Stripe');
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/jetshare/dashboard`,
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Payment confirmation error:', error);
        
        // For test mode: if payment fails, attempt to use the completeTestPayment endpoint
        if (process.env.NODE_ENV !== 'production') {
          const offerId = new URLSearchParams(window.location.search).get('offer_id');
          const paymentIntentId = new URLSearchParams(window.location.search).get('intent')?.split('_secret_')[0];
          
          if (offerId && paymentIntentId) {
            console.log('Attempting test payment completion after Stripe error', { offerId, paymentIntentId });
            
            try {
              const testResponse = await fetch('/api/jetshare/completeTestPayment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  offer_id: offerId,
                  payment_intent_id: paymentIntentId,
                }),
              });
              
              if (testResponse.ok) {
                toast.success('Test payment completed successfully!');
                setTimeout(() => {
                  router.push('/jetshare/dashboard');
                }, 1500);
                return;
              } else {
                console.error('Test payment completion failed:', await testResponse.json());
              }
            } catch (testError) {
              console.error('Error in test payment completion:', testError);
            }
          }
        }
        
        // Format error message based on type
        let errorMessage = error.message || 'An error occurred during payment';
        if (error.type === 'card_error') {
          errorMessage = `Card error: ${error.message}`;
        } else if (error.type === 'validation_error') {
          errorMessage = `Validation error: ${error.message}`;
        }
        
        toast.error(errorMessage);
        setError(errorMessage);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded with intent:', paymentIntent.id);
        toast.success('Payment successful!');
        
        // Update the transaction status via API
        try {
          const offerId = new URLSearchParams(window.location.search).get('offer_id');
          console.log('Logging successful transaction for offer:', offerId);
          
          if (offerId) {
            const response = await fetch('/api/jetshare/logTransaction', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                offer_id: offerId,
                payment_method: 'fiat',
                payment_status: 'completed',
                transaction_reference: paymentIntent.id,
              }),
            });
            
            if (!response.ok) {
              console.error('Error updating transaction status:', await response.json());
            } else {
              console.log('Transaction logged successfully');
            }
          } else {
            console.warn('No offer ID found in URL, skipping transaction logging');
          }
        } catch (updateError) {
          console.error('Error updating transaction status:', updateError);
        }
        
        setTimeout(() => {
          router.push('/jetshare/dashboard');
        }, 1500);
      } else if (paymentIntent) {
        console.log('Payment intent status:', paymentIntent.status);
        setMessage(`Payment status: ${paymentIntent.status}. Please wait or try again.`);
      } else {
        setMessage('Please complete the payment process.');
      }
    } catch (error) {
      console.error('Unexpected payment error:', error);
      toast.error('Failed to process payment');
      setError('Failed to process payment. Please try again or contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading payment details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-4 border border-amber-100 dark:border-amber-800 text-sm">
          <strong>Test Mode:</strong> This is a test payment environment. Use test card numbers listed below.
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
          <PaymentElement />
        </div>
        
        {message && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {message}
          </div>
        )}
        
        <Button
          type="submit"
          disabled={isProcessing || !stripe || !elements}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Pay Now'
          )}
        </Button>
        
        <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
          <p>
            Use test card number: <span className="font-mono">4242 4242 4242 4242</span>
          </p>
          <p>
            Use any future expiration date, any 3-digit CVC, and any ZIP code
          </p>
        </div>
      </form>
    </div>
  );
} 