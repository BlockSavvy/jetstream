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
    // Show splash for 3 seconds to let GIF play
    const timer = setTimeout(() => {
      setIsVisible(false);
      
      // Hide Capacitor splash screen if running in native app
      if (typeof window !== 'undefined' && (window as any).Capacitor) {
        const { SplashScreen } = (window as any).Capacitor?.Plugins || {};
        if (SplashScreen) {
          SplashScreen.hide();
        }
      }
      
      // Notify parent that splash is complete
      onComplete();
    }, 3000);

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
          onError={(e) => {
            // Fallback to a simple logo if GIF fails
            e.currentTarget.src = '/icons/icon-512x512.png';
            e.currentTarget.className = 'w-32 h-32 object-contain';
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
  const pathname = usePathname();
  const { getThemedBackgroundClasses } = useGdyupTheme();
  const [showSplash, setShowSplash] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);

  // Handle app initialization
  useEffect(() => {
    // Only show splash screen on initial app load (not on navigation)
    const hasShownSplash = sessionStorage.getItem('gdyup_splash_shown');
    
    if (!hasShownSplash && isCapacitorApp()) {
      // First time loading the app in native mode
      setShowSplash(true);
      sessionStorage.setItem('gdyup_splash_shown', 'true');
    } else {
      // Skip splash for web or subsequent navigations
      setShowSplash(false);
      setIsAppReady(true);
    }
  }, []);

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