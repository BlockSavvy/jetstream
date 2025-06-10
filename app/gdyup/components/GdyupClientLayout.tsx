'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import { AuthProvider } from '@/lib/auth-provider';
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
  const [splashStep, setSplashStep] = useState<'loading' | 'gif' | 'complete'>('loading');

  useEffect(() => {
    console.log('[Splash] AppSplashScreen mounted');
    
    // Immediately hide native Capacitor splash screen
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const { SplashScreen } = (window as any).Capacitor?.Plugins || {};
      if (SplashScreen) {
        console.log('[Splash] Hiding native Capacitor splash screen immediately');
        SplashScreen.hide();
      }
    }

    // Show GIF immediately after a short delay
    const showGifTimer = setTimeout(() => {
      console.log('[Splash] Showing GIF');
      setSplashStep('gif');
    }, 300);

    // Complete splash after 3 seconds total
    const completeTimer = setTimeout(() => {
      console.log('[Splash] Completing splash screen');
      setSplashStep('complete');
      setIsVisible(false);
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(showGifTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!isVisible) {
    console.log('[Splash] Splash screen hidden, returning null');
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      {splashStep === 'loading' && (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-gdyup-primary rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-gdyup-primary rounded-full animate-pulse delay-75"></div>
            <div className="w-3 h-3 bg-gdyup-primary rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
      )}
      
      {splashStep === 'gif' && (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <img 
            src="/videos/gdyup-intro.gif"
            alt="GDY·UP Loading..."
            className="w-full h-full object-cover"
            style={{ 
              maxWidth: '100vw',
              maxHeight: '100vh',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              imageRendering: 'auto'
            }}
            onLoad={() => console.log('[Splash] GIF loaded successfully')}
            onError={(e) => {
              console.log('[Splash] GIF failed to load, showing fallback');
              // Fallback to simple logo if GIF fails
              e.currentTarget.src = '/icons/gdyup-icon-512.png';
              e.currentTarget.style.width = '128px';
              e.currentTarget.style.height = '128px';
              e.currentTarget.style.position = 'relative';
              e.currentTarget.style.objectFit = 'contain';
            }}
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

  // Force show app content if stuck loading for too long
  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      if (!isAppReady) {
        console.log('[GdyupClientLayout] 🚨 EMERGENCY TIMEOUT - forcing app to show');
        console.log('[GdyupClientLayout] Current state - showSplash:', showSplash, 'isAppReady:', isAppReady);
        setShowSplash(false);
        setIsAppReady(true);
      }
    }, 5000); // 5 second emergency timeout

    return () => clearTimeout(emergencyTimeout);
  }, [isAppReady, showSplash]);

  const handleSplashComplete = () => {
    console.log('[GdyupClientLayout] 🎉 Splash complete, showing main app');
    console.log('[GdyupClientLayout] Previous state - showSplash:', showSplash, 'isAppReady:', isAppReady);
    setShowSplash(false);
    setIsAppReady(true);
    console.log('[GdyupClientLayout] New state - showSplash: false, isAppReady: true');
    
    // Hide native Capacitor splash screen if still showing
    if (isCapacitorApp()) {
      const { SplashScreen } = (window as any).Capacitor?.Plugins || {};
      if (SplashScreen) {
        console.log('[GdyupClientLayout] Hiding native Capacitor splash screen');
        SplashScreen.hide();
      }
    }
  };

  // Show splash screen during app initialization
  if (showSplash && !isAppReady) {
    console.log('[GdyupClientLayout] Rendering splash screen');
    return <AppSplashScreen onComplete={handleSplashComplete} />;
  }

  console.log('[GdyupClientLayout] Rendering main app content');

  useEffect(() => {
    console.log('[GdyupClientLayout] Setting up mobile navigation and iOS optimizations');
    
    // Add mobile navigation body class
    document.body.classList.add('mobile-nav-active');
    
    // iOS Capacitor detection and optimization
    if (typeof window !== 'undefined') {
      const isCapacitor = !!(window as any).Capacitor;
      console.log('[GdyupClientLayout] Capacitor detected:', isCapacitor);
      
      if (isCapacitor) {
        // Add Capacitor class for iOS-specific styles
        document.documentElement.classList.add('capacitor');
        
        // Set up viewport height variables for iOS
        const updateViewportHeight = () => {
          const vh = window.innerHeight * 0.01;
          document.documentElement.style.setProperty('--vh', `${vh}px`);
          document.documentElement.style.setProperty('--mobile-nav-top', `${window.innerHeight - 80}px`);
          console.log('[GdyupClientLayout] Viewport height updated for iOS:', window.innerHeight);
        };
        
        updateViewportHeight();
        window.addEventListener('resize', updateViewportHeight);
        window.addEventListener('orientationchange', updateViewportHeight);
        
        // iOS WebView optimizations
        document.body.style.overscrollBehavior = 'none';
        (document.body.style as any).webkitOverflowScrolling = 'touch';
        
        return () => {
          window.removeEventListener('resize', updateViewportHeight);
          window.removeEventListener('orientationchange', updateViewportHeight);
        };
      }
    }
    
    return () => {
      document.body.classList.remove('mobile-nav-active');
      document.documentElement.classList.remove('capacitor');
    };
  }, []);

  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}

export default GdyupClientLayout; 