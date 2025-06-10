'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isCapacitor, setIsCapacitor] = useState(false);

  // Only mount on client side and setup iOS-specific positioning
  useEffect(() => {
    setMounted(true);
    console.log('[MobileNavBar] 🚀 BULLETPROOF NAV - Component mounted, will render to body portal');
    
    // Detect Capacitor
    const capacitorDetected = !!(window as any).Capacitor;
    setIsCapacitor(capacitorDetected);
    console.log('[MobileNavBar] Capacitor detected:', capacitorDetected);
    
    // iOS WebView BULLETPROOF setup
    const updateViewport = () => {
      const vh = window.innerHeight;
      setViewportHeight(vh);
      console.log('[MobileNavBar] iOS viewport height:', vh);
      
      if (capacitorDetected) {
        // Force document height and prevent zoom/bounce
        document.documentElement.style.height = '100%';
        document.documentElement.style.overflow = 'hidden';
        document.body.style.height = '100%';
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'relative';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        
        // Create or update the scroll container
        let scrollContainer = document.getElementById('gdyup-scroll-container');
        if (!scrollContainer) {
          scrollContainer = document.createElement('div');
          scrollContainer.id = 'gdyup-scroll-container';
          scrollContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 80px;
            overflow-y: auto;
            overflow-x: hidden;
            -webkit-overflow-scrolling: touch;
            z-index: 1;
          `;
          
          // Move all body children into scroll container except the nav
          const children = Array.from(document.body.children);
          children.forEach(child => {
            if (child.id !== 'gdyup-mobile-nav-portal' && child.id !== 'gdyup-scroll-container') {
              scrollContainer!.appendChild(child);
            }
          });
          
          document.body.appendChild(scrollContainer);
        }
      }
    };
    
    updateViewport();
    
    // Update on orientation change
    const handleOrientationChange = () => {
      setTimeout(updateViewport, 100);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', updateViewport);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', updateViewport);
      
      // Cleanup on unmount
      if (capacitorDetected) {
        const scrollContainer = document.getElementById('gdyup-scroll-container');
        if (scrollContainer) {
          // Move children back to body
          const children = Array.from(scrollContainer.children);
          children.forEach(child => {
            document.body.appendChild(child);
          });
          scrollContainer.remove();
        }
        
        // Reset body styles
        document.body.style.height = '';
        document.body.style.overflow = '';
        document.body.style.position = '';
      }
    };
  }, []);

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

  // Don't render anything until mounted on client
  if (!mounted) {
    return null;
  }

  // BULLETPROOF MOBILE NAV COMPONENT
  const MobileNavContent = (
    <>
      <div 
        id="gdyup-mobile-nav-portal"
        style={{
          // BULLETPROOF iOS WebView positioning with scroll container
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          width: '100vw',
          height: '80px',
          zIndex: 999999,
          backgroundColor: '#000000', // BACK TO BLACK - debug complete!
          borderTop: '1px solid #333333',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column' as const,
          margin: '0',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
          willChange: 'transform',
          WebkitBackfaceVisibility: 'hidden' as const,
          backfaceVisibility: 'hidden' as const,
          overflow: 'visible' as const,
          pointerEvents: 'auto' as const,
          visibility: 'visible' as const,
          opacity: '1'
        }}
      >
        {/* Navigation Items Container */}
        <div 
          style={{
            position: 'relative' as const,
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
                    aria-label="Open AI Concierge"
                    style={{
                      position: 'absolute' as const,
                      top: '-32px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 999999,
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
                      overflow: 'hidden' as const
                    }}
                  >
                    <img 
                      src="/icons/conciergebutton.png" 
                      alt="AI Concierge" 
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover' as const,
                        borderRadius: '50%'
                      }}
                    />
                  </button>
                  
                  {/* Regular nav item */}
                  <Link
                    href={item.href}
                    onClick={handleNavClick}
                    style={{
                      display: 'flex',
                      flexDirection: 'column' as const,
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
                style={{
                  display: 'flex',
                  flexDirection: 'column' as const,
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
      </div>
      
      {/* Concierge Radial Menu */}
      <AnimatePresence>
        {conciergeExpanded && (
          <motion.div
            style={{
              position: 'absolute' as const,
              bottom: '100px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 999999,
              display: 'flex',
              flexDirection: 'row' as const,
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
                style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }}
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
                    textAlign: 'center' as const,
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

  // Render to body using portal - BYPASSES ALL PARENT CONTAINERS
  return createPortal(MobileNavContent, document.body);
} 