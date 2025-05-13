'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Check, Clock, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';
import { format, addMinutes, isBefore } from 'date-fns';

interface TicketCheckInProps {
  flightDate: Date | string;
  departureLocation: string;
  boardingTime?: Date | string;
  checkInStatus?: 'pending' | 'available' | 'completed' | 'expired';
  onCheckIn?: () => Promise<boolean>;
  className?: string;
}

export default function TicketCheckIn({
  flightDate,
  departureLocation,
  boardingTime,
  checkInStatus = 'pending',
  onCheckIn,
  className
}: TicketCheckInProps) {
  const [status, setStatus] = useState<'pending' | 'available' | 'completed' | 'expired'>(checkInStatus);
  const [isProcessing, setIsProcessing] = useState(false);
  const { theme, getThemedTextClasses, getThemedButtonClasses } = useGdyupTheme();
  
  const flightDateTime = flightDate instanceof Date ? flightDate : new Date(flightDate);
  const boardingDateTime = boardingTime instanceof Date ? boardingTime : 
    boardingTime ? new Date(boardingTime) : addMinutes(flightDateTime, -30);
  
  const isCheckInAvailable = status === 'available' || 
    (status === 'pending' && isBefore(new Date(), flightDateTime));
  
  const handleCheckIn = async () => {
    if (!isCheckInAvailable || !onCheckIn) return;
    
    setIsProcessing(true);
    try {
      const success = await onCheckIn();
      if (success) {
        setStatus('completed');
      }
    } catch (error) {
      console.error('Error during check-in:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Helper function to check if button should be disabled
  const isButtonDisabled = () => {
    // Using type assertions to help TypeScript understand our logic
    const isCompleted = status === 'completed';
    const isExpired = status === 'expired';
    return !isCheckInAvailable || isProcessing || isCompleted || isExpired;
  };

  // Theme-specific background colors
  const cardBg = {
    default: "bg-black/30 border-gray-800",
    luxury: "bg-blue-950/30 border-blue-900",
    bitcoin: "bg-pink-950/30 border-pink-900"
  }[theme || 'default'];

  // Status badge styles
  const getStatusBadgeClasses = () => {
    if (status === 'completed') {
      return "bg-green-900/30 text-green-400 border border-green-800";
    } else if (status === 'available') {
      return "bg-blue-900/30 text-blue-400 border border-blue-800";
    } else if (status === 'pending') {
      return "bg-amber-900/30 text-amber-400 border border-amber-800";
    } else if (status === 'expired') {
      return "bg-red-900/30 text-red-400 border border-red-800";
    }
    return "";
  };

  // Button styles
  const getButtonClasses = () => {
    if (status === 'completed') {
      return "bg-green-800 hover:bg-green-700 text-white";
    }
    return getThemedButtonClasses('primary');
  };
  
  return (
    <motion.div 
      className={cn(
        "rounded-lg border p-4",
        cardBg, 
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className={getThemedTextClasses()}>
          Check-in Status
        </h3>
        
        <div>
          {status === 'completed' && (
            <span className={cn(
              "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
              getStatusBadgeClasses()
            )}>
              <Check className="mr-1 h-3 w-3" />
              Checked In
            </span>
          )}
          
          {status === 'available' && (
            <span className={cn(
              "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
              getStatusBadgeClasses()
            )}>
              <Clock className="mr-1 h-3 w-3" />
              Available
            </span>
          )}
          
          {status === 'pending' && (
            <span className={cn(
              "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
              getStatusBadgeClasses()
            )}>
              <Calendar className="mr-1 h-3 w-3" />
              Upcoming
            </span>
          )}
          
          {status === 'expired' && (
            <span className={cn(
              "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
              getStatusBadgeClasses()
            )}>
              <Clock className="mr-1 h-3 w-3" />
              Expired
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className={getThemedTextClasses('muted')}>
            Flight Date:
          </span>
          <span className={getThemedTextClasses()}>
            {format(flightDateTime, 'MMM d, yyyy')}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className={getThemedTextClasses('muted')}>
            Boarding Time:
          </span>
          <span className={getThemedTextClasses()}>
            {format(boardingDateTime, 'h:mm a')}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className={getThemedTextClasses('muted')}>
            Location:
          </span>
          <span className={getThemedTextClasses()}>
            {departureLocation}
          </span>
        </div>
      </div>
      
      <div className="mt-3">
        <Button
          onClick={handleCheckIn}
          disabled={isButtonDisabled()}
          className={cn(
            "w-full",
            getButtonClasses()
          )}
        >
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {status === 'completed' && 'Checked In'}
          {status === 'available' && !isProcessing && 'Check In Now'}
          {status === 'pending' && !isProcessing && 'Check In (Available Soon)'}
          {status === 'expired' && 'Check-in Expired'}
        </Button>
        
        <p className={getThemedTextClasses('muted')}>
          {status === 'completed' 
            ? 'You have successfully checked in for your flight.'
            : status === 'expired'
            ? 'Check-in for this flight has expired.'
            : 'Please arrive at the FBO terminal 30 minutes before departure.'}
        </p>
      </div>
    </motion.div>
  );
} 