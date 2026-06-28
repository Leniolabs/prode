const CACHE_NAME = "prode-offline-v3";
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/192x192.png",
  "/512x512.png",
  "/favicon.ico",
  "/bg-trophy.png",
  "/improving-logo-light.png",
];

const STATIC_DESTINATIONS = new Set(["style", "script", "image", "font"]);

function collectSameOriginAssetUrls(html) {
  const assetUrls = new Set();
  const pattern = /(?:href|src)=["']([^"'<> ]+)["']/g;

  for (const match of html.matchAll(pattern)) {
    try {
      const url = new URL(match[1], self.location.origin);
      if (url.origin === self.location.origin) {
        assetUrls.add(url.toString());
      }
    } catch {
      // Ignore invalid URLs from markup we do not control.
    }
  }

  return [...assetUrls];
}

async function cacheResponse(request, response) {
  if (!response || !response.ok || request.method !== "GET") {
    return response;
  }

  const cache = await caches.open(CACHE_NAME);
  cache.put(request, response.clone());
  return response;
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  const networkResponse = await fetch(request);
  return cacheResponse(request, networkResponse);
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    return cacheResponse(request, networkResponse);
  } catch {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    const offlineResponse = await caches.match(OFFLINE_URL);
    if (offlineResponse) return offlineResponse;

    throw new Error("Network error and no cached response available");
  }
}

async function warmOfflineShellAssets(cache) {
  try {
    const response = await fetch(OFFLINE_URL, { cache: "reload" });
    if (!response.ok) return;

    const html = await response.clone().text();
    const assetUrls = collectSameOriginAssetUrls(html);
    await Promise.allSettled(assetUrls.map((url) => cache.add(url)));
  } catch {
    // The shell should still install even if the network is unavailable here.
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(PRECACHE_URLS);
      await warmOfflineShellAssets(cache);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve(false);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (
    STATIC_DESTINATIONS.has(event.request.destination) ||
    requestUrl.pathname.startsWith("/_next/") ||
    requestUrl.pathname === "/manifest.webmanifest" ||
    /\.(?:css|js|mjs|png|jpg|jpeg|gif|svg|webp|ico|woff2?)$/i.test(
      requestUrl.pathname
    )
  ) {
    event.respondWith(cacheFirst(event.request));
  }
});
