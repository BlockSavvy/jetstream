import { useState, useEffect } from 'react';
import { FractionalToken } from '../types';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle, Check } from 'lucide-react';

interface TokenPaymentProps {
  flightId: string;
  userId: string;
  jetId: string;
  seatsBooked: number;
  totalPrice: number;
  onPaymentSuccess: (tokenId: string) => void;
  onPaymentError: (message: string) => void;
}

export function TokenPayment({ flightId, userId, jetId, seatsBooked, totalPrice, onPaymentSuccess, onPaymentError }: TokenPaymentProps) {
  const [tokens, setTokens] = useState<FractionalToken[]>([]);
  const [selectedTokenId, setSelectedTokenId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch available tokens for this jet
  useEffect(() => {
    const fetchTokens = async () => {
      if (!userId || !jetId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('fractional_tokens')
          .select('*')
          .eq('user_id', userId)
          .eq('jet_id', jetId)
          .eq('is_active', true);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setTokens(data);
          setSelectedTokenId(data[0].id);
        } else {
          throw new Error('No active tokens found for this jet');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load token information');
        onPaymentError(err instanceof Error ? err.message : 'Failed to load token information');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTokens();
  }, [userId, jetId, onPaymentError]);
  
  const handleTokenPayment = async () => {
    if (!selectedTokenId) {
      setError('Please select a token');
      return;
    }
    
    setProcessing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/flights/payment/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flightId,
          userId,
          seatsBooked,
          totalPrice,
          tokenId: selectedTokenId
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process token payment');
      }
      
      onPaymentSuccess(selectedTokenId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      onPaymentError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <p>Loading your tokens...</p>
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
  
  if (!tokens.length) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>You don't have any active tokens for this jet.</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <h4 className="font-medium mb-2">Select a token to use</h4>
        <Select value={selectedTokenId} onValueChange={setSelectedTokenId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a token" />
          </SelectTrigger>
          <SelectContent>
            {tokens.map((token) => (
              <SelectItem key={token.id} value={token.id}>
                Token {token.id.slice(0, 6)}... ({token.token_amount} shares)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="mt-4">
          <p className="text-sm">Using fractional ownership tokens allows you to:</p>
          <ul className="text-sm list-disc list-inside mt-2 space-y-1">
            <li>Book flights instantly without payment processing</li>
            <li>Receive priority boarding and concierge service</li>
            <li>Access exclusive in-flight amenities</li>
          </ul>
        </div>
      </div>
      
      <div className="rounded-lg border p-4 text-center">
        <p className="mb-2">Total booking value:</p>
        <p className="text-xl font-semibold">${totalPrice.toFixed(2)} USD</p>
        <p className="text-sm text-muted-foreground mt-1">Will be deducted from your token benefits</p>
      </div>
      
      <Button 
        onClick={handleTokenPayment} 
        className="w-full"
        disabled={processing || !selectedTokenId}
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Check className="mr-2 h-4 w-4" />
            Confirm Token Booking
          </>
        )}
      </Button>
    </div>
  );
} 