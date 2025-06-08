'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import { AuthProvider } from '@/lib/auth-provider';
import { NostrProvider } from '../contexts/NostrContext';
import { ConciergeProvider } from '@/app/components/concierge-provider';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';
import MobileNavBar from './MobileNavBar';

// Capacitor detection utility
function isCapacitorApp(): boolean {
  return typeof window !== 'undefined' && !!(window as any).Capacitor;
}

// Custom App Initialization Splash Screen Component
function AppSplashScreen({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Show splash for 4 seconds to let GIF play fully
    const timer = setTimeout(() => {
      console.log('[Splash] Hiding splash screen after timeout');
      setIsVisible(false);
      
      // Hide Capacitor splash screen if running in native app
      if (typeof window !== 'undefined' && (window as any).Capacitor) {
        const { SplashScreen } = (window as any).Capacitor?.Plugins || {};
        if (SplashScreen) {
          console.log('[Splash] Hiding Capacitor splash screen');
          SplashScreen.hide();
        }
      }
      
      // Notify parent that splash is complete
      onComplete();
    }, 4000); // Increased to 4 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      {/* GDY·UP Splash GIF */}
      <div className="relative w-full h-full flex items-center justify-center">
        <img 
          src="/videos/gdyup-intro.gif" 
          alt="GDY·UP Loading..."
          className="w-full h-full object-cover"
          style={{ 
            imageRendering: 'crisp-edges',
            maxWidth: '100vw',
            maxHeight: '100vh'
          }}
          onLoad={() => {
            console.log('[Splash] GIF loaded successfully');
          }}
          onError={(e) => {
            console.log('[Splash] GIF failed to load, using fallback');
            // Fallback to a simple logo if GIF fails
            e.currentTarget.src = '/icons/icon-512x512.png';
            e.currentTarget.className = 'w-32 h-32 object-contain';
            e.currentTarget.style.maxWidth = '128px';
            e.currentTarget.style.maxHeight = '128px';
          }}
        />
        
        {/* Optional loading indicator overlay */}
        <div className="absolute bottom-20 left-0 right-0 flex justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gdyup-primary rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-gdyup-primary rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-gdyup-primary rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GdyupClientLayout({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false);
  const [isAppReady, setIsAppReady] = useState(true); // Default to ready for web
  const pathname = usePathname();
  const { getThemedBackgroundClasses } = useGdyupTheme();

  // Handle app initialization - only show splash on very first app launch
  useEffect(() => {
    if (isCapacitorApp()) {
      // Check if this is the initial app launch (not navigation)
      const hasShownSplash = sessionStorage.getItem('gdyup_splash_shown');
      const isInitialLoad = !hasShownSplash && pathname === '/gdyup';
      
      if (isInitialLoad) {
        console.log('[GdyupClientLayout] Initial app launch detected, showing splash screen');
        setShowSplash(true);
        setIsAppReady(false);
        sessionStorage.setItem('gdyup_splash_shown', 'true');
      } else {
        console.log('[GdyupClientLayout] Navigation or subsequent load, skipping splash');
        setShowSplash(false);
        setIsAppReady(true);
      }
    } else {
      // Skip splash for web
      console.log('[GdyupClientLayout] Web detected, skipping splash screen');
      setShowSplash(false);
      setIsAppReady(true);
    }
  }, []); // Only run once on mount, not on pathname changes

  const handleSplashComplete = () => {
    setShowSplash(false);
    setIsAppReady(true);
  };

  // Show splash screen during app initialization
  if (showSplash && !isAppReady) {
    return <AppSplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <AuthProvider>
      <NostrProvider>
        <ConciergeProvider>
          <div className={cn(
            "min-h-screen w-full transition-colors duration-300",
            getThemedBackgroundClasses()
          )}>
            <main className="pb-20 min-h-screen">
              {children}
            </main>
            
            {/* Mobile Navigation */}
            <MobileNavBar />
          </div>
        </ConciergeProvider>
      </NostrProvider>
    </AuthProvider>
  );
} 