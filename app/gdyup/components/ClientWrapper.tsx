'use client';

import React, { useEffect, useState } from 'react';
import { GdyupThemeProvider } from '../hooks/useGdyupTheme';
import ThemeManager from './ThemeManager';
import { ThemeDebugDisabler } from '../utils/theme-debug';
import { NostrProvider } from '../contexts/NostrContext';
import { ConciergeProvider } from '@/app/components/concierge-provider';
import GdyupHeader from './GdyupHeader';
import dynamic from 'next/dynamic';

// Dynamically import the concierge button to avoid SSR issues
const DynamicConciergeButton = dynamic(
  () => import('@/components/concierge-button').then(mod => ({ default: mod.ConciergeButton })),
  { ssr: false, loading: () => null }
);

/**
 * Client wrapper component that provides all the necessary providers
 * Use this inside pages to ensure proper hydration
 */
export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize after mount to prevent hydration issues
  useEffect(() => {
    try {
      setMounted(true);
      console.log('[ClientWrapper] Mounted and initialized');
    } catch (err) {
      console.error('[ClientWrapper] Error during initialization:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  // Simple loading state
  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-gray-300 border-t-black animate-spin" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-xl font-bold mb-4">Component Error</h1>
        <div className="p-4 bg-red-900/30 border border-red-800 rounded">
          {error.message}
        </div>
      </div>
    );
  }

  // Render the full app with all providers
  return (
    <GdyupThemeProvider>
      <div className="min-h-screen flex flex-col">
        <ThemeDebugDisabler />
        <NostrProvider>
          <ConciergeProvider>
            <GdyupHeader />
            <ThemeManager>
              <main className="flex-1 bg-gdyup-bg-dark">
                {children}
              </main>
              {/* Render concierge button in the bottom-right corner */}
              <DynamicConciergeButton 
                position="bottom-right"
                imageUrl="/icons/conciergebutton.png" 
              />
            </ThemeManager>
          </ConciergeProvider>
        </NostrProvider>
      </div>
    </GdyupThemeProvider>
  );
} 