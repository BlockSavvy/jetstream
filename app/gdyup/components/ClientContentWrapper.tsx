'use client';

import React, { useEffect, useState } from 'react';
import { GdyupThemeProvider } from '../hooks/useGdyupTheme';
import { NostrProvider } from '../contexts/NostrContext';
import GdyupHeader from './GdyupHeader';
import { ConciergeProvider } from '@/app/components/concierge-provider';
import ThemeManager from './ThemeManager';

/**
 * Client content wrapper component that provides all necessary providers
 * Use this inside page components to ensure proper client-side functionality
 * without causing hydration issues in the main layout
 */
export function ClientContentWrapper({ 
  children,
  showHeader = true,
}: { 
  children: React.ReactNode;
  showHeader?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  
  // Initialize theme from localStorage safely after component mounts
  useEffect(() => {
    try {
      // Apply theme via data attribute as early as possible
      if (typeof window !== 'undefined') {
        // Set default theme
        document.documentElement.setAttribute('data-gdyup-theme', 'default');
        
        // Then try to load from localStorage if available
        const savedTheme = localStorage.getItem('gdyup-theme');
        if (savedTheme && ['default', 'luxury', 'bitcoin'].includes(savedTheme)) {
          document.documentElement.setAttribute('data-gdyup-theme', savedTheme);
        }
      }
      
      // Mark component as mounted
      setMounted(true);
      console.log('[ClientContentWrapper] Mounted successfully');
    } catch (e) {
      console.error('[ClientContentWrapper] Theme initialization error:', e);
    }
  }, []);
  
  // During SSR or before mounting, render a minimal placeholder
  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
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
            {showHeader && <GdyupHeader />}
            <ThemeManager>
              <main className="flex-1">
                {children}
              </main>
            </ThemeManager>
          </div>
        </ConciergeProvider>
      </NostrProvider>
    </GdyupThemeProvider>
  );
} 