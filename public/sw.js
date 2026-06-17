const CACHE_NAME = "proofolio-install-v10";
const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/icons/favicon-32.png?v=10",
  "/icons/apple-touch-icon.png?v=10",
  "/icons/icon-192.png?v=10",
  "/icons/icon-512.png?v=10",
  "/icons/maskable-512.png?v=10",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("proofolio-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request)),
  );
});
