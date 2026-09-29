const CACHE = 'frota-strsat-v4';
const CORE = [
  './',
  './index.html',
  './style.css',
  './script_app.js',
  './auth.js',
  './config.js',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url;
  if (e.request.method !== 'GET') return;
  if (url.includes('supabase') || url.includes('jsdelivr') || url.includes('unpkg') || url.includes('router.project-osrm') || url.includes('api.')) {
    return;
  }
  e.respondWith(
    fetch(e.request).then((resp) => {
      const clone = resp.clone();
      if (resp.ok && (resp.type === 'basic' || resp.type === 'default')) {
        caches.open(CACHE).then((c) => c.put(e.request, clone));
      }
      return resp;
    }).catch(() => caches.match(e.request))
  );
});