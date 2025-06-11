'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, ChevronDown, Sparkles, Copy, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { useNostr } from '../contexts/NostrContext';
import { toast } from 'sonner';

interface EliteZapSheetProps {
  isOpen: boolean;
  onClose?: (() => void) | undefined;
  recipientPubkey: string;
  recipientName?: string;
  recipientNip05?: string;
  defaultAmount?: number;
  context?: string; // e.g., "flight_share", "message_tip"  
  onZapComplete?: ((zapId: string, amount: number) => void) | undefined;
}

const PRESET_AMOUNTS = [1000, 5000, 10000, 21000, 50000, 100000];
const AMOUNT_LABELS: Record<number, string> = {
  1000: '1K sats',
  5000: '5K sats', 
  10000: '10K sats',
  21000: '21K sats',
  50000: '50K sats',
  100000: '100K sats'
};

export default function EliteZapSheet({
  isOpen,
  onClose,
  recipientPubkey,
  recipientName,
  recipientNip05,
  defaultAmount = 5000,
  context = 'tip',
  onZapComplete
}: EliteZapSheetProps) {
  const [selectedAmount, setSelectedAmount] = useState(defaultAmount);
  const [customAmount, setCustomAmount] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [zapComment, setZapComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { getThemedTextClasses } = useGdyupTheme();
  const { zapRequest, isConnected, pubkey } = useNostr();

  // Haptic feedback
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

  const formatSats = (sats: number) => {
    if (sats >= 1000000) {
      return `${(sats / 1000000).toFixed(2)}M`;
    } else if (sats >= 1000) {
      return `${(sats / 1000).toFixed(1)}K`;
    } else {
      return `${sats}`;
    }
  };

  const getBtcValue = (sats: number) => {
    return (sats / 100000000).toFixed(8);
  };

  const getUsdValue = (sats: number) => {
    // Approximate BTC price - in real app, fetch from API
    const btcPrice = 68000;
    const usdValue = (sats / 100000000) * btcPrice;
    return usdValue < 0.01 ? '<$0.01' : `$${usdValue.toFixed(2)}`;
  };

  const handleAmountSelect = (amount: number) => {
    triggerHaptic('light');
    setSelectedAmount(amount);
    setShowCustomInput(false);
    setCustomAmount('');
  };

  const handleCustomAmountSubmit = () => {
    const amount = parseInt(customAmount);
    if (amount && amount > 0) {
      triggerHaptic('medium');
      setSelectedAmount(amount);
      setShowCustomInput(false);
    }
  };

  const handleSendZap = async () => {
    if (!isConnected || !pubkey) {
      toast.error('Please connect your Nostr identity first');
      return;
    }

    if (selectedAmount <= 0) {
      toast.error('Please select a valid amount');
      return;
    }

    triggerHaptic('medium');
    setIsProcessing(true);

    try {
      const zapId = await zapRequest(
        recipientPubkey,
        selectedAmount,
        zapComment || `${formatSats(selectedAmount)} sats zap from GDY·UP`,
        context
      );

      if (zapId) {
        triggerHaptic('heavy');
        toast.success(`⚡ Zapped ${formatSats(selectedAmount)} sats!`);
        onZapComplete?.(zapId, selectedAmount);
        onClose?.();
      } else {
        throw new Error('Failed to create zap request');
      }
    } catch (error) {
      console.error('Zap error:', error);
      triggerHaptic('heavy');
      toast.error('Failed to send zap. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyPubkey = async () => {
    try {
      await navigator.clipboard.writeText(recipientPubkey);
      triggerHaptic('light');
      toast.success('Public key copied');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

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
            onClick={handleClose}
          />

          {/* Zap Sheet */}
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
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" fill="currentColor" />
                </div>
                <div>
                  <h2 className={cn("text-xl font-bold", getThemedTextClasses())}>
                    Send Zap
                  </h2>
                  <p className={cn("text-sm", getThemedTextClasses('muted'))}>
                    {recipientName || recipientNip05 || `${recipientPubkey.substring(0, 8)}...`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full bg-gdyup-text-subtle/10 hover:bg-gdyup-text-subtle/20 transition-colors"
              >
                <X size={20} className="text-gdyup-text-subtle" />
              </button>
            </div>

            <div className="px-6 pb-6 space-y-6">
              {/* Amount Selection */}
              <div>
                <h3 className={cn("text-lg font-semibold mb-4", getThemedTextClasses())}>
                  Select Amount
                </h3>
                
                {/* Preset amounts */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {PRESET_AMOUNTS.map((amount) => (
                    <motion.button
                      key={amount}
                      onClick={() => handleAmountSelect(amount)}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all text-center",
                        selectedAmount === amount
                          ? "border-amber-500 bg-amber-500/10 shadow-lg"
                          : "border-gdyup-border bg-gdyup-bg-elevated hover:border-gdyup-border-light"
                      )}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className={cn(
                        "font-bold",
                        selectedAmount === amount ? "text-amber-400" : getThemedTextClasses()
                      )}>
                        {AMOUNT_LABELS[amount]}
                      </div>
                      <div className={cn("text-xs", getThemedTextClasses('muted'))}>
                        {getUsdValue(amount)}
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Custom amount */}
                <motion.button
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  className="w-full p-4 rounded-xl border-2 border-gdyup-border bg-gdyup-bg-elevated hover:border-gdyup-border-light transition-all flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.98 }}
                >
                  <Sparkles size={16} className="text-gdyup-primary" />
                  <span className={getThemedTextClasses()}>Custom Amount</span>
                  <ChevronDown 
                    size={16} 
                    className={cn(
                      "transition-transform",
                      showCustomInput ? "rotate-180" : "",
                      getThemedTextClasses('muted')
                    )} 
                  />
                </motion.button>

                <AnimatePresence>
                  {showCustomInput && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 flex gap-2">
                        <input
                          type="number"
                          placeholder="Enter sats..."
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          className="input-elite flex-1"
                          autoFocus
                        />
                        <button
                          onClick={handleCustomAmountSubmit}
                          className="btn-primary-elite px-4"
                        >
                          Set
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Amount Summary */}
              <div className="bg-gdyup-bg-elevated rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-amber-400 mb-1">
                  ⚡ {formatSats(selectedAmount)} sats
                </div>
                <div className={cn("text-sm", getThemedTextClasses('muted'))}>
                  {getBtcValue(selectedAmount)} BTC • {getUsdValue(selectedAmount)}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className={cn("block text-sm font-medium mb-2", getThemedTextClasses())}>
                  Message (optional)
                </label>
                <textarea
                  value={zapComment}
                  onChange={(e) => setZapComment(e.target.value)}
                  placeholder="Add a note with your zap..."
                  className="input-elite min-h-[80px] resize-none"
                  maxLength={280}
                />
                <div className={cn("text-xs text-right mt-1", getThemedTextClasses('muted'))}>
                  {zapComment.length}/280
                </div>
              </div>

              {/* Recipient info */}
              <div className="bg-gdyup-bg-elevated rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={cn("font-medium", getThemedTextClasses())}>
                      Sending to:
                    </div>
                    <div className={cn("text-sm", getThemedTextClasses('muted'))}>
                      {recipientNip05 || `${recipientPubkey.substring(0, 16)}...`}
                    </div>
                  </div>
                  <button
                    onClick={copyPubkey}
                    className="p-2 rounded-lg bg-gdyup-bg-dark hover:bg-gdyup-bg-dark/80 transition-colors"
                  >
                    <Copy size={16} className="text-gdyup-text-subtle" />
                  </button>
                </div>
              </div>

              {/* Send Button */}
              <motion.button
                onClick={handleSendZap}
                disabled={isProcessing || !isConnected}
                className="btn-primary-elite w-full py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                whileTap={{ scale: 0.98 }}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Zap size={20} />
                    </motion.div>
                    Sending Zap...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Send size={20} />
                    Send ⚡ {formatSats(selectedAmount)} sats
                  </div>
                )}
              </motion.button>

              {!isConnected && (
                <div className="text-center">
                  <p className={cn("text-sm", getThemedTextClasses('muted'))}>
                    Connect your Nostr identity to send zaps
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 