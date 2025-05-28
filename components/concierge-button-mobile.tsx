'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useGdyupTheme } from '@/app/gdyup/hooks/useGdyupTheme';
import { cn } from '@/lib/utils';
import { Sparkles, MessageSquareText, X } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import dynamic from 'next/dynamic';

// Import AI Concierge component with dynamic loading to avoid SSR issues
const AIConcierge = dynamic(() => import('@/app/components/voice/AIConcierge'), { 
  ssr: false 
});

interface MobileConciergeButtonProps {
  context?: 'offer-creation' | 'flight-search' | 'general';
  currentFlightData?: any;
}

const MobileConciergeButton: React.FC<MobileConciergeButtonProps> = ({
  context = 'general',
  currentFlightData
}) => {
  const { theme, getThemedButtonClasses } = useGdyupTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [directRequestContext, setDirectRequestContext] = useState<any>(null);
  const [mode, setMode] = useState<'chat' | 'voice'>('chat');
  const isMobile = useMediaQuery('(max-width: 768px)');
  const pathname = usePathname();
  
  // Determine if the current page has a bottom navigation bar
  const hasBottomNav = pathname?.startsWith('/gdyup');
  
  // Listen for direct open requests (from Ask Concierge button or other components)
  useEffect(() => {
    const handleOpenRequest = (event: CustomEvent) => {
      console.log('[MobileConciergeButton] Received open request:', event.detail);
      setDirectRequestContext(event.detail);
      setMode('chat');
      setIsOpen(true);
    };
    
    // Add event listener
    document.addEventListener('gdyup-open-concierge', handleOpenRequest as EventListener);
    document.addEventListener('gdyup-ai-concierge-request', handleOpenRequest as EventListener);
    
    return () => {
      document.removeEventListener('gdyup-open-concierge', handleOpenRequest as EventListener);
      document.removeEventListener('gdyup-ai-concierge-request', handleOpenRequest as EventListener);
    };
  }, []);
  
  // Handle body scrolling when the concierge is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('concierge-open');
    } else {
      document.body.classList.remove('concierge-open');
    }
    
    return () => {
      document.body.classList.remove('concierge-open');
    };
  }, [isOpen]);
  
  // Get theme-aware button glow color
  const getGlowColor = () => {
    switch (theme) {
      case 'luxury': 
        return 'rgba(57, 255, 20, 0.4)'; // Neon green glow
      case 'bitcoin':
        return 'rgba(247, 147, 26, 0.7)'; // Stronger Bitcoin orange glow
      default:
        return 'rgba(218, 255, 13, 0.5)'; // Lime glow
    }
  };
  
  // Calculate safe button position based on viewport and navigation presence
  const getButtonPosition = () => {
    // If desktop (or no bottom nav), position in the bottom right
    if (!isMobile || !hasBottomNav) {
      return { bottom: '16px', right: '16px' };
    }
    
    // For mobile with bottom nav, position above the nav bar
    return { 
      bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))', 
      right: '16px'
    };
  };

  return (
    <>
      {/* Drawer-like tab button for mobile */}
      <motion.button
        className={cn(
          "fixed z-[100] px-3 py-2 rounded-full shadow-lg",
          getThemedButtonClasses('primary')
        )}
        style={{
          ...getButtonPosition(),
          boxShadow: `0 0 10px ${getGlowColor()}`
        }}
        onClick={() => setIsOpen(true)}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full overflow-hidden">
            <Image 
              src="/icons/conciergebutton.png" 
              width={24} 
              height={24} 
              alt="AI Concierge" 
              className="object-cover" 
            />
          </div>
          <span className="text-xs font-medium">Ask AI</span>
        </div>
      </motion.button>
      
      {/* Full-screen overlay when opened */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AIConcierge 
              showButton={false}
              initiallyOpen={true}
              buttonColor="var(--gdyup-primary)"
              initialContext={directRequestContext || { flightData: currentFlightData }}
              onClose={() => {
                setIsOpen(false);
                setDirectRequestContext(null);
              }}
              mode={mode}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileConciergeButton; 