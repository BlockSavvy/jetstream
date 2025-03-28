'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { JetShareOfferWithUser } from '@/types/jetshare';
import { User } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, CreditCard, Bitcoin, CheckCircle, ArrowRight, Plane, Copy, QrCode } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface JetSharePaymentFormProps {
  offer: JetShareOfferWithUser;
  user: User;
}

export default function JetSharePaymentForm({ offer, user }: JetSharePaymentFormProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card');
  const [currentStep, setCurrentStep] = useState<'method' | 'details' | 'processing' | 'confirmation'>('method');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvc: ''
  });
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<Array<{id: string, last4: string, brand: string}>>([]);
  const [useSavedMethod, setUseSavedMethod] = useState(false);
  const [selectedSavedMethodId, setSelectedSavedMethodId] = useState<string | null>(null);
  const [saveThisCard, setSaveThisCard] = useState(false);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);
  
  // Fetch saved payment methods on mount
  useEffect(() => {
    const fetchSavedPaymentMethods = async () => {
      setIsLoadingMethods(true);
      try {
        // This would connect to your actual payment API in production
        // For this demo, we'll simulate some saved methods
        // In production, this would call your API endpoint that retrieves saved methods from Stripe
        
        // Simulated API response for demo - in production, fetch from your payment provider
        const mockSavedMethods = [
          { id: 'pm_1234', last4: '4242', brand: 'visa' },
          { id: 'pm_5678', last4: '1234', brand: 'mastercard' },
        ];
        
        // Wait a bit to simulate network request
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setSavedPaymentMethods(mockSavedMethods);
        
        // If we have saved methods, default to using them
        if (mockSavedMethods.length > 0) {
          setUseSavedMethod(true);
          setSelectedSavedMethodId(mockSavedMethods[0].id);
        }
      } catch (error) {
        console.error('Error fetching saved payment methods:', error);
        toast.error('Failed to load saved payment methods');
        setSavedPaymentMethods([]);
      } finally {
        setIsLoadingMethods(false);
      }
    };
    
    // Only fetch saved methods if we're logged in
    if (user?.id) {
      fetchSavedPaymentMethods();
    } else {
      setIsLoadingMethods(false);
    }
  }, [user?.id]);
  
  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value as 'card' | 'crypto');
  };
  
  const handleCardDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Format card number with spaces for readability
    if (name === 'cardNumber') {
      // Remove any non-digit characters
      const digitsOnly = value.replace(/\D/g, '');
      // Add spaces after every 4 digits
      const formatted = digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
      // Limit to 19 characters (16 digits + 3 spaces)
      const limitedValue = formatted.slice(0, 19);
      
      setCardDetails({
        ...cardDetails,
        cardNumber: limitedValue
      });
      return;
    }
    
    // Format expiry date (MM/YY)
    if (name === 'expiry') {
      // Remove any non-digit characters
      const digitsOnly = value.replace(/\D/g, '');
      
      let formatted = digitsOnly;
      // Add slash after month (first 2 digits)
      if (digitsOnly.length > 2) {
        formatted = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}`;
      }
      
      // Limit to 5 characters (MM/YY)
      const limitedValue = formatted.slice(0, 5);
      
      setCardDetails({
        ...cardDetails,
        expiry: limitedValue
      });
      return;
    }
    
    // Format CVC (3-4 digits)
    if (name === 'cvc') {
      // Remove any non-digit characters and limit to 4 digits
      const limitedValue = value.replace(/\D/g, '').slice(0, 4);
      
      setCardDetails({
        ...cardDetails,
        cvc: limitedValue
      });
      return;
    }
    
    // Default handling for other fields
    setCardDetails({
      ...cardDetails,
      [name]: value
    });
  };
  
  const validateCardDetails = () => {
    // Skip validation if using a saved method
    if (useSavedMethod && selectedSavedMethodId) {
      return true;
    }
    
    // Only basic validation for demo
    if (paymentMethod === 'card') {
      const { cardNumber, cardName, expiry, cvc } = cardDetails;
      
      // Check if all fields are filled
      if (!cardNumber || !cardName || !expiry || !cvc) {
        toast.error('Please complete all card details');
        return false;
      }
      
      // Basic card number validation (length)
      if (cardNumber.replace(/\s/g, '').length < 16) {
        toast.error('Please enter a valid card number');
        return false;
      }
      
      // Basic expiry validation (format MM/YY)
      if (!expiry.match(/^\d{2}\/\d{2}$/)) {
        toast.error('Please enter a valid expiry date (MM/YY)');
        return false;
      }
      
      // Basic CVC validation (3-4 digits)
      if (cvc.length < 3) {
        toast.error('Please enter a valid CVC code');
        return false;
      }
    }
    
    return true;
  };
  
  const goToDetailsStep = () => {
    setCurrentStep('details');
  };
  
  const processPayment = async () => {
    if (!validateCardDetails()) {
      return;
    }
    
    setCurrentStep('processing');
    setIsProcessing(true);
    
    try {
      // Generate transaction reference ID for tracking
      const transactionReference = `payment_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      console.log('Starting payment process with reference:', transactionReference);
      
      // Skip the acceptOffer call since we've handled that in the payment page
      
      // Step 1: Prepare payment details
      console.log('Creating payment details...');
      const testPaymentId = `test_intent_${transactionReference}`;
      
      // In production, this would be replaced with real payment processing
      const paymentDetails = useSavedMethod && selectedSavedMethodId
        ? { 
            saved_payment_method_id: selectedSavedMethodId,
            save_payment_method: false, // Already saved
            transaction_reference: transactionReference
          }
        : {
            card_number: cardDetails.cardNumber.replace(/\s/g, ''),
            card_name: cardDetails.cardName,
            card_expiry: cardDetails.expiry,
            card_cvc: cardDetails.cvc,
            save_payment_method: saveThisCard,
            transaction_reference: transactionReference
          };
      
      // Step 2: Complete the payment
      console.log('Processing payment...');
      const timestamp = Date.now();
      const requestId = Math.random().toString(36).substring(2, 10);
      
      // Use retry logic for better reliability
      let response = null;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          response = await fetch(`/api/jetshare/completeTestPayment?t=${timestamp}&rid=${requestId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
            credentials: 'include',
            body: JSON.stringify({
              offer_id: offer.id,
              payment_intent_id: testPaymentId,
              payment_method: paymentMethod,
              payment_details: paymentDetails,
              transaction_reference: transactionReference
            }),
          });
          
          // If successful, break out of retry loop
          if (response.ok) {
            break;
          }
          
          // If server error, retry after delay
          if (response.status >= 500) {
            retryCount++;
            const delay = Math.min(1000 * (2 ** retryCount), 5000); // Exponential backoff with max 5s
            console.log(`Payment attempt ${retryCount} failed with status ${response.status}, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            // For 4xx errors, don't retry
            break;
          }
        } catch (fetchError) {
          console.error(`Network error during payment attempt ${retryCount + 1}:`, fetchError);
          retryCount++;
          const delay = Math.min(1000 * (2 ** retryCount), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      // If no response after all retries, throw error
      if (!response) {
        throw new Error('Failed to process payment after multiple attempts. Please try again.');
      }
      
      // Handle response
      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle different types of errors with appropriate user feedback
        if (response.status === 403) {
          console.error('Authorization error during payment:', errorData);
          throw new Error('You are not authorized to pay for this offer. The offer may have been accepted by another user.');
        } else if (response.status === 409 || errorData.message?.includes('already been accepted')) {
          throw new Error('This flight has already been booked by another user. Please choose a different flight.');
        } else if (errorData.message?.includes('already completed') || errorData.message?.includes('already paid')) {
          throw new Error('This payment has already been processed. Please check your transactions.');
        } else if (response.status === 401) {
          // Authentication issues
          throw new Error('Your session has expired. Please sign in again to complete your payment.');
        } else {
          // Generic error
          throw new Error(errorData.message || 'Failed to process payment. Please try again later.');
        }
      }
      
      // Payment successful
      const responseData = await response.json();
      console.log('Payment completed successfully:', responseData);
      
      // Update UI state
      setCurrentStep('confirmation');
      toast.success('Payment completed successfully!');
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push('/jetshare/dashboard?tab=transactions');
      }, 3000);
    } catch (error) {
      console.error('Error processing payment:', error);
      setCurrentStep('details');
      toast.error(error instanceof Error ? error.message : 'Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Format the flight date
  const formattedDate = format(new Date(offer.flight_date), 'MMMM d, yyyy');
  
  // Payment summary details
  const paymentSummary = {
    amount: offer.requested_share_amount,
    handlingFee: Math.round(offer.requested_share_amount * 0.075), // 7.5% handling fee
    total: Math.round(offer.requested_share_amount * 1.075)
  };
  
  if (currentStep === 'confirmation') {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle>Payment Successful!</CardTitle>
          <CardDescription>Your flight has been booked</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <div className="flex items-center">
              <Plane className="h-4 w-4 mr-2 rotate-90" />
              <span>Flight</span>
            </div>
            <span className="font-medium">{offer.departure_location} → {offer.arrival_location}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span>Date</span>
            <span className="font-medium">{formattedDate}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span>Amount</span>
            <span className="font-medium">{formatCurrency(paymentSummary.amount)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span>Handling Fee</span>
            <span>{formatCurrency(paymentSummary.handlingFee)}</span>
          </div>
          <div className="flex justify-between items-center py-2 font-bold">
            <span>Total Paid</span>
            <span>{formatCurrency(paymentSummary.total)}</span>
          </div>
          
          <div className="mt-6 bg-green-50 p-4 rounded-md text-green-700 text-sm">
            <p>A confirmation email has been sent to your email address. You will be redirected to your dashboard shortly.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => router.push('/jetshare/dashboard?tab=transactions')}>
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="pb-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-2" 
          onClick={() => router.back()}
          disabled={isProcessing}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <CardTitle className="font-bold text-xl">
          {offer.departure_location} → {offer.arrival_location}
        </CardTitle>
        <CardDescription>
          Flight date: {formattedDate}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {currentStep === 'method' && (
          <>
            <div className="space-y-4">
              <h3 className="font-medium">Payment Summary</h3>
              <div className="bg-gray-50 p-4 rounded-md space-y-2">
                <div className="flex justify-between">
                  <span>Flight Share Amount</span>
                  <span className="font-medium">{formatCurrency(paymentSummary.amount)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Handling Fee (7.5%)</span>
                  <span>{formatCurrency(paymentSummary.handlingFee)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-gray-200 mt-2">
                  <span>Total</span>
                  <span>{formatCurrency(paymentSummary.total)}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">Select Payment Method</h3>
              <RadioGroup value={paymentMethod} onValueChange={handlePaymentMethodChange} className="space-y-3">
                <div className={cn(
                  "flex items-center space-x-3 rounded-md border p-4",
                  paymentMethod === 'card' ? "border-blue-200 bg-blue-50" : "border-gray-200"
                )}>
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex flex-1 items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                    <div>
                      <p className="font-medium">Credit Card</p>
                      <p className="text-sm text-muted-foreground">Pay with Visa, Mastercard, or Amex</p>
                    </div>
                  </Label>
                </div>
                
                <div className={cn(
                  "flex items-center space-x-3 rounded-md border p-4",
                  paymentMethod === 'crypto' ? "border-purple-200 bg-purple-50" : "border-gray-200"
                )}>
                  <RadioGroupItem value="crypto" id="crypto" />
                  <Label htmlFor="crypto" className="flex flex-1 items-center">
                    <Bitcoin className="h-5 w-5 mr-2 text-purple-600" />
                    <div>
                      <p className="font-medium">Cryptocurrency</p>
                      <p className="text-sm text-muted-foreground">Pay with Bitcoin, Ethereum, or USDC</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </>
        )}
        
        {currentStep === 'details' && (
          <>
            {paymentMethod === 'card' ? (
              <div className="space-y-5">
                <h3 className="font-medium">Enter Payment Details</h3>
                
                {/* Saved Payment Methods Section */}
                {savedPaymentMethods.length > 0 && (
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="useSavedMethod" 
                        checked={useSavedMethod} 
                        onCheckedChange={setUseSavedMethod}
                      />
                      <Label htmlFor="useSavedMethod">Use saved payment method</Label>
                    </div>
                    
                    {useSavedMethod && (
                      <div className="pl-8 space-y-3">
                        <RadioGroup 
                          value={selectedSavedMethodId || ''} 
                          onValueChange={setSelectedSavedMethodId}
                          className="space-y-2"
                        >
                          {savedPaymentMethods.map(method => (
                            <div key={method.id} className="flex items-center space-x-2 border p-3 rounded-md">
                              <RadioGroupItem value={method.id} id={method.id} />
                              <Label htmlFor={method.id} className="flex items-center">
                                {method.brand === 'visa' && <CreditCard className="h-4 w-4 mr-2 text-blue-600" />}
                                {method.brand === 'mastercard' && <CreditCard className="h-4 w-4 mr-2 text-red-600" />}
                                {method.brand === 'amex' && <CreditCard className="h-4 w-4 mr-2 text-purple-600" />}
                                <span>••••••••••••{method.last4}</span>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    )}
                  </div>
                )}
                
                {/* New Card Input Section - Only show if not using saved method */}
                {!useSavedMethod && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="cardName">Cardholder Name</Label>
                      <Input 
                        id="cardName"
                        name="cardName"
                        placeholder="Jane Smith"
                        value={cardDetails.cardName}
                        onChange={handleCardDetailsChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input 
                        id="cardNumber"
                        name="cardNumber"
                        placeholder="4242 4242 4242 4242"
                        value={cardDetails.cardNumber}
                        onChange={handleCardDetailsChange}
                        maxLength={19}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input 
                          id="expiry"
                          name="expiry"
                          placeholder="MM/YY"
                          value={cardDetails.expiry}
                          onChange={handleCardDetailsChange}
                          maxLength={5}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cvc">CVC</Label>
                        <Input 
                          id="cvc"
                          name="cvc"
                          placeholder="123"
                          value={cardDetails.cvc}
                          onChange={handleCardDetailsChange}
                          maxLength={4}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-2">
                      <Checkbox 
                        id="saveCard" 
                        checked={saveThisCard} 
                        onCheckedChange={(checked) => setSaveThisCard(checked === true)}
                      />
                      <Label htmlFor="saveCard">Save this card for future payments</Label>
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-50 p-4 rounded-md space-y-2 mt-4">
                  <div className="flex justify-between">
                    <span>Flight Share Amount</span>
                    <span className="font-medium">{formatCurrency(paymentSummary.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Handling Fee (7.5%)</span>
                    <span>{formatCurrency(paymentSummary.handlingFee)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-gray-200 mt-2">
                    <span>Total</span>
                    <span>{formatCurrency(paymentSummary.total)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-medium">Pay with Cryptocurrency</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center justify-center mb-4">
                    <QrCode className="h-32 w-32 text-purple-600" />
                  </div>
                  <p className="text-center text-sm mb-2">Scan this QR code to pay</p>
                  <p className="text-center text-xs text-muted-foreground">Or copy the wallet address below</p>
                  
                  <div className="mt-4 p-2 bg-white border rounded-md flex items-center justify-between">
                    <span className="text-xs truncate">0x742d35Cc6634C0532925a3b844Bc454e4438f44e</span>
                    <Button size="icon" variant="ghost" onClick={() => {
                      navigator.clipboard.writeText('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
                      toast.success('Address copied to clipboard');
                    }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Amount:</span>
                      <span className="font-medium">{formatCurrency(paymentSummary.total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Equivalent ETH:</span>
                      <span className="font-medium">0.0143 ETH</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {currentStep === 'processing' && (
          <div className="py-10 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <div className="text-center">
              <h3 className="font-medium text-lg">Processing Your Payment</h3>
              <p className="text-muted-foreground">Please wait while we process your payment...</p>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        {currentStep === 'method' && (
          <Button className="w-full" onClick={goToDetailsStep}>
            Continue to Payment
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
        
        {currentStep === 'details' && (
          <Button 
            className="w-full" 
            onClick={processPayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Complete Payment
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 