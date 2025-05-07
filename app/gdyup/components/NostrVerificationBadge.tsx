'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NostrVerificationBadgeProps {
  nip05?: string | null;
  pubkey?: string | null;
  isVerified?: boolean;
  nip05_verified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

export default function NostrVerificationBadge({
  nip05,
  pubkey,
  isVerified,
  nip05_verified,
  size = 'md',
  showTooltip = true,
  className
}: NostrVerificationBadgeProps) {
  const { getThemeClasses } = useGdyupTheme();
  const [verificationStatus, setVerificationStatus] = useState<'verified' | 'unverified' | 'unknown'>(
    isVerified ? 'verified' : nip05 ? 'unknown' : 'unverified'
  );

  useEffect(() => {
    // First check the nip05_verified field from database
    if (nip05_verified === true) {
      setVerificationStatus('verified');
      return;
    }
    
    // Then check isVerified prop
    if (isVerified !== undefined) {
      setVerificationStatus(isVerified ? 'verified' : 'unverified');
      return;
    }
    
    // Otherwise, determine based on nip05 presence
    if (nip05) {
      // If we have a nip05 but it's not verified, mark as unverified
      if (nip05_verified === false) {
        setVerificationStatus('unverified');
      } else {
        // By default, assume verified if we have nip05
        setVerificationStatus('verified');
      }
    } else if (pubkey) {
      setVerificationStatus('unverified');
    } else {
      setVerificationStatus('unknown');
    }
  }, [nip05, pubkey, isVerified, nip05_verified]);

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
      {verificationStatus === 'verified' && (
        <CheckCircle className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      )}
      {verificationStatus === 'unverified' && (
        <AlertCircle className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      )}
      {verificationStatus === 'unknown' && (
        <HelpCircle className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      )}
      <span>
        {verificationStatus === 'verified' && 'Verified'}
        {verificationStatus === 'unverified' && 'Unverified'}
        {verificationStatus === 'unknown' && 'Unknown'}
      </span>
    </motion.div>
  );

  const badge = (
    <Badge
      className={cn(
        sizeClasses[size],
        getThemeClasses({
          base: "font-medium",
          default: verificationStatus === 'verified' 
            ? "bg-green-700 hover:bg-green-800 text-white" 
            : verificationStatus === 'unverified'
            ? "bg-amber-700 hover:bg-amber-800 text-white"
            : "bg-gray-700 hover:bg-gray-800 text-white",
          blue: verificationStatus === 'verified'
            ? "bg-green-800 hover:bg-green-900 text-green-100"
            : verificationStatus === 'unverified'
            ? "bg-amber-800 hover:bg-amber-900 text-amber-100"
            : "bg-blue-800 hover:bg-blue-900 text-blue-100",
          pink: verificationStatus === 'verified'
            ? "bg-green-800 hover:bg-green-900 text-green-100"
            : verificationStatus === 'unverified'
            ? "bg-amber-800 hover:bg-amber-900 text-amber-100"
            : "bg-pink-800 hover:bg-pink-900 text-pink-100",
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
          {verificationStatus === 'verified' && (
            <p>
              {nip05 ? `Verified as ${nip05}` : 'Identity verified on Nostr'}
            </p>
          )}
          {verificationStatus === 'unverified' && (
            <p>This identity has not been verified on Nostr</p>
          )}
          {verificationStatus === 'unknown' && (
            <p>Verification status unknown</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 