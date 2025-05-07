import { ReactNode } from 'react';
import { ClientLayoutWrapper } from './client-layout-wrapper';
import './gdyup.css';
import './index.css';
import './components/gdyup-forms.css';
import './pwa-fixes.css';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import ThemeManager from './components/ThemeManager';
import { NostrProvider } from './contexts/NostrContext';
import GdyupHeader from './components/GdyupHeader';

// Define PWA metadata for the GDYUP section
export const metadata: Metadata = {
  title: 'GDY UP | Private Jet Sharing Platform',
  description: 'Share private jets and reduce your flying costs',
  manifest: "/manifest.json",
  icons: [
    { rel: "apple-touch-icon", url: "/icons/gdyup-icon-192.png" },
    { rel: "apple-touch-icon", sizes: "152x152", url: "/icons/gdyup-icon-192.png" },
    { rel: "apple-touch-icon", sizes: "180x180", url: "/icons/gdyup-icon-192.png" },
    { rel: "apple-touch-icon", sizes: "167x167", url: "/icons/gdyup-icon-192.png" },
    { rel: "icon", url: "/icons/gdyup-icon-512.png" },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GDY UP",
  }
};

// Simplified viewport settings to ensure proper navigation
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function GdyupLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Minimal theme initialization script - critical for first paint */}
      <Script id="theme-init" strategy="beforeInteractive">
        {`
          (function() {
            // Skip if already initialized to prevent duplicate calls
            if (window.gdyupThemeInitialized) return;
            
            try {
              window.gdyupThemeInitialized = true;
              
              // Get stored theme or use default
              let theme = 'default';
              try {
                const stored = localStorage.getItem('gdyup-theme');
                if (stored && ['default', 'blue', 'pink'].includes(stored)) {
                  theme = stored;
                }
              } catch (e) {
                console.warn('Could not read theme from storage');
              }
              
              // Apply theme class - only once at initial load
              document.documentElement.classList.remove('gdyup-theme-default', 'gdyup-theme-blue', 'gdyup-theme-pink');
              document.documentElement.classList.add('gdyup-theme-' + theme);
              
              console.log('Theme initialized to:', theme);
            } catch (e) {
              console.warn('Theme init failed:', e);
              document.documentElement.classList.add('gdyup-theme-default');
            }
          })();
        `}
      </Script>
      
      {/* ThemeManager handles theme after client-side hydration */}
      <ThemeManager>
        <div className="flex flex-col min-h-screen">
          <NostrProvider>
            <GdyupHeader />
            <main className="flex-grow">
        {children}
            </main>
            <footer className="py-6 px-4 text-center text-xs text-gray-500 dark:text-gray-400">
              <p>© 2025 GDY·UP. All rights reserved.</p>
            </footer>
          </NostrProvider>
        </div>
      </ThemeManager>
    </>
  );
} 