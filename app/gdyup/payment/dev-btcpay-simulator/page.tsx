'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Bitcoin, Check, Clock, Loader2, ArrowLeft } from 'lucide-react';
import { useGdyupTheme } from '@/app/gdyup/hooks/useGdyupTheme';

function DevBTCPaySimulatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const offerId = searchParams?.get('offer_id') || '';
  const errorRecovery = searchParams?.get('error_recovery') === 'true';
  const { getThemeClasses, theme } = useGdyupTheme();
  
  const [stage, setStage] = useState<'initial' | 'processing' | 'complete'>('initial');
  const [countdown, setCountdown] = useState(5);
  const [offerData, setOfferData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch offer data
  useEffect(() => {
    const fetchOfferData = async () => {
      if (!offerId) return;
      
      try {
        const response = await fetch(`/api/jetshare/getOfferById?id=${offerId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch offer data');
        }
        
        const data = await response.json();
        setOfferData(data);
      } catch (error) {
        console.error('Error fetching offer data:', error);
        // Set fallback data for testing
        setOfferData({
          id: offerId,
          departure_location: 'Test Departure',
          arrival_location: 'Test Arrival',
          requested_share_amount: 12500, // Fallback amount
          total_flight_cost: 25000, // Fallback total
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOfferData();
  }, [offerId]);
  
  // Auto redirect after payment simulation completes
  useEffect(() => {
    if (stage === 'complete' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    if (stage === 'complete' && countdown === 0) {
      // Redirect to success page
      router.push(`/gdyup/payment/success?offer_id=${offerId}&simulated=true&t=${Date.now()}`);
    }
  }, [stage, countdown, offerId, router]);
  
  const handleGoBack = () => {
    router.back();
  };
  
  const handleSimulatePayment = () => {
    setStage('processing');
    
    // Update the offer status via API if possible
    if (offerId) {
      fetch(`/api/jetshare/process-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offer_id: offerId,
          payment_method: 'btc',
          payment_details: {
            simulated: true,
            invoice_id: `sim-${Date.now()}`,
            timestamp: new Date().toISOString(),
          }
        })
      }).catch(err => 
        console.warn('Failed to update payment status via API:', err)
      );
    }
    
    // Simulate a payment process that takes a random amount of time
    const processingTime = Math.floor(Math.random() * 1000) + 1500;
    
    setTimeout(() => {
      // Update offer status in local storage to indicate it's paid
      try {
        localStorage.setItem('simulated_btc_payment_complete', 'true');
        localStorage.setItem('simulated_btc_payment_offer_id', offerId);
        localStorage.setItem('gdyup_last_action', 'payment_complete');
      } catch (e) {
        console.warn('Failed to update localStorage with payment status:', e);
      }
      
      // Move to completed stage
      setStage('complete');
    }, processingTime);
  };
  
  // Calculate Bitcoin amount based on current rate - USING THE SHARE AMOUNT, NOT TOTAL FLIGHT COST
  const btcRate = 68452; // Mock BTC/USD rate
  const shareAmount = offerData?.requested_share_amount || 0;
  const totalFee = shareAmount * 0.075; // 7.5% fee
  const totalAmount = shareAmount + totalFee;
  const btcAmount = totalAmount / btcRate;
  
  return (
    <div className={getThemeClasses({
      base: "flex flex-col items-center justify-center min-h-screen p-4",
      default: "bg-black text-white",
      blue: "bg-blue-950 text-blue-50",
      pink: "bg-pink-950 text-pink-50",
    })}>
      <div className={getThemeClasses({
        base: "max-w-md w-full p-6 rounded-lg border shadow-xl",
        default: "bg-gray-900 border-gray-800",
        blue: "bg-blue-900 border-blue-800",
        pink: "bg-pink-900 border-pink-800",
      })}>
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleGoBack}
            className={getThemeClasses({
              base: "p-0",
              default: "text-gray-400 hover:text-white",
              blue: "text-blue-400 hover:text-blue-100",
              pink: "text-pink-400 hover:text-pink-100"
            })}
            disabled={stage !== 'initial'}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="text-xs px-2 py-1 rounded bg-blue-900 text-blue-200">
            Development Simulator
          </div>
        </div>
        
        <div className="text-center mb-6">
          <Bitcoin className={getThemeClasses({
            base: "h-16 w-16 mx-auto mb-4",
            default: "text-amber-500",
            blue: "text-amber-400",
            pink: "text-amber-300"
          })} />
          <h1 className="text-xl font-bold mb-2">BTC Pay Server Simulator</h1>
          <p className={getThemeClasses({
            base: "text-sm mb-4",
            default: "text-gray-300",
            blue: "text-blue-300",
            pink: "text-pink-300"
          })}>
            This is a development-only simulator for testing the Bitcoin payment flow.
          </p>
          
          {errorRecovery && (
            <div className="mb-4 p-3 bg-blue-900/30 border border-blue-800 rounded-md text-left">
              <p className="text-sm text-blue-200">
                This simulator was triggered after a failed connection to the real BTCPay server.
                Proceeding will simulate a successful payment for testing purposes only.
              </p>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
          <div className={getThemeClasses({
            base: "p-4 rounded-lg border mb-4 text-left",
            default: "bg-black border-gray-800",
            blue: "bg-blue-950 border-blue-800",
            pink: "bg-pink-950 border-pink-800",
          })}>
            <p className="text-sm flex justify-between mb-2 font-medium">
              <span className={getThemeClasses({
                base: "",
                default: "text-gray-300",
                blue: "text-blue-300",
                pink: "text-pink-300"
              })}>Order ID:</span> 
              <span className="font-mono">{offerId.substring(0, 8)}...</span>
            </p>
            <p className="text-sm flex justify-between mb-2 font-medium">
              <span className={getThemeClasses({
                base: "",
                default: "text-gray-300",
                blue: "text-blue-300",
                pink: "text-pink-300"
              })}>Share Amount:</span> 
              <span className="font-mono text-white">${shareAmount.toLocaleString()}</span>
            </p>
            <p className="text-sm flex justify-between mb-2 font-medium">
              <span className={getThemeClasses({
                base: "",
                default: "text-gray-300",
                blue: "text-blue-300",
                pink: "text-pink-300"
              })}>Fee (7.5%):</span> 
              <span className="font-mono text-white">${totalFee.toLocaleString()}</span>
            </p>
            <div className="my-2 border-t border-gray-700"></div>
            <p className="text-sm flex justify-between mb-2 font-medium">
              <span className={getThemeClasses({
                base: "",
                default: "text-gray-300",
                blue: "text-blue-300",
                pink: "text-pink-300"
              })}>Total Due:</span> 
              <span className="font-mono text-white">${totalAmount.toLocaleString()}</span>
            </p>
            <p className="text-sm flex justify-between mb-2 font-medium">
              <span className={getThemeClasses({
                base: "",
                default: "text-gray-300",
                blue: "text-blue-300",
                pink: "text-pink-300"
              })}>Rate:</span> 
              <span className="font-mono text-white">1 BTC = ${btcRate.toLocaleString()} USD</span>
            </p>
            <p className="text-sm flex justify-between font-medium">
              <span className={getThemeClasses({
                base: "",
                default: "text-gray-300",
                blue: "text-blue-300",
                pink: "text-pink-300"
              })}>Bitcoin Amount:</span> 
              <span className="font-mono text-white">{btcAmount.toFixed(8)} BTC</span>
            </p>
          </div>
          )}
        </div>
        
        {stage === 'initial' && (
          <Button 
            onClick={handleSimulatePayment}
            className={getThemeClasses({
              base: "w-full py-6 font-bold",
              default: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text",
              blue: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text",
              pink: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text"
            })}
            disabled={isLoading}
          >
            <Bitcoin className="h-5 w-5 mr-2" />
            Simulate Payment
          </Button>
        )}
        
        {stage === 'processing' && (
          <div className="text-center">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
            <p className="mt-4 text-lg font-medium">Processing Payment</p>
            <p className="text-sm opacity-70">
              Simulating blockchain confirmation...
            </p>
          </div>
        )}
        
        {stage === 'complete' && (
          <div className="text-center">
            <div className="flex items-center justify-center">
              <div className="rounded-full bg-green-900/30 p-3">
                <Check className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <p className="mt-4 text-lg font-medium">Payment Complete!</p>
            <p className="text-sm opacity-70 mb-4">
              Your simulated payment has been confirmed.
            </p>
            
            <div className="flex items-center justify-center mt-2 text-sm">
              <Clock className="h-4 w-4 mr-2 text-amber-500" />
              <span>Redirecting in {countdown} seconds...</span>
            </div>
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t border-gray-700">
          <p className="text-xs text-center opacity-60">
            Development Environment Only - No real transactions are processed
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  const { getThemeClasses } = useGdyupTheme();
  
  return (
    <div className={getThemeClasses({
      base: "flex flex-col items-center justify-center min-h-screen p-4",
      default: "bg-black text-white",
      blue: "bg-blue-950 text-blue-50",
      pink: "bg-pink-950 text-pink-50",
    })}>
      <Loader2 className="h-10 w-10 animate-spin" />
    </div>
  );
}

export default function DevBTCPaySimulator() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DevBTCPaySimulatorContent />
    </Suspense>
  );
} 