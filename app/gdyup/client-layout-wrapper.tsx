'use client';

import { ReactNode, useEffect, useState } from 'react';
import GdyupHeader from './components/GdyupHeader';
import { useAuth } from '@/lib/auth-provider';
import { OnboardingMiddleware } from './components/onboarding/onboarding-middleware';
import CustomHead from './head';

export function ClientLayoutWrapper({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  
  // Console log the auth state for debugging
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_AUTH_DEV_MODE === 'true') {
      console.log('DEV MODE: GDY UP Layout Auth State:', { 
        isAuthenticated: !!user, 
        authLoading 
      });
    }
  }, [user, authLoading]);

  // Add mobile detection
  useEffect(() => {
    // Detect if the user is on a mobile device
    const checkMobile = () => {
      const isMobileDevice = typeof window !== 'undefined' && 
        (window.innerWidth <= 768 || 
         /Android/i.test(navigator.userAgent) ||
         /iPhone|iPad|iPod/i.test(navigator.userAgent));
      
      setIsMobile(!!isMobileDevice);
      
      // Store preference
      try {
        localStorage.setItem('jetstream_is_mobile', isMobileDevice ? 'true' : 'false');
      } catch (e) {
        console.warn('Could not store mobile preference:', e);
      }
    };
    
    // Run on mount
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <main className="min-h-screen bg-background dark gdyup-app">
        <div className="flex items-center justify-center h-screen">
          <p>Loading GDY UP...</p>
        </div>
      </main>
    );
  }
  
  return (
    <>
      <CustomHead />
      <main className={`min-h-screen bg-background dark gdyup-app ${isMobile ? 'gdyup-mobile' : ''}`} 
            style={{ "--primary-color": "#DAFF0D", "--secondary-color": "#FF4B47" } as React.CSSProperties}>
        <OnboardingMiddleware>
          <GdyupHeader />
          <div className={`gdyup-content-container ${isMobile ? 'px-2 py-2' : 'px-4 py-4'}`}>
            {children}
          </div>
        </OnboardingMiddleware>
      </main>
    </>
  );
} 