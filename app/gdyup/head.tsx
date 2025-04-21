'use client';

import { useEffect } from 'react';

// This component will add iOS-specific meta tags using client-side JavaScript
export default function CustomHead() {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Remove any existing PWA-related meta tags to avoid duplicates
      document.querySelectorAll('meta[name="apple-mobile-web-app-capable"]').forEach(el => el.remove());
      document.querySelectorAll('meta[name="apple-touch-fullscreen"]').forEach(el => el.remove());
      document.querySelectorAll('meta[name="apple-mobile-web-app-status-bar-style"]').forEach(el => el.remove());
      document.querySelectorAll('meta[name="mobile-web-app-capable"]').forEach(el => el.remove());
      document.querySelectorAll('link[rel="manifest"]').forEach(el => el.remove());
      
      // Add manifest link - adding it dynamically to ensure it's there
      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/manifest.json';
      manifestLink.crossOrigin = 'use-credentials'; // Add credentials if needed
      document.head.insertBefore(manifestLink, document.head.firstChild);
      
      // Create and inject the PWA meta tags in a specific order
      
      // 1. apple-mobile-web-app-capable (most important for fullscreen)
      const appCapable = document.createElement('meta');
      appCapable.name = 'apple-mobile-web-app-capable';
      appCapable.content = 'yes';
      document.head.insertBefore(appCapable, document.head.firstChild);
      
      // 2. apple-touch-fullscreen
      const touchFullscreen = document.createElement('meta');
      touchFullscreen.name = 'apple-touch-fullscreen';
      touchFullscreen.content = 'yes';
      document.head.insertBefore(touchFullscreen, document.head.firstChild);
      
      // 3. apple-mobile-web-app-status-bar-style
      const statusBarStyle = document.createElement('meta');
      statusBarStyle.name = 'apple-mobile-web-app-status-bar-style';
      statusBarStyle.content = 'black-translucent';
      document.head.insertBefore(statusBarStyle, document.head.firstChild);
      
      // 4. mobile-web-app-capable
      const mobileCapable = document.createElement('meta');
      mobileCapable.name = 'mobile-web-app-capable';
      mobileCapable.content = 'yes';
      document.head.insertBefore(mobileCapable, document.head.firstChild);
      
      // 5. viewport with minimal-ui
      const existingViewport = document.querySelector('meta[name="viewport"]');
      if (existingViewport) {
        (existingViewport as HTMLMetaElement).content = 'width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover, minimal-ui';
      } else {
        const viewport = document.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = 'width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover, minimal-ui';
        document.head.insertBefore(viewport, document.head.firstChild);
      }
      
      // 6. theme-color
      const themeColor = document.createElement('meta');
      themeColor.name = 'theme-color';
      themeColor.content = '#CEFF00';
      document.head.insertBefore(themeColor, document.head.firstChild);
      
      // Add apple-touch-icon links with specific sizes
      const touchIconSizes = ['152x152', '167x167', '180x180', '192x192'];
      touchIconSizes.forEach(size => {
        const link = document.createElement('link');
        link.rel = 'apple-touch-icon';
        link.setAttribute('sizes', size);
        link.href = `/icons/gdyup-icon-192.png`;
        document.head.appendChild(link);
      });
      
      // Add an event listener to hide the Safari UI on first load
      window.addEventListener('load', () => {
        // Check if running in standalone mode (home screen)
        if (navigator && 'standalone' in navigator && (navigator as any).standalone) {
          document.documentElement.style.height = '100vh';
          document.body.style.height = '100vh';
          document.body.style.position = 'fixed';
          document.body.style.overflow = 'hidden';
          document.body.style.width = '100%';
        }
      });
    }
  }, []);

  return null;
} 