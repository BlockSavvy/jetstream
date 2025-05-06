'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import JetSharePaymentForm from '../../components/JetSharePaymentForm';
import { JetShareOfferWithUser } from '@/types/jetshare';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, RefreshCw, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useGdyupTheme } from '../../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Component Props
interface PaymentContentProps {
  offerId: string;
}

// PaymentContent Component
export default function PaymentContent({ offerId }: PaymentContentProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [offer, setOffer] = useState<JetShareOfferWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'error'>('pending');
  const [testMode, setTestMode] = useState(false);
  const supabase = createClient();
  const { getThemeClasses, getThemedButtonClasses, theme, isMobile } = useGdyupTheme();
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load offer data from Supabase
  useEffect(() => {
    async function loadOfferData() {
      try {
        setLoading(true);
        setError(null);
        
        if (!offerId) {
          throw new Error('No offer ID provided');
        }
        
        // Get the offer with creator user details
        const { data, error } = await supabase
          .from('jetshare_offers')
          .select(`
            *,
            user:user_id (*),
            matched_user:matched_user_id (*)
          `)
          .eq('id', offerId)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (!data) {
          throw new Error('Offer not found');
        }
        
        setOffer(data);
        
        // Check if the user is authorized to view this payment screen
        if (data.user_id === user?.id) {
          setError('You cannot accept your own offer');
        }
        
        // If the offer is already accepted and the matched user is this user
        // then we should show the payment status
        if (data.status === 'accepted' && data.matched_user_id === user?.id) {
          setPaymentStatus('processing');
          
          // Also check for test mode
          const { data: settings } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'btcpay_test_mode')
            .single();
            
          if (settings && settings.value === 'true') {
            setTestMode(true);
          }
        }
        
        // If the offer is already completed
        if (data.status === 'completed') {
          setPaymentStatus('success');
        }
      } catch (err) {
        console.error('Error loading offer:', err);
        setError(err instanceof Error ? err.message : 'Failed to load offer details');
      } finally {
        setLoading(false);
      }
    }
    
    if (user) {
      loadOfferData();
    }
    
    // Cleanup
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [offerId, user, supabase]);

  // Handle accepting an offer
  const handleAcceptOffer = async () => {
    if (!user || !offer) return;
    
    try {
      setIsAccepting(true);
      
      // First accept the offer
      const { error: acceptError } = await supabase
        .from('jetshare_offers')
        .update({ 
          status: 'accepted',
          matched_user_id: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', offerId);
        
      if (acceptError) {
        throw acceptError;
      }
      
      // Update the local state
      setOffer(prev => prev ? { 
        ...prev, 
        status: 'accepted',
        matched_user_id: user.id,
        matched_user: user
      } : null);
      
      setPaymentStatus('processing');
      toast.success('Offer accepted! Proceeding to payment...');
      
      // Start polling for payment status
      pollForPaymentStatus();
      
    } catch (err) {
      console.error('Error accepting offer:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to accept offer');
      setIsAccepting(false);
    }
  };

  // Poll for payment status updates
  const pollForPaymentStatus = () => {
    // Clear any existing timer
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }
    
    // Set up polling
    pollTimerRef.current = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('jetshare_offers')
          .select('status, payment_status')
          .eq('id', offerId)
          .single();
          
        if (error) throw error;
        
        if (data.status === 'completed' || data.payment_status === 'completed') {
          setPaymentStatus('success');
          clearInterval(pollTimerRef.current!);
          
          // Update local state
          setOffer(prev => prev ? { ...prev, status: 'completed' } : null);
          
          // Show success toast
          toast.success('Payment completed successfully!');
          
          // After a short delay, redirect to the boarding pass
          setTimeout(() => {
            router.push(`/gdyup/boardingpass/${offerId}`);
          }, 2000);
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
        // Don't stop polling on errors, just log them
      }
    }, 5000); // Check every 5 seconds
  };

  // Handle retry payment
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Manually reload the offer data
      const supabase = createClient();
      
      if (!offerId) {
        throw new Error('No offer ID available');
      }
      
      const { data, error } = await supabase
        .from('jetshare_offers')
        .select(`
          *,
          user:user_id (*),
          matched_user:matched_user_id (*)
        `)
        .eq('id', offerId)
        .single();
            
            if (error) {
        throw error;
      }
      
      setOffer(data);
      
      // Reset the payment status to allow retrying
      if (data.status === 'accepted') {
        setPaymentStatus('processing');
        // Start polling again
        pollForPaymentStatus();
      }
      
      toast.success('Payment details refreshed');
    } catch (err) {
      console.error('Error retrying payment:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to refresh payment details');
    } finally {
      setIsRetrying(false);
    }
  };

  // Handle cancelling the payment and returning to the offer
  const handleCancel = async () => {
    const confirmed = window.confirm('Are you sure you want to cancel this payment? Your seat is not guaranteed until payment is complete.');
    
    if (confirmed) {
      try {
        // Only revert if we're in the accepted state
        if (offer?.status === 'accepted' && offer.matched_user_id === user?.id) {
          // Revert the offer status back to open
          await supabase
            .from('jetshare_offers')
            .update({ 
              status: 'open',
              matched_user_id: null, 
              updated_at: new Date().toISOString()
            })
            .eq('id', offerId);
        }
        
        // Redirect back to the offer page
        router.push(`/gdyup/offer/${offerId}`);
      } catch (err) {
        console.error('Error cancelling payment:', err);
        toast.error('Failed to cancel payment');
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card className={getThemeClasses({
          base: "border shadow",
          default: "bg-white border-gray-200",
          blue: "bg-blue-950/40 border-blue-900/60",
          pink: "bg-pink-950/40 border-pink-900/60"
        })}>
          <CardHeader className={getThemeClasses({
            base: "",
            default: "border-b border-gray-100",
            blue: "border-b border-blue-900/60",
            pink: "border-b border-pink-900/60"
          })}>
            <CardTitle className={getThemeClasses({
              base: "text-center",
              default: "text-gray-900",
              blue: "text-blue-50",
              pink: "text-pink-50"
            })}>Loading Payment Details...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-10">
            <Loader2 className={cn("h-12 w-12 animate-spin", getThemeClasses({
              base: "",
              default: "text-amber-500",
              blue: "text-amber-400",
              pink: "text-amber-400"
            }))} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card className={getThemeClasses({
          base: "border shadow",
          default: "bg-white border-gray-200",
          blue: "bg-blue-950/40 border-blue-900/60",
          pink: "bg-pink-950/40 border-pink-900/60"
        })}>
          <CardHeader>
            <CardTitle className={cn("flex items-center justify-center gap-2", getThemeClasses({
              base: "",
              default: "text-red-600",
              blue: "text-red-400",
              pink: "text-red-400"
            }))}>
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className={getThemeClasses({
              base: "mb-4",
              default: "text-gray-700",
              blue: "text-blue-200",
              pink: "text-pink-200"
            })}>{error}</p>
            <Button 
              onClick={() => router.push('/gdyup/dashboard')}
              className={getThemedButtonClasses("primary")}
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main payment interface
  return (
    <motion.div 
      className="container mx-auto px-4 py-6 max-w-2xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-6 flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          className={getThemeClasses({
            base: "mr-2",
            default: "text-gray-800 hover:text-black hover:bg-gray-100",
            blue: "text-blue-100 hover:text-white hover:bg-blue-800",
            pink: "text-pink-100 hover:text-white hover:bg-pink-800"
          })}
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className={getThemeClasses({
          base: "text-2xl font-bold", 
          default: "text-gray-900",
          blue: "text-blue-50",
          pink: "text-pink-50"
        })}>
          Flight Share Payment
        </h1>
      </div>
      
      {testMode && (
        <div className={getThemeClasses({
          base: "mb-4 p-3 rounded-md border text-sm",
          default: "bg-blue-50 border-blue-200 text-blue-700",
          blue: "bg-blue-900/40 border-blue-800/60 text-blue-200",
          pink: "bg-pink-900/40 border-pink-800/60 text-pink-200"
        })}>
          <div className="font-medium">Test Mode Active</div>
          <p>This is a test payment. No actual Bitcoin will be transferred.</p>
        </div>
      )}
      
      <Card className={getThemeClasses({
        base: "border shadow mb-6",
        default: "bg-white border-gray-200",
        blue: "bg-blue-950/40 border-blue-900/60",
        pink: "bg-pink-950/40 border-pink-900/60"
      })}>
        <CardHeader className={getThemeClasses({
          base: "pb-3",
          default: "bg-gray-50 border-b border-gray-100",
          blue: "bg-blue-950/60 border-b border-blue-900/60",
          pink: "bg-pink-950/60 border-b border-pink-900/60"
        })}>
          <CardTitle className={getThemeClasses({
            base: "",
            default: "text-gray-900",
            blue: "text-blue-50",
            pink: "text-pink-50"
          })}>Payment Details</CardTitle>
        </CardHeader>
        
        <CardContent className="pt-4">
          {offer && (
            <div className="space-y-4">
              <div className={cn("flex justify-between items-center p-3 rounded-md", getThemeClasses({
                base: "",
                default: "bg-gray-50 border border-gray-100",
                blue: "bg-blue-950/60 border border-blue-900/40",
                pink: "bg-pink-950/60 border border-pink-900/40"
              }))}>
                <div>
                  <p className={getThemeClasses({
                    base: "text-sm",
                    default: "text-gray-500",
                    blue: "text-blue-300",
                    pink: "text-pink-300"
                  })}>Flight Share Amount</p>
                  <p className={getThemeClasses({
                    base: "text-xl font-bold",
                    default: "text-gray-900",
                    blue: "text-blue-50",
                    pink: "text-pink-50"
                  })}>${offer.requested_share_amount.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className={getThemeClasses({
                    base: "text-sm",
                    default: "text-gray-500",
                    blue: "text-blue-300",
                    pink: "text-pink-300"
                  })}>Total Flight Cost</p>
                  <p className={getThemeClasses({
                    base: "text-lg",
                    default: "text-gray-700",
                    blue: "text-blue-100",
                    pink: "text-pink-100"
                  })}>${offer.total_flight_cost.toLocaleString()}</p>
                </div>
              </div>
              
              <div className={cn("flex flex-col md:flex-row gap-4 rounded-md p-3", getThemeClasses({
                base: "",
                default: "bg-amber-50 border border-amber-100",
                blue: "bg-amber-900/20 border border-amber-800/50",
                pink: "bg-amber-900/20 border border-amber-800/50"
              }))}>
                <div className="flex-grow">
                  <p className={cn("text-sm font-medium", getThemeClasses({
                    base: "",
                    default: "text-amber-800",
                    blue: "text-amber-300",
                    pink: "text-amber-300"
                  }))}>From</p>
                  <p className={getThemeClasses({
                    base: "",
                    default: "text-amber-900",
                    blue: "text-amber-200",
                    pink: "text-amber-200"
                  })}>{offer.departure_location}</p>
                </div>
                <div className="flex-grow">
                  <p className={cn("text-sm font-medium", getThemeClasses({
                    base: "",
                    default: "text-amber-800",
                    blue: "text-amber-300",
                    pink: "text-amber-300"
                  }))}>To</p>
                  <p className={getThemeClasses({
                    base: "",
                    default: "text-amber-900",
                    blue: "text-amber-200",
                    pink: "text-amber-200"
                  })}>{offer.arrival_location}</p>
                </div>
                <div className="flex-grow">
                  <p className={cn("text-sm font-medium", getThemeClasses({
                    base: "",
                    default: "text-amber-800",
                    blue: "text-amber-300",
                    pink: "text-amber-300"
                  }))}>Date</p>
                  <p className={getThemeClasses({
                    base: "",
                    default: "text-amber-900",
                    blue: "text-amber-200",
                    pink: "text-amber-200"
                  })}>
                    {new Date(offer.flight_date).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              
              <AnimatePresence mode="wait">
                {/* Initial accept state - only show if offer not yet accepted */}
                {offer.status === 'open' && (
                  <motion.div
                    key="accept-state"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn("p-4 rounded-md", getThemeClasses({
                      base: "border",
                      default: "bg-gray-50 border-gray-100",
                      blue: "bg-blue-950/60 border-blue-900/40",
                      pink: "bg-pink-950/60 border-pink-900/40"
                    }))}
                  >
                    <p className={getThemeClasses({
                      base: "text-sm mb-4",
                      default: "text-gray-700",
                      blue: "text-blue-200",
                      pink: "text-pink-200"
                    })}>
                      To secure this flight share, you'll need to accept the offer and complete payment. By accepting, you agree to the terms of this flight share.
                    </p>
                    <Button 
                      onClick={handleAcceptOffer} 
                      disabled={isAccepting}
                      className={cn(
                        getThemedButtonClasses("primary"),
                        "w-full"
                      )}
                    >
                      {isAccepting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : "Accept & Continue to Payment"}
                    </Button>
                  </motion.div>
                )}
                
                {/* Payment processing state */}
                {paymentStatus === 'processing' && (
                  <motion.div
                    key="payment-form"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <JetSharePaymentForm 
                      offer={offer} 
                      onPaymentComplete={() => setPaymentStatus('success')}
                      onPaymentError={() => setPaymentStatus('error')}
                      testMode={testMode}
                    />
                  </motion.div>
                )}
                
                {/* Payment error state */}
                {paymentStatus === 'error' && (
                  <motion.div
                    key="payment-error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn("p-4 rounded-md border", getThemeClasses({
                      base: "",
                      default: "bg-red-50 border-red-100 text-red-700",
                      blue: "bg-red-900/20 border-red-900/40 text-red-300",
                      pink: "bg-red-900/20 border-red-900/40 text-red-300"
                    }))}
                  >
                    <div className="flex items-center mb-2">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      <p className="font-medium">Payment Error</p>
                    </div>
                    <p className="text-sm mb-4">
                      We encountered an issue processing your payment. Please try again or contact support if the problem persists.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        onClick={handleRetry} 
                        disabled={isRetrying}
                        className={cn(
                          "flex-1",
                          getThemeClasses({
                            base: "",
                            default: "bg-amber-600 hover:bg-amber-700 text-white",
                            blue: "bg-amber-600 hover:bg-amber-700 text-white",
                            pink: "bg-amber-600 hover:bg-amber-700 text-white"
                          })
                        )}
                      >
                        {isRetrying ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Retrying...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry Payment
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleCancel}
                        className={getThemedButtonClasses("outline")}
                      >
                        Cancel & Return to Offer
                      </Button>
                    </div>
                  </motion.div>
                )}
                
                {/* Payment success state */}
                {paymentStatus === 'success' && (
                  <motion.div
                    key="payment-success"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn("p-4 rounded-md border", getThemeClasses({
                      base: "",
                      default: "bg-green-50 border-green-100 text-green-700",
                      blue: "bg-green-900/20 border-green-900/40 text-green-300",
                      pink: "bg-green-900/20 border-green-900/40 text-green-300"
                    }))}
                  >
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <p className="font-medium">Payment Complete!</p>
                    </div>
                    <p className="text-sm mb-4">
                      Your payment has been successfully processed. You can now view your boarding pass.
                    </p>
                    <Button 
                      onClick={() => router.push(`/gdyup/boardingpass/${offerId}`)}
                      className={cn(
                        getThemedButtonClasses("primary"),
                        "w-full"
                      )}
                    >
                      View Boarding Pass
              </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          </CardContent>
        </Card>
    </motion.div>
  );
} 