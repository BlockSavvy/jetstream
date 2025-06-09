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

  // Debug logging
  useEffect(() => {
    console.log('[MobileNavBar] Component mounted');
    console.log('[MobileNavBar] Current pathname:', pathname);
    console.log('[MobileNavBar] Capacitor detected:', !!(window as any).Capacitor);
    
    // Add visibility debugging
    const navElement = document.querySelector('.mobile-nav-bar');
    if (navElement) {
      console.log('[MobileNavBar] Element found, checking styles...');
      const styles = window.getComputedStyle(navElement);
      console.log('[MobileNavBar] Display:', styles.display);
      console.log('[MobileNavBar] Position:', styles.position);
      console.log('[MobileNavBar] Z-index:', styles.zIndex);
      console.log('[MobileNavBar] Bottom:', styles.bottom);
      console.log('[MobileNavBar] Visibility:', styles.visibility);
      console.log('[MobileNavBar] Opacity:', styles.opacity);
    } else {
      console.log('[MobileNavBar] Element NOT found in DOM');
    }

    // NUCLEAR CAPACITOR POSITIONING FIX
    if ((window as any).Capacitor) {
      console.log('[MobileNavBar] Applying nuclear Capacitor positioning fix...');
      
      // Create a style element with maximum specificity
      const styleEl = document.createElement('style');
      styleEl.innerHTML = `
        /* NUCLEAR MOBILE NAV POSITIONING FOR CAPACITOR */
        .capacitor .mobile-nav-bar,
        body.capacitor .mobile-nav-bar,
        html.capacitor .mobile-nav-bar,
        .mobile-nav-bar {
          position: fixed !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          width: 100vw !important;
          min-height: 80px !important;
          z-index: 2147483647 !important;
          background: #000000 !important;
          border-top: 1px solid #333333 !important;
          padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px)) !important;
          padding-left: env(safe-area-inset-left, 0px) !important;
          padding-right: env(safe-area-inset-right, 0px) !important;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          display: flex !important;
          flex-direction: column !important;
          margin: 0 !important;
          transform: none !important;
        }
        
        /* Force concierge radial menu positioning */
        .mobile-nav-bar .concierge-radial-menu {
          position: fixed !important;
          bottom: 100px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          z-index: 2147483648 !important;
          display: flex !important;
          flex-direction: row !important;
          gap: 16px !important;
          align-items: center !important;
          justify-content: center !important;
        }
      `;
      document.head.appendChild(styleEl);
    }
  }, [pathname]);

  // Function to open concierge with haptic feedback
  const handleConciergeClick = () => {
    console.log('[MobileNavBar] Concierge button clicked - toggling radial menu');
    triggerHaptic('medium'); // Medium impact for concierge button
    setConciergeExpanded(!conciergeExpanded);
  };

  // Handle nav item clicks with haptic feedback
  const handleNavClick = () => {
    console.log('[MobileNavBar] Nav item clicked');
    triggerHaptic('light'); // Light haptic for nav changes
    setConciergeExpanded(false); // Close concierge menu on navigation
  };

  return (
    <>
      <nav 
        className="mobile-nav-bar"
        style={{
          position: 'fixed !important' as any,
          bottom: '0 !important' as any,
          left: '0 !important' as any,
          right: '0 !important' as any,
          width: '100vw !important' as any,
          minHeight: '80px !important' as any,
          zIndex: '2147483647 !important' as any,
          backgroundColor: '#000000 !important' as any,
          borderTop: '1px solid #333333 !important' as any,
          paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px)) !important' as any,
          paddingLeft: 'env(safe-area-inset-left, 0px) !important' as any,
          paddingRight: 'env(safe-area-inset-right, 0px) !important' as any,
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5) !important' as any,
          backdropFilter: 'blur(20px) !important' as any,
          WebkitBackdropFilter: 'blur(20px) !important' as any,
          display: 'flex !important' as any,
          flexDirection: 'column !important' as any,
          margin: '0 !important' as any,
          transform: 'none !important' as any
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
            padding: '0.5rem 1rem'
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
      
      {/* Concierge Radial Menu - Fixed positioning outside nav */}
      <AnimatePresence>
        {conciergeExpanded && (
          <motion.div
            className="concierge-radial-menu"
            style={{
              position: 'fixed',
              bottom: '100px',
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