const CACHE_NAME = 'warcrow-ko-pwa-v20';
const CORE_FILES = [
  './', './index.html', './style.css?v=20', './app.js?v=19',
  './app-data.json?v=17', './card-ko.json?v=17',
  './card-profiles.json?v=17', './card-abilities.json?v=17',
  './card-effects.json?v=17', './model-images.json?v=17', './icons.svg?v=9',
  './rules.html', './quick-sheet.html', './tutorial.html',
  './guide.css?v=16', './pwa.js?v=16', './manifest.json',
  './pwa-icon-192.png', './pwa-icon-512.png', './pwa-icon-maskable-512.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME && key.startsWith('warcrow-ko-pwa-')).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(request).then(response => {
    if (response.ok && response.type === 'basic') {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {}));
    }
    return response;
  }).catch(async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, {ignoreSearch: true});
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const home = await cache.match('./index.html');
      if (home) return home;
    }
    return Response.error();
  }));
});
