'use client';

import React, { useEffect, useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import MobileNavBar from './MobileNavBar';
import ThemeManager from './ThemeManager';

interface GdyupClientLayoutProps {
  children: React.ReactNode;
}

export default function GdyupClientLayout({ children }: GdyupClientLayoutProps) {
  const [isCapacitor, setIsCapacitor] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { theme } = useGdyupTheme();

  useEffect(() => {
    setMounted(true);
    
    // Detect Capacitor environment
    const capacitorDetected = !!(window as any).Capacitor;
    setIsCapacitor(capacitorDetected);
    
    // Apply Capacitor class to HTML element
    if (capacitorDetected) {
      document.documentElement.classList.add('capacitor');
      
      // Initialize Capacitor plugins
      initializeCapacitorPlugins();
    }
    
    // Apply theme class to document
    document.documentElement.setAttribute('data-gdyup-theme', theme);
    
  }, [theme]);

  const initializeCapacitorPlugins = async () => {
    try {
      const { Capacitor } = (window as any);
      
      if (Capacitor?.isNativePlatform()) {
        // Initialize Status Bar
        const { StatusBar } = Capacitor.Plugins;
        if (StatusBar) {
          await StatusBar.setStyle({ style: 'DARK' });
          await StatusBar.setBackgroundColor({ color: '#000000' });
          await StatusBar.show();
        }
        
        // Initialize Keyboard
        const { Keyboard } = Capacitor.Plugins;
        if (Keyboard) {
          await Keyboard.setResizeMode({ mode: 'ionic' });
        }
        
        // Initialize Haptics
        const { Haptics } = Capacitor.Plugins;
        if (Haptics) {
          // Haptics available for button interactions
          console.log('Haptics initialized');
        }
        
        console.log('Capacitor plugins initialized');
      }
    } catch (error) {
      console.error('Error initializing Capacitor plugins:', error);
    }
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gdyup-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gdyup-text">Loading GDY·UP...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeManager>
      <div className="min-h-screen bg-gdyup-bg-dark text-gdyup-text">
        {/* Status Bar Overlay for iOS */}
        {isCapacitor && (
          <div className="status-bar-overlay bg-gdyup-bg-dark" />
        )}
        
        {/* Main Content */}
        <main className="relative">
          {children}
        </main>
        
        {/* Mobile Navigation - Only show on mobile */}
        {isMobile && (
          <MobileNavBar />
        )}
        
        {/* Desktop Navigation Placeholder */}
        {!isMobile && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-gdyup-bg-card border border-gdyup-border rounded-lg p-4">
              <p className="text-gdyup-text-subtle text-sm">
                Desktop navigation coming soon
              </p>
            </div>
          </div>
        )}
      </div>
    </ThemeManager>
  );
} 