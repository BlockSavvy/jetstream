'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NostrZapButtonProps {
  recipientPubkey?: string;
  recipientNip05?: string;
  amount?: number;
  note?: string;
  size?: 'sm' | 'md' | 'lg';
  showAmount?: boolean;
  className?: string;
  onSuccess?: (amount: number) => void;
}

export default function NostrZapButton({
  recipientPubkey,
  recipientNip05,
  amount = 1000,
  note = 'Zap from GDY·UP',
  size = 'md',
  showAmount = true,
  className,
  onSuccess
}: NostrZapButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [zapAmount, setZapAmount] = useState(amount);
  const [zapNote, setZapNote] = useState(note);
  const { getThemedButtonClasses, getThemedTextClasses, getThemedBackgroundClasses, getThemedBadgeClasses } = useGdyupTheme();
  
  const formatSats = (sats: number) => {
    if (sats >= 1000000) {
      return `${(sats / 1000000).toFixed(2)}M sats`;
    } else if (sats >= 1000) {
      return `${(sats / 1000).toFixed(1)}K sats`;
    } else {
      return `${sats} sats`;
    }
  };
  
  const handleZap = async () => {
    if (!recipientPubkey && !recipientNip05) {
      toast.error('No recipient specified for zap');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // In a real implementation, this would use the Nostr or WebLN API to send a zap
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(`Zapped ${formatSats(zapAmount)}!`);
      setIsOpen(false);
      
      if (onSuccess) {
        onSuccess(zapAmount);
      }
    } catch (error) {
      console.error('Error sending zap:', error);
      toast.error('Failed to send zap. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const sizeClasses = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base'
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'default'}
          className={cn(
            sizeClasses[size],
            getThemedTextClasses('secondary'),
            "gap-2 border border-gdyup-secondary hover:bg-gdyup-secondary/10",
            className
          )}
        >
          <Zap className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
          <span>
            {showAmount ? `Zap ${formatSats(zapAmount)}` : 'Zap'}
          </span>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className={cn(
        getThemedBackgroundClasses('card'),
        "border-gdyup-border w-80"
      )}>
        <div className="space-y-4">
          <h4 className={cn(getThemedTextClasses('primary'), "font-medium text-sm")}>
            Send a Zap
          </h4>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className={getThemedTextClasses('muted') + " text-xs"}>
                Amount
              </span>
              <span className={getThemedTextClasses('secondary') + " text-xs font-medium"}>
                {formatSats(zapAmount)}
              </span>
            </div>
            
            <Slider
              defaultValue={[zapAmount]}
              min={100}
              max={100000}
              step={100}
              onValueChange={(values) => setZapAmount(values[0])}
              className="bg-gdyup-secondary/20"
            />
            
            <div className="flex gap-2 mt-2">
              {[1000, 5000, 21000, 50000].map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setZapAmount(preset)}
                  className={cn(
                    "text-xs py-0 h-6 flex-1",
                    zapAmount === preset ? 
                      cn("bg-gdyup-secondary/20", getThemedTextClasses('secondary'), "border-gdyup-secondary") : 
                      "border-gdyup-border"
                  )}
                >
                  {formatSats(preset)}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className={getThemedTextClasses('muted') + " text-xs"}>
              Note (optional)
            </label>
            <Input
              value={zapNote}
              onChange={(e) => setZapNote(e.target.value)}
              placeholder="Add a note to your zap"
              className={cn("bg-gdyup-bg-dark border-gdyup-border text-gdyup-text text-sm")}
            />
          </div>
          
          <div className="pt-2">
            <Button
              onClick={handleZap}
              disabled={isProcessing}
              className={cn(
                "w-full",
                getThemedButtonClasses('secondary')
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Send {formatSats(zapAmount)}
                </>
              )}
            </Button>
            
            <p className={cn(getThemedTextClasses('muted'), "text-xs mt-2 text-center")}>
              {recipientNip05 ? `Sending to ${recipientNip05}` : 'Sending via Nostr'}
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 