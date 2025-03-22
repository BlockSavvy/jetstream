import { useState, useEffect } from 'react';
import { CoinbaseCheckout } from '../types';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';

interface CoinbasePaymentProps {
  flightId: string;
  userId: string;
  seatsBooked: number;
  totalPrice: number;
  onPaymentSuccess: (checkoutId: string) => void;
  onPaymentError: (message: string) => void;
}

export function CoinbasePayment({ flightId, userId, seatsBooked, totalPrice, onPaymentSuccess, onPaymentError }: CoinbasePaymentProps) {
  const [checkoutInfo, setCheckoutInfo] = useState<CoinbaseCheckout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create Coinbase checkout on component mount
  useEffect(() => {
    const createCheckout = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/flights/payment/coinbase', {
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
          throw new Error(data.error || 'Unable to create crypto checkout');
        }
        
        setCheckoutInfo(data.coinbaseCheckout);
        
        // Let the parent know we have a checkout ready
        onPaymentSuccess(data.coinbaseCheckout.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        onPaymentError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    createCheckout();
  }, [flightId, userId, seatsBooked, totalPrice, onPaymentSuccess, onPaymentError]);
  
  const handleCheckoutClick = () => {
    if (checkoutInfo?.checkoutUrl) {
      window.open(checkoutInfo.checkoutUrl, '_blank');
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <p>Preparing cryptocurrency payment...</p>
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
  
  if (!checkoutInfo) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to initialize cryptocurrency payment. Please try again.</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 text-center">
        <p className="mb-4">You'll be redirected to Coinbase Commerce to complete your payment of:</p>
        <p className="text-xl font-semibold">${checkoutInfo.amount.toFixed(2)} USD</p>
        <p className="text-sm text-muted-foreground mt-1">Pay with Bitcoin, Ethereum, or other supported cryptocurrencies</p>
      </div>
      
      <Button 
        onClick={handleCheckoutClick} 
        className="w-full"
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        Continue to Coinbase Checkout
      </Button>
      
      <p className="text-sm text-muted-foreground text-center">
        After payment is confirmed, your booking will be automatically processed.
      </p>
    </div>
  );
} 