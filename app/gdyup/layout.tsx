import { ReactNode } from 'react';
import { ClientLayoutWrapper } from './client-layout-wrapper';
import './gdyup.css';
import './index.css';
import './components/gdyup-forms.css';
import './pwa-fixes.css';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import ThemeManager from './components/ThemeManager';
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
      {/* Add enhanced theme initialization script */}
      <Script id="theme-init" strategy="beforeInteractive">
        {`
          (function() {
            try {
              // Get stored theme or default to 'default'
              const storedTheme = localStorage.getItem('gdyup-theme') || 'default';
              
              // Clean up any existing theme classes
              document.documentElement.classList.remove(
                'gdyup-theme-default', 
                'gdyup-theme-blue', 
                'gdyup-theme-pink'
              );
              
              // Add the theme class to document root
              if (['default', 'blue', 'pink'].includes(storedTheme)) {
                document.documentElement.classList.add('gdyup-theme-' + storedTheme);
                console.log('Theme initialized to:', storedTheme);
              } else {
                // Fallback to default theme
                document.documentElement.classList.add('gdyup-theme-default');
                console.log('Theme fallback to default');
              }
              
              // Add extra protection - set timeout to check theme class
              setTimeout(function() {
                const hasThemeClass = Array.from(document.documentElement.classList).some(
                  cls => cls.startsWith('gdyup-theme-')
                );
                
                if (!hasThemeClass) {
                  // Force default theme class if missing
                  document.documentElement.classList.add('gdyup-theme-default');
                  console.log('Theme class missing, applied default');
                }
              }, 100);
              
              // Add event listener for storage changes
              window.addEventListener('storage', function(e) {
                if (e.key === 'gdyup-theme') {
                  const newTheme = e.newValue || 'default';
                  
                  // Clean up theme classes
                  document.documentElement.classList.remove(
                    'gdyup-theme-default', 
                    'gdyup-theme-blue', 
                    'gdyup-theme-pink'
                  );
                  
                  // Add appropriate theme class
                  if (['default', 'blue', 'pink'].includes(newTheme)) {
                    document.documentElement.classList.add('gdyup-theme-' + newTheme);
                  } else {
                    document.documentElement.classList.add('gdyup-theme-default');
                  }
                }
              });
            } catch (e) {
              console.warn('Theme init warning:', e);
              // Ensure default theme is applied on error
              document.documentElement.classList.add('gdyup-theme-default');
            }
          })();
        `}
      </Script>
      
      <ThemeManager />
      <GdyupHeader />
      <ClientLayoutWrapper>
        {children}
      </ClientLayoutWrapper>
    </>
  );
} 