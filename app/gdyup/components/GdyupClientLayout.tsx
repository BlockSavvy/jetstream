'use client';

import React, { ReactNode, useEffect } from 'react';
import { GdyupThemeProvider } from '../hooks/useGdyupTheme';
import { NostrProvider } from '../contexts/NostrContext';
import dynamic from 'next/dynamic';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// Import CSS files that should be applied to the entire layout
import '../gdyup.css';
import '../index.css';
import '../components/gdyup-forms.css';
import '../pwa-fixes.css';
import '../components/themed-icons.css';

// Import with no SSR to avoid hydration issues
const MobileNavBar = dynamic(() => import('./MobileNavBar'), { ssr: false });

// Determine if this is a Capacitor app
const isCapacitorApp = () => {
  if (typeof window !== 'undefined') {
    return typeof (window as any).Capacitor !== 'undefined';
  }
  return false;
};

/**
 * Client-side layout component for GDY·UP
 * Contains all client-side functionality like media queries, theme providers, etc.
 */
export default function GdyupClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Apply Capacitor-specific styles for iOS/Android
  useEffect(() => {
    if (isCapacitorApp()) {
      // Prevent overscroll/bounce effects
      document.documentElement.style.overscrollBehavior = 'none';
      document.body.style.overscrollBehavior = 'none';
      
      // Add safe area insets
      document.documentElement.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top, 0px)');
      document.documentElement.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom, 0px)');
      
      // Prevent unnecessary tap highlights and callouts
      document.documentElement.style.setProperty('-webkit-tap-highlight-color', 'transparent');
      (document.body.style as any).webkitTouchCallout = 'none';
    }
    
    return () => {
      // Reset styles when component unmounts
      document.documentElement.style.overscrollBehavior = '';
      document.body.style.overscrollBehavior = '';
    };
  }, []);
  
  return (
    <GdyupThemeProvider>
      <NostrProvider>
        <div className="min-h-screen flex flex-col bg-gdyup-bg-dark">
          <main className="flex-1 pb-16">
            {children}
          </main>
          
          {/* Only show mobile nav on mobile devices */}
          {isMobile && <MobileNavBar />}
          
          {/* We don't need to include the concierge button here 
              as it's already provided by the ConciergeProvider in app/layout.tsx */}
        </div>
      </NostrProvider>
    </GdyupThemeProvider>
  );
} 