'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Plus, Calendar, User, Sparkles, MessageSquareText, Mic, InfoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive?: (pathname: string) => boolean;
}

const navItems: NavItem[] = [
  {
    href: '/gdyup/browse',
    icon: Search,
    label: 'Browse',
    isActive: (pathname) => pathname.startsWith('/gdyup/browse')
  },
  {
    href: '/gdyup/list',
    icon: Plus,
    label: 'List',
    isActive: (pathname) => pathname.startsWith('/gdyup/list')
  },
  // Center space for concierge button
  {
    href: '/gdyup/flights',
    icon: Calendar,
    label: 'Flights',
    isActive: (pathname) => pathname.startsWith('/gdyup/flights')
  },
  {
    href: '/gdyup/profile',
    icon: User,
    label: 'Profile',
    isActive: (pathname) => pathname.startsWith('/gdyup/profile')
  }
];

interface MobileNavBarProps {
  className?: string;
}

// Helper function to trigger haptic feedback
function triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    const { Haptics } = (window as any).Capacitor?.Plugins || {};
    if (Haptics) {
      const impactStyle = style.toUpperCase() as 'LIGHT' | 'MEDIUM' | 'HEAVY';
      Haptics.impact({ style: impactStyle });
    }
  }
}

// Concierge menu options 
const conciergeOptions = [
  {
    id: 'text-chat',
    label: 'Text Chat',
    description: 'Chat with AI assistant',
    icon: MessageSquareText,
    action: () => {
      const event = new CustomEvent('gdyup-open-concierge', {
        detail: { mode: 'chat', context: 'mobile-nav' }
      });
      document.dispatchEvent(event);
    }
  },
  {
    id: 'voice-chat',
    label: 'Voice Chat',
    description: 'Talk with ElevenLabs voice',
    icon: Mic,
    action: () => {
      const event = new CustomEvent('gdyup-open-concierge', {
        detail: { mode: 'voice', context: 'mobile-nav' }
      });
      document.dispatchEvent(event);
    }
  },
  {
    id: 'smart-prompts',
    label: 'Smart Prompts',
    description: 'Quick specialized help',
    icon: InfoIcon,
    action: () => {
      const event = new CustomEvent('gdyup-open-concierge', {
        detail: { mode: 'prompts', context: 'mobile-nav' }
      });
      document.dispatchEvent(event);
    }
  }
];

