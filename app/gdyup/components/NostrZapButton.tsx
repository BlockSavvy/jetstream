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
  const { getThemeClasses } = useGdyupTheme();
  
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
            getThemeClasses({
              base: "gap-2",
              default: "border-amber-600 text-amber-500 hover:bg-amber-950/30 hover:text-amber-400",
              blue: "border-amber-600 text-amber-500 hover:bg-amber-950/30 hover:text-amber-400",
              pink: "border-amber-600 text-amber-500 hover:bg-amber-950/30 hover:text-amber-400"
            }),
            className
          )}
        >
          <Zap className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
          <span>
            {showAmount ? `Zap ${formatSats(zapAmount)}` : 'Zap'}
          </span>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className={getThemeClasses({
        base: "w-80",
        default: "bg-gray-900 border-gray-800",
        blue: "bg-blue-950 border-blue-900",
        pink: "bg-pink-950 border-pink-900"
      })}>
        <div className="space-y-4">
          <h4 className={getThemeClasses({
            base: "font-medium text-sm",
            default: "text-white",
            blue: "text-blue-100",
            pink: "text-pink-100"
          })}>
            Send a Zap
          </h4>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className={getThemeClasses({
                base: "text-xs",
                default: "text-gray-400",
                blue: "text-blue-300",
                pink: "text-pink-300"
              })}>
                Amount
              </span>
              <span className={getThemeClasses({
                base: "text-xs font-medium",
                default: "text-amber-500",
                blue: "text-amber-400",
                pink: "text-amber-400"
              })}>
                {formatSats(zapAmount)}
              </span>
            </div>
            
            <Slider
              defaultValue={[zapAmount]}
              min={100}
              max={100000}
              step={100}
              onValueChange={(values) => setZapAmount(values[0])}
              className={getThemeClasses({
                base: "",
                default: "bg-amber-900/20",
                blue: "bg-amber-900/20",
                pink: "bg-amber-900/20"
              })}
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
                      getThemeClasses({
                        base: "",
                        default: "bg-amber-900/30 border-amber-700 text-amber-400",
                        blue: "bg-amber-900/30 border-amber-700 text-amber-400",
                        pink: "bg-amber-900/30 border-amber-700 text-amber-400"
                      }) : 
                      getThemeClasses({
                        base: "",
                        default: "border-gray-700",
                        blue: "border-blue-700",
                        pink: "border-pink-700"
                      })
                  )}
                >
                  {formatSats(preset)}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className={getThemeClasses({
              base: "text-xs",
              default: "text-gray-400",
              blue: "text-blue-300",
              pink: "text-pink-300"
            })}>
              Note (optional)
            </label>
            <Input
              value={zapNote}
              onChange={(e) => setZapNote(e.target.value)}
              placeholder="Add a note to your zap"
              className={getThemeClasses({
                base: "text-sm",
                default: "bg-black/30 border-gray-700 text-white",
                blue: "bg-blue-900/30 border-blue-800 text-blue-100",
                pink: "bg-pink-900/30 border-pink-800 text-pink-100"
              })}
            />
          </div>
          
          <div className="pt-2">
            <Button
              onClick={handleZap}
              disabled={isProcessing}
              className={cn(
                "w-full",
                getThemeClasses({
                  base: "",
                  default: "bg-amber-600 hover:bg-amber-700 text-white",
                  blue: "bg-amber-600 hover:bg-amber-700 text-white",
                  pink: "bg-amber-600 hover:bg-amber-700 text-white"
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
                  <Zap className="mr-2 h-4 w-4" />
                  Send {formatSats(zapAmount)}
                </>
              )}
            </Button>
            
            <p className={getThemeClasses({
              base: "text-xs mt-2 text-center",
              default: "text-gray-400",
              blue: "text-blue-300",
              pink: "text-pink-300"
            })}>
              {recipientNip05 ? `Sending to ${recipientNip05}` : 'Sending via Nostr'}
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 