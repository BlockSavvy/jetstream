import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PaymentIntent } from '../types';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

// Get the publishable key from env
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
// Only initialize Stripe if we have a valid key
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

interface StripePaymentProps {
  flightId: string;
  userId: string;
  seatsBooked: number;
  totalPrice: number;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (message: string) => void;
}

export function StripePayment({ flightId, userId, seatsBooked, totalPrice, onPaymentSuccess, onPaymentError }: StripePaymentProps) {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create payment intent on component mount
  useEffect(() => {
    const createPaymentIntent = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/flights/payment/stripe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            flightId,
            userId,
            seatsBooked,
            totalPrice
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Unable to create payment intent');
        }
        
        setClientSecret(data.paymentIntent.clientSecret);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        onPaymentError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    createPaymentIntent();
  }, [flightId, userId, seatsBooked, totalPrice, onPaymentError]);

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as 'stripe',
    },
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <p>Preparing payment...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (!clientSecret) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to initialize payment. Please try again.</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm 
        paymentIntentClientSecret={clientSecret} 
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
      />
    </Elements>
  );
}

interface CheckoutFormProps {
  paymentIntentClientSecret: string;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (message: string) => void;
}

function CheckoutForm({ paymentIntentClientSecret, onPaymentSuccess, onPaymentError }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/flights/confirmation`,
        },
        redirect: 'if_required',
      });
      
      if (error) {
        setMessage(error.message || 'An unexpected error occurred');
        onPaymentError(error.message || 'An unexpected error occurred');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setMessage('Payment successful!');
        onPaymentSuccess(paymentIntent.id);
      } else if (paymentIntent) {
        // Handle other payment intent statuses
        const paymentIntentId = paymentIntent.id;
        const clientSecret = paymentIntentClientSecret.split('_secret_')[0];
        onPaymentSuccess(clientSecret);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
      onPaymentError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {message && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Pay Now'
        )}
      </Button>
    </form>
  );
} 