'use client';

import { ReactNode, useEffect, useState } from 'react';
import GdyupHeader from './components/GdyupHeader';
import { useAuth } from '@/lib/auth-provider';
import { OnboardingMiddleware } from './components/onboarding/onboarding-middleware';
import CustomHead from './head';
import './pwa-fixes.css';

export function ClientLayoutWrapper({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [theme, setTheme] = useState<string>('default');
  
  // Console log the auth state for debugging
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_AUTH_DEV_MODE === 'true') {
      console.log('DEV MODE: GDY UP Layout Auth State:', { 
        isAuthenticated: !!user, 
        authLoading 
      });
    }
  }, [user, authLoading]);

  // Initialize default theme on first load and watch for changes
  useEffect(() => {
    // Function to apply theme
    const applyTheme = (themeName: string) => {
      // Remove all existing theme classes
      document.documentElement.classList.remove(
        'gdyup-theme-default',
        'gdyup-theme-blue',
        'gdyup-theme-pink'
      );
      
      // Add the selected theme class
      document.documentElement.classList.add(`gdyup-theme-${themeName}`);
      setTheme(themeName);
      
      console.log(`Theme applied by client wrapper: ${themeName}`);
    };
    
    try {
      // Get stored theme or default to the lime green theme
      const storedTheme = localStorage.getItem('gdyup-theme') || 'default';
      
      // Apply initial theme
      applyTheme(storedTheme);
      
      // Listen for theme changes from other components
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'gdyup-theme') {
          const newTheme = e.newValue || 'default';
          applyTheme(newTheme);
        }
      };
      
      // Also listen for direct changes to localStorage from same window
      window.addEventListener('storage', handleStorageChange);
      
      // Create a MutationObserver to watch for theme class changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.type === 'attributes' && 
            mutation.attributeName === 'class'
          ) {
            const htmlElement = document.documentElement;
            const classList = Array.from(htmlElement.classList);
            
            // Check if theme class is missing
            const hasThemeClass = classList.some(cls => cls.startsWith('gdyup-theme-'));
            
            if (!hasThemeClass) {
              // Re-apply theme if class was removed
              applyTheme(storedTheme);
              console.log('Theme class was lost, reapplied');
            }
          }
        });
      });
      
      // Start observing document element
      observer.observe(document.documentElement, { 
        attributes: true,
        attributeFilter: ['class']
      });
      
      // Clean up
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        observer.disconnect();
      };
    } catch (error) {
      console.error('Theme initialization error:', error);
      // Fallback to default theme on error
      document.documentElement.classList.add('gdyup-theme-default');
    }
  }, []);

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