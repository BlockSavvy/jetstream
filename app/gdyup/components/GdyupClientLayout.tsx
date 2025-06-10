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
  const [splashStep, setSplashStep] = useState<'loading' | 'gif' | 'complete'>('loading');

  useEffect(() => {
    console.log('[Splash] 🎬 AppSplashScreen mounted');
    
    // Hide native splash immediately
    const hideNativeSplash = () => {
      if (typeof window !== 'undefined' && (window as any).Capacitor) {
        const { SplashScreen } = (window as any).Capacitor?.Plugins || {};
        if (SplashScreen) {
          SplashScreen.hide().catch(() => {
            console.log('[Splash] Native splash already hidden');
          });
        }
      }
    };

    hideNativeSplash();

    // Show GIF after brief delay
    const showGifTimer = setTimeout(() => {
      console.log('[Splash] 🎥 Showing GIF');
      setSplashStep('gif');
    }, 500);

    // Complete splash
    const completeTimer = setTimeout(() => {
      console.log('[Splash] ✨ Completing splash');
      setSplashStep('complete');
      onComplete();
    }, 3500);

    return () => {
      clearTimeout(showGifTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (splashStep === 'complete') {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {splashStep === 'loading' && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <div 
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#DAFF0D',
              borderRadius: '50%',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}
          />
          <div 
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#DAFF0D',
              borderRadius: '50%',
              animation: 'pulse 1.5s ease-in-out 0.1s infinite'
            }}
          />
          <div 
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#DAFF0D',
              borderRadius: '50%',
              animation: 'pulse 1.5s ease-in-out 0.2s infinite'
            }}
          />
        </div>
      )}
      
      {splashStep === 'gif' && (
        <img 
          src="/videos/gdyup-intro.gif"
          alt="GDY·UP Loading"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#000000'
          }}
          onLoad={() => console.log('[Splash] 🎯 GIF loaded')}
          onError={(e) => {
            console.log('[Splash] ❌ GIF failed, showing logo');
            const img = e.currentTarget;
            img.src = '/icons/gdyup-icon-512.png';
            img.style.width = '200px';
            img.style.height = '200px';
            img.style.objectFit = 'contain';
          }}
        />
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
  const [isClient, setIsClient] = useState(false);
  const { getThemedBackgroundClasses } = useGdyupTheme();

  // Client-side hydration fix
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle app initialization - only show splash on very first app launch
  useEffect(() => {
    if (!isClient) return; // Wait for client-side hydration
    
    console.log('[GdyupClientLayout] 🚀 Initializing app, checking environment...');
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
      
      // ALWAYS show splash on first load in Capacitor (not just first app launch)
      console.log('[GdyupClientLayout] 🎬 CAPACITOR - showing splash screen');
      setShowSplash(true);
      setIsAppReady(false);
    } else {
      // For web, always skip splash and show app immediately
      console.log('[GdyupClientLayout] 🌐 WEB - skipping splash screen');
      setShowSplash(false);
      setIsAppReady(true);
    }
    
    return () => {
      isMounted = false;
      window.removeEventListener('resize', checkMobile);
    };
  }, [isClient]); // Depend on isClient to prevent hydration issues

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
  };

  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-gdyup-primary rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-gdyup-primary rounded-full animate-pulse delay-75"></div>
          <div className="w-3 h-3 bg-gdyup-primary rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    );
  }

  // Show splash screen during app initialization in Capacitor
  if (showSplash && !isAppReady && isCapacitorApp()) {
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