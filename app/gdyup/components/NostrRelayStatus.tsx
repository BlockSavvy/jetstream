'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wifi, WifiOff, Radio } from 'lucide-react';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface NostrRelayStatusProps {
  relayUrl?: string;
  isConnected?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

export default function NostrRelayStatus({
  relayUrl = 'relay.gdyup.com',
  isConnected = false,
  size = 'md',
  showTooltip = true,
  className
}: NostrRelayStatusProps) {
  const { getThemedBadgeClasses, getThemedTextClasses, getThemedBackgroundClasses } = useGdyupTheme();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>(
    isConnected ? 'connected' : 'disconnected'
  );
  
  // Updated to use isConnected prop directly instead of simulating
  useEffect(() => {
    if (isConnected !== undefined) {
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      return;
    }
    
    // Fallback to simulated behavior for demo purposes only when isConnected is not provided
    setConnectionStatus('connecting');
    const timer = setTimeout(() => {
      // 70% chance of successful connection for demo
      const success = Math.random() > 0.3;
      setConnectionStatus(success ? 'connected' : 'disconnected');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [isConnected]);
  
  const sizeClasses = {
    sm: 'text-xs py-0.5 px-1.5',
    md: 'text-sm py-0.5 px-2',
    lg: 'text-base py-1 px-3'
  };
  
  const badgeContent = (
    <motion.div
      className="flex items-center gap-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {connectionStatus === 'connected' && (
        <Wifi className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      )}
      {connectionStatus === 'disconnected' && (
        <WifiOff className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      )}
      {connectionStatus === 'connecting' && (
        <Radio className={cn(
          size === 'sm' ? 'h-3 w-3' : 'h-4 w-4',
          'animate-pulse'
        )} />
      )}
      <span>
        {connectionStatus === 'connected' && 'Relay Connected'}
        {connectionStatus === 'disconnected' && 'Relay Disconnected'}
        {connectionStatus === 'connecting' && 'Connecting...'}
      </span>
    </motion.div>
  );
  
  // Enhanced custom styles for better contrast
  const getCustomStyles = () => {
    if (connectionStatus === 'connected') {
      return "bg-green-600/90 text-white border border-green-500 font-medium";
    }
    if (connectionStatus === 'disconnected') {
      return "bg-red-600/90 text-white border border-red-500 font-medium";
    }
    return "bg-amber-600/90 text-white border border-amber-500 font-medium"; // 'connecting' state
  };
  
  const badge = (
    <Badge
      className={cn(
        sizeClasses[size],
        getCustomStyles(),
        className
      )}
    >
      {badgeContent}
    </Badge>
  );
  
  if (!showTooltip) {
    return badge;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent className={cn(
          "max-w-xs",
          getThemedBackgroundClasses('card'),
          getThemedTextClasses()
        )}>
          {connectionStatus === 'connected' && (
            <p>
              Connected to {relayUrl}
            </p>
          )}
          {connectionStatus === 'disconnected' && (
            <p>Not connected to any Nostr relay</p>
          )}
          {connectionStatus === 'connecting' && (
            <p>Attempting to connect to {relayUrl}...</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 