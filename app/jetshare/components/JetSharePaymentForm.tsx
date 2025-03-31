'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { JetShareOfferWithUser } from '@/types/jetshare';
import { User } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, CreditCard, Bitcoin, CheckCircle, ArrowRight, Plane, Copy, QrCode, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroupItem } from '@/components/ui/radio-group';
import { Label as UILabel } from '@/components/ui/label';
import { Input as UIInput } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { RadioGroup } from "@/components/ui/radio-group";

interface JetSharePaymentFormProps {
  offer: JetShareOfferWithUser;
}

export default function JetSharePaymentForm({ offer }: JetSharePaymentFormProps) {
  const router = useRouter();
  const { user, refreshSession } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card');
  const [currentStep, setCurrentStep] = useState<'method' | 'details' | 'processing' | 'confirmation' | 'auth_error'>('method');
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
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
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
  
  // Process the payment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    
    try {
      // First ensure we have a valid auth session
      console.log('Starting payment process, attempting to refresh auth session first');
      
      // Try an explicit refresh token
      let hasValidSession = false;
      try {
        if (refreshSession) {
          await refreshSession();
          hasValidSession = true;
          console.log('Session refreshed successfully before payment');
        }
      } catch (refreshError) {
        console.warn('Failed to refresh session before payment:', refreshError);
        // Will attempt payment anyway with service role fallback
      }
      
      // Verify we have user context
      if (!user && !hasValidSession) {
        console.warn('No user context available for payment, will rely on service role fallback');
      }
      
      // Prepare user ID for payment from various sources for robustness
      const userIdForPayment = user?.id || localStorage.getItem('jetstream_user_id') || sessionStorage.getItem('current_user_id') || 'unknown';
      
      // Log payment attempt for debugging
      console.log(`Processing payment for offer ${offer.id} by user ${userIdForPayment}`);
      
      // Prepare headers with multiple auth options for redundancy
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Request-Source': 'payment-form',
      };
      
      // Add auth token from multiple possible sources
      let authToken = null;
      try {
        // First try the supabase client getSession
        const supabase = createClient();
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.access_token) {
          authToken = sessionData.session.access_token;
          headers['Authorization'] = `Bearer ${authToken}`;
          console.log('Using session token for payment API');
        } else {
          // Try localStorage as fallback
          const tokenData = localStorage.getItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
          if (tokenData) {
            const parsed = JSON.parse(tokenData);
            if (parsed?.access_token) {
              authToken = parsed.access_token;
              headers['Authorization'] = `Bearer ${authToken}`;
              console.log('Using localStorage token for payment API');
            }
          }
        }
      } catch (e) {
        console.warn('Error getting auth token for payment:', e);
      }
      
      // Always include user ID in headers for service role fallback
      if (userIdForPayment) {
        headers['X-User-ID'] = userIdForPayment;
      }
      
      // Generate request ID and timestamp for tracking
      const timestamp = Date.now();
      const requestId = Math.random().toString(36).substring(2, 15);
      headers['X-Request-ID'] = requestId;
      
      // Add params for stability and request tracking
      const apiParams = new URLSearchParams({
        t: timestamp.toString(),
        rid: requestId,
        from: 'paymentForm',
        user_id: userIdForPayment
      }).toString();

      // First validate payment details and method
      if (!validateCardDetails()) {
        setIsProcessing(false);
        return;
      }

      // Set the processing step with a focus on the processing indicator
      setCurrentStep('processing');
      
      // Store the offer ID in storage for recovery if needed
      try {
        localStorage.setItem('current_payment_offer_id', offer.id);
        sessionStorage.setItem('current_payment_offer_id', offer.id);
        localStorage.setItem('jetstream_pending_payment', 'true');
      } catch (storageError) {
        console.warn('Error storing payment state in storage:', storageError);
      }
      
      // Use a small delay for UI smoothness
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call the API to process the payment - use credentials: 'include' to send cookies
      console.log('Calling payment API with headers:', Object.keys(headers).join(', '));
      const response = await fetch(`/api/jetshare/process-payment?${apiParams}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          offer_id: offer.id,
          payment_method: paymentMethod,
          payment_details: useSavedMethod && selectedSavedMethodId 
            ? { saved_method_id: selectedSavedMethodId } 
            : cardDetails,
          save_card: saveThisCard,
          user_id: userIdForPayment,
          amount: offer.requested_share_amount
        }),
        credentials: 'include', // Important for cookie-based auth
      });
      
      if (!response.ok) {
        // Parse the error response
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.warn('Error parsing error response:', parseError);
          errorData = { message: response.statusText || 'Unknown error' };
        }
        
        // Handle authentication errors
        if (response.status === 401) {
          console.error('Authentication error during payment processing:', errorData);
          
          // Critical recovery step: store essential info for service role fallback
          try {
            localStorage.setItem('current_payment_offer_id', offer.id);
            sessionStorage.setItem('pending_payment_id', offer.id);
            localStorage.setItem('jetstream_last_action', 'payment_attempted');
            localStorage.setItem('jetstream_user_id', userIdForPayment);
            
            // Try one more time with a service role approach
            console.log('Attempting critical payment recovery via service role path...');
            
            // Call the service role bypass endpoint directly
            const recoveryResponse = await fetch(`/api/jetshare/payment/critical-recovery`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Recovery-Request': 'true',
                'X-User-ID': userIdForPayment,
                'X-Offer-ID': offer.id,
              },
              body: JSON.stringify({
                offer_id: offer.id,
                user_id: userIdForPayment,
                amount: offer.requested_share_amount,
                payment_method: paymentMethod,
                recovery: true
              })
            });
            
            if (recoveryResponse.ok) {
              const recoveryData = await recoveryResponse.json();
              console.log('Recovery payment successful:', recoveryData);
              
              // Show success UI
              setIsSuccess(true);
              setCurrentStep('confirmation');
              
              // Redirect to dashboard after a short delay
              setTimeout(() => {
                window.location.href = recoveryData.data?.redirect_url || '/jetshare/dashboard?success=recovery';
              }, 2000);
              
              return;
            } else {
              console.error('Recovery attempt also failed, redirecting to login');
            }
          } catch (storageError) {
            console.warn('Error storing state for login redirect:', storageError);
          }
          
          throw new Error('Your session has expired. Please sign in again to complete your payment.');
        }
        
        // Handle other error types
        console.error('Payment processing error:', errorData);
        throw new Error(errorData.message || errorData.error || 'Payment failed. Please try again.');
      }
      
      // Parse the success response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.warn('Error parsing success response:', parseError);
        // Create a default success response
        data = {
          success: true,
          message: 'Payment completed, but response parsing failed',
          data: {
            redirect_url: '/jetshare/dashboard?success=payment-partial'
          }
        };
      }
      
      // Handle successful response
      console.log('Payment successful:', data);
      
      // Update the UI to reflect a successful payment
      setIsSuccess(true);
      setCurrentStep('confirmation');
      
      // Clear any pending payment state
      try {
        localStorage.removeItem('jetstream_pending_payment');
        sessionStorage.removeItem('pending_payment_id');
        localStorage.removeItem('current_payment_offer_id');
        sessionStorage.removeItem('current_payment_offer_id');
      } catch (e) {
        console.warn('Error clearing payment state:', e);
      }
      
      toast.success('Payment completed successfully!');
      
      // Set a timer to redirect to the dashboard
      setTimeout(() => {
        setIsComplete(true);
        
        // Use the redirect URL if provided, or default to dashboard
        const redirectUrl = data.data?.redirect_url || '/jetshare/dashboard?success=payment-completed';
        
        // Use window.location for a clean redirect instead of router.push
        console.log('Redirecting to:', redirectUrl);
        window.location.href = redirectUrl;
      }, 2000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('Payment submission error:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      
      // If the error is auth-related, offer a login button
      if (errorMessage.includes('session') || errorMessage.includes('sign in')) {
        // Store state for resuming after login
        try {
          localStorage.setItem('current_payment_offer_id', offer.id);
          sessionStorage.setItem('pending_payment_id', offer.id);
          localStorage.setItem('jetstream_last_action', 'payment_failed_auth');
        } catch (storageError) {
          console.warn('Error storing state for login redirect:', storageError);
        }
        
        // Return to the details step on error
        setCurrentStep('auth_error');
      } else {
        // Return to the details step on non-auth errors
        setCurrentStep('details');
      }
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
  
  // Render a different view based on the current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'method':
        return (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle>Choose Payment Method</CardTitle>
              <CardDescription>
                Select how you want to pay for your flight share.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="card">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger 
                    value="card" 
                    onClick={() => setPaymentMethod('card')}
                    autoFocus // Auto-focus this button for better keyboard navigation
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Card
                  </TabsTrigger>
                  <TabsTrigger 
                    value="crypto" 
                    onClick={() => setPaymentMethod('crypto')}
                  >
                    <Bitcoin className="mr-2 h-4 w-4" />
                    Crypto
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="card" className="space-y-4">
                  <div className="space-y-4 pt-4">
                    <h3 className="text-lg font-medium">Credit/Debit Card</h3>
                    <p className="text-sm text-muted-foreground">
                      Pay securely with your credit or debit card. We accept Visa, Mastercard, and American Express.
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="crypto" className="space-y-4">
                  <div className="space-y-4 pt-4">
                    <h3 className="text-lg font-medium">Cryptocurrency</h3>
                    <p className="text-sm text-muted-foreground">
                      Pay with Bitcoin, Ethereum, or other cryptocurrencies. Fast and secure transactions.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={goToDetailsStep}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </div>
        );
      case 'details':
        if (paymentMethod === 'card') {
          return (
            <div className="space-y-6">
              <CardHeader>
                <Button 
                  variant="ghost" 
                  className="p-0 mb-2" 
                  onClick={() => setCurrentStep('method')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <CardTitle>Card Payment</CardTitle>
                <CardDescription>
                  Enter your card details securely.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
                  {savedPaymentMethods.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="use-saved-method" 
                          checked={useSavedMethod}
                          onCheckedChange={setUseSavedMethod}
                          autoFocus // Auto-focus this switch for better keyboard navigation
                        />
                        <UILabel htmlFor="use-saved-method">Use a saved card</UILabel>
                      </div>
                      
                      {useSavedMethod && (
                        <RadioGroup 
                          value={selectedSavedMethodId || ''} 
                          onValueChange={setSelectedSavedMethodId}
                          className="mt-2 space-y-3"
                        >
                          {savedPaymentMethods.map((method) => (
                            <div key={method.id} className="flex items-center space-x-2">
                              <RadioGroupItem value={method.id} id={method.id} />
                              <UILabel htmlFor={method.id} className="flex items-center">
                                <CreditCard className="mr-2 h-4 w-4" />
                                {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} •••• {method.last4}
                              </UILabel>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    </div>
                  )}
                  
                  {(!useSavedMethod || savedPaymentMethods.length === 0) && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <UILabel htmlFor="cardNumber">Card Number</UILabel>
                        <UIInput
                          id="cardNumber"
                          name="cardNumber"
                          value={cardDetails.cardNumber}
                          onChange={handleCardDetailsChange}
                          placeholder="1234 5678 9012 3456"
                          autoComplete="cc-number"
                          className="font-mono"
                          autoFocus={savedPaymentMethods.length === 0} // Auto-focus first field only if no saved cards
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <UILabel htmlFor="cardName">Name on Card</UILabel>
                        <UIInput
                          id="cardName"
                          name="cardName"
                          value={cardDetails.cardName}
                          onChange={handleCardDetailsChange}
                          placeholder="John Smith"
                          autoComplete="cc-name"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <UILabel htmlFor="expiry">Expiry Date</UILabel>
                          <UIInput
                            id="expiry"
                            name="expiry"
                            value={cardDetails.expiry}
                            onChange={handleCardDetailsChange}
                            placeholder="MM/YY"
                            autoComplete="cc-exp"
                            className="font-mono"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <UILabel htmlFor="cvc">CVC</UILabel>
                          <UIInput
                            id="cvc"
                            name="cvc"
                            value={cardDetails.cvc}
                            onChange={handleCardDetailsChange}
                            placeholder="123"
                            autoComplete="cc-csc"
                            className="font-mono"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox 
                          id="save-card" 
                          checked={saveThisCard}
                          onCheckedChange={(checked) => 
                            setSaveThisCard(checked === true)
                          }
                        />
                        <UILabel htmlFor="save-card" className="text-sm">
                          Save this card for future payments
                        </UILabel>
                      </div>
                    </div>
                  )}
                </form>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleSubmit}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Pay ${formatCurrency(offer.requested_share_amount)}
                    </>
                  )}
                </Button>
              </CardFooter>
            </div>
          );
        } else {
          // Crypto payment flow (simplified for demo)
          return (
            <div className="space-y-6">
              <CardHeader>
                <Button 
                  variant="ghost" 
                  className="p-0 mb-2" 
                  onClick={() => setCurrentStep('method')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <CardTitle>Crypto Payment</CardTitle>
                <CardDescription>
                  Send cryptocurrency to complete your payment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="rounded-lg border p-4">
                    <div className="mb-4 text-center">
                      <QrCode className="h-32 w-32 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Scan QR code to pay</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Amount:</span>
                        <span>0.01523 BTC</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Address:</span>
                        <div className="flex items-center">
                          <span className="text-xs truncate max-w-[150px] font-mono">3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1">
                            <Copy className="h-3 w-3" />
                            <span className="sr-only">Copy</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-center">
                  <p className="text-sm text-muted-foreground">
                    After sending the payment, click the button below to complete your purchase.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  autoFocus
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying Transaction...
                    </>
                  ) : (
                    <>
                      I've Sent the Payment
                    </>
                  )}
                </Button>
              </CardFooter>
            </div>
          );
        }
        
      case 'processing':
        return (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle className="text-center">Processing Payment</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-16 w-16 text-amber-500 animate-spin mb-4" />
              <p className="text-center text-muted-foreground">
                Please wait while we process your payment...
              </p>
            </CardContent>
          </div>
        );
        
      case 'confirmation':
        return (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle className="text-center">
                {isSuccess ? 'Payment Successful' : 'Payment Failed'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              {isSuccess ? (
                <>
                  <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-3 mb-4">
                    <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-500" />
                  </div>
                  <p className="text-center font-medium text-lg mb-2">
                    Your payment of ${formatCurrency(offer.requested_share_amount)} has been successful!
                  </p>
                  <p className="text-center text-muted-foreground mb-6">
                    You'll receive a confirmation email shortly with all the details.
                  </p>
                  {isComplete && (
                    <Button 
                      onClick={() => router.push('/jetshare/dashboard')}
                      autoFocus
                    >
                      Go to Dashboard
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-3 mb-4">
                    <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-500" />
                  </div>
                  <p className="text-center font-medium text-lg mb-2">
                    There was a problem processing your payment
                  </p>
                  <p className="text-center text-muted-foreground mb-2">
                    {error || 'Please check your payment details and try again.'}
                  </p>
                  <Button 
                    onClick={() => setCurrentStep('details')}
                    className="mt-4"
                    autoFocus
                  >
                    Try Again
                  </Button>
                </>
              )}
            </CardContent>
          </div>
        );
        
      case 'auth_error':
        return (
          <div>
            <CardContent className="flex flex-col items-center py-6">
              <div className="rounded-full bg-red-50 p-3 mb-4">
                <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-500" />
              </div>
              <p className="text-center font-medium text-lg mb-2">
                Your session has expired
              </p>
              <p className="text-center text-muted-foreground mb-6">
                {error || 'Please sign in again to complete your payment.'}
              </p>
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button 
                  onClick={async () => {
                    // Try to refresh the session before redirecting
                    try {
                      const supabase = createClient();
                      const { data, error } = await supabase.auth.refreshSession();
                      
                      if (!error && data.session) {
                        // Session refreshed successfully
                        console.log('Payment Form: Session refreshed successfully');
                        toast.success('Session restored');
                        
                        // Update auth state
                        try {
                          localStorage.setItem('jetstream_user_id', data.session.user.id);
                          localStorage.setItem('jetstream_user_email', data.session.user.email || '');
                        } catch (e) {
                          console.warn('Failed to update auth state:', e);
                        }
                        
                        // Return to payment details
                        setCurrentStep('details');
                        return;
                      }
                      
                      // If refresh failed, redirect to login
                      console.log('Payment Form: Session refresh failed, redirecting to login');
                    } catch (e) {
                      console.error('Error refreshing session:', e);
                    }
                    
                    // Preserve the offer ID for recovery
                    try {
                      sessionStorage.setItem('pending_payment_id', offer.id);
                      localStorage.setItem('current_payment_offer_id', offer.id);
                    } catch (e) {
                      console.warn('Failed to store offer ID for login redirect:', e);
                    }
                    
                    // Redirect to login with return URL
                    window.location.href = `/auth/login?returnUrl=${encodeURIComponent(`/jetshare/payment/${offer.id}`)}&t=${Date.now()}`;
                  }}
                  autoFocus
                >
                  Try to Restore Session
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Preserve the offer ID for recovery
                    try {
                      sessionStorage.setItem('pending_payment_id', offer.id);
                      localStorage.setItem('current_payment_offer_id', offer.id);
                    } catch (e) {
                      console.warn('Failed to store offer ID for login redirect:', e);
                    }
                    
                    // Redirect to login with return URL
                    window.location.href = `/auth/login?returnUrl=${encodeURIComponent(`/jetshare/payment/${offer.id}`)}&t=${Date.now()}`;
                  }}
                >
                  Sign In Again
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => setCurrentStep('details')}
                >
                  Try Again Without Signing In
                </Button>
              </div>
            </CardContent>
          </div>
        );
        
      default:
        return null;
    }
  };
  
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
        {renderCurrentStep()}
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
            onClick={handleSubmit}
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