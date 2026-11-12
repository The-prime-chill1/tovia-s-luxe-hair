const CACHE_NAME = "tovia-app-v2";
const APP_SHELL = ["/", "/index.html", "/site.webmanifest", "/pwa-192.png", "/pwa-512.png", "/tovias-logo.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const isProductImage = url.origin === "https://peolkpovoreuigrxfoyc.supabase.co" && url.pathname.startsWith("/storage/v1/object/public/product-images/");

  if (isProductImage) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      return response;
    })));
    return;
  }

  if (url.origin !== self.location.origin) return;
  event.respondWith(fetch(request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
    }
    return response;
  }).catch(() => caches.match(request).then((cached) => cached || (request.mode === "navigate" ? caches.match("/index.html") : Response.error()))));
});
