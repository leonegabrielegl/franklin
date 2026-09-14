
/* Vasca — copia offline dell'app.
   Cambia VERSIONE ogni volta che aggiorni index.html, altrimenti i telefoni
   continuano ad aprire la copia vecchia. */
const VERSIONE = 'vasca-8';
const FILE = ['./', './index.html', './manifest.json',
              './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSIONE).then(c => c.addAll(FILE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(x => x !== VERSIONE).map(x => caches.delete(x))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                    // le chiamate al foglio non si toccano
  if (new URL(req.url).origin !== location.origin) return;

  e.respondWith(
    caches.match(req).then(colpo => {
      // in rete si aggiorna la copia, ma la pagina parte subito da quella salvata
      const rete = fetch(req).then(r => {
        if (r && r.status === 200) {
          const clone = r.clone();
          caches.open(VERSIONE).then(c => c.put(req, clone));
        }
        return r;
      }).catch(() => colpo || caches.match('./index.html'));
      return colpo || rete;
    })
  );
});
