/**
 * sw.js — dord.racing service worker
 *
 * Cache strategies:
 *   • Fonts, static assets (images, CSS, JS chunks)  → Cache-First (long TTL)
 *   • API / dynamic data (/data/series.json etc.)    → Network-First, fallback to cache
 *   • Calendar, series, track, results pages          → Stale-While-Revalidate
 *   • Everything else                                 → Network-First, no cache fallback
 *
 * Install: registers in BaseLayout.astro (skipped on localhost unless ?sw=1 is set).
 */

const VERSION  = 'v2';
const CACHE    = `dord-${VERSION}`;

// Assets to precache on install (shell only — pages served SW-free initially)
const PRECACHE = [
  '/',
  '/manifest.webmanifest',
  '/assets/fonts/orbitron-900.woff2',
  '/assets/fonts/roboto-mono-400.woff2',
  '/assets/fonts/roboto-mono-700.woff2',
  '/assets/fonts/inter-400.woff2',
  '/assets/fonts/inter-800.woff2',
];

// ── Install: precache shell ────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ── Activate: clear old caches ────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GETs
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const path = url.pathname;

  // Fonts and immutable static assets → Cache-First
  if (
    path.startsWith('/assets/fonts/') ||
    path.startsWith('/assets/flags/') ||
    path.startsWith('/assets/track-maps/') ||
    path.startsWith('/assets/tracks/') ||
    path.startsWith('/assets/series-grid-images/') ||
    path.startsWith('/assets/og/') ||
    /\.(woff2?|ttf|otf|png|webp|avif|svg|jpg|jpeg)$/.test(path)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Dynamic data feeds → Network-First with cache fallback
  if (
    path.startsWith('/data/') ||
    path.startsWith('/api/')  ||
    path.startsWith('/ical/')
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  // HTML pages → Stale-While-Revalidate
  const acceptsHtml = request.headers.get('accept')?.includes('text/html');
  if (acceptsHtml || path === '/' || path.endsWith('/')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Everything else (JS chunks, inlined CSS) → Network-First
  event.respondWith(networkFirst(request));
});

// ── Strategies ────────────────────────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached ?? new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache  = await caches.open(CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => cached);
  return cached ?? fetchPromise;
}
