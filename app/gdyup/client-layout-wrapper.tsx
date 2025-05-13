'use client';

import React, { useEffect, useState } from 'react';
import { GdyupThemeProvider } from './hooks/useGdyupTheme';
import ThemeManager from './components/ThemeManager';
import { NostrProvider } from './contexts/NostrContext';
import GdyupHeader from './components/GdyupHeader';
import { ConciergeProvider } from '@/app/components/concierge-provider';
import { ConciergeButton } from '@/components/concierge-button';

// Import all CSS files to ensure proper styling is available
import './gdyup.css';
import './index.css';
import './components/gdyup-forms.css';
import './pwa-fixes.css';
import './components/themed-icons.css';

/**
 * Enhanced ClientLayoutWrapper that handles all client-side functionality
 * This isolates client components from the server component layout
 * to prevent hydration issues and chunk loading errors
 */
export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  // Initialize theme from localStorage safely after component mounts
  useEffect(() => {
    // Apply theme as early as possible
    if (typeof window !== 'undefined') {
      try {
        // Set default theme via data attribute
        document.documentElement.setAttribute('data-gdyup-theme', 'default');
        
        // Then try to load from localStorage if available
        const savedTheme = localStorage.getItem('gdyup-theme');
        if (savedTheme && ['default', 'luxury', 'bitcoin'].includes(savedTheme)) {
          document.documentElement.setAttribute('data-gdyup-theme', savedTheme);
        }
      } catch (e) {
        console.error('Theme storage access error:', e);
      }
    }
    
    // Mark component as mounted
    setMounted(true);
    console.log('[ClientLayoutWrapper] Mounted successfully');
  }, []);
  
  // During SSR or before mounting, render a minimal placeholder
  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center" suppressHydrationWarning>
        <div className="w-10 h-10 rounded-full border-2 border-gray-300 border-t-black animate-spin"></div>
      </div>
    );
  }
  
  // After mounting, render the full layout with all providers
  return (
    <GdyupThemeProvider>
      <NostrProvider>
        <ConciergeProvider>
          <div className="min-h-screen flex flex-col bg-gdyup-bg-dark">
            <GdyupHeader />
            <ThemeManager>
              <main className="flex-1 pb-24">
                {children}
              </main>
              <div className="flex justify-center items-center">
                <ConciergeButton 
                  position="bottom-nav"
                  imageUrl="/icons/conciergebutton.png" 
                />
              </div>
            </ThemeManager>
          </div>
        </ConciergeProvider>
      </NostrProvider>
    </GdyupThemeProvider>
  );
} 