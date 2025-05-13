/**
 * GDY·UP Platform Behaviors
 * 
 * This file contains platform-specific behaviors and initializations
 * that should run after the page has loaded
 */

// Wait until the page is fully loaded and stable
window.addEventListener('load', function() {
  // Give additional time for React hydration to complete
  setTimeout(function() {
    console.log('GDY·UP Platform behaviors initialized');
    
    try {
      // Set GDYUP platform initialized flag
      try {
        sessionStorage.setItem('gdyup-platform-initialized', 'true');
      } catch (storageError) {
        console.warn('Could not access sessionStorage:', storageError);
      }
      
      // Detect if the app is running as a PWA
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                   (window.navigator.standalone === true);
      
      if (isPWA) {
        document.documentElement.classList.add('gdyup-pwa-mode');
        console.log('Running in PWA mode');
        
        // Apply additional PWA-specific behaviors
        try {
          // Prevent pull-to-refresh on iOS
          document.body.addEventListener('touchmove', function(e) {
            if (e.target.nodeName !== 'INPUT' && e.target.nodeName !== 'TEXTAREA') {
              if (document.body.scrollTop === 0) {
                e.preventDefault();
              }
            }
          }, { passive: false });
        } catch (pwaBehaviorError) {
          console.warn('Error setting up PWA behaviors:', pwaBehaviorError);
        }
      }

      // Add iOS-specific touch handling
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        document.documentElement.classList.add('ios-device');
        
        // Fix for iOS hover effects
        document.addEventListener('touchstart', function() {}, { passive: true });
      }
      
      // Register service worker if supported
      if ('serviceWorker' in navigator) {
        // Small delay before registering service worker
        setTimeout(function() {
          navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
              console.log('ServiceWorker registered successfully: ', registration.scope);
            })
            .catch(function(error) {
              console.warn('ServiceWorker registration failed: ', error);
            });
        }, 1000);
      }
    } catch (error) {
      console.error('Error initializing platform behaviors:', error);
    }
  }, 1000); // Increased delay to ensure hydration is complete
}); 