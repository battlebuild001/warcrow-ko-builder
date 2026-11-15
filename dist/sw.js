const CACHE_NAME = 'warcrow-ko-pwa-v27';
const CORE_FILES = [
  './', './index.html', './style.css?v=24', './builder.css?v=27', './glossary.css?v=26', './native-cards.css?v=27',
  './app.js?v=27', './glossary.js?v=27', './native-cards.js?v=27', './fonts/Warcrow.woff2',
  './app-data.json?v=27', './card-ko.json?v=27', './native-cards.json?v=27',
  './card-abilities.json?v=27', './card-effects.json?v=27', './model-images.json?v=27', './rules-glossary.json?v=27',
  './rules.html', './quick-sheet.html', './tutorial.html', './guide.css?v=16', './pwa.js?v=16', './manifest.json',
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
