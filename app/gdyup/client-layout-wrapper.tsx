'use client';

import { ReactNode, useEffect, useState, useRef } from 'react';
import GdyupHeader from './components/GdyupHeader';
import { useAuth } from '@/lib/auth-provider';
import { OnboardingMiddleware } from './components/onboarding/onboarding-middleware';
import CustomHead from './head';
import './pwa-fixes.css';

export function ClientLayoutWrapper({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [theme, setTheme] = useState<string>('default');
  const initialized = useRef(false);
  const currentThemeRef = useRef<string>('default');
  
  // Console log the auth state for debugging
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_AUTH_DEV_MODE === 'true') {
      console.log('DEV MODE: GDY UP Layout Auth State:', { 
        isAuthenticated: !!user, 
        authLoading 
      });
    }
  }, [user, authLoading]);

  // Get current theme from localStorage once
  useEffect(() => {
    // Only run once on mount
    if (initialized.current) return;
    initialized.current = true;
    
    // Get the initial theme from class already applied by ThemeManager
    // or fall back to localStorage
    const themeClass = Array.from(document.documentElement.classList)
      .find(cls => cls.startsWith('gdyup-theme-'));
    
    let initialTheme = 'default';
    if (themeClass) {
      initialTheme = themeClass.replace('gdyup-theme-', '');
    } else {
      try {
        const storedTheme = localStorage.getItem('gdyup-theme');
        if (storedTheme) initialTheme = storedTheme;
      } catch (error) {
        console.error('Theme state error:', error);
      }
    }
    
    currentThemeRef.current = initialTheme;
    setTheme(initialTheme);
    
    // Listen for storage events from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'gdyup-theme') {
        const newTheme = e.newValue || 'default';
        // Only update if the theme is different from our current ref
        if (newTheme !== currentThemeRef.current) {
          currentThemeRef.current = newTheme;
          setTheme(newTheme);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Empty dependency array - only run once

  // Add mobile detection - no theme management here
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
      <main className={`min-h-screen bg-background dark gdyup-app gdyup-theme-${theme}`}>
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