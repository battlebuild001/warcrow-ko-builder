const CACHE_NAME = 'warcrow-ko-pwa-v35';
const CORE_FILES = [
  "./",
  "./index.html",
  "./style.css?v=24",
  "./builder.css?v=27",
  "./glossary.css?v=26",
  "./native-cards.css?v=27",
  "./play-tools.css?v=28",
  "./scenarios.css?v=30",
  "./joins.css?v=34",
  "./app.js?v=35",
  "./rosters.js?v=31",
  "./rosters.css?v=31",
  "./keyword-guide.js?v=35",
  "./keyword-guide.css?v=33",
  "./keyword-timing.json?v=35",
  "./glossary.js?v=33",
  "./native-cards.js?v=35",
  "./scenarios.js?v=30",
  "./joins.js?v=34",
  "./fonts/Warcrow.woff2",
  "./app-data.json?v=35",
  "./card-ko.json?v=35",
  "./native-cards.json?v=35",
  "./card-abilities.json?v=35",
  "./card-effects.json?v=35",
  "./model-images.json?v=35",
  "./rules-glossary.json?v=35",
  "./join-metadata.json?v=35",
  "./scenarios-data.json?v=28",
  "./rulebook-core-a.json?v=35",
  "./rulebook-core-b.json?v=35",
  "./rulebook-core-c.json?v=35",
  "./rulebook-core-d.json?v=35",
  "./rulebook-wts.json?v=35",
  "./rulebook-source.json?v=35",
  "./rulebook-figures.json?v=35",
  "./rules.html",
  "./scenarios.html",
  "./quick-sheet.html",
  "./tutorial.html",
  "./guide.css?v=16",
  "./rulebook.css?v=28",
  "./rulebook.js?v=35",
  "./pwa.js?v=16",
  "./manifest.json",
  "./pwa-icon-192.png",
  "./pwa-icon-512.png",
  "./pwa-icon-maskable-512.png",
  "./scenarios-assets/wts-s2-map-p19.png",
  "./scenarios-assets/wts-s2-map-p21.png",
  "./scenarios-assets/wts-s2-map-p23.png",
  "./scenarios-assets/wts-s2-map-p25.png",
  "./scenarios-assets/wts-s2-map-p27.png",
  "./scenarios-assets/wts-s2-map-p29.png",
  "./scenarios-assets/wts-s2-map-p31.png",
  "./scenarios-assets/wts-s2-map-p32.png",
  "./scenarios-assets/wts-s2-map-p34.png",
  "./scenarios-assets/wts-s2-map-p36.png",
  "./scenarios-assets/wts-s2-map-p38.png",
  "./scenarios-assets/wts-s2-map-p40.png",
  "./rulebook-art/core-003-1.webp",
  "./rulebook-art/core-004-1.webp",
  "./rulebook-art/core-008-1.webp",
  "./rulebook-art/core-017-1.webp",
  "./rulebook-art/core-017-2.webp",
  "./rulebook-art/core-021-1.webp",
  "./rulebook-art/core-022-1.webp",
  "./rulebook-art/core-027-1.webp",
  "./rulebook-art/core-031-1.webp",
  "./rulebook-art/core-035-1.webp",
  "./rulebook-art/core-045-1.webp",
  "./rulebook-art/core-045-2.webp",
  "./rulebook-art/core-055-1.webp",
  "./rulebook-art/core-057-1.webp",
  "./rulebook-art/core-058-1.webp",
  "./rulebook-art/core-058-2.webp",
  "./rulebook-art/core-058-3.webp",
  "./rulebook-art/core-059-1.webp",
  "./rulebook-art/core-059-2.webp",
  "./rulebook-art/core-059-3.webp",
  "./rulebook-art/core-077-1.webp",
  "./rulebook-art/core-078-1.webp",
  "./rulebook-art/core-081-1.webp",
  "./rulebook-art/core-102-1.webp",
  "./rulebook-art/core-105-1.webp",
  "./rulebook-art/core-106-1.webp",
  "./rulebook-art/core-107-1.webp",
  "./rulebook-art/core-107-2.webp",
  "./rulebook-art/core-108-1.webp",
  "./rulebook-art/core-108-2.webp",
  "./rulebook-art/core-109-1.webp",
  "./rulebook-art/core-109-2.webp",
  "./rulebook-art/core-109-3.webp",
  "./rulebook-art/core-110-1.webp",
  "./rulebook-art/core-110-2.webp",
  "./rulebook-art/core-110-3.webp",
  "./rulebook-art/core-111-1.webp",
  "./rulebook-art/core-111-2.webp",
  "./rulebook-art/core-112-1.webp",
  "./rulebook-art/core-112-2.webp",
  "./rulebook-art/core-113-1.webp",
  "./rulebook-art/core-113-2.webp",
  "./rulebook-art/core-113-3.webp",
  "./rulebook-art/core-114-1.webp",
  "./rulebook-art/core-114-2.webp",
  "./rulebook-art/core-115-1.webp",
  "./rulebook-art/core-116-1.webp",
  "./rulebook-art/core-116-2.webp",
  "./rulebook-art/core-117-1.webp",
  "./rulebook-art/core-117-2.webp",
  "./rulebook-art/core-118-1.webp",
  "./rulebook-art/core-118-2.webp",
  "./rulebook-art/core-118-3.webp",
  "./rulebook-art/core-119-1.webp",
  "./rulebook-art/core-119-2.webp",
  "./rulebook-art/core-119-3.webp",
  "./rulebook-art/core-120-1.webp",
  "./rulebook-art/core-120-2.webp",
  "./rulebook-art/core-120-3.webp",
  "./rulebook-art/core-120-4.webp",
  "./rulebook-art/wts-017-1.webp",
  "./rulebook-art/wts-018-1.webp"
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
