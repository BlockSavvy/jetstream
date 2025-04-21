'use client';

import { useEffect } from 'react';

// This component will add iOS-specific meta tags using client-side JavaScript
export default function CustomHead() {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Add mobile web app capable meta tag (iOS)
      let metaTag = document.createElement('meta');
      metaTag.name = 'apple-touch-fullscreen';
      metaTag.content = 'yes';
      document.head.appendChild(metaTag);
      
      // Add format detection meta tag
      metaTag = document.createElement('meta');
      metaTag.name = 'format-detection';
      metaTag.content = 'telephone=no';
      document.head.appendChild(metaTag);
      
      // Add theme-color meta tag
      metaTag = document.createElement('meta');
      metaTag.name = 'theme-color';
      metaTag.content = '#CEFF00';
      document.head.appendChild(metaTag);
    }
  }, []);

  return null;
} 