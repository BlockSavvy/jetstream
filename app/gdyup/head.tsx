'use client';

import { useEffect } from 'react';

// This component will add iOS-specific meta tags using client-side JavaScript
export default function CustomHead() {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Only modify the meta tags in standalone mode (when app installed on home screen)
      if (navigator && 'standalone' in navigator && (navigator as any).standalone) {
        // Add specific iOS meta tags for best PWA experience
        const metaTags = [
          { name: 'apple-mobile-web-app-capable', content: 'yes' },
          { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
          { name: 'theme-color', content: '#CEFF00' }
        ];
        
        // Apply meta tags
        metaTags.forEach(tag => {
          // Remove existing tag if it exists
          const existing = document.querySelector(`meta[name="${tag.name}"]`);
          if (existing) existing.remove();
          
          // Create and add new tag
          const meta = document.createElement('meta');
          meta.name = tag.name;
          meta.content = tag.content;
          document.head.insertBefore(meta, document.head.firstChild);
        });
        
        // Ensure link to manifest exists
        if (!document.querySelector('link[rel="manifest"]')) {
          const manifestLink = document.createElement('link');
          manifestLink.rel = 'manifest';
          manifestLink.href = '/manifest.json';
          document.head.insertBefore(manifestLink, document.head.firstChild);
        }
      }
    }
  }, []);

  return null;
} 