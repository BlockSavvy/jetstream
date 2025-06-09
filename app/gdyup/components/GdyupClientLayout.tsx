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

// Mobile detection utility  
function isMobileDevice(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= 768;
}

// Custom App Initialization Splash Screen Component
function AppSplashScreen({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);
  const [gifLoaded, setGifLoaded] = useState(false);
  const [showGif, setShowGif] = useState(false);

  useEffect(() => {
    // Preload the GIF aggressively to avoid static frame
    const preloadGif = () => {
      const img = new Image();
      img.onload = () => {
        console.log('[Splash] GIF preloaded successfully');
        setGifLoaded(true);
        // Small delay to ensure animation starts
        setTimeout(() => {
          setShowGif(true);
        }, 100);
      };
      img.onerror = () => {
        console.log('[Splash] GIF preload failed');
        setGifLoaded(true);
        setShowGif(true);
      };
      // Force cache busting to ensure fresh GIF load
      img.src = `/videos/gdyup-intro.gif?v=${Date.now()}`;
    };

    preloadGif();

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
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      {/* Pure black background while GIF loads */}
      {!showGif && (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gdyup-primary rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-gdyup-primary rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-gdyup-primary rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
      )}
      
      {/* GDY·UP Splash GIF - Only show when fully loaded and ready */}
      {showGif && (
        <div className="relative w-full h-full flex items-center justify-center">
          <img 
            src={`/videos/gdyup-intro.gif?v=${Date.now()}`}
            alt="GDY·UP Loading..."
            className="w-full h-full object-cover"
            style={{ 
              imageRendering: 'crisp-edges',
              maxWidth: '100vw',
              maxHeight: '100vh',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
            onLoad={() => {
              console.log('[Splash] GIF rendered successfully');
            }}
            onError={(e) => {
              console.log('[Splash] GIF render failed, using fallback');
              // Fallback to a simple logo if GIF fails
              e.currentTarget.src = '/icons/gdyup-icon-512.png';
              e.currentTarget.className = 'w-32 h-32 object-contain';
              e.currentTarget.style.maxWidth = '128px';
              e.currentTarget.style.maxHeight = '128px';
              e.currentTarget.style.position = 'relative';
            }}
            // Force animation restart
            key={`gif-${Date.now()}`}
          />
        </div>
      )}
    </div>
  );
}

interface GdyupClientLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

const GdyupClientLayout: React.FC<GdyupClientLayoutProps> = ({ 
  children, 
  showNavigation = true 
}) => {
  const pathname = usePathname();
  const [showSplash, setShowSplash] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { getThemedBackgroundClasses } = useGdyupTheme();

  // Handle app initialization - only show splash on very first app launch
  useEffect(() => {
    console.log('[GdyupClientLayout] Initializing app, checking environment...');
    console.log('[GdyupClientLayout] isCapacitorApp:', isCapacitorApp());
    console.log('[GdyupClientLayout] pathname:', pathname);
    
    let isMounted = true;
    
    // Detect mobile device
    const checkMobile = () => {
      if (!isMounted) return;
      const mobile = isMobileDevice();
      setIsMobile(mobile);
      console.log('[GdyupClientLayout] Mobile detected:', mobile);
    };
    
    // Check mobile on mount and on resize
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Add capacitor class for CSS targeting
    if (isCapacitorApp()) {
      document.documentElement.classList.add('capacitor');
      console.log('[GdyupClientLayout] Added capacitor class to HTML element');
      
      // Only show splash on the very first app launch, not on navigation
      const hasShownSplash = sessionStorage.getItem('gdyup_splash_shown');
      const isAppLaunch = !hasShownSplash;
      
      console.log('[GdyupClientLayout] hasShownSplash:', hasShownSplash);
      console.log('[GdyupClientLayout] isAppLaunch:', isAppLaunch);
      
      if (isAppLaunch && isMounted) {
        console.log('[GdyupClientLayout] FIRST APP LAUNCH - showing splash GIF');
        setShowSplash(true);
        setIsAppReady(false);
        sessionStorage.setItem('gdyup_splash_shown', 'true');
      } else {
        console.log('[GdyupClientLayout] Navigation or subsequent load, skipping splash');
        setShowSplash(false);
        setIsAppReady(true);
      }
    } else {
      // For web, always skip splash and show app immediately
      console.log('[GdyupClientLayout] Web detected, skipping splash screen');
      setShowSplash(false);
      setIsAppReady(true);
    }
    
    return () => {
      isMounted = false;
      window.removeEventListener('resize', checkMobile);
    };
  }, []); // Only run once on mount, ignore pathname changes

  const handleSplashComplete = () => {
    console.log('[GdyupClientLayout] Splash complete, showing main app');
    setShowSplash(false);
    setIsAppReady(true);
    
    // Hide native Capacitor splash screen if still showing
    if (isCapacitorApp()) {
      const { SplashScreen } = (window as any).Capacitor?.Plugins || {};
      if (SplashScreen) {
        console.log('[GdyupClientLayout] Hiding native Capacitor splash screen');
        SplashScreen.hide();
      }
    }
  };

  // Force show app content if stuck loading for too long
  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      if (!isAppReady) {
        console.log('[GdyupClientLayout] Emergency timeout - forcing app to show');
        setShowSplash(false);
        setIsAppReady(true);
      }
    }, 10000); // 10 second emergency timeout

    return () => clearTimeout(emergencyTimeout);
  }, [isAppReady]);

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
            {isMobile && <MobileNavBar />}
          </div>
        </ConciergeProvider>
      </NostrProvider>
    </AuthProvider>
  );
}

export default GdyupClientLayout; 