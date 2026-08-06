// HarambeeFlow Service Worker v2 (Android 15+ & PWA Compliant)
const CACHE_NAME = "harambeeflow-pwa-v2";

const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/icon.svg"
];

// Install Event: Pre-cache App Shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching core app shell");
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn("[Service Worker] Core asset pre-cache warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up legacy caches & claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Purging legacy cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-first for navigation, stale-while-revalidate for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Bypass non-GET requests or requests from unsupported schemes (extensions, firebase auth, etc.)
  if (request.method !== "GET" || !request.url.startsWith("http")) {
    return;
  }

  // Skip browser extensions
  if (request.url.startsWith("chrome-extension://") || request.url.includes("extension")) {
    return;
  }

  // Handle SPA HTML Navigation Requests (Network-First)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put("/", responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback to cached index.html
          return caches.match("/index.html").then((cachedIndex) => {
            return cachedIndex || caches.match("/");
          });
        })
    );
    return;
  }

  // Handle Static Assets (Stale-While-Revalidate)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            request.url.startsWith(self.location.origin)
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          /* Ignore offline fetch errors for background revalidation */
        });

      return cachedResponse || fetchPromise;
    })
  );
});
