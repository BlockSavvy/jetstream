'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Bitcoin, Plane, Search, Share, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface MobileNavBarProps {
  className?: string;
}

export default function MobileNavBar({ className }: MobileNavBarProps) {
  const pathname = usePathname();
  
  // Check if path is active
  const isActive = (path: string) => {
    return pathname?.startsWith(path);
  };
  
  // Determine active link styling
  const getLinkStyle = (path: string) => {
    return isActive(path) ? 'text-gdyup-primary' : 'text-gdyup-text-medium';
  };
  
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "fixed bottom-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-md border-t border-gdyup-border flex items-center justify-around px-4 z-30", 
        className
      )}
      style={{
        paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))'
      }}
    >
      <Link href="/gdyup/browse" className="flex flex-col items-center justify-center w-16">
        <Search className={cn("w-5 h-5", getLinkStyle('/gdyup/browse'))} />
        <span className={cn("text-xs mt-1", getLinkStyle('/gdyup/browse'))}>Browse</span>
      </Link>
      
      <Link href="/gdyup/list" className="flex flex-col items-center justify-center w-16">
        <Share className={cn("w-5 h-5", getLinkStyle('/gdyup/list'))} />
        <span className={cn("text-xs mt-1", getLinkStyle('/gdyup/list'))}>List</span>
      </Link>
      
      {/* Center elevated concierge button */}
      <div className="relative w-16 flex justify-center">
        <motion.button
          onClick={() => {
            // Dispatch custom event to open concierge
            document.dispatchEvent(new CustomEvent('gdyup-open-concierge', {
              detail: { context: 'quick-access' }
            }));
          }}
          className="absolute -top-6 bg-gdyup-primary rounded-full w-14 h-14 flex items-center justify-center shadow-lg border-2 border-black"
          whileTap={{ scale: 0.95 }}
          whileHover={{ y: -2 }}
          style={{
            boxShadow: '0 0 15px var(--gdyup-primary-rgb, rgba(218, 255, 13, 0.5))'
          }}
        >
          <Image 
            src="/icons/conciergebutton.png" 
            width={40} 
            height={40} 
            alt="AI Concierge" 
            className="rounded-full" 
          />
        </motion.button>
        <span className="text-xs mt-10 text-gdyup-text-medium">Concierge</span>
      </div>
      
      <Link href="/gdyup/flights" className="flex flex-col items-center justify-center w-16">
        <Plane className={cn("w-5 h-5", getLinkStyle('/gdyup/flights'))} />
        <span className={cn("text-xs mt-1", getLinkStyle('/gdyup/flights'))}>Flights</span>
      </Link>
      
      <Link href="/gdyup/profile" className="flex flex-col items-center justify-center w-16">
        <Bitcoin className={cn("w-5 h-5", getLinkStyle('/gdyup/profile'))} />
        <span className={cn("text-xs mt-1", getLinkStyle('/gdyup/profile'))}>Wallet</span>
      </Link>
    </motion.div>
  );
} 