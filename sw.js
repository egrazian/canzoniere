// Service worker: rende il canzoniere consultabile anche senza rete.
const VERSIONE = '6668b81d28';
const CACHE = 'canzoniere-' + VERSIONE;
const BASE = ['./', 'index.html', 'manifest.webmanifest', 'icona-192.png', 'icona-512.png', 'icona-180.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('canzoniere-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // pagina: prima la rete (così arrivano gli aggiornamenti), poi la copia salvata
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put('index.html', c)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  // caratteri e icone: prima la copia salvata
  if (url.origin === location.origin || url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
      const c = r.clone(); caches.open(CACHE).then((x) => x.put(req, c)); return r;
    })));
  }
});
