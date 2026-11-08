// 오프라인 캐시 (네트워크 우선, 실패 시 캐시)
const CACHE = 'monster-idle-v3';
const CORE = ['./', 'index.html', 'css/style.css', 'js/data.js', 'js/art.js', 'js/assets.js', 'js/hero.js', 'js/gear.js', 'js/audio.js',
  'js/monetize.js', 'js/battleview.js', 'js/game.js', 'js/ui.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(e.request, c)); }
    return r;
  }).catch(() => caches.match(e.request)));
});
