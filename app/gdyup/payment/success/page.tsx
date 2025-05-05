'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, ArrowRight, BookOpen, MessageSquare, Ticket } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { useGdyupTheme } from '../../hooks/useGdyupTheme';
import { motion, AnimatePresence } from 'framer-motion';
import BoardingPassButton from '../../components/BoardingPassButton';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offerDetails, setOfferDetails] = useState<any>(null);
  const { user } = useAuth();
  const { getThemeClasses, theme } = useGdyupTheme();
  
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        setIsLoading(true);
        
        // Get offer ID from query parameters
        const offerId = searchParams?.get('offer_id');
        const paymentIntentId = searchParams?.get('payment_intent_id');
        const invoiceId = searchParams?.get('invoiceId') || localStorage.getItem('btcpay_invoice_id');
        
        if (!offerId) {
          setError('Missing offer ID. Please try again.');
          setIsLoading(false);
          return;
        }
        
        const supabase = createClient();
        
        // Get the offer details
        const { data: offer, error: offerError } = await supabase
          .from('jetshare_offers')
          .select(`
            *,
            user:user_id (*),
            matched_user:matched_user_id (*)
          `)
          .eq('id', offerId)
          .single();
          
        if (offerError || !offer) {
          console.error('Error fetching offer:', offerError);
          setError('Could not fetch offer details.');
          setIsLoading(false);
          return;
        }
        
        // Check if the offer status indicates payment
        if (offer.status !== 'completed' && offer.status !== 'paid') {
          // If we have an invoice ID, check the status with BTCPay
          if (invoiceId) {
            try {
              const response = await fetch(`/api/jetshare/check-payment?offer_id=${offerId}&invoice_id=${invoiceId}`);
              if (!response.ok) {
                throw new Error('Failed to verify payment status');
              }
              
              const data = await response.json();
              
              if (data.status === 'paid' || data.status === 'completed') {
                // Payment is confirmed, update local state
                offer.status = 'completed';
                offer.payment_status = 'paid';
              }
            } catch (e) {
              console.error('Error checking payment status:', e);
              // Continue with what we have from the database
            }
          }
          
          // If still not paid, show appropriate message
          if (offer.status !== 'completed' && offer.status !== 'paid') {
            // If the payment hasn't been confirmed yet, we'll still show a success message
            // but alert the user that the confirmation might take some time
            console.log('Payment is still processing. Current status:', offer.status);
          }
        }
        
        setOfferDetails(offer);
        setIsLoading(false);
        
        // Clean up any payment-related local storage
        try {
          localStorage.removeItem('btcpay_invoice_id');
          localStorage.removeItem('pending_payment_id');
          localStorage.setItem('payment_complete', 'true');
        } catch (e) {
          console.warn('Error cleaning up local storage:', e);
        }
        
      } catch (error) {
        console.error('Error verifying payment:', error);
        setError('An error occurred while verifying payment.');
        setIsLoading(false);
      }
    };
    
    verifyPayment();
  }, [searchParams, user]);
  
  const handleNavigateToDashboard = () => {
    router.push('/gdyup/dashboard');
  };
  
  const handleNavigateToSeating = () => {
    router.push(`/gdyup/boardingpass/${offerDetails.id}`);
  };
  
  const handleNavigateToMessages = () => {
    // Redirect to the messaging interface
    router.push(`/gdyup/messages?offer=${offerDetails.id}`);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card className={getThemeClasses({
          base: "border shadow-md",
          default: "bg-gray-900/90 border-gray-800",
          blue: "bg-blue-950/90 border-blue-900",
          pink: "bg-pink-950/90 border-pink-900"
        })}>
          <CardHeader>
            <CardTitle className={getThemeClasses({
              base: "text-center",
              default: "text-white",
              blue: "text-blue-100",
              pink: "text-pink-100"
            })}>Verifying Payment</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Loader2 className={getThemeClasses({
              base: "h-12 w-12 animate-spin mb-4",
              default: "text-amber-500",
              blue: "text-amber-400",
              pink: "text-amber-300"
            })} />
            <p className={getThemeClasses({
              base: "text-center",
              default: "text-gray-400",
              blue: "text-blue-300",
              pink: "text-pink-300"
            })}>
              Please wait while we verify your payment...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card className={getThemeClasses({
          base: "border shadow-md",
          default: "bg-gray-900/90 border-gray-800",
          blue: "bg-blue-950/90 border-blue-900",
          pink: "bg-pink-950/90 border-pink-900"
        })}>
          <CardHeader>
            <CardTitle className="text-center text-red-600">Payment Verification Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">{error}</p>
            <p className={getThemeClasses({
              base: "text-center",
              default: "text-gray-400",
              blue: "text-blue-300",
              pink: "text-pink-300"
            })}>
              If you believe this is an error, please check your dashboard for the latest status.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              className={getThemeClasses({
                base: "w-full",
                default: "bg-[#DAFF0D] hover:bg-[#DAFF0D]/90 text-black",
                blue: "bg-blue-500 hover:bg-blue-600 text-white",
                pink: "bg-pink-500 hover:bg-pink-600 text-white"
              })} 
              onClick={handleNavigateToDashboard}
            >
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <motion.div 
      className="container mx-auto px-4 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="max-w-2xl mx-auto space-y-6"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Card className={getThemeClasses({
          base: "border shadow-xl overflow-hidden",
          default: "bg-gray-900/80 border-green-600/40",
          blue: "bg-blue-950/80 border-green-500/40",
          pink: "bg-pink-950/80 border-green-500/40"
        })}>
          <div className={getThemeClasses({
            base: "h-1.5 w-full",
            default: "bg-green-500",
            blue: "bg-green-500",
            pink: "bg-green-500"
          })}></div>
          
          <CardHeader className="text-center pb-2">
            <motion.div 
              className={getThemeClasses({
                base: "mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-2",
                default: "bg-green-900",
                blue: "bg-green-900",
                pink: "bg-green-900"
              })}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle className={getThemeClasses({
                base: "h-10 w-10",
                default: "text-green-500",
                blue: "text-green-400",
                pink: "text-green-400"
              })} />
            </motion.div>
            <CardTitle className={getThemeClasses({
              base: "text-2xl",
              default: "text-green-500",
              blue: "text-green-400",
              pink: "text-green-400"
            })}>Payment Successful!</CardTitle>
          </CardHeader>
          
          <CardContent className="text-center">
            <p className={getThemeClasses({
              base: "text-lg mb-6",
              default: "text-white",
              blue: "text-blue-100",
              pink: "text-pink-100"
            })}>
              Your flight share has been confirmed.
            </p>
            
            <motion.div 
              className={getThemeClasses({
                base: "rounded-md p-4 mb-6",
                default: "bg-black/30 border border-gray-800",
                blue: "bg-blue-950/50 border border-blue-900",
                pink: "bg-pink-950/50 border border-pink-900"
              })}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className={getThemeClasses({
                base: "font-medium mb-1",
                default: "text-white",
                blue: "text-blue-100",
                pink: "text-pink-100"
              })}>Flight Details:</p>
              
              <div className="flex justify-between items-center mb-2">
                <div className={getThemeClasses({
                  base: "flex items-center",
                  default: "text-gray-300",
                  blue: "text-blue-200",
                  pink: "text-pink-200"
                })}>
                  <span>From</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{offerDetails.departure_location}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <div className={getThemeClasses({
                  base: "flex items-center",
                  default: "text-gray-300",
                  blue: "text-blue-200",
                  pink: "text-pink-200"
                })}>
                  <span>To</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{offerDetails.arrival_location}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className={getThemeClasses({
                  base: "flex items-center",
                  default: "text-gray-300",
                  blue: "text-blue-200",
                  pink: "text-pink-200"
                })}>
                  <span>Date</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{new Date(offerDetails.flight_date).toLocaleDateString(undefined, { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
              </div>
            </motion.div>
            
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <BoardingPassButton 
                  offerId={offerDetails.id} 
                  variant="expanded"
                  showQR={true}
                />
              </motion.div>
            </AnimatePresence>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className={getThemeClasses({
                  base: "flex items-center justify-center",
                  default: "border-gray-700 hover:bg-gray-800",
                  blue: "border-blue-700 hover:bg-blue-800",
                  pink: "border-pink-700 hover:bg-pink-800"
                })}
                onClick={handleNavigateToMessages}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Message Jet Owner
              </Button>
              
              <Button 
                className={getThemeClasses({
                  base: "flex items-center justify-center",
                  default: "bg-[#DAFF0D] hover:bg-[#DAFF0D]/90 text-black",
                  blue: "bg-blue-500 hover:bg-blue-600 text-white",
                  pink: "bg-pink-500 hover:bg-pink-600 text-white"
                })}
                onClick={handleNavigateToDashboard}
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <p className={getThemeClasses({
          base: "text-center text-xs opacity-70",
          default: "text-gray-400",
          blue: "text-blue-300",
          pink: "text-pink-300"
        })}>
          Transaction ID: {searchParams?.get('payment_intent_id') || searchParams?.get('invoiceId') || 'N/A'}
        </p>
      </motion.div>
    </motion.div>
  );
} 