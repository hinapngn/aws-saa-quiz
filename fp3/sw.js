const CACHE_NAME = 'fp3-quiz-v1';
const ASSETS = [
  './',
  './index.html',
  './questions.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];
// アプリ本体と問題データはネットワーク優先: questions.js の更新が
// CACHE_NAME を上げなくても自動でユーザーに届く
const NETWORK_FIRST = ['/', '/index.html', '/questions.js'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const path = new URL(e.request.url).pathname;
  const isNetworkFirst = NETWORK_FIRST.some(p => path.endsWith(p));
  if (isNetworkFirst) {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
        return res;
      }))
    );
  }
});
