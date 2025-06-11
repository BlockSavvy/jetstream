'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  CreditCard, 
  X, 
  CheckCircle, 
  Loader2, 
  Bitcoin,
  Smartphone,
  QrCode,
  Copy,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { toast } from 'sonner';

interface ElitePaymentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency: string;
  description: string;
  onPaymentComplete: (result: any) => void;
  onPaymentError: (error: string) => void;
}

type PaymentMethod = 'lightning' | 'bitcoin' | 'card';
type PaymentStatus = 'selecting' | 'processing' | 'success' | 'error';

export default function ElitePaymentSheet({
  isOpen,
  onClose,
  amount,
  currency,
  description,
  onPaymentComplete,
  onPaymentError
}: ElitePaymentSheetProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('lightning');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('selecting');
  const [invoice, setInvoice] = useState<string>('');
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const { getThemedTextClasses, getThemedBackgroundClasses } = useGdyupTheme();

  // Haptic feedback simulation
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const { Haptics } = (window as any).Capacitor.Plugins;
      if (Haptics) {
        switch (type) {
          case 'light':
            Haptics.impact({ style: 'LIGHT' });
            break;
          case 'medium':
            Haptics.impact({ style: 'MEDIUM' });
            break;
          case 'heavy':
            Haptics.impact({ style: 'HEAVY' });
            break;
        }
      }
    }
  };

  const paymentMethods = [
    {
      id: 'lightning',
      name: 'Lightning',
      description: 'Instant & Low Fees',
      icon: Zap,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30'
    },
    {
      id: 'bitcoin',
      name: 'Bitcoin',
      description: 'On-Chain Settlement',
      icon: Bitcoin,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30'
    },
    {
      id: 'card',
      name: 'Card',
      description: 'Credit/Debit Card',
      icon: CreditCard,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    }
  ];

  const handleMethodSelect = (method: PaymentMethod) => {
    triggerHaptic('light');
    setSelectedMethod(method);
  };

  const handlePayment = async () => {
    triggerHaptic('medium');
    setPaymentStatus('processing');

    try {
      let result: any;
      
      // Create payment based on selected method
      if (selectedMethod === 'lightning' || selectedMethod === 'bitcoin') {
        const response = await fetch('/api/jetshare/process-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_method: selectedMethod === 'lightning' ? 'btc' : 'bitcoin',
            amount: amount,
            currency: currency,
            description: description
          })
        });

        result = await response.json();

        if (result.success) {
          setInvoice(result.data.invoice || '');
          setPaymentUrl(result.data.checkout_url || '');
          
          // For Lightning, we might get an instant redirect
          if (result.data.force_redirect && result.data.checkout_url) {
            window.location.href = result.data.checkout_url;
            return;
          }
        } else {
          throw new Error(result.message || 'Payment failed');
        }
      } else {
        // Handle card payment
        throw new Error('Card payments not implemented in demo');
      }

      setPaymentStatus('success');
      triggerHaptic('heavy');
      onPaymentComplete(result);
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      triggerHaptic('heavy');
      onPaymentError(error instanceof Error ? error.message : 'Payment failed');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      triggerHaptic('light');
      toast.success('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openInWallet = () => {
    if (invoice) {
      triggerHaptic('medium');
      window.open(`lightning:${invoice}`, '_blank');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Payment Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-gdyup-bg-card border-t border-gdyup-border rounded-t-3xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1 bg-gdyup-text-subtle/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4">
              <div>
                <h2 className={cn("text-xl font-bold", getThemedTextClasses())}>
                  Pay {amount} {currency}
                </h2>
                <p className={cn("text-sm", getThemedTextClasses('muted'))}>
                  {description}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-gdyup-text-subtle/10 hover:bg-gdyup-text-subtle/20 transition-colors"
              >
                <X size={20} className="text-gdyup-text-subtle" />
              </button>
            </div>

            <div className="px-6 pb-6">
              {paymentStatus === 'selecting' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Payment Methods */}
                  <div className="space-y-3">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      const isSelected = selectedMethod === method.id;
                      
                      return (
                        <motion.button
                          key={method.id}
                          onClick={() => handleMethodSelect(method.id as PaymentMethod)}
                          className={cn(
                            "w-full p-4 rounded-2xl border-2 transition-all",
                            "flex items-center justify-between",
                            isSelected 
                              ? `${method.bgColor} ${method.borderColor} shadow-lg` 
                              : "bg-gdyup-bg-elevated border-gdyup-border hover:border-gdyup-border-light"
                          )}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center",
                              isSelected ? method.bgColor : "bg-gdyup-bg-dark"
                            )}>
                              <Icon className={cn("w-6 h-6", isSelected ? method.color : "text-gdyup-text-subtle")} />
                            </div>
                            <div className="text-left">
                              <div className={cn("font-semibold", getThemedTextClasses())}>
                                {method.name}
                              </div>
                              <div className={cn("text-sm", getThemedTextClasses('muted'))}>
                                {method.description}
                              </div>
                            </div>
                          </div>
                          
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            >
                              <CheckCircle className="w-6 h-6 text-gdyup-primary" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Pay Button */}
                  <motion.button
                    onClick={handlePayment}
                    className="btn-primary-elite w-full py-4 text-lg font-semibold"
                    whileTap={{ scale: 0.98 }}
                  >
                    Pay with {paymentMethods.find(m => m.id === selectedMethod)?.name}
                  </motion.button>
                </motion.div>
              )}

              {paymentStatus === 'processing' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <Loader2 className="w-12 h-12 animate-spin text-gdyup-primary mx-auto mb-4" />
                  <h3 className={cn("text-lg font-semibold mb-2", getThemedTextClasses())}>
                    Processing Payment
                  </h3>
                  <p className={cn("text-sm", getThemedTextClasses('muted'))}>
                    Creating your {selectedMethod} payment...
                  </p>
                </motion.div>
              )}

              {paymentStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  {invoice && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <Zap className="w-16 h-16 text-gdyup-primary mx-auto mb-4" />
                        <h3 className={cn("text-xl font-bold mb-2", getThemedTextClasses())}>
                          Lightning Invoice Created
                        </h3>
                        <p className={cn("text-sm", getThemedTextClasses('muted'))}>
                          Scan or copy the invoice to complete payment
                        </p>
                      </div>

                      {/* Invoice Actions */}
                      <div className="space-y-3">
                        <button
                          onClick={openInWallet}
                          className="btn-primary-elite w-full flex items-center justify-center gap-2"
                        >
                          <Smartphone size={20} />
                          Open in Lightning Wallet
                        </button>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => copyToClipboard(invoice)}
                            className="btn-secondary-elite flex items-center justify-center gap-2"
                          >
                            <Copy size={16} />
                            Copy Invoice
                          </button>
                          
                          {paymentUrl && (
                            <button
                              onClick={() => window.open(paymentUrl, '_blank')}
                              className="btn-secondary-elite flex items-center justify-center gap-2"
                            >
                              <ExternalLink size={16} />
                              Web Wallet
                            </button>
                          )}
                        </div>
                      </div>

                      {/* QR Code placeholder */}
                      <div className="bg-gdyup-bg-dark rounded-xl p-8 flex items-center justify-center">
                        <QrCode size={48} className="text-gdyup-text-subtle" />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {paymentStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className={cn("text-lg font-semibold mb-2", getThemedTextClasses())}>
                    Payment Failed
                  </h3>
                  <p className={cn("text-sm mb-6", getThemedTextClasses('muted'))}>
                    Please try again or choose a different payment method
                  </p>
                  <button
                    onClick={() => setPaymentStatus('selecting')}
                    className="btn-primary-elite"
                  >
                    Try Again
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 