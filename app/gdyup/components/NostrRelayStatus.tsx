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
  const { getThemeClasses } = useGdyupTheme();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>(
    isConnected ? 'connected' : 'disconnected'
  );
  
  // Simulate connection status changes for demo purposes
  useEffect(() => {
    if (isConnected) {
      setConnectionStatus('connected');
      return;
    }
    
    // Simulate a connection attempt
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
  
  const badge = (
    <Badge
      className={cn(
        sizeClasses[size],
        getThemeClasses({
          base: "font-medium",
          default: connectionStatus === 'connected' 
            ? "bg-green-700 hover:bg-green-800 text-white" 
            : connectionStatus === 'disconnected'
            ? "bg-red-700 hover:bg-red-800 text-white"
            : "bg-amber-700 hover:bg-amber-800 text-white",
          blue: connectionStatus === 'connected'
            ? "bg-green-800 hover:bg-green-900 text-green-100"
            : connectionStatus === 'disconnected'
            ? "bg-red-800 hover:bg-red-900 text-red-100"
            : "bg-amber-800 hover:bg-amber-900 text-amber-100",
          pink: connectionStatus === 'connected'
            ? "bg-green-800 hover:bg-green-900 text-green-100"
            : connectionStatus === 'disconnected'
            ? "bg-red-800 hover:bg-red-900 text-red-100"
            : "bg-amber-800 hover:bg-amber-900 text-amber-100",
        }),
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
        <TooltipContent className="max-w-xs">
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