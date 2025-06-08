'use client';

import React from 'react';
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

// Elite haptic feedback function
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    const { Haptics } = (window as any).Capacitor.Plugins || {};
    if (Haptics) {
      switch (type) {
        case 'light':
          Haptics.selectionStart?.();
          break;
        case 'medium':
          Haptics.impact?.({ style: 'MEDIUM' });
          break;
        case 'heavy':
          Haptics.impact?.({ style: 'HEAVY' });
          break;
      }
    }
  }
};

export default function MobileNavBar({ className }: MobileNavBarProps) {
  const pathname = usePathname();
  const { getThemedTextClasses } = useGdyupTheme();

  // Function to open concierge with haptic feedback
  const handleConciergeClick = () => {
    triggerHaptic('medium'); // Medium impact for concierge button
    const event = new CustomEvent('gdyup-open-concierge', {
      detail: { context: 'general' }
    });
    document.dispatchEvent(event);
  };

  // Handle nav item clicks with haptic feedback
  const handleNavClick = () => {
    triggerHaptic('light'); // Light haptic for nav changes
  };

  return (
    <nav className={cn(
      "mobile-nav-bar",
      "fixed bottom-0 left-0 right-0 z-50",
      "bg-gdyup-nav-bg border-t border-gdyup-nav-border",
      "backdrop-blur-xl",
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