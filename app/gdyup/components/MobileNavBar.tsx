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
    <nav className={cn(
      "mobile-nav-bar",
      "fixed bottom-0 left-0 right-0",
      "bg-gdyup-nav-bg border-t border-gdyup-nav-border",
      "backdrop-blur-xl",
      "z-[9999]",
      className
    )}>
      {/* Navigation Items Container */}
      <div className="flex items-center justify-around px-4 py-2 relative">
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
                  className="concierge-button-mobile flex items-center justify-center"
                  aria-label="Open AI Concierge"
                  style={{
                    position: 'absolute',
                    top: '-25px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10000,
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'var(--gdyup-primary)',
                    color: 'var(--gdyup-button-text)',
                    border: '3px solid var(--gdyup-bg-dark)',
                    boxShadow: 'var(--gdyup-glow-primary), var(--gdyup-shadow-lg)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <Sparkles size={24} className="text-gdyup-button-text" />
                </button>
                
                {/* Continue with regular nav item */}
                <Link
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    "nav-item flex flex-col items-center gap-1",
                    isActive && "active"
                  )}
                >
                  <Icon 
                    size={20} 
                    className={cn(
                      "nav-icon transition-colors",
                      isActive ? "text-gdyup-nav-active-text" : "text-gdyup-nav-text"
                    )} 
                  />
                  <span className={cn(
                    "text-xs font-medium transition-colors",
                    isActive 
                      ? "text-gdyup-nav-active-text" 
                      : getThemedTextClasses('muted')
                  )}>
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
                "nav-item flex flex-col items-center gap-1",
                isActive && "active"
              )}
            >
              <Icon 
                size={20} 
                className={cn(
                  "nav-icon transition-colors",
                  isActive ? "text-gdyup-nav-active-text" : "text-gdyup-nav-text"
                )} 
              />
              <span className={cn(
                "text-xs font-medium transition-colors",
                isActive 
                  ? "text-gdyup-nav-active-text" 
                  : getThemedTextClasses('muted')
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      
      {/* Safe Area Bottom Padding */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
} 