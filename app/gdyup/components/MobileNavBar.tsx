'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Plus, Calendar, User, Sparkles, MessageSquareText, Mic, InfoIcon, LayoutDashboard } from 'lucide-react';
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
    href: '/gdyup/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    isActive: (pathname) => pathname.startsWith('/gdyup/dashboard')
  },
  // Center space for concierge button
  {
    href: '/gdyup/list',
    icon: Plus,
    label: 'List',
    isActive: (pathname) => pathname.startsWith('/gdyup/list')
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
    
    // Add premium CSS animations
    const style = document.createElement('style');
    style.id = 'elite-nav-animations';
    style.textContent = `
      @keyframes concierge-pulse {
        0% { opacity: 0; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(1.1); }
        100% { opacity: 0; transform: scale(1.2); }
      }
      
      @keyframes subtle-glow {
        0%, 100% { box-shadow: 0 0 5px rgba(218, 255, 13, 0.3); }
        50% { box-shadow: 0 0 15px rgba(218, 255, 13, 0.6); }
      }
      
      /* Premium nav bar backdrop */
      #gdyup-mobile-nav-portal {
        backdrop-filter: blur(20px) saturate(1.5) !important;
        -webkit-backdrop-filter: blur(20px) saturate(1.5) !important;
      }
    `;
    document.head.appendChild(style);
    
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
      
      // Cleanup animations
      const styleEl = document.getElementById('elite-nav-animations');
      if (styleEl) styleEl.remove();
      
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
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', // 5 columns: nav nav CONCIERGE nav nav
            alignItems: 'center',
            justifyItems: 'center',
            width: '100%',
            padding: '12px 16px 8px 16px',
            height: '100%',
            maxWidth: '400px',
            margin: '0 auto'
          }}
        >
          {/* Concierge Button - Grid Column 3 (Perfect Center) */}
          <div
            style={{
              gridColumn: '3', // Explicitly place in center column
              position: 'relative' as const,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <button
              onClick={handleConciergeClick}
              aria-label="Open AI Concierge"
              style={{
                position: 'absolute' as const,
                top: '-42px', // Raised above the grid
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #DAFF0D 0%, #B8E600 100%)',
                color: '#000000',
                border: '3px solid #000000',
                boxShadow: `
                  0 8px 25px rgba(0, 0, 0, 0.3),
                  0 0 20px rgba(218, 255, 13, 0.4),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3)
                `,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                padding: '0',
                overflow: 'hidden' as const,
                filter: 'brightness(1)',
                zIndex: 999999
              }}
              onMouseDown={() => {
                const button = document.querySelector('[aria-label="Open AI Concierge"]') as HTMLElement;
                if (button) {
                  button.style.transform = 'scale(0.95)';
                  button.style.filter = 'brightness(1.1)';
                }
              }}
              onMouseUp={() => {
                const button = document.querySelector('[aria-label="Open AI Concierge"]') as HTMLElement;
                if (button) {
                  button.style.transform = 'scale(1)';
                  button.style.filter = 'brightness(1)';
                }
              }}
            >
              <img 
                src="/icons/conciergebutton.png" 
                alt="AI Concierge" 
                style={{
                  width: '85%',
                  height: '85%',
                  objectFit: 'cover' as const,
                  borderRadius: '50%',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                }}
              />
              {/* Elite pulse animation ring */}
              <div
                style={{
                  position: 'absolute' as const,
                  top: '-3px',
                  left: '-3px',
                  right: '-3px',
                  bottom: '-3px',
                  borderRadius: '50%',
                  border: '2px solid #DAFF0D',
                  opacity: '0',
                  animation: 'concierge-pulse 3s infinite',
                  pointerEvents: 'none' as const
                }}
              />
            </button>
          </div>

          {/* Navigation Items - Grid Positioned */}
          {navItems.map((item, index) => {
            const isActive = item.isActive ? item.isActive(pathname || '') : pathname === item.href;
            const Icon = item.icon;
            
            // Grid column positions: 1, 2, skip 3 (concierge), 4, 5
            const gridColumn = index < 2 ? index + 1 : index + 2;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                style={{
                  gridColumn: `${gridColumn}`, // Explicit grid positioning
                  display: 'flex',
                  flexDirection: 'column' as const,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '8px 6px', // Tighter padding since we have proper grid
                  borderRadius: '12px',
                  backgroundColor: isActive ? 'rgba(218, 255, 13, 0.95)' : 'transparent',
                  color: isActive ? '#000000' : '#FFFFFF',
                  textDecoration: 'none',
                  minHeight: '56px',
                  minWidth: '55px', // Optimized for grid layout
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  // Premium active state
                  ...(isActive && {
                    boxShadow: '0 4px 12px rgba(218, 255, 13, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    transform: 'translateY(-1px)'
                  }),
                  position: 'relative' as const
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.transform = 'translateY(-0.5px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <Icon 
                  size={19}
                  color={isActive ? '#000000' : '#FFFFFF'} 
                  strokeWidth={2.5}
                />
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  color: isActive ? '#000000' : '#FFFFFF',
                  textAlign: 'center' as const,
                  lineHeight: '1.1',
                  letterSpacing: '0.1px',
                  whiteSpace: 'nowrap' as const
                }}>
                  {item.label}
                </span>
                
                {/* Active indicator dot */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute' as const,
                      bottom: '2px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      backgroundColor: '#000000',
                      opacity: '0.6'
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Elite Concierge Panel */}
      <AnimatePresence>
        {conciergeExpanded && (
          <>
            {/* Premium backdrop overlay */}
            <motion.div
              style={{
                position: 'absolute' as const,
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                zIndex: 999998
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setConciergeExpanded(false)} // Click outside to close
            />
            
            <motion.div
              style={{
                position: 'absolute' as const,
                bottom: '100px', // Perfect positioning above nav
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 999999,
                display: 'flex',
                flexDirection: 'column' as const,
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                backgroundColor: 'rgba(0, 0, 0, 0.85)', // Slightly more transparent
                backdropFilter: 'blur(30px) saturate(1.8)', // Enhanced glassmorphism
                WebkitBackdropFilter: 'blur(30px) saturate(1.8)',
                borderRadius: '24px', // More rounded for 2025
                border: '1px solid rgba(218, 255, 13, 0.4)',
                boxShadow: `
                  0 20px 60px rgba(0, 0, 0, 0.4),
                  0 0 30px rgba(218, 255, 13, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1)
                `, // Multi-layer premium shadows
                minWidth: '240px',
                // Premium glassmorphism effect
                background: `
                  linear-gradient(145deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.8) 100%),
                  linear-gradient(145deg, rgba(218, 255, 13, 0.05) 0%, rgba(218, 255, 13, 0.02) 100%)
                `
              }}
              initial={{ opacity: 0, y: 40, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ 
                duration: 0.4, 
                ease: [0.25, 0.46, 0.45, 0.94] // Premium cubic bezier
              }}
            >
              {/* Premium Panel Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                style={{
                  marginBottom: '16px',
                  textAlign: 'center' as const
                }}
              >
                <span style={{
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: '#DAFF0D',
                  letterSpacing: '1px',
                  textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                  textTransform: 'uppercase' as const,
                  background: 'linear-gradient(135deg, #DAFF0D 0%, #B8E600 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  AI Concierge
                </span>
                <div style={{
                  width: '40px',
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent 0%, #DAFF0D 50%, transparent 100%)',
                  margin: '8px auto 0',
                  borderRadius: '1px'
                }} />
              </motion.div>

              {/* Elite Button Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px', // More generous spacing
                alignItems: 'center',
                justifyItems: 'center',
                marginBottom: '16px'
              }}>
                {conciergeOptions.map((option, index) => (
                  <motion.div
                    key={option.id}
                    initial={{ opacity: 0, scale: 0.4, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.4, y: 15 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: index * 0.1 + 0.2, 
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
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
                      triggerHaptic('medium');
                    }}
                  >
                    <motion.div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '18px', // Perfect rounded square
                        background: 'linear-gradient(135deg, #DAFF0D 0%, #B8E600 100%)',
                        color: '#000000',
                        border: '2px solid rgba(0, 0, 0, 0.8)',
                        boxShadow: `
                          0 8px 24px rgba(218, 255, 13, 0.3),
                          0 4px 12px rgba(0, 0, 0, 0.3),
                          inset 0 1px 0 rgba(255, 255, 255, 0.3)
                        `,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        marginBottom: '10px',
                        position: 'relative' as const
                      }}
                      whileHover={{ 
                        scale: 1.05,
                        boxShadow: `
                          0 12px 30px rgba(218, 255, 13, 0.4),
                          0 6px 16px rgba(0, 0, 0, 0.3),
                          inset 0 1px 0 rgba(255, 255, 255, 0.4)
                        `,
                        y: -2
                      }}
                      whileTap={{ 
                        scale: 0.95,
                        y: 0
                      }}
                    >
                      {React.createElement(option.icon, { 
                        size: 22,
                        strokeWidth: 2.5,
                        color: '#000000'
                      })}
                    </motion.div>
                    
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.1 + 0.4 }}
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        textAlign: 'center' as const,
                        color: '#FFFFFF',
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                        maxWidth: '60px',
                        lineHeight: '1.2',
                        letterSpacing: '0.3px'
                      }}
                    >
                      {option.label}
                    </motion.span>
                  </motion.div>
                ))}
              </div>

              {/* Premium Panel Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.6 }}
                style={{
                  textAlign: 'center' as const,
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <span style={{
                  fontSize: '0.65rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontStyle: 'italic',
                  letterSpacing: '0.2px'
                }}>
                  Tap outside to close
                </span>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );

  // Render to body using portal - BYPASSES ALL PARENT CONTAINERS
  return createPortal(MobileNavContent, document.body);
} 