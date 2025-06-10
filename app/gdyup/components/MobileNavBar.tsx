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
            display: 'grid', // Use grid for perfect centering
            gridTemplateColumns: '1fr 1fr 1fr 1fr', // Equal columns
            alignItems: 'center',
            justifyItems: 'center',
            width: '100%',
            padding: '12px 1rem 8px 1rem', // Better vertical centering
            height: '100%'
          }}
        >
          {/* Concierge Button - Perfectly Centered */}
          <button
            onClick={handleConciergeClick}
            aria-label="Open AI Concierge"
            style={{
              position: 'absolute' as const,
              top: '-28px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 999999,
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#DAFF0D',
              color: '#000000',
              border: '2px solid #000000',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(218, 255, 13, 0.5)',
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
                width: '90%',
                height: '90%',
                objectFit: 'cover' as const,
                borderRadius: '50%'
              }}
            />
          </button>

          {navItems.map((item, index) => {
            const isActive = item.isActive ? item.isActive(pathname || '') : pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                style={{
                  display: 'flex',
                  flexDirection: 'column' as const,
                  alignItems: 'center',
                  justifyContent: 'center', // Perfect vertical centering
                  gap: '3px', // Optimal spacing
                  padding: '6px 8px',
                  borderRadius: '8px',
                  backgroundColor: isActive ? '#DAFF0D' : 'transparent',
                  color: isActive ? '#000000' : '#FFFFFF',
                  textDecoration: 'none',
                  minHeight: '52px', // Better proportions
                  minWidth: '48px',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={18} color={isActive ? '#000000' : '#FFFFFF'} strokeWidth={2} />
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '500',
                  color: isActive ? '#000000' : '#FFFFFF',
                  textAlign: 'center' as const,
                  lineHeight: '1'
                }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Elite Concierge Panel */}
      <AnimatePresence>
        {conciergeExpanded && (
          <motion.div
            style={{
              position: 'absolute' as const,
              bottom: '96px', // Perfect positioning above nav
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 999999,
              display: 'flex',
              flexDirection: 'column' as const, // Vertical panel layout
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              backgroundColor: 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '2px solid #DAFF0D',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(218, 255, 13, 0.3)',
              minWidth: '200px'
            }}
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Panel Header */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                marginBottom: '12px',
                textAlign: 'center' as const
              }}
            >
              <span style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#DAFF0D',
                letterSpacing: '0.5px',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)'
              }}>
                AI CONCIERGE
              </span>
            </motion.div>

            {/* Elite Button Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '12px',
              alignItems: 'center',
              justifyItems: 'center'
            }}>
              {conciergeOptions.map((option, index) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, scale: 0.6, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.6, y: 10 }}
                  transition={{ duration: 0.3, delay: index * 0.1, ease: "easeOut" }}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column' as const, 
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    console.log('[MobileNavBar] Concierge option clicked:', option.id);
                    option.action();
                    setConciergeExpanded(false);
                    triggerHaptic('light');
                  }}
                >
                  <motion.div
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '16px', // Rounded square for modern look
                      backgroundColor: '#DAFF0D',
                      color: '#000000',
                      border: '2px solid #000000',
                      boxShadow: '0 6px 20px rgba(218, 255, 13, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      marginBottom: '8px'
                    }}
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: '0 8px 25px rgba(218, 255, 13, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {React.createElement(option.icon, { 
                      size: 20,
                      strokeWidth: 2.5,
                      color: '#000000'
                    })}
                  </motion.div>
                  
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      textAlign: 'center' as const,
                      color: '#FFFFFF',
                      textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                      maxWidth: '55px',
                      lineHeight: '1.1',
                      letterSpacing: '0.2px'
                    }}
                  >
                    {option.label}
                  </motion.span>
                </motion.div>
              ))}
            </div>

            {/* Panel Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.4 }}
              style={{
                marginTop: '12px',
                textAlign: 'center' as const
              }}
            >
              <span style={{
                fontSize: '0.6rem',
                color: '#888888',
                fontStyle: 'italic'
              }}>
                Tap outside to close
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  // Render to body using portal - BYPASSES ALL PARENT CONTAINERS
  return createPortal(MobileNavContent, document.body);
} 