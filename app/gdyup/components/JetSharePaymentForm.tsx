'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { JetShareOfferWithUser } from '@/types/jetshare';
import { User } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, CreditCard, Bitcoin, CheckCircle, ArrowRight, Plane, Copy, QrCode, AlertCircle, Calendar, DollarSign, Info, Timer, Clock, Zap } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input as UIInput } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { RadioGroup } from "@/components/ui/radio-group";
import { useGdyupTheme } from '../hooks/useGdyupTheme';

// Add a comment near the top indicating future Stripe integration
// Note: This form uses a simplified test environment.
// For production, integrate with Stripe Elements or Checkout for secure payment collection.
// See: https://docs.stripe.com/payments/quickstart

interface JetSharePaymentFormProps {
  offer: JetShareOfferWithUser;
  onPaymentComplete?: () => void;
  onPaymentError?: () => void;
  testMode?: boolean;
}

export default function JetSharePaymentForm({ offer, onPaymentComplete, onPaymentError, testMode = false }: JetSharePaymentFormProps) {
  const router = useRouter();
  const { user, refreshSession } = useAuth();
  const { getThemeClasses, theme } = useGdyupTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'btc'>('card');
  const [currentStep, setCurrentStep] = useState<'confirmation' | 'method' | 'details' | 'processing' | 'auth_error'>('confirmation');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvc: ''
  });
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<Array<{id: string, last4: string, brand: string}>>([
    { id: 'pm_test_visa', last4: '4242', brand: 'visa' },
    { id: 'pm_test_mastercard', last4: '5556', brand: 'mastercard' }
  ]);
  const [useSavedMethod, setUseSavedMethod] = useState(true);
  const [selectedSavedMethodId, setSelectedSavedMethodId] = useState<string>('pm_test_visa');
  const [saveThisCard, setSaveThisCard] = useState(false);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showPayLater, setShowPayLater] = useState(true);
  
  // Fetch saved payment methods on mount
  useEffect(() => {
    const fetchSavedPaymentMethods = async () => {
      setIsLoadingMethods(true);
      try {
        // Set mock data for testing
        const mockSavedMethods = [
          { id: 'pm_test_visa', last4: '4242', brand: 'visa' },
          { id: 'pm_test_mastercard', last4: '5556', brand: 'mastercard' },
          { id: 'pm_test_amex', last4: '0005', brand: 'amex' }
        ];
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setSavedPaymentMethods(mockSavedMethods);
        
        // Always default to using saved methods in test mode
        setUseSavedMethod(true);
        setSelectedSavedMethodId(mockSavedMethods[0].id);
      } catch (error) {
        console.error('Error fetching saved payment methods:', error);
        toast.error('Failed to load saved payment methods');
      } finally {
        setIsLoadingMethods(false);
      }
    };
    
    fetchSavedPaymentMethods();
  }, [user?.id]);
  
  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value as 'card' | 'btc');
  };
  
  const handleCardDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setCardDetails({
      ...cardDetails,
      [name]: value
    });
    
    // Only validate when all fields are filled
    if (cardDetails.cardNumber && cardDetails.cardName && cardDetails.expiry && cardDetails.cvc) {
      validateCardDetails(false); // Don't show errors during typing
    }
  };
  
  // Add a helper function to insert test card data when in development mode
  const insertTestCardData = () => {
    if (process.env.NODE_ENV === 'development') {
      setCardDetails({
        cardNumber: '4242 4242 4242 4242',
        cardName: 'Test User',
        expiry: '12/30',
        cvc: '123'
      });
    }
  };
  
  const validateCardDetails = (showErrors = false) => {
    // Skip validation if using a saved method
    if (useSavedMethod && selectedSavedMethodId) {
      return true;
    }
    
    // Only basic validation for demo
    if (paymentMethod === 'card') {
      const { cardNumber, cardName, expiry, cvc } = cardDetails;
      
      // Check if all fields are filled
      if (!cardNumber || !cardName || !expiry || !cvc) {
        if (showErrors) {
          toast.error('Please complete all card details');
        }
        return false;
      }
      
      // Basic card number validation (length)
      if (cardNumber.replace(/\s/g, '').length < 16) {
        if (showErrors) {
          toast.error('Please enter a valid card number');
        }
        return false;
      }
      
      // Basic expiry validation (format MM/YY)
      if (!expiry.match(/^\d{2}\/\d{2}$/)) {
        if (showErrors) {
          toast.error('Please enter a valid expiry date (MM/YY)');
        }
        return false;
      }
      
      // Basic CVC validation (3-4 digits)
      if (cvc.length < 3) {
        if (showErrors) {
          toast.error('Please enter a valid CVC code');
        }
        return false;
      }
    }
    
    return true;
  };
  
  const goToDetailsStep = () => {
    setCurrentStep('details');
  };
  
  // Modify the handleSubmit function to handle both Stripe and BTCPay
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);
    
    // Detect test mode for more resilient processing
    const isTestMode = testMode || process.env.NODE_ENV === 'development' || 
                       window.location.hostname.includes('dev.gdyup.xyz') ||
                       window.location.hostname.includes('staging.gdyup.xyz');
    
    console.log(`Payment form: Processing in ${isTestMode ? 'TEST' : 'PRODUCTION'} mode`);
    
    try {
      // First ensure we have a valid auth session with improved retry logic
      console.log('Starting payment process, attempting auth verification first');
      
      // Try to establish a valid session before proceeding
      let hasValidSession = false;
      let authToken = null;
      let validUserId = null;
      let authErrors = [];
      
      // ATTEMPT 1: Try using the auth context's refreshSession
      // In test mode, don't show auth errors that might prevent test payments
      if (refreshSession && !isTestMode) {
        try {
          const refreshSuccess = await refreshSession();
          if (refreshSuccess && user?.id) {
            console.log('Auth refreshed successfully via provider');
            hasValidSession = true;
            validUserId = user.id;
          }
        } catch (e) {
          console.warn('Session refresh via provider failed:', e);
          authErrors.push('Provider refresh failed: ' + (e instanceof Error ? e.message : String(e)));
        }
      } else if (user?.id) {
        // If we have a user but skipped refresh, still use their ID
        validUserId = user.id;
        hasValidSession = true;
      }
      
      // ATTEMPT 2: Try getting user_id from localStorage as fallback
      if (!validUserId) {
        try {
          const localUserId = localStorage.getItem('jetstream_user_id');
          if (localUserId) {
            console.log('Using user_id from localStorage:', localUserId);
            validUserId = localUserId;
            hasValidSession = true;
          }
        } catch (e) {
          console.warn('Failed to get user_id from localStorage:', e);
          authErrors.push('LocalStorage access failed: ' + (e instanceof Error ? e.message : String(e)));
        }
      }
      
      // ATTEMPT 3: Try to get auth token from supabase directly
      if (!hasValidSession && !isTestMode) {
        try {
          const supabase = createClient();
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user?.id) {
            console.log('Got user ID from Supabase session:', data.session.user.id);
            validUserId = data.session.user.id;
            authToken = data.session.access_token;
            hasValidSession = true;
          }
        } catch (e) {
          console.warn('Failed to get session from Supabase:', e);
          authErrors.push('Supabase session failed: ' + (e instanceof Error ? e.message : String(e)));
        }
      }
      
      // ATTEMPT 4: In test mode, allow anonymous checkout
      if (!validUserId && isTestMode) {
        console.log('Using anonymous test mode for payment processing');
        validUserId = 'test-user-' + Math.floor(Date.now() / 1000);
        hasValidSession = true;
      }
      
      // After all our auth attempts, check if we're good to proceed
      if (!validUserId && !isTestMode) {
        console.error('No valid user ID available after multiple attempts');
        setCurrentStep('auth_error');
        setError(`Authentication required to complete this payment. Please sign in again. Errors: ${authErrors.join(', ')}`);
        setIsProcessing(false);
        if (onPaymentError) onPaymentError();
        return;
      }
      
      // Validate card details before proceeding if using card payment
      if (paymentMethod === 'card' && !validateCardDetails(true)) {
        setIsProcessing(false);
        if (onPaymentError) onPaymentError();
        return;
      }
      
      setCurrentStep('processing');
      
      // In test mode, mock a successful payment after a delay
      if (isTestMode && validUserId && validUserId.startsWith('test-user')) {
        console.log('TEST MODE: Simulating successful payment without server call');
        
        // Add artificial delay to simulate processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setIsSuccess(true);
        setCurrentStep('confirmation');
        
        // Store payment completion in localStorage for test mode
        try {
          localStorage.setItem('payment_complete', 'true');
          localStorage.setItem('gdyup_last_action', 'payment_complete');
        } catch (e) {
          console.warn('Failed to store payment completion flag:', e);
        }
        
        // Call the completion callback
        if (onPaymentComplete) onPaymentComplete();
        
        // Wait briefly before redirecting - use the universal success page
        setTimeout(() => {
          window.location.href = `/gdyup/payment/success?offer_id=${offer.id}&t=${Date.now()}&test=true`;
        }, 1000);
        
        setIsProcessing(false);
        return;
      }
      
      // Process payment with the API endpoint
      // This will redirect to BTCPay Server for crypto or handle Stripe for cards
      const response = await fetch(
        `/api/jetshare/process-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
            ...(validUserId ? { 'x-user-id': validUserId } : {})
          },
          body: JSON.stringify({
            offer_id: offer.id,
            payment_method: paymentMethod,
            user_id: validUserId,
            payment_details: {
              card_details: paymentMethod === 'card' ? {
                brand: useSavedMethod && selectedSavedMethodId 
                  ? savedPaymentMethods.find(m => m.id === selectedSavedMethodId)?.brand 
                  : 'test-card',
                last4: useSavedMethod && selectedSavedMethodId
                  ? savedPaymentMethods.find(m => m.id === selectedSavedMethodId)?.last4
                  : '4242'
              } : undefined
            }
          })
        }
      );
      
      if (!response.ok) {
        // Try to parse error details from response
        let errorDetail = 'Failed to process payment';
        
        try {
          const errorData = await response.json();
          errorDetail = errorData.message || errorData.error || errorDetail;
          
          // If authentication required, redirect to login
          if (response.status === 401 && errorData.action?.type === 'login') {
            console.error('Authentication required, redirecting to login');
            setCurrentStep('auth_error');
            
            setTimeout(() => {
              const returnUrl = errorData.action.returnUrl || `/gdyup/payment/${offer.id}`;
              window.location.href = `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}&t=${Date.now()}`;
            }, 1500);
            if (onPaymentError) onPaymentError();
            return;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        
        setError(errorDetail);
        setCurrentStep('details'); // Go back to details step on error
        toast.error(errorDetail);
        setIsProcessing(false);
        if (onPaymentError) onPaymentError();
        return;
      }
      
      // Process successful response
      const data = await response.json();
      
      console.log('Payment processed successfully:', data);
      
      // Show success message
      toast.success('Payment processed successfully!');
      setIsSuccess(true);
      setCurrentStep('confirmation');
      
      // Call the completion callback
      if (onPaymentComplete) onPaymentComplete();
      
      // For BTCPay, we need to redirect to the checkout URL
      if (paymentMethod === 'btc' && data.data?.checkout_url) {
        // Store payment state before redirecting
        try {
          localStorage.setItem('btcpay_invoice_id', data.data.invoice_id);
          localStorage.setItem('current_payment_offer_id', offer.id);
        } catch (e) {
          console.warn('Failed to store BTCPay invoice info:', e);
        }
        
        // Redirect to BTCPay checkout
        window.location.href = data.data.checkout_url;
        return;
      }
      
      // For Stripe or if we should redirect immediately
      if (data.data?.redirect_now === true || data.data?.force_redirect === true) {
        console.log('Force redirect requested, using direct browser navigation');
        
        // Store some data for session persistence
        try {
          localStorage.setItem('payment_complete', 'true');
          localStorage.setItem('gdyup_last_action', 'payment_complete');
          localStorage.setItem('current_payment_offer_id', offer.id);
        } catch (e) {
          console.warn('Failed to store payment completion flag:', e);
        }
        
        // Force direct browser navigation for most reliable redirect
        const redirectUrl = data.data?.redirect_url || 
          `/gdyup/payment/success?offer_id=${offer.id}&t=${Date.now()}`;
        
        console.log('Immediately redirecting to:', redirectUrl);
        window.location.href = redirectUrl;
        return;
      }
      
      // Regular redirect handled with brief delay to ensure storage is set
      try {
        // Store some data for session persistence
        localStorage.setItem('payment_complete', 'true');
        localStorage.setItem('gdyup_last_action', 'payment_complete');
        localStorage.setItem('current_payment_offer_id', offer.id);
        
        // Always use direct navigation for better reliability
        const successUrl = `/gdyup/payment/success?offer_id=${offer.id}&t=${Date.now()}`;
        console.log('Redirecting to success URL:', successUrl);
        window.location.href = successUrl;
      } catch (redirectError) {
        console.error('Redirect/storage error, using fallback navigation:', redirectError);
        // Use direct browser navigation as ultimate fallback
        window.location.href = `/gdyup/payment/success?offer_id=${offer.id}&t=${Date.now()}`;
      }
      
    } catch (error) {
      console.error('Error processing payment:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred during payment processing';
      
      setError(errorMessage);
      setCurrentStep('details'); // Go back to details step on error
      toast.error(errorMessage);
      if (onPaymentError) onPaymentError();
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle BTC Payment flow with improved UI
  const handleCryptoPayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log('Starting BTC payment process for offer:', offer.id);
      
      // Get required information from user context or localStorage
      let userId = user?.id;
      if (!userId) {
        try {
          userId = localStorage.getItem('jetstream_user_id') || undefined;
        } catch (e) {
          console.warn('Failed to get user ID from localStorage:', e);
        }
      }
      
      // In test mode, simulate payment
      if (testMode) {
        console.log('TEST MODE: Simulating BTC payment processing');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Update success state
        setIsSuccess(true);
        setCurrentStep('confirmation');
        
        // Call completion callback
        if (onPaymentComplete) onPaymentComplete();
        setIsProcessing(false);
        return;
      }
      
      // Call the API to process payment
      const response = await fetch('/api/jetshare/process-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
          ...(userId ? { 'x-user-id': userId } : {})
      },
      body: JSON.stringify({
        offer_id: offer.id,
          payment_method: 'btc',
          user_id: userId || 'guest'
        }),
      });
      
      // Parse the response as JSON, with error handling
      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error('Error parsing payment response:', error);
        if (onPaymentError) onPaymentError();
        throw new Error('Invalid response from payment server');
      }
      
      // Special case for development mode when fallback is available
      if (data.fallback_available && (process.env.NODE_ENV === 'development' || testMode)) {
        console.log('Dev mode fallback available:', data);
        setError('BTCPay Server is currently unavailable. Use the simulation mode for testing.');
        
        // Store info for dev simulation
        try {
          localStorage.setItem('btcpay_dev_fallback_url', data.details?.fallback_url || '');
          localStorage.setItem('current_payment_offer_id', offer.id);
        } catch (e) {
          console.warn('Failed to store fallback info:', e);
        }
        
        // Show simulation button and stop loading state
      setIsProcessing(false);
        
        // Display fallback option but don't continue with normal flow
        return;
      }
      
      // If the API request was successful but we have an error message
      if (data.error) {
        setError(data.error);
        setCurrentStep('details');
        toast.error(data.error);
        setIsProcessing(false);
        if (onPaymentError) onPaymentError();
        return;
      }
      
      // For successful response, update UI and redirect as needed
      if (data.success && data.checkout_url) {
        // Call completion callback before redirect
        if (onPaymentComplete) onPaymentComplete();
        
        // ...handle redirect
      }
      
    } catch (error) {
      console.error('Error processing BTC payment:', error);
      setError(error instanceof Error ? error.message : 'Failed to process BTC payment');
      setCurrentStep('details');
      toast.error('Failed to process payment');
      setIsProcessing(false);
      if (onPaymentError) onPaymentError();
    }
  };
  
  // Add a new handler for the development mode simulation
  const handleDevSimulation = () => {
    const fallbackUrl = localStorage.getItem('btcpay_dev_fallback_url') || `/gdyup/payment/dev-btcpay-simulator?offer_id=${offer.id}`;
    
    // Navigate to the dev simulator
    window.location.href = fallbackUrl;
  };
  
  // Add a handler for the "Pay Later" option
  const handlePayLater = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Get user ID using similar approach as handleSubmit
      let userId = user?.id;
      if (!userId) {
        try {
          userId = localStorage.getItem('jetstream_user_id') || undefined;
        } catch (e) {
          console.warn('Failed to get user ID from localStorage:', e);
        }
      }
      
      // If we still don't have a user ID and not in test mode, show error
      if (!userId && process.env.NODE_ENV !== 'development') {
        setError('You must be signed in to use the Pay Later option');
        setCurrentStep('auth_error');
        setIsProcessing(false);
        return;
      }
      
      // Call the API to mark the offer as accepted but unpaid
      const response = await fetch('/api/jetshare/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offer_id: offer.id,
          payment_method: paymentMethod,
          user_id: userId,
          pay_later: true // This is the key flag that indicates a deferred payment
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set up deferred payment');
      }
      
      const data = await response.json();
      
      // Show success message
      toast.success('Offer held for 1 hour. Complete payment before it expires.');
      
      // Redirect to dashboard or success page
      if (data.data?.redirect_url) {
        window.location.href = data.data.redirect_url;
      } else {
        router.push('/gdyup/dashboard?payment=pending');
      }
    } catch (error) {
      console.error('Error setting up deferred payment:', error);
      setError(error instanceof Error ? error.message : 'Failed to set up deferred payment');
      toast.error('Could not set up Pay Later option');
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
  
  // Function to update offer status in the database
  const updateOfferStatus = async (offerId: string, status: string) => {
    try {
      const supabase = createClient();
      
      // First, prepare the basic update data
      const updateData: Record<string, any> = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      // Attempt to add payment_status if that column exists in the database
      try {
        // First update without payment_status
        const { error: initialError } = await supabase
          .from('jetshare_offers')
          .update(updateData)
          .eq('id', offerId);
          
        if (!initialError) {
          // Successfully updated the basic fields
          console.log(`Successfully updated offer status to ${status}`);
          
          // Now try to update metadata with payment information
          const { data: offer } = await supabase
            .from('jetshare_offers')
            .select('metadata')
            .eq('id', offerId)
            .single();
          
          // Prepare metadata update with payment info
          const metadataUpdate = {
            metadata: {
              ...(offer?.metadata || {}),
              payment: {
                status: status === 'payment_pending' ? 'pending' : status,
                updated_at: new Date().toISOString()
              }
            }
          };
          
          // Update metadata separately
          await supabase
            .from('jetshare_offers')
            .update(metadataUpdate)
            .eq('id', offerId);
        } else {
          console.warn('Error in initial offer update:', initialError);
        }
      } catch (error) {
        console.error('Error updating offer status:', error);
        // Continue execution, as this is not critical to the payment flow
      }
    } catch (e) {
      console.warn('Error in updateOfferStatus:', e);
      // Continue with payment flow regardless
    }
  };
  
  // Function to render the current step UI based on state
  const renderCurrentStep = () => {
    if (currentStep === 'auth_error') {
      return renderAuthError();
    }
    
    if (currentStep === 'confirmation') {
      return renderConfirmationStep();
    }
    
    if (currentStep === 'method') {
      if (paymentMethod === 'btc') {
        return renderCryptoPaymentSection();
      }
      return renderPaymentMethodSelection();
    }
    
    if (currentStep === 'details') {
      return renderCardDetailsForm();
    }
    
    if (currentStep === 'processing') {
      return renderProcessingStep();
    }
    
    return null;
  };
  
  // Function to render the crypto payment section with enhanced UI
  const renderCryptoPaymentSection = () => {
    const isDevMode = process.env.NODE_ENV === 'development';
    const hasFallback = Boolean(localStorage.getItem('btcpay_dev_fallback_url'));
    
    return (
      <div className={getThemeClasses({
        base: "space-y-6 p-4 rounded-lg border",
        default: "bg-black/20 border-gray-800",
        blue: "bg-blue-950/20 border-blue-900",
        pink: "bg-pink-950/20 border-pink-900"
      })}>
        <div className="text-center space-y-2">
          <Bitcoin className={getThemeClasses({
            base: "h-8 w-8 mx-auto",
            default: "text-amber-500",
            blue: "text-amber-400",
            pink: "text-amber-300"
          })} />
          
          <h3 className={getThemeClasses({
            base: "text-lg font-semibold",
            default: "text-white",
            blue: "text-blue-100",
            pink: "text-pink-100"
          })}>Pay with Bitcoin</h3>
          
          <p className={getThemeClasses({
            base: "text-sm",
            default: "text-gray-300",
            blue: "text-blue-200",
            pink: "text-pink-200"
          })}>
            Secure and private Bitcoin payments
          </p>
        </div>
        
        <div className="grid gap-2">
          <div className="flex items-start">
            <Zap className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-amber-500" />
            <div>
              <span className="font-medium">Lightning: </span>
              <span>Instant payment option available</span>
            </div>
          </div>
          <div className="flex items-start">
            <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-amber-500" />
            <div>
              <span className="font-medium">Confirmation: </span>
              <span>1-2 confirmations required</span>
            </div>
          </div>
          <div className="flex items-start">
            <Plane className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-amber-500" />
            <div>
              <span className="font-medium">Ticket Issuance: </span>
              <span>Immediate upon payment confirmation</span>
            </div>
          </div>
        </div>
        
        {/* Main Bitcoin Payment Button */}
        <Button
          type="button"
          onClick={handleCryptoPayment}
          disabled={isProcessing}
          className={getThemeClasses({
            base: "w-full py-6 text-base font-medium relative",
            default: "bg-primary hover:bg-primary/90 text-primary-foreground",
            blue: "bg-blue-500 hover:bg-blue-600 text-white",
            pink: "bg-pink-500 hover:bg-pink-600 text-white"
          })}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin inline-block" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Bitcoin className="h-5 w-5 mr-2 inline-block" />
              <span className="font-bold">Pay with Bitcoin</span>
            </>
          )}
        </Button>
        
        {/* Development fallback button */}
        {isDevMode && error && error.includes('unavailable') && (
          <Button
            type="button"
            onClick={handleDevSimulation}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Info className="h-4 w-4 mr-2" />
            Use Development Simulation
          </Button>
        )}
        
        <p className={getThemeClasses({
          base: "text-xs text-center",
          default: "text-white/60",
          blue: "text-blue-100/60",
          pink: "text-pink-100/60"
        })}>
          Powered by self-custodial BTC Pay Server
        </p>
        
        {error && (
          <div className="mt-4 p-3 rounded-md bg-red-900/30 border border-red-800">
            <p className="text-sm text-red-200 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              {error}
            </p>
          </div>
        )}
      </div>
    );
  };
  
  // Function to render the payment method selection with enhanced UI
  const renderPaymentMethodSelection = () => {
    return (
      <div className="space-y-6">
        <div className={getThemeClasses({
          base: "p-4 rounded-lg border mb-6",
          default: "bg-black/20 border-gray-800 text-white/90",
          blue: "bg-blue-950/20 border-blue-900 text-blue-100/90",
          pink: "bg-pink-950/20 border-pink-900 text-pink-100/90"
        })}>
          <h3 className="font-medium mb-2">Choose Payment Method</h3>
          <p className="text-sm opacity-80">
            Pay securely using your preferred payment method. All transactions are encrypted.
          </p>
        </div>
        
        <RadioGroup 
          value={paymentMethod} 
          onValueChange={handlePaymentMethodChange}
          className="space-y-4"
        >
          <div className={getThemeClasses({
            base: "flex items-center p-4 rounded-lg border transition-colors cursor-pointer",
            default: paymentMethod === 'card' ? "bg-gray-800/80 border-gray-700" : "bg-black/20 border-gray-800",
            blue: paymentMethod === 'card' ? "bg-blue-900/80 border-blue-800" : "bg-blue-950/20 border-blue-900",
            pink: paymentMethod === 'card' ? "bg-pink-900/80 border-pink-800" : "bg-pink-950/20 border-pink-900"
          })}>
            <RadioGroupItem value="card" id="card" className="mr-3" />
            <Label 
              htmlFor="card" 
              className={getThemeClasses({
                base: "flex-grow cursor-pointer flex items-center",
                default: "text-white",
                blue: "text-blue-100",
                pink: "text-pink-100"
              })}
            >
              <CreditCard className="h-5 w-5 mr-3" />
              <div>
                <div className="font-medium">Credit / Debit Card</div>
                <div className="text-sm opacity-70">Pay with your existing card (VISA, Mastercard, etc.)</div>
              </div>
            </Label>
          </div>
          
          <div className={getThemeClasses({
            base: "flex items-center p-4 rounded-lg border transition-colors cursor-pointer",
            default: paymentMethod === 'btc' ? "bg-gray-800/80 border-gray-700" : "bg-black/20 border-gray-800",
            blue: paymentMethod === 'btc' ? "bg-blue-900/80 border-blue-800" : "bg-blue-950/20 border-blue-900",
            pink: paymentMethod === 'btc' ? "bg-pink-900/80 border-pink-800" : "bg-pink-950/20 border-pink-900"
          })}>
            <RadioGroupItem value="btc" id="btc" className="mr-3" />
            <Label 
              htmlFor="btc" 
              className={getThemeClasses({
                base: "flex-grow cursor-pointer flex items-center",
                default: "text-white",
                blue: "text-blue-100",
                pink: "text-pink-100"
              })}
            >
              <Bitcoin className={getThemeClasses({
                base: "h-5 w-5 mr-3",
                default: "text-amber-500",
                blue: "text-amber-400",
                pink: "text-amber-300"
              })} />
              <div>
                <div className="font-medium">Bitcoin</div>
                <div className="text-sm opacity-70">Pay with BTC - secure, private, and borderless</div>
              </div>
            </Label>
          </div>
        </RadioGroup>
        
        <div className="pt-6">
          <Button
            type="button"
            onClick={() => {
              paymentMethod === 'card' ? goToDetailsStep() : handleCryptoPayment();
            }}
            disabled={isProcessing}
            style={paymentMethod === 'btc' ? { backgroundColor: '#F59E0B', color: 'black' } : undefined}
            className={`w-full py-6 text-base font-medium ${
              paymentMethod === 'btc' 
                ? 'hover:bg-amber-600' 
                : getThemeClasses({
                    base: "",
                    default: "bg-green-500 hover:bg-green-600 text-white",
                    blue: "bg-green-500 hover:bg-green-600 text-white",
                    pink: "bg-green-500 hover:bg-green-600 text-white"
                  })
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : paymentMethod === 'card' ? (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Continue to Card Details
              </>
            ) : (
              <>
                <Bitcoin className="h-5 w-5 mr-2" />
                <span className="font-bold">Pay with Bitcoin</span>
              </>
            )}
          </Button>
        </div>
        
        {showPayLater && (
          <div className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handlePayLater}
              disabled={isProcessing}
              className={getThemeClasses({
                base: "w-full text-sm font-normal",
                default: "text-gray-400 hover:text-white hover:bg-gray-800/50",
                blue: "text-blue-400 hover:text-blue-200 hover:bg-blue-900/50",
                pink: "text-pink-400 hover:text-pink-200 hover:bg-pink-900/50"
              })}
            >
              Pay Later
            </Button>
          </div>
        )}
      </div>
    );
  };
  
  // Function to render the confirmation step UI
  const renderConfirmationStep = () => {
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Confirm Flight Share</CardTitle>
              <CardDescription>
                Review the flight details before proceeding to payment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <span className="text-sm text-muted-foreground">From</span>
                    <p className="font-medium text-lg">{offer.departure_location}</p>
                  </div>
                  <Plane className="h-5 w-5 mx-4 transform rotate-90" />
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground">To</span>
                    <p className="font-medium text-lg">{offer.arrival_location}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Flight Date</span>
                    </div>
                    <p className="font-medium">{format(new Date(offer.flight_date), 'MMMM d, yyyy')}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Your Share Cost</span>
                    </div>
                    <p className="font-medium">${offer.requested_share_amount.toLocaleString()}</p>
                  </div>
                </div>
                
                {/* Aircraft model info if available */}
                {offer.aircraft_model && (
                  <div>
                    <div className="flex items-center">
                      <Plane className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Aircraft</span>
                    </div>
                    <p className="font-medium">{offer.aircraft_model}</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => setCurrentStep('method')}
              >
                Continue to Payment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        );
  };
  
  // Function to render the card details form UI
  const renderCardDetailsForm = () => {
          return (
            <Card className="w-full max-w-md mx-auto">
              <CardHeader className="pb-0">
                <CardTitle>
                  Complete Your Booking
                  {process.env.NODE_ENV === 'development' && (
                    <span className="ml-2 text-sm font-normal text-blue-500">
                      (Test Mode)
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Pay your share and secure your seat
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-1 text-xs p-1 bg-blue-50 rounded-sm text-blue-700">
                      Use card: 4242 4242 4242 4242 | Any future date | Any 3-digit CVC
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <Button 
                variant="ghost" 
                className="p-0 ml-6 mb-2" 
                onClick={() => setCurrentStep('method')}
                disabled={isProcessing}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <CardContent>
                <form 
                  className="space-y-4" 
                  id="payment-form" 
                  onSubmit={handleSubmit}
                  autoComplete="on"
                  data-testid="payment-form"
                >
                  {/* Test mode message */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="rounded-md bg-blue-50 p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Info className="h-5 w-5 text-blue-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">Test Mode Active</h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <p>Using test payment cards. Any card details will work in test mode.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {savedPaymentMethods.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="use-saved-method" 
                          checked={useSavedMethod}
                          onCheckedChange={setUseSavedMethod}
                          autoFocus // Auto-focus this switch for better keyboard navigation
                        />
                        <Label htmlFor="use-saved-method">Use a saved card</Label>
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
                              <Label htmlFor={method.id} className="flex items-center">
                                <CreditCard className="mr-2 h-4 w-4" />
                                {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} •••• {method.last4}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    </div>
                  )}
                  
                  {(!useSavedMethod || savedPaymentMethods.length === 0) && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <UIInput
                          id="cardNumber"
                          name="cardNumber"
                          value={cardDetails.cardNumber}
                          onChange={handleCardDetailsChange}
                          placeholder="4242 4242 4242 4242" 
                          autoComplete="cc-number"
                          data-testid="card-number-input"
                          className="font-mono"
                          autoFocus={savedPaymentMethods.length === 0}
                          onClick={() => process.env.NODE_ENV === 'development' && !cardDetails.cardNumber && insertTestCardData()}
                        />
                        {process.env.NODE_ENV === 'development' && !cardDetails.cardNumber && (
                          <div className="mt-1">
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="outline" 
                              className="text-xs h-6 py-0 px-2"
                              onClick={insertTestCardData}
                            >
                              Insert Test Data
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cardName">Name on Card</Label>
                        <UIInput
                          id="cardName"
                          name="cardName"
                          value={cardDetails.cardName}
                          onChange={handleCardDetailsChange}
                          placeholder="John Doe"
                          autoComplete="cc-name"
                          data-testid="card-name-input"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <UIInput
                            id="expiry"
                            name="expiry"
                            value={cardDetails.expiry}
                            onChange={handleCardDetailsChange}
                            placeholder="MM/YY"
                            autoComplete="cc-exp"
                            data-testid="card-expiry-input"
                            className="font-mono"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="cvc">CVC</Label>
                          <UIInput
                            id="cvc"
                            name="cvc"
                            value={cardDetails.cvc}
                            onChange={handleCardDetailsChange}
                            placeholder="123"
                            autoComplete="cc-csc"
                            data-testid="card-cvc-input"
                            className="font-mono"
                            inputMode="numeric"
                            maxLength={4}
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
                        <Label htmlFor="save-card" className="text-sm">
                          Save this card for future payments
                        </Label>
                      </div>
                    </div>
                  )}
                  
                  {/* Pay Later option - only show in card details view */}
                  {showPayLater && !isProcessing && (
                    <div className="mt-6 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">Pay later (1 hour hold)</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handlePayLater}
                          disabled={isProcessing}
                        >
                          Hold My Seat
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Locks your seat for 1 hour. You must complete payment before expiration.
                      </p>
                    </div>
                  )}
                </form>
              </CardContent>
              <CardFooter className="flex justify-center pt-2">
                <Button 
                  type="submit"
                  form="payment-form"
                  className="w-full py-6 text-base font-medium"
                  disabled={isProcessing}
                  data-testid="complete-payment-button"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Complete Payment
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
  };
  
  // Function to render the processing step UI
  const renderProcessingStep = () => {
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
  };
        
  // Function to render the auth error UI
  const renderAuthError = () => {
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
                    window.location.href = `/auth/login?returnUrl=${encodeURIComponent(`/gdyup/payment/${offer.id}`)}&t=${Date.now()}`;
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
                    window.location.href = `/auth/login?returnUrl=${encodeURIComponent(`/gdyup/payment/${offer.id}`)}&t=${Date.now()}`;
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
  };
  
  return (
    <div className="w-full max-w-md mx-auto">
      {renderCurrentStep()}
    </div>
  );
} 