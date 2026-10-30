/* MATi-MoTE service worker
 * - NETWORK FIRST for the app's own files: every launch asks GitHub Pages for the latest
 *   version (revalidating past the browser's HTTP cache), so new uploads show up right away.
 *   The saved copy is only used when you're offline.
 * - Never touches traffic to TVs/speakers on your network (private IPs / .local).
 * - VERSION is stamped automatically by build.sh (and must change with each release so old
 *   caches are cleared).
 */
const VERSION = 'mati-2026.10.30.6';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './icons/favicon-16.png',
  './icons/favicon.svg',
  './favicon.ico'
];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isLocalTarget(url) {
  const h = url.hostname;
  return h.endsWith('.local') || /^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
    /^169\.254\./.test(h) || h === 'localhost' || h === '127.0.0.1';
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (isLocalTarget(url) && url.origin !== self.location.origin) return;  // TV / speaker traffic
  if (url.pathname.endsWith('/version.json')) return;                       // always straight to GitHub

  if (url.origin === self.location.origin) {
    // cache key ignores ?code= (Spotify sign-in) and ?v= (icon cache-busting) query strings
    const key = req.mode === 'navigate' ? './index.html' : url.pathname;
    event.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then((res) => {
          if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(key, copy)); }
          return res;
        })
        .catch(() => caches.match(key, { ignoreSearch: true }).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  if (FONT_HOSTS.includes(url.hostname)) {   // fonts never change: cache first
    event.respondWith(
      caches.open(VERSION).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      })
    );
  }
});

self.addEventListener('message', (event) => { if (event.data === 'SKIP_WAITING') self.skipWaiting(); });
