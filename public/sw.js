const CACHE_NAME = 'gdyup-v1';
const urlsToCache = [
  '/',
  '/gdyup',
  '/gdyup/listings',
  '/manifest.json',
  '/icons/gdyup-icon-512.png',
  '/icons/gdyup-icon-192.png',
  '/assets/gdyup-logo.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
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
      })
  );
});

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