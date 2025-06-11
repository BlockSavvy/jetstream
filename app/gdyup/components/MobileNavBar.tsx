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
  const [conciergeButtonPosition, setConciergeButtonPosition] = useState({ x: 0, y: 0 });

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

  // Function to get the actual position of the concierge button
  const updateConciergeButtonPosition = () => {
    const button = document.querySelector('[aria-label="Open AI Concierge"]') as HTMLElement;
    if (button) {
      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      setConciergeButtonPosition({ x: centerX, y: centerY });
      console.log('[MobileNavBar] Concierge button position:', { x: centerX, y: centerY });
    }
  };

  // Function to open concierge with haptic feedback
  const handleConciergeClick = () => {
    console.log('[MobileNavBar] Concierge button clicked - toggling radial menu');
    triggerHaptic('medium');
    
    // Update button position before showing menu
    updateConciergeButtonPosition();
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
            
            {/* CIRCULAR RADIAL MENU - POSITIONED RELATIVE TO ACTUAL BUTTON */}
            <motion.div
              style={{
                position: 'absolute' as const,
                left: `${conciergeButtonPosition.x}px`, // Use actual button X position
                top: `${conciergeButtonPosition.y - 140}px`, // Position above button
                transform: 'translateX(-50%)', // Center on the button
                zIndex: 999999,
                width: '240px',
                height: '140px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                pointerEvents: 'none' as const,
              }}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.3 }}
              transition={{ 
                duration: 0.5, 
                ease: [0.25, 0.46, 0.45, 0.94] 
              }}
            >
              {/* Glowing Arc Background - PURE AESTHETIC MAGIC */}
              <motion.div
                style={{
                  position: 'absolute' as const,
                  bottom: '0',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '200px',
                  height: '100px', // Half circle height
                  borderRadius: '100px 100px 0 0', // Top semicircle
                  background: `
                    radial-gradient(
                      100px 100px at 50% 100%,
                      rgba(218, 255, 13, 0.3) 0%,
                      rgba(218, 255, 13, 0.1) 40%,
                      transparent 70%
                    )
                  `,
                  filter: 'blur(8px)',
                  zIndex: 1
                }}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />

              {/* Arc Border - STUNNING VISUAL GUIDE */}
              <motion.svg
                style={{
                  position: 'absolute' as const,
                  bottom: '0',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '160px',
                  height: '80px',
                  zIndex: 2,
                  pointerEvents: 'none' as const
                }}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                <motion.path
                  d="M 10 80 A 70 70 0 0 1 150 80"
                  fill="none"
                  stroke="rgba(218, 255, 13, 0.6)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(218, 255, 13, 0.4))' }}
                />
              </motion.svg>

              {/* RADIAL MENU BUTTONS - PERFECT ARC POSITIONING */}
              {conciergeOptions.map((option, index) => {
                // Create perfect semicircle above button
                const totalButtons = conciergeOptions.length;
                const arcRadius = 80; // Distance from center bottom
                
                // Calculate angle for each button (180° arc from left to right)
                const startAngle = 180; // Start at left (180°)
                const endAngle = 0;     // End at right (0°)
                const angleSpan = startAngle - endAngle; // 180° total
                const angleStep = angleSpan / (totalButtons - 1);
                const angle = startAngle - (index * angleStep); // Subtract to go left-to-right
                const radian = (angle * Math.PI) / 180;
                
                // Convert polar to cartesian coordinates
                const x = Math.cos(radian) * arcRadius;
                const y = -Math.sin(radian) * arcRadius; // Negative for upward arc
                
                return (
                  <motion.div
                    key={option.id}
                    style={{
                      position: 'absolute' as const,
                      bottom: '0', // Start from bottom center
                      left: '50%',
                      transform: `translate(calc(-50% + ${x}px), ${y}px)`, // Apply offset
                      zIndex: 10,
                      pointerEvents: 'auto' as const,
                      cursor: 'pointer'
                    }}
                    initial={{ 
                      opacity: 0, 
                      scale: 0.2,
                    }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                    }}
                    exit={{ 
                      opacity: 0, 
                      scale: 0.2,
                    }}
                    transition={{ 
                      duration: 0.6, 
                      delay: index * 0.15 + 0.3,
                      ease: [0.25, 0.46, 0.45, 0.94],
                      type: "spring",
                      stiffness: 200,
                      damping: 20
                    }}
                    onClick={() => {
                      console.log('[MobileNavBar] Radial option clicked:', option.id);
                      option.action();
                      setConciergeExpanded(false);
                      triggerHaptic('medium');
                    }}
                  >
                    {/* Button Container with Glass Morphism */}
                    <motion.div
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: `
                          linear-gradient(135deg, 
                            rgba(218, 255, 13, 0.95) 0%, 
                            rgba(184, 230, 0, 0.9) 100%
                          )
                        `,
                        backdropFilter: 'blur(20px) saturate(1.5)',
                        WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
                        border: '2px solid rgba(0, 0, 0, 0.8)',
                        boxShadow: `
                          0 8px 24px rgba(218, 255, 13, 0.4),
                          0 4px 12px rgba(0, 0, 0, 0.3),
                          inset 0 1px 0 rgba(255, 255, 255, 0.4),
                          inset 0 -1px 0 rgba(0, 0, 0, 0.2)
                        `,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative' as const,
                        overflow: 'hidden' as const
                      }}
                      whileHover={{ 
                        scale: 1.1,
                        boxShadow: `
                          0 12px 32px rgba(218, 255, 13, 0.5),
                          0 6px 16px rgba(0, 0, 0, 0.4),
                          inset 0 1px 0 rgba(255, 255, 255, 0.5),
                          inset 0 -1px 0 rgba(0, 0, 0, 0.3)
                        `,
                        y: -3,
                        rotate: index === 1 ? 0 : (index === 0 ? -5 : 5) // Center stays, sides rotate
                      }}
                      whileTap={{ 
                        scale: 0.95,
                        y: -1
                      }}
                    >
                      {/* Animated Background Shine */}
                      <motion.div
                        style={{
                          position: 'absolute' as const,
                          top: '-50%',
                          left: '-50%',
                          width: '200%',
                          height: '200%',
                          background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
                          transform: 'rotate(-45deg)',
                          opacity: 0
                        }}
                        animate={{ 
                          opacity: [0, 1, 0],
                          x: ['-100%', '100%']
                        }}
                        transition={{ 
                          duration: 2,
                          delay: index * 0.5 + 1,
                          repeat: Infinity,
                          repeatDelay: 3
                        }}
                      />
                      
                      {/* Icon */}
                      {React.createElement(option.icon, { 
                        size: 22,
                        strokeWidth: 2.5,
                        color: '#000000',
                        style: { 
                          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
                          zIndex: 2
                        }
                      })}
                      
                      {/* Subtle pulse ring */}
                      <motion.div
                        style={{
                          position: 'absolute' as const,
                          top: '-3px',
                          left: '-3px',
                          right: '-3px',
                          bottom: '-3px',
                          borderRadius: '50%',
                          border: '1.5px solid rgba(218, 255, 13, 0.6)',
                          opacity: 0,
                          pointerEvents: 'none' as const
                        }}
                        animate={{ 
                          opacity: [0, 0.8, 0],
                          scale: [1, 1.05, 1.1]
                        }}
                        transition={{ 
                          duration: 2,
                          delay: index * 0.3 + 0.5,
                          repeat: Infinity,
                          repeatDelay: 4
                        }}
                      />
                    </motion.div>
                    
                    {/* Floating Label with Perfect Positioning */}
                    <motion.div
                      style={{
                        position: 'absolute' as const,
                        top: '-45px', // Position above the button
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '4px 8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderRadius: '8px',
                        border: '1px solid rgba(218, 255, 13, 0.3)',
                        whiteSpace: 'nowrap' as const,
                        pointerEvents: 'none' as const,
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
                      }}
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.8 }}
                      transition={{ 
                        duration: 0.4,
                        delay: index * 0.1 + 0.7 
                      }}
                    >
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: '600',
                        color: '#FFFFFF',
                        textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                        letterSpacing: '0.2px'
                      }}>
                        {option.label}
                      </span>
                      
                      {/* Label Arrow pointing down */}
                      <div style={{
                        position: 'absolute' as const,
                        bottom: '-3px',
                        left: '50%',
                        width: '6px',
                        height: '6px',
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        borderRight: '1px solid rgba(218, 255, 13, 0.3)',
                        borderBottom: '1px solid rgba(218, 255, 13, 0.3)',
                        transform: 'translateX(-50%) rotate(45deg)'
                      }} />
                    </motion.div>
                  </motion.div>
                );
              })}

              {/* Central Connection Lines - STUNNING VISUAL EFFECT */}
              <motion.svg
                style={{
                  position: 'absolute' as const,
                  bottom: '0',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '200px',
                  height: '100px',
                  zIndex: 3,
                  pointerEvents: 'none' as const
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                {conciergeOptions.map((_, index) => {
                  const totalButtons = conciergeOptions.length;
                  const arcRadius = 80;
                  
                  const startAngle = 180;
                  const endAngle = 0;
                  const angleSpan = startAngle - endAngle;
                  const angleStep = angleSpan / (totalButtons - 1);
                  const angle = startAngle - (index * angleStep);
                  const radian = (angle * Math.PI) / 180;
                  
                  const x = 100 + Math.cos(radian) * arcRadius; // Center is at 100,100
                  const y = 100 + Math.sin(radian) * arcRadius;
                  
                  return (
                    <motion.line
                      key={index}
                      x1="100" // Center bottom
                      y1="100"
                      x2={x}
                      y2={y}
                      stroke="rgba(218, 255, 13, 0.2)"
                      strokeWidth="0.8"
                      strokeDasharray="1,3"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      exit={{ pathLength: 0, opacity: 0 }}
                      transition={{ 
                        duration: 0.6,
                        delay: index * 0.2 + 0.8,
                        ease: "easeOut"
                      }}
                    />
                  );
                })}
              </motion.svg>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );

  // Render to body using portal - BYPASSES ALL PARENT CONTAINERS
  return createPortal(MobileNavContent, document.body);
} 