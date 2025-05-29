'use client';

import React, { useState, useEffect } from 'react';
import { NostrProvider } from '../contexts/NostrContext';
import { cn } from '@/lib/utils';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import MobileNavBar from './MobileNavBar';
import { ConciergeProvider } from '@/app/components/concierge-provider';

function isCapacitorApp(): boolean {
  return typeof window !== 'undefined' && !!(window as any).Capacitor;
}

interface GdyupClientLayoutProps {
  children: React.ReactNode;
  showMobileNav?: boolean;
}

function LayoutContent({ children, showMobileNav = true }: GdyupClientLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const { getThemedBackgroundClasses } = useGdyupTheme();

  useEffect(() => {
    setMounted(true);
    
    // Apply mobile app optimizations
    if (typeof window !== 'undefined') {
      // Add capacitor class if running in Capacitor
      if (isCapacitorApp()) {
        document.documentElement.classList.add('capacitor');
        
        // Initialize Capacitor plugins
        const setupCapacitorPlugins = async () => {
          try {
            const { StatusBar } = (window as any).Capacitor?.Plugins || {};
            if (StatusBar) {
              await StatusBar.setStyle({ style: 'DARK' });
              await StatusBar.setBackgroundColor({ color: '#000000' });
            }

            const { Keyboard } = (window as any).Capacitor?.Plugins || {};
            if (Keyboard) {
              await Keyboard.setResizeMode({ mode: 'ionic' });
            }

            const { Haptics } = (window as any).Capacitor?.Plugins || {};
            if (Haptics) {
              // Test haptic feedback
              console.log('Haptics available:', !!Haptics);
            }
          } catch (error) {
            console.warn('Error setting up Capacitor plugins:', error);
          }
        };

        setupCapacitorPlugins();
      }

      // Apply app-specific body classes
      document.body.classList.add('gdyup-app');
      
      // Prevent iOS bounce scrolling
      document.body.style.overscrollBehavior = 'none';
      
      return () => {
        document.body.classList.remove('gdyup-app');
        if (isCapacitorApp()) {
          document.documentElement.classList.remove('capacitor');
        }
      };
    }
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gdyup-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gdyup-bg-dark">
        {/* Main Content */}
        <main className="flex-1 pb-20"> {/* Add bottom padding for mobile nav */}
          {children}
        </main>
        
        {/* Mobile Navigation - Always show on mobile */}
        {showMobileNav && (
          <MobileNavBar />
        )}
      </div>
    </>
  );
}

export default function GdyupClientLayout({ children, showMobileNav = true }: GdyupClientLayoutProps) {
  return (
    <NostrProvider>
      <ConciergeProvider>
        <LayoutContent showMobileNav={showMobileNav}>
          {children}
        </LayoutContent>
      </ConciergeProvider>
    </NostrProvider>
  );
} 