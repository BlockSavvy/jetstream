'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { JetShareOfferWithUser } from '@/types/jetshare';
import { User } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, CreditCard, Bitcoin, CheckCircle, ArrowRight, Plane, Copy, QrCode, AlertCircle, Calendar, DollarSign, Info, Timer, Clock, Zap, Ticket } from 'lucide-react';
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
import { motion, AnimatePresence } from 'framer-motion';

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
      <motion.div 
        className={getThemeClasses({
          base: "space-y-6 p-6 rounded-lg border transition-colors",
          default: "bg-black/20 border-gray-800",
          blue: "bg-blue-950/20 border-blue-900",
          pink: "bg-pink-950/20 border-pink-900"
        })}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center space-y-3">
          <motion.div 
            className={getThemeClasses({
              base: "inline-flex items-center justify-center w-16 h-16 rounded-full mb-2",
              default: "bg-gdyup-primary/10",
              blue: "bg-gdyup-primary/10",
              pink: "bg-gdyup-primary/10"
            })}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <Bitcoin className={getThemeClasses({
              base: "h-8 w-8",
              default: "text-gdyup-primary",
              blue: "text-gdyup-primary",
              pink: "text-gdyup-primary"
            })} />
          </motion.div>
          
          <h3 className={getThemeClasses({
            base: "text-xl font-bold",
            default: "text-white",
            blue: "text-blue-50",
            pink: "text-pink-50"
          })}>Pay with Bitcoin</h3>
          
          <p className={getThemeClasses({
            base: "text-sm",
            default: "text-gray-400",
            blue: "text-blue-300",
            pink: "text-pink-300"
          })}>
            Secure, private, and borderless payments
          </p>
        </div>
        
        <div className={getThemeClasses({
          base: "grid gap-4 p-4 rounded-lg border",
          default: "bg-black/30 border-gray-800",
          blue: "bg-blue-900/30 border-blue-800",
          pink: "bg-pink-900/30 border-pink-800"
        })}>
          <div className="flex items-start space-x-3">
            <Zap className={getThemeClasses({
              base: "h-5 w-5 mt-0.5 flex-shrink-0",
              default: "text-gdyup-primary",
              blue: "text-gdyup-primary",
              pink: "text-gdyup-primary"
            })} />
            <div>
              <span className="font-semibold">Lightning Network</span>
              <p className="text-sm opacity-80">Instant payments with minimal fees</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <CheckCircle className={getThemeClasses({
              base: "h-5 w-5 mt-0.5 flex-shrink-0",
              default: "text-gdyup-primary",
              blue: "text-gdyup-primary",
              pink: "text-gdyup-primary"
            })} />
            <div>
              <span className="font-semibold">On-Chain Security</span>
              <p className="text-sm opacity-80">1-2 confirmations for settlement</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Plane className={getThemeClasses({
              base: "h-5 w-5 mt-0.5 flex-shrink-0",
              default: "text-gdyup-primary",
              blue: "text-gdyup-primary",
              pink: "text-gdyup-primary"
            })} />
            <div>
              <span className="font-semibold">Instant Boarding Pass</span>
              <p className="text-sm opacity-80">Generated immediately after confirmation</p>
            </div>
          </div>
        </div>
        
        {/* Amount Display */}
        <motion.div 
          className={getThemeClasses({
            base: "p-4 rounded-lg border text-center",
            default: "bg-black/30 border-gray-800",
            blue: "bg-blue-900/30 border-blue-800",
            pink: "bg-pink-900/30 border-pink-800"
          })}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="text-sm font-medium mb-1">Amount Due</div>
          <div className="text-2xl font-bold font-mono">
            {formatCurrency(offer.requested_share_amount, 'USD')}
          </div>
          <div className="text-sm mt-1">≈ {(offer.requested_share_amount / 68452).toFixed(8)} BTC</div>
        </motion.div>
        
        {/* Main Bitcoin Payment Button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            type="button"
            onClick={handleCryptoPayment}
            disabled={isProcessing}
            className={getThemeClasses({
              base: "w-full py-6 text-base font-bold relative transition-all duration-200",
              default: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text",
              blue: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text",
              pink: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text"
            })}
          >
            {isProcessing ? (
              <motion.div
                className="flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Loader2 className="h-6 w-6 mr-2 animate-spin inline-block" />
                <span>Initializing Payment...</span>
              </motion.div>
            ) : (
              <motion.div
                className="flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Bitcoin className="h-6 w-6 mr-2 inline-block" />
                <span>Continue to Payment</span>
              </motion.div>
            )}
          </Button>
        </motion.div>
        
        {/* Development Mode UI */}
        {isDevMode && error && error.includes('unavailable') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              type="button"
              onClick={handleDevSimulation}
              className={getThemeClasses({
                base: "w-full mt-2",
                default: "bg-gdyup-secondary hover:bg-gdyup-secondary/90 text-white",
                blue: "bg-gdyup-secondary hover:bg-gdyup-secondary/90 text-white",
                pink: "bg-gdyup-secondary hover:bg-gdyup-secondary/90 text-white"
              })}
            >
              <Info className="h-4 w-4 mr-2" />
              Use Development Simulation
            </Button>
          </motion.div>
        )}
        
        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div 
              className={getThemeClasses({
                base: "p-4 rounded-lg border space-y-2",
                default: "bg-red-950/30 border-red-900",
                blue: "bg-red-950/20 border-red-800",
                pink: "bg-red-950/20 border-red-800"
              })}
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center space-x-2 text-red-400">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="font-medium">Payment Error</p>
              </div>
              <p className="text-sm text-red-300">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="text-center">
          <p className={getThemeClasses({
            base: "text-xs",
            default: "text-gray-500",
            blue: "text-blue-400",
            pink: "text-pink-400"
          })}>
            Powered by self-custodial BTCPay Server
          </p>
        </div>
      </motion.div>
    );
  };
  
  // Function to render the payment method selection with enhanced UI
  const renderPaymentMethodSelection = () => {
    return (
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-lg font-semibold mb-4">Select Payment Method</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div 
            whileHover={{ scale: 1.03 }} 
            whileTap={{ scale: 0.97 }}
          >
            <div
              onClick={() => setPaymentMethod('card')}
              className={cn(
                "p-4 rounded-lg border cursor-pointer transition-all",
                getThemeClasses({
                  base: "relative",
                  default: paymentMethod === 'card' 
                    ? "border-gdyup-primary bg-black/30" 
                    : "border-gray-700 bg-black/20 hover:border-gray-600",
                  blue: paymentMethod === 'card' 
                    ? "border-gdyup-primary bg-blue-950/30" 
                    : "border-blue-800 bg-blue-950/20 hover:border-blue-700",
                  pink: paymentMethod === 'card' 
                    ? "border-gdyup-primary bg-pink-950/30" 
                    : "border-pink-800 bg-pink-950/20 hover:border-pink-700"
                })
              )}
            >
              <div className="flex items-center">
                <div className="mr-3">
                  <CreditCard className={cn(
                    "h-6 w-6",
                    getThemeClasses({
                      base: "",
                      default: "text-white",
                      blue: "text-blue-300",
                      pink: "text-pink-300"
                    })
                  )} />
                </div>
                <div>
                  <div className="font-medium">Credit Card</div>
                  <div className={getThemeClasses({
                    base: "text-sm",
                    default: "text-gray-400",
                    blue: "text-blue-400",
                    pink: "text-pink-400"
                  })}>
                    Visa, Mastercard, Amex
                  </div>
                </div>
                {paymentMethod === 'card' && (
                  <motion.div 
                    className="absolute right-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <CheckCircle className={getThemeClasses({
                      base: "h-5 w-5",
                      default: "text-gdyup-primary",
                      blue: "text-gdyup-primary",
                      pink: "text-gdyup-primary"
                    })} />
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.03 }} 
            whileTap={{ scale: 0.97 }}
          >
            <div
              onClick={() => setPaymentMethod('btc')}
              className={cn(
                "p-4 rounded-lg border cursor-pointer transition-all",
                getThemeClasses({
                  base: "relative",
                  default: paymentMethod === 'btc' 
                    ? "border-gdyup-primary bg-black/30" 
                    : "border-gray-700 bg-black/20 hover:border-gray-600",
                  blue: paymentMethod === 'btc' 
                    ? "border-gdyup-primary bg-blue-950/30" 
                    : "border-blue-800 bg-blue-950/20 hover:border-blue-700",
                  pink: paymentMethod === 'btc' 
                    ? "border-gdyup-primary bg-pink-950/30" 
                    : "border-pink-800 bg-pink-950/20 hover:border-pink-700"
                })
              )}
            >
              <div className="flex items-center">
                <div className="mr-3">
                  <Bitcoin className={cn(
                    "h-6 w-6",
                    getThemeClasses({
                      base: "",
                      default: "text-orange-500",
                      blue: "text-orange-500",
                      pink: "text-orange-500"
                    })
                  )} />
                </div>
                <div>
                  <div className="font-medium">Bitcoin</div>
                  <div className={getThemeClasses({
                    base: "text-sm",
                    default: "text-gray-400",
                    blue: "text-blue-400",
                    pink: "text-pink-400"
                  })}>
                    Pay with BTC
                  </div>
                </div>
                {paymentMethod === 'btc' && (
                  <motion.div 
                    className="absolute right-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <CheckCircle className={getThemeClasses({
                      base: "h-5 w-5",
                      default: "text-gdyup-primary",
                      blue: "text-gdyup-primary",
                      pink: "text-gdyup-primary"
                    })} />
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
        
        <div className="flex justify-end mt-6">
          <motion.div 
            whileHover={{ scale: 1.03 }} 
            whileTap={{ scale: 0.97 }}
          >
            <Button
              onClick={() => setCurrentStep('details')}
              className={cn(
                "rounded-md font-medium transition-colors",
                getThemeClasses({
                  base: "",
                  default: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text",
                  blue: "bg-blue-500 hover:bg-blue-600 text-white",
                  pink: "bg-pink-500 hover:bg-pink-600 text-white"
                })
              )}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  };
  
  // Function to render the card details form UI
  const renderCardDetailsForm = () => {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className={getThemeClasses({
          base: "w-full max-w-md mx-auto border shadow-lg",
          default: "bg-gray-900/90 border-gray-800",
          blue: "bg-blue-950/90 border-blue-900",
          pink: "bg-pink-950/90 border-pink-900"
        })}>
          <CardHeader className="pb-0">
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <CardTitle className={getThemeClasses({
                base: "",
                default: "text-white",
                blue: "text-blue-50",
                pink: "text-pink-50"
              })}>
                Complete Your Booking
                {process.env.NODE_ENV === 'development' && (
                  <span className={getThemeClasses({
                    base: "ml-2 text-sm font-normal",
                    default: "text-blue-500",
                    blue: "text-blue-400",
                    pink: "text-pink-400"
                  })}>
                    (Test Mode)
                  </span>
                )}
              </CardTitle>
              <CardDescription className={getThemeClasses({
                base: "",
                default: "text-gray-400",
                blue: "text-blue-300",
                pink: "text-pink-300"
              })}>
                Pay your share and secure your seat
                {process.env.NODE_ENV === 'development' && (
                  <motion.div 
                    className={getThemeClasses({
                      base: "mt-1 text-xs p-1 rounded-sm",
                      default: "bg-blue-950 text-blue-300 border border-blue-800",
                      blue: "bg-blue-950 text-blue-300 border border-blue-800",
                      pink: "bg-pink-950 text-pink-300 border border-pink-800"
                    })}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Use card: 4242 4242 4242 4242 | Any future date | Any 3-digit CVC
                  </motion.div>
                )}
              </CardDescription>
            </motion.div>
          </CardHeader>
          <Button 
            variant="ghost" 
            className={getThemeClasses({
              base: "p-0 ml-6 mb-2",
              default: "text-white hover:text-gdyup-primary hover:bg-transparent",
              blue: "text-blue-100 hover:text-gdyup-primary hover:bg-transparent",
              pink: "text-pink-100 hover:text-gdyup-primary hover:bg-transparent"
            })}
            onClick={() => setCurrentStep('method')}
            disabled={isProcessing}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <CardContent>
            <motion.form 
              className="space-y-4" 
              id="payment-form" 
              onSubmit={handleSubmit}
              autoComplete="on"
              data-testid="payment-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              {/* Test mode message */}
              {process.env.NODE_ENV === 'development' && (
                <motion.div 
                  className={getThemeClasses({
                    base: "rounded-md p-4 mb-4",
                    default: "bg-blue-950/50 border border-blue-800",
                    blue: "bg-blue-950/50 border border-blue-800",
                    pink: "bg-pink-950/50 border border-pink-800"
                  })}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Info className={getThemeClasses({
                        base: "h-5 w-5",
                        default: "text-blue-400",
                        blue: "text-blue-400",
                        pink: "text-pink-400"
                      })} aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className={getThemeClasses({
                        base: "text-sm font-medium",
                        default: "text-blue-300",
                        blue: "text-blue-300",
                        pink: "text-pink-300"
                      })}>Test Mode Active</h3>
                      <div className="mt-2 text-sm">
                        <p className={getThemeClasses({
                          base: "",
                          default: "text-blue-400",
                          blue: "text-blue-400",
                          pink: "text-pink-400"
                        })}>Using test payment cards. Any card details will work in test mode.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
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
                    <Label htmlFor="use-saved-method" className={getThemeClasses({
                      base: "",
                      default: "text-white",
                      blue: "text-blue-50",
                      pink: "text-pink-50"
                    })}>Use a saved card</Label>
                  </div>
                  
                  {useSavedMethod && (
                    <RadioGroup 
                      value={selectedSavedMethodId || ''} 
                      onValueChange={setSelectedSavedMethodId}
                      className="mt-2 space-y-3"
                    >
                      {savedPaymentMethods.map((method) => (
                        <motion.div 
                          key={method.id} 
                          className={getThemeClasses({
                            base: "flex items-center space-x-2 p-2 rounded-md",
                            default: "hover:bg-gray-800/50",
                            blue: "hover:bg-blue-900/50",
                            pink: "hover:bg-pink-900/50"
                          })}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <RadioGroupItem value={method.id} id={method.id} />
                          <Label htmlFor={method.id} className={getThemeClasses({
                            base: "flex items-center cursor-pointer",
                            default: "text-white",
                            blue: "text-blue-50",
                            pink: "text-pink-50"
                          })}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} •••• {method.last4}
                          </Label>
                        </motion.div>
                      ))}
                    </RadioGroup>
                  )}
                </div>
              )}
              
              {(!useSavedMethod || savedPaymentMethods.length === 0) && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="cardNumber" className={getThemeClasses({
                      base: "",
                      default: "text-white",
                      blue: "text-blue-50",
                      pink: "text-pink-50"
                    })}>Card Number</Label>
                    <UIInput
                      id="cardNumber"
                      name="cardNumber"
                      value={cardDetails.cardNumber}
                      onChange={handleCardDetailsChange}
                      placeholder="4242 4242 4242 4242" 
                      autoComplete="cc-number"
                      data-testid="card-number-input"
                      className={cn("font-mono", getThemeClasses({
                        base: "",
                        default: "bg-gray-800 border-gray-700 text-white",
                        blue: "bg-blue-900 border-blue-800 text-blue-50",
                        pink: "bg-pink-900 border-pink-800 text-pink-50"
                      }))}
                      autoFocus={savedPaymentMethods.length === 0}
                      onClick={() => process.env.NODE_ENV === 'development' && !cardDetails.cardNumber && insertTestCardData()}
                    />
                    {process.env.NODE_ENV === 'development' && !cardDetails.cardNumber && (
                      <motion.div 
                        className="mt-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline" 
                          className={cn("text-xs h-6 py-0 px-2", getThemeClasses({
                            base: "",
                            default: "border-gray-700 text-gray-300 hover:bg-gray-800",
                            blue: "border-blue-700 text-blue-300 hover:bg-blue-900",
                            pink: "border-pink-700 text-pink-300 hover:bg-pink-900"
                          }))}
                          onClick={insertTestCardData}
                        >
                          Insert Test Data
                        </Button>
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cardName" className={getThemeClasses({
                      base: "",
                      default: "text-white",
                      blue: "text-blue-50",
                      pink: "text-pink-50"
                    })}>Name on Card</Label>
                    <UIInput
                      id="cardName"
                      name="cardName"
                      value={cardDetails.cardName}
                      onChange={handleCardDetailsChange}
                      placeholder="John Doe"
                      autoComplete="cc-name"
                      data-testid="card-name-input"
                      className={getThemeClasses({
                        base: "",
                        default: "bg-gray-800 border-gray-700 text-white",
                        blue: "bg-blue-900 border-blue-800 text-blue-50",
                        pink: "bg-pink-900 border-pink-800 text-pink-50"
                      })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry" className={getThemeClasses({
                        base: "",
                        default: "text-white",
                        blue: "text-blue-50",
                        pink: "text-pink-50"
                      })}>Expiry Date</Label>
                      <UIInput
                        id="expiry"
                        name="expiry"
                        value={cardDetails.expiry}
                        onChange={handleCardDetailsChange}
                        placeholder="MM/YY"
                        autoComplete="cc-exp"
                        data-testid="card-expiry-input"
                        className={cn("font-mono", getThemeClasses({
                          base: "",
                          default: "bg-gray-800 border-gray-700 text-white",
                          blue: "bg-blue-900 border-blue-800 text-blue-50",
                          pink: "bg-pink-900 border-pink-800 text-pink-50"
                        }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cvc" className={getThemeClasses({
                        base: "",
                        default: "text-white",
                        blue: "text-blue-50",
                        pink: "text-pink-50"
                      })}>CVC</Label>
                      <UIInput
                        id="cvc"
                        name="cvc"
                        value={cardDetails.cvc}
                        onChange={handleCardDetailsChange}
                        placeholder="123"
                        autoComplete="cc-csc"
                        data-testid="card-cvc-input"
                        className={cn("font-mono", getThemeClasses({
                          base: "",
                          default: "bg-gray-800 border-gray-700 text-white",
                          blue: "bg-blue-900 border-blue-800 text-blue-50",
                          pink: "bg-pink-900 border-pink-800 text-pink-50"
                        }))}
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
                    <Label htmlFor="save-card" className={getThemeClasses({
                      base: "text-sm",
                      default: "text-gray-300",
                      blue: "text-blue-200",
                      pink: "text-pink-200"
                    })}>
                      Save this card for future payments
                    </Label>
                  </div>
                </div>
              )}
              
              {/* Pay Later option - only show in card details view */}
              {showPayLater && !isProcessing && (
                <motion.div 
                  className={cn("mt-6 pt-4 border-t", getThemeClasses({
                    base: "",
                    default: "border-gray-800",
                    blue: "border-blue-900",
                    pink: "border-pink-900"
                  }))}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className={getThemeClasses({
                        base: "h-4 w-4",
                        default: "text-gray-500",
                        blue: "text-blue-400",
                        pink: "text-pink-400"
                      })} />
                      <p className={getThemeClasses({
                        base: "text-sm font-medium",
                        default: "text-white",
                        blue: "text-blue-50",
                        pink: "text-pink-50"
                      })}>Pay later (1 hour hold)</p>
                    </div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handlePayLater}
                        disabled={isProcessing}
                        className={getThemeClasses({
                          base: "",
                          default: "border-gray-700 hover:bg-gray-800",
                          blue: "border-blue-700 hover:bg-blue-900",
                          pink: "border-pink-700 hover:bg-pink-900"
                        })}
                      >
                        Hold My Seat
                      </Button>
                    </motion.div>
                  </div>
                  <p className={getThemeClasses({
                    base: "text-xs mt-1",
                    default: "text-gray-500",
                    blue: "text-blue-400",
                    pink: "text-pink-400"
                  })}>
                    Locks your seat for 1 hour. You must complete payment before expiration.
                  </p>
                </motion.div>
              )}
            </motion.form>
          </CardContent>
          <CardFooter className="flex justify-center pt-2">
            <motion.div 
              className="w-full"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                type="submit"
                form="payment-form"
                className={cn("w-full py-6 text-base font-medium", getThemeClasses({
                  base: "",
                  default: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text",
                  blue: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text",
                  pink: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text"
                }))}
                disabled={isProcessing}
                data-testid="complete-payment-button"
              >
                {isProcessing ? (
                  <motion.div 
                    className="flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Loader2 className="mr-2 h-4 animate-spin" />
                    Processing...
                  </motion.div>
                ) : (
                  <motion.div 
                    className="flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Complete Payment
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </motion.div>
                )}
              </Button>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    );
  };
  
  // Function to render the processing step UI
  const renderProcessingStep = () => {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Loader2 className={cn(
            "h-12 w-12 animate-spin mb-4",
            getThemeClasses({
              base: "",
              default: "text-gdyup-primary",
              blue: "text-gdyup-primary",
              pink: "text-gdyup-primary"
            })
          )} />
        </motion.div>
        
        <motion.h3 
          className="text-xl font-semibold mb-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          Processing Your Payment
        </motion.h3>
        
        <motion.p 
          className={cn(
            "text-center max-w-md",
            getThemeClasses({
              base: "",
              default: "text-gray-400",
              blue: "text-blue-300",
              pink: "text-pink-300"
            })
          )}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {paymentMethod === 'btc' 
            ? "Please wait while we prepare your Bitcoin payment..." 
            : "Please wait while we process your payment..."}
        </motion.p>
        
        <motion.div 
          className="mt-8 w-full max-w-md"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: "easeInOut" }}
        >
          <div className={cn(
            "h-1 rounded-full",
            getThemeClasses({
              base: "",
              default: "bg-gdyup-primary",
              blue: "bg-gdyup-primary",
              pink: "bg-gdyup-primary"
            })
          )}>
            <motion.div 
              className="h-full w-full bg-gdyup-primary rounded-full"
              animate={{ 
                x: ["0%", "100%", "0%"],
                scaleX: [0.1, 0.5, 0.1]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5,
                ease: "easeInOut"
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    );
  };
        
  // Function to render the auth error UI
  const renderAuthError = () => {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <CardContent className="flex flex-col items-center py-6">
          <motion.div 
            className={getThemeClasses({
              base: "rounded-full p-3 mb-4",
              default: "bg-red-950/30 text-red-500",
              blue: "bg-red-950/20 text-red-400",
              pink: "bg-red-950/20 text-red-400"
            })}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <AlertCircle className="h-12 w-12" />
          </motion.div>
          <motion.p 
            className={cn("text-center font-medium text-lg mb-2", getThemeClasses({
              base: "",
              default: "text-white",
              blue: "text-blue-50",
              pink: "text-pink-50"
            }))}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            Your session has expired
          </motion.p>
          <motion.p 
            className={cn("text-center mb-6", getThemeClasses({
              base: "",
              default: "text-gray-400",
              blue: "text-blue-300",
              pink: "text-pink-300"
            }))}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {error || 'Please sign in again to complete your payment.'}
          </motion.p>
          <motion.div 
            className="flex flex-col gap-3 w-full max-w-xs"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
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
                className={getThemeClasses({
                  base: "",
                  default: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text",
                  blue: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text",
                  pink: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text"
                })}
                autoFocus
              >
                Try to Restore Session
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
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
                className={getThemeClasses({
                  base: "",
                  default: "border-gray-700 text-white hover:bg-gray-800",
                  blue: "border-blue-700 text-blue-100 hover:bg-blue-900",
                  pink: "border-pink-700 text-pink-100 hover:bg-pink-900"
                })}
              >
                Sign In Again
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button 
                variant="ghost"
                onClick={() => setCurrentStep('details')}
                className={getThemeClasses({
                  base: "",
                  default: "text-gray-400 hover:text-white hover:bg-gray-800/50",
                  blue: "text-blue-400 hover:text-blue-200 hover:bg-blue-900/50",
                  pink: "text-pink-400 hover:text-pink-200 hover:bg-pink-900/50"
                })}
              >
                Try Again Without Signing In
              </Button>
            </motion.div>
          </motion.div>
        </CardContent>
      </motion.div>
    );
  };
  
  // Function to render the confirmation step UI
  const renderConfirmationStep = () => {
    return (
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col items-center justify-center py-4">
          {isSuccess ? (
            <motion.div 
              className="text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <div className="inline-flex items-center justify-center rounded-full p-2 mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 500, damping: 30 }}
                >
                  <CheckCircle className={cn(
                    "h-12 w-12",
                    getThemeClasses({
                      base: "",
                      default: "text-green-500",
                      blue: "text-green-400",
                      pink: "text-green-400"
                    })
                  )} />
                </motion.div>
              </div>
              
              <motion.h3 
                className="text-xl font-semibold mb-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                Payment Successful!
              </motion.h3>
              
              <motion.p 
                className={getThemeClasses({
                  base: "text-center max-w-md mb-6",
                  default: "text-gray-400",
                  blue: "text-blue-300",
                  pink: "text-pink-300"
                })}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                Your payment has been processed successfully. You can now view your boarding pass.
              </motion.p>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <Button 
                  onClick={() => window.location.href = `/gdyup/boardingpass/${offer.id}`}
                  className={cn(
                    "px-6 rounded-md font-medium transition-colors",
                    getThemeClasses({
                      base: "",
                      default: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text",
                      blue: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text",
                      pink: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text"
                    })
                  )}
                >
                  <Ticket className="mr-2 h-4 w-4" />
                  View Boarding Pass
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <div>
              <div className="space-y-4">
                <div className="text-lg font-semibold mb-2">Confirm Your Payment</div>
                
                <div className={getThemeClasses({
                  base: "p-4 rounded-lg border mb-4 text-left relative",
                  default: "bg-gray-800/80 border-gray-700",
                  blue: "bg-blue-900/80 border-blue-800",
                  pink: "bg-pink-900/80 border-pink-800"
                })}>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <p className={getThemeClasses({
                        base: "text-xs font-medium uppercase",
                        default: "text-gray-300",
                        blue: "text-blue-200",
                        pink: "text-pink-200"
                      })}>
                        Flight Share Amount
                      </p>
                      <p className={cn("text-xl font-bold", getThemeClasses({
                        base: "",
                        default: "text-white",
                        blue: "text-white",
                        pink: "text-white"
                      }))}>
                        ${offer.requested_share_amount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className={getThemeClasses({
                        base: "text-xs font-medium uppercase",
                        default: "text-gray-300",
                        blue: "text-blue-200",
                        pink: "text-pink-200"
                      })}>
                        Total Flight Cost
                      </p>
                      <p className={cn("text-xl", getThemeClasses({
                        base: "",
                        default: "text-gray-300",
                        blue: "text-blue-200",
                        pink: "text-pink-200"
                      }))}>
                        ${offer.total_flight_cost.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className={getThemeClasses({
                    base: "text-center p-3 rounded-lg",
                    default: "bg-gray-900/70",
                    blue: "bg-blue-950/70",
                    pink: "bg-pink-950/70"
                  })}>
                    <p className={getThemeClasses({
                      base: "text-xs uppercase mb-1 font-medium",
                      default: "text-gray-300",
                      blue: "text-blue-200",
                      pink: "text-pink-200"
                    })}>
                      Payment Summary
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-sm mb-2">
                      <div className={cn("text-left font-medium", getThemeClasses({
                        base: "",
                        default: "text-white",
                        blue: "text-white",
                        pink: "text-white"
                      }))}>Share Amount:</div>
                      <div className={cn("text-right", getThemeClasses({
                        base: "",
                        default: "text-white",
                        blue: "text-white",
                        pink: "text-white"
                      }))}>
                        ${offer.requested_share_amount.toLocaleString()}
                      </div>
                      
                      <div className={cn("text-left font-medium", getThemeClasses({
                        base: "",
                        default: "text-white",
                        blue: "text-white",
                        pink: "text-white"
                      }))}>Handling Fee:</div>
                      <div className={cn("text-right", getThemeClasses({
                        base: "",
                        default: "text-white",
                        blue: "text-white",
                        pink: "text-white"
                      }))}>
                        ${(offer.requested_share_amount * 0.075).toLocaleString()}
                      </div>
                    </div>
                    <div className={cn("border-t border-opacity-20 pt-2 mt-2 grid grid-cols-2", getThemeClasses({
                      base: "",
                      default: "border-gray-600",
                      blue: "border-blue-600",
                      pink: "border-pink-600"
                    }))}>
                      <div className={cn("text-left font-semibold", getThemeClasses({
                        base: "",
                        default: "text-white",
                        blue: "text-white",
                        pink: "text-white"
                      }))}>Total:</div>
                      <div className={cn("text-right font-semibold", getThemeClasses({
                        base: "",
                        default: "text-white",
                        blue: "text-white",
                        pink: "text-white"
                      }))}>
                        ${(offer.requested_share_amount * 1.075).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-3 mt-6">
                  <motion.div 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleSubmit}
                      disabled={isProcessing}
                      className={cn(
                        "w-full rounded-md font-medium transition-colors",
                        getThemeClasses({
                          base: "",
                          default: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text",
                          blue: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text",
                          pink: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text"
                        })
                      )}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {paymentMethod === 'btc' ? (
                            <>
                              <Bitcoin className="mr-2 h-4 w-4" />
                              Pay with Bitcoin
                            </>
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Pay Now
                            </>
                          )}
                        </>
                      )}
                    </Button>
                  </motion.div>
                  
                  {showPayLater && (
                    <motion.div 
                      whileHover={{ scale: 1.02 }} 
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={handlePayLater}
                        disabled={isProcessing}
                        variant="outline"
                        className={cn(
                          "w-full",
                          getThemeClasses({
                            base: "",
                            default: "border-gray-700 text-gray-300 hover:bg-gray-800",
                            blue: "border-blue-700 text-blue-300 hover:bg-blue-900/50",
                            pink: "border-pink-700 text-pink-300 hover:bg-pink-900/50"
                          })
                        )}
                      >
                        Pay Later
                      </Button>
                    </motion.div>
                  )}
                  
                  <motion.div 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => setCurrentStep('method')}
                      disabled={isProcessing}
                      variant="ghost"
                      className={cn(
                        "w-full",
                        getThemeClasses({
                          base: "",
                          default: "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50",
                          blue: "text-blue-400 hover:text-blue-300 hover:bg-blue-900/30",
                          pink: "text-pink-400 hover:text-pink-300 hover:bg-pink-900/30"
                        })
                      )}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Change Payment Method
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };
  
  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {renderCurrentStep()}
      </AnimatePresence>
    </div>
  );
} 