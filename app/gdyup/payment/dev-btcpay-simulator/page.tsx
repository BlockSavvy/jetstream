'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Bitcoin, Check, Clock, Loader2, ArrowLeft } from 'lucide-react';
import { useGdyupTheme } from '@/app/gdyup/hooks/useGdyupTheme';

export default function DevBTCPaySimulator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const offerId = searchParams?.get('offer_id') || '';
  const errorRecovery = searchParams?.get('error_recovery') === 'true';
  const { getThemeClasses, theme } = useGdyupTheme();
  
  const [stage, setStage] = useState<'initial' | 'processing' | 'complete'>('initial');
  const [countdown, setCountdown] = useState(5);
  
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
            default: "text-gray-400",
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
          
          <div className={getThemeClasses({
            base: "p-4 rounded-lg border mb-4 text-left",
            default: "bg-black border-gray-800",
            blue: "bg-blue-950 border-blue-800",
            pink: "bg-pink-950 border-pink-800",
          })}>
            <p className="text-sm flex justify-between">
              <span>Order ID:</span> 
              <span className="font-mono">{offerId.substring(0, 8)}...</span>
            </p>
            <p className="text-sm flex justify-between">
              <span>Amount:</span> 
              <span className="font-mono">17,283.00 USD</span>
            </p>
            <p className="text-sm flex justify-between">
              <span>Rate:</span> 
              <span className="font-mono">1 BTC = 68,452.00 USD</span>
            </p>
            <p className="text-sm flex justify-between">
              <span>Due:</span> 
              <span className="font-mono">0.25248 BTC</span>
            </p>
          </div>
        </div>
        
        {stage === 'initial' && (
          <Button 
            onClick={handleSimulatePayment}
            className={getThemeClasses({
              base: "w-full py-6 font-bold",
              default: "bg-primary hover:bg-primary/90 text-primary-foreground",
              blue: "bg-blue-500 hover:bg-blue-600 text-white",
              pink: "bg-pink-500 hover:bg-pink-600 text-white"
            })}
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
        
        <div className="mt-6 pt-4 border-t border-gray-800">
          <p className="text-xs text-center opacity-60">
            Development Environment Only - No real transactions are processed
          </p>
        </div>
      </div>
    </div>
  );
} 