const CACHE_NAME = 'gdyup-v2';
const urlsToCache = [
  '/',
  '/gdyup',
  '/gdyup/listings',
  '/gdyup/dashboard',
  '/manifest.json',
  '/icons/gdyup-icon-512.png',
  '/icons/gdyup-icon-192.png',
  '/assets/gdyup-logo.jpg',
  '/assets/gdyup-logo-v2.svg',
];

// Helper function to determine if this is an API request
function isApiRequest(url) {
  return url.includes('/api/') || url.includes('_next/data');
}

// Helper function to determine if this is a jets page request
function isJetsPageRequest(url) {
  return url.includes('/gdyup/jets');
}

self.addEventListener('install', (event) => {
  // Force immediate activation to avoid delays
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Special handling for iOS PWA and Jets page
  if (isJetsPageRequest(event.request.url)) {
    // For Jets page in iOS PWA, use network-first strategy with timeout
    event.respondWith(
      fetchWithTimeout(event.request, 5000)
        .catch(() => {
          console.log('Jets page fetch failed, falling back to cache');
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If no cached response for jets page, redirect to dashboard
              return caches.match('/gdyup/dashboard');
            });
        })
    );
    return;
  }
  
  // For API requests, use network-only with no caching
  if (isApiRequest(event.request.url)) {
    event.respondWith(
      fetch(event.request)
        .catch(error => {
          console.error('API fetch error:', error);
          // Return a custom error response that won't trigger iOS retry loops
          return new Response(JSON.stringify({
            error: 'Network error',
            message: 'Failed to fetch data. Please check your connection.'
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }
  
  // Standard cache-first strategy for other requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then((response) => {
            // Return the response if it's not valid or isn't a GET request
            if (!response || response.status !== 200 || response.type !== 'basic' || event.request.method !== 'GET') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
      .catch(() => {
        // If both the cache and fetch fail, show a fallback page
        if (event.request.url.indexOf('/gdyup') !== -1) {
          return caches.match('/gdyup');
        }
        
        // For other paths, return a generic error response
        return new Response('Network error. Please try again later.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

// Helper function for timed network requests
function fetchWithTimeout(request, timeoutMs) {
  return new Promise((resolve, reject) => {
    // Set timeout
    const timeoutId = setTimeout(() => {
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    
    fetch(request).then(
      (response) => {
        // Clear timeout
        clearTimeout(timeoutId);
        resolve(response);
      },
      (err) => {
        // Clear timeout
        clearTimeout(timeoutId);
        reject(err);
      }
    );
  });
}

self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/gdyup-icon-512.png',
      badge: '/icons/gdyup-icon-192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '1',
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('/gdyup'));
});

// Service worker activate - clean up old caches
self.addEventListener('activate', (event) => {
  // Take control of all clients immediately
  event.waitUntil(clients.claim());
  
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 