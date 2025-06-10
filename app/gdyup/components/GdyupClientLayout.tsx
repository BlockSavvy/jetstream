'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  const [mounted, setMounted] = useState(false);
  const [appState, setAppState] = useState<'loading' | 'splash' | 'ready'>('loading');
  const [isMobile, setIsMobile] = useState(false);
  const { getThemedBackgroundClasses } = useGdyupTheme();

  // Prevent hydration mismatch by only rendering after client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize app state only after mount
  useEffect(() => {
    if (!mounted) return;
    
    console.log('[GdyupClientLayout] 🚀 Client mounted, initializing...');
    
    // Detect mobile
    const mobile = isMobileDevice();
    setIsMobile(mobile);
    console.log('[GdyupClientLayout] Mobile detected:', mobile);
    
    // Setup Capacitor
    if (isCapacitorApp()) {
      document.documentElement.classList.add('capacitor');
      console.log('[GdyupClientLayout] 🎬 CAPACITOR - will show splash');
      setAppState('splash');
    } else {
      console.log('[GdyupClientLayout] 🌐 WEB - ready immediately');
      setAppState('ready');
    }
  }, [mounted]);

  // Handle splash completion
  const handleSplashComplete = useCallback(() => {
    console.log('[GdyupClientLayout] 🎉 Splash complete');
    setAppState('ready');
  }, []);

  // Setup mobile optimizations only after ready
  useEffect(() => {
    if (appState !== 'ready' || !mounted) return;
    
    console.log('[GdyupClientLayout] ⚙️ Setting up mobile optimizations');
    
    document.body.classList.add('mobile-nav-active');
    
    if (isCapacitorApp()) {
      const updateViewportHeight = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        document.documentElement.style.setProperty('--mobile-nav-top', `${window.innerHeight - 80}px`);
      };
      
      updateViewportHeight();
      window.addEventListener('resize', updateViewportHeight);
      window.addEventListener('orientationchange', updateViewportHeight);
      
      document.body.style.overscrollBehavior = 'none';
      (document.body.style as any).webkitOverflowScrolling = 'touch';
      
      return () => {
        window.removeEventListener('resize', updateViewportHeight);
        window.removeEventListener('orientationchange', updateViewportHeight);
      };
    }
    
    return () => {
      document.body.classList.remove('mobile-nav-active');
      document.documentElement.classList.remove('capacitor');
    };
  }, [appState, mounted]);

  // Show loading until mounted (prevents hydration mismatch)
  if (!mounted) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#DAFF0D',
            borderRadius: '50%',
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#DAFF0D',
            borderRadius: '50%',
            animation: 'pulse 1.5s ease-in-out 0.1s infinite'
          }} />
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#DAFF0D',
            borderRadius: '50%',
            animation: 'pulse 1.5s ease-in-out 0.2s infinite'
          }} />
        </div>
      </div>
    );
  }

  // Show splash screen in Capacitor
  if (appState === 'splash') {
    console.log('[GdyupClientLayout] 📱 Rendering splash screen');
    return <AppSplashScreen onComplete={handleSplashComplete} />;
  }

  // Show main app
  console.log('[GdyupClientLayout] 🚀 Rendering main app');
  
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