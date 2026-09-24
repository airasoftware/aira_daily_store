const CACHE_NAME = 'aira-daily-offline-v1';
const OFFLINE_ASSETS = ['/offline.html', '/aira-daily-logo.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names.filter(name => name.startsWith('aira-daily-offline-') && name !== CACHE_NAME).map(name => caches.delete(name))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.mode !== 'navigate' || request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/')) return;

  event.respondWith(fetch(request).catch(async () => {
    const cache = await caches.open(CACHE_NAME);
    return (await cache.match('/offline.html')) || Response.error();
  }));
});
