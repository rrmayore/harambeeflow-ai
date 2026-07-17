const CACHE_NAME = "harambeeflow-cache-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/src/main.tsx",
  "/src/App.tsx",
  "/src/index.css"
];

// Install Service Worker
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching app shell assets");
      return cache.addAll(ASSETS).catch((err) => {
        console.warn("[Service Worker] Prefetch cache error:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Interceptor
self.addEventListener("fetch", (e) => {
  // Only handle GET requests and local requests
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip chrome-extension or other non-http requests
  if (e.request.url.startsWith("chrome-extension://") || e.request.url.includes("extension")) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in background to update cache (stale-while-revalidate)
        fetch(e.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
          }
        }).catch(() => {/* Ignore network errors */});
        
        return cachedResponse;
      }

      return fetch(e.request).catch(() => {
        // Fallback for offline page or index.html
        if (e.request.mode === "navigate") {
          return caches.match("/");
        }
      });
    })
  );
});