export default function MobileNavBar({ className }: MobileNavBarProps) {
  const pathname = usePathname();
  const { getThemedTextClasses } = useGdyupTheme();
  const [conciergeExpanded, setConciergeExpanded] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isCapacitor, setIsCapacitor] = useState(false);

  // Universal positioning solution for both web and Capacitor
  useEffect(() => {
    console.log('[MobileNavBar] Component mounted - USING UNIVERSAL SOLUTION');
    console.log('[MobileNavBar] Current pathname:', pathname);
    
    const capacitorDetected = !!(window as any).Capacitor;
    setIsCapacitor(capacitorDetected);
    console.log('[MobileNavBar] Capacitor detected:', capacitorDetected);
    
    // Universal viewport height calculation (works in both web and Capacitor)
    const updateViewportHeight = () => {
      const vh = window.innerHeight;
      setViewportHeight(vh);
      console.log('[MobileNavBar] Viewport height updated:', vh);
      
      // Force CSS custom properties for universal use
      document.documentElement.style.setProperty('--vh', `${vh * 0.01}px`);
      document.documentElement.style.setProperty('--mobile-nav-top', `${vh - 80}px`);
    };

    // Set initial height immediately
    updateViewportHeight();
    
    // Update on resize and orientation change (universal)
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);
    
    // Additional iOS specific optimizations when in Capacitor
    if (capacitorDetected) {
      console.log('[MobileNavBar] Applying additional iOS optimizations...');
      
      const handleViewportChange = () => {
        setTimeout(updateViewportHeight, 100);
      };
      
      // Listen for iOS-specific events
      window.addEventListener('scroll', handleViewportChange, { passive: true });
      
      return () => {
        window.removeEventListener('resize', updateViewportHeight);
        window.removeEventListener('orientationchange', updateViewportHeight);
        window.removeEventListener('scroll', handleViewportChange);
      };
    }
    
    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, [pathname]);

  // Function to open concierge with haptic feedback
  const handleConciergeClick = () => {
    console.log('[MobileNavBar] Concierge button clicked - toggling radial menu');
    triggerHaptic('medium');
    setConciergeExpanded(!conciergeExpanded);
  };

  // Handle nav item clicks with haptic feedback
  const handleNavClick = () => {
    console.log('[MobileNavBar] Nav item clicked');
    triggerHaptic('light');
    setConciergeExpanded(false);
  };

  return (
    <>
      <nav 
        className="mobile-nav-bar ios-native-nav"
        style={{
          // Universal positioning - fixed for web, absolute for Capacitor
          position: isCapacitor ? 'absolute' : 'fixed',
          top: viewportHeight > 0 ? `${viewportHeight - 80}px` : 'calc(100vh - 80px)',
          bottom: isCapacitor ? 'auto' : '0',
          left: '0',
          right: '0',
          width: '100vw',
          height: '80px',
          zIndex: 2147483647,
          backgroundColor: '#000000',
          borderTop: '1px solid #333333',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          margin: '0',
          // CRITICAL: Transform to force hardware acceleration
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
          willChange: 'transform',
          // Force iOS to respect positioning
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden'
        }}
      >
        {/* Navigation Items Container */}
        <div 
          className="flex items-center justify-around px-4 py-2 relative w-full"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            width: '100%',
            padding: '0.5rem 1rem',
            height: '100%'
          }}
        >
          {navItems.map((item, index) => {
            const isActive = item.isActive ? item.isActive(pathname || '') : pathname === item.href;
            const Icon = item.icon;
            
            // Insert concierge button in the middle
            if (index === 2) {
              return (
                <React.Fragment key={`nav-${index}`}>
                  {/* Concierge Button - Elevated Center */}
                  <button
                    onClick={handleConciergeClick}
                    className="concierge-button-mobile"
                    aria-label="Open AI Concierge"
                    style={{
                      position: 'absolute',
                      top: '-32px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 2147483648,
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: '#DAFF0D',
                      color: '#000000',
                      border: '3px solid #000000',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(218, 255, 13, 0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      padding: '0',
                      overflow: 'hidden'
                    }}
                  >
                    <img 
                      src="/icons/conciergebutton.png" 
                      alt="AI Concierge" 
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '50%'
                      }}
                    />
                  </button>
                  
                  {/* Regular nav item */}
                  <Link
                    href={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      "nav-item",
                      isActive ? "active" : ""
                    )}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      backgroundColor: isActive ? '#DAFF0D' : 'transparent',
                      color: isActive ? '#000000' : '#FFFFFF',
                      textDecoration: 'none',
                      minHeight: '60px',
                      minWidth: '50px',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Icon size={20} color={isActive ? '#000000' : '#FFFFFF'} strokeWidth={2} />
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: isActive ? '#000000' : '#FFFFFF'
                    }}>
                      {item.label}
                    </span>
                  </Link>
                </React.Fragment>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  "nav-item",
                  isActive ? "active" : ""
                )}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  backgroundColor: isActive ? '#DAFF0D' : 'transparent',
                  color: isActive ? '#000000' : '#FFFFFF',
                  textDecoration: 'none',
                  minHeight: '60px',
                  minWidth: '50px',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={20} color={isActive ? '#000000' : '#FFFFFF'} strokeWidth={2} />
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: isActive ? '#000000' : '#FFFFFF'
                }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* Concierge Radial Menu - Universal positioning */}
      <AnimatePresence>
        {conciergeExpanded && (
          <motion.div
            className="concierge-radial-menu"
            style={{
              position: isCapacitor ? 'absolute' : 'fixed',
              top: viewportHeight > 0 ? `${viewportHeight - 180}px` : 'calc(100vh - 180px)',
              bottom: isCapacitor ? 'auto' : '100px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 2147483649,
              display: 'flex',
              flexDirection: 'row',
              gap: '16px',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 20px',
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: '16px',
              border: '1px solid #DAFF0D',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
            }}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            {conciergeOptions.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex flex-col items-center"
              >
                <motion.button
                  onClick={() => {
                    console.log('[MobileNavBar] Concierge option clicked:', option.id);
                    option.action();
                    setConciergeExpanded(false);
                    triggerHaptic('light');
                  }}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#DAFF0D',
                    color: '#000000',
                    border: '2px solid #000000',
                    boxShadow: '0 4px 15px rgba(218, 255, 13, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    marginBottom: '8px'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {React.createElement(option.icon, { 
                    size: 20, 
                    strokeWidth: 2,
                    color: '#000000'
                  })}
                </motion.button>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '500',
                    textAlign: 'center',
                    color: '#FFFFFF',
                    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                    maxWidth: '60px',
                    lineHeight: '1.2'
                  }}
                >
                  {option.label}
                </motion.span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 