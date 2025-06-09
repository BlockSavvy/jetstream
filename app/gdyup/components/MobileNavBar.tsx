'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Plus, Calendar, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGdyupTheme } from '../hooks/useGdyupTheme';

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

export default function MobileNavBar({ className }: MobileNavBarProps) {
  const pathname = usePathname();
  const { getThemedTextClasses } = useGdyupTheme();

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
  }, [pathname]);

  // Function to open concierge with haptic feedback
  const handleConciergeClick = () => {
    console.log('[MobileNavBar] Concierge button clicked');
    triggerHaptic('medium'); // Medium impact for concierge button
    const event = new CustomEvent('gdyup-open-concierge', {
      detail: { context: 'general' }
    });
    document.dispatchEvent(event);
  };

  // Handle nav item clicks with haptic feedback
  const handleNavClick = () => {
    console.log('[MobileNavBar] Nav item clicked');
    triggerHaptic('light'); // Light haptic for nav changes
  };

  return (
    <nav 
      className="mobile-nav-bar fixed bottom-0 left-0 right-0 z-[9999] bg-black border-t border-gray-700"
      style={{
        minHeight: '80px',
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Navigation Items Container */}
      <div className="flex items-center justify-around px-4 py-2 relative w-full">
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
                    zIndex: 10001,
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
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Sparkles size={28} />
                </button>
                
                {/* Regular nav item */}
                <Link
                  href={item.href}
                  onClick={handleNavClick}
                  className="nav-item"
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
              className="nav-item"
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
  );
} 