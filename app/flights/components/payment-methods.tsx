import { useState, useEffect } from 'react';
import { PaymentMethod } from '../types';
import { createClient } from '@/lib/supabase';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CreditCard, Bitcoin, Ticket } from 'lucide-react';

interface PaymentMethodsProps {
  userId: string | null;
  flightId: string;
  jetId: string;
  onSelectMethod: (method: PaymentMethod | undefined) => void;
}

export function PaymentMethods({ userId, flightId, jetId, onSelectMethod }: PaymentMethodsProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | undefined>(undefined);
  const [hasTokens, setHasTokens] = useState(false);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [tokensError, setTokensError] = useState<string | null>(null);
  
  // Check if the user has fractional tokens for this jet
  useEffect(() => {
    if (!userId || !jetId) return;
    
    const checkTokens = async () => {
      setTokensLoading(true);
      setTokensError(null);
      
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('fractional_tokens')
          .select('*')
          .eq('user_id', userId)
          .eq('jet_id', jetId)
          .eq('is_active', true);
        
        if (error) throw error;
        
        setHasTokens(data && data.length > 0);
      } catch (err) {
        console.error('Error checking tokens:', err);
        setTokensError('Unable to verify token ownership. Please try again.');
      } finally {
        setTokensLoading(false);
      }
    };
    
    checkTokens();
  }, [userId, jetId]);
  
  const handleMethodChange = (method: PaymentMethod) => {
    setSelectedMethod(method);
    onSelectMethod(method);
  };
  
  return (
    <div className="space-y-4">
      <RadioGroup value={selectedMethod} onValueChange={(value) => handleMethodChange(value as PaymentMethod)}>
        <div className="grid gap-4">
          <Card className={`border ${selectedMethod === 'stripe' ? 'border-primary' : 'border-muted'} transition-all`}>
            <CardContent className="pt-4 flex items-center gap-3">
              <RadioGroupItem value="stripe" id="method-stripe" className="mt-0" />
              <div className="flex-1">
                <Label htmlFor="method-stripe" className="font-medium">Credit Card</Label>
                <p className="text-sm text-muted-foreground">Pay with any major credit card</p>
              </div>
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
          
          <Card className={`border ${selectedMethod === 'coinbase' ? 'border-primary' : 'border-muted'} transition-all`}>
            <CardContent className="pt-4 flex items-center gap-3">
              <RadioGroupItem value="coinbase" id="method-coinbase" className="mt-0" />
              <div className="flex-1">
                <Label htmlFor="method-coinbase" className="font-medium">Cryptocurrency</Label>
                <p className="text-sm text-muted-foreground">Pay with Bitcoin, Ethereum, and more</p>
              </div>
              <Bitcoin className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
          
          {tokensLoading ? (
            <Card className="border border-muted">
              <CardContent className="pt-4 flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <p className="text-sm">Checking token ownership...</p>
              </CardContent>
            </Card>
          ) : tokensError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{tokensError}</AlertDescription>
            </Alert>
          ) : hasTokens ? (
            <Card className={`border ${selectedMethod === 'token' ? 'border-primary' : 'border-muted'} transition-all`}>
              <CardContent className="pt-4 flex items-center gap-3">
                <RadioGroupItem value="token" id="method-token" className="mt-0" />
                <div className="flex-1">
                  <Label htmlFor="method-token" className="font-medium">Fractional Ownership Tokens</Label>
                  <p className="text-sm text-muted-foreground">Use your ownership tokens for this jet</p>
                </div>
                <Ticket className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </RadioGroup>
    </div>
  );
} 