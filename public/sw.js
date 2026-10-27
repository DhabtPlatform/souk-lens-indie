// Souk Lens service worker — offline shell for the seller in the market.
// Cache-first for brand/static assets, network-first for pages, API always live.
const CACHE = "souk-lens-v1";
const CORE = ["/", "/manifest.webmanifest", "/logo.svg", "/brand/hero-souq.jpg", "/brand/empty-stall.jpg", "/brand/app-icon-art.jpg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.pathname.startsWith("/api/")) return; // listings/payment always live
  if (url.pathname.startsWith("/brand/") || url.pathname === "/logo.svg" || url.pathname.startsWith("/_next/static/")) {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res; })));
    return;
  }
  e.respondWith(fetch(e.request).catch(() => caches.match("/")));
});
