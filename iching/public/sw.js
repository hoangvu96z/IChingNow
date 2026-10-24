const CACHE_NAME = 'iching-pwa-v1';
const CACHE_PREFIX = 'iching-pwa-';
const APP_BASE = '/kinhdich/';
const APP_SHELL = '/kinhdich/';

const FIXED_STATIC_PATHS = [
  APP_BASE + 'manifest.webmanifest',
  APP_BASE + 'icon-192.png',
  APP_BASE + 'icon-512.png',
  APP_BASE + 'favicon.svg',
];

// Explicitly bypass API, /sso, auth/OAuth, account/profile, user readings/notes and any private/dynamic endpoint
const BYPASS_PATTERNS = [
  '/api',
  '/sso',
  '/auth',
  '/oauth',
  '/me',
  '/account',
  '/profile',
  '/readings',
  '/notes',
  '/plans',
  '/uploads',
  '/contact',
  '/analytics',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Precache only that app's app-shell URL
      return cache.addAll([APP_SHELL]);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

function isBypassed(request, url) {
  if (request.headers.has('Authorization')) {
    return true;
  }
  const pathname = url.pathname.toLowerCase();
  return BYPASS_PATTERNS.some((pattern) => {
    return pathname === pattern || pathname.startsWith(pattern + '/') || pathname.includes(pattern);
  });
}

function isCacheableStaticAsset(url) {
  if (!url.pathname.startsWith(APP_BASE)) {
    return false;
  }
  if (url.pathname.startsWith(APP_BASE + 'assets/')) {
    return true;
  }
  return FIXED_STATIC_PATHS.includes(url.pathname);
}

self.addEventListener('fetch', (event) => {
  // Never cache non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Never cache cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Confine to app base
  if (!url.pathname.startsWith(APP_BASE)) {
    return;
  }

  // Explicitly bypass API, /sso, auth/OAuth, account/profile, user readings/notes and private/dynamic endpoints
  if (isBypassed(event.request, url)) {
    return;
  }

  // Network-first navigation with the app-shell URL as the same-app fallback.
  // Only save response when request URL pathname exactly equals APP_SHELL.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok && url.pathname === APP_SHELL) {
            const clone = networkResponse.clone();
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => cache.put(APP_SHELL, clone))
            );
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedShell = await caches.match(APP_SHELL);
          if (cachedShell) {
            return cachedShell;
          }
          return Response.error();
        })
    );
    return;
  }

  // Cache same-origin GET Vite build assets under that app's /assets/ path
  // and exact fixed PWA icons/manifest/favicon files only.
  if (isCacheableStaticAsset(url)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
            );
          }
          return networkResponse;
        });
      })
    );
  }
});
