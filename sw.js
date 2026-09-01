/* Service Worker - macht aus der Seite eine App, die auch ohne Netz
   startet. Drei Strategien, je nachdem worum es geht:

   1. Die App selbst (HTML, Icons, Leaflet, Schrift): erst aus dem Cache
      ausliefern, damit der Start sofort geht, und im Hintergrund die
      neue Fassung holen.
   2. Wetterdaten: erst das Netz fragen, weil frische Werte der ganze
      Zweck sind - und nur wenn das scheitert auf die letzte Antwort
      zurueckfallen.
   3. Karten- und Radarkacheln: gar nicht zwischenspeichern, davon gibt
      es zu viele.

   Beim Aendern der App die Version hochzaehlen, dann raeumt der Worker
   die alten Caches beim naechsten Start auf. */
const VERSION    = 'wetter-v4';
const SHELL      = VERSION + '-shell';
const DATEN      = VERSION + '-daten';

const SHELL_URLS = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(SHELL)
      // einzeln, damit ein fehlgeschlagener Eintrag nicht alles kippt
      .then(c => Promise.all(SHELL_URLS.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const istWetterdaten = url =>
  url.hostname.endsWith('open-meteo.com') ||
  url.hostname.endsWith('rainviewer.com') && url.pathname.endsWith('.json') ||
  url.hostname.endsWith('bigdatacloud.net');

const istKachel = url =>
  url.hostname.includes('arcgisonline') ||
  url.hostname.includes('tilecache') ||
  /\.(png|jpg|jpeg|webp)$/i.test(url.pathname) && !url.pathname.includes('/icons/');

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  if (istKachel(url)) return;                       // Kacheln laufen am Worker vorbei

  if (istWetterdaten(url)){
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const kopie = res.clone();
          caches.open(DATEN).then(c => c.put(e.request, kopie)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(e.request).then(r => {
          if (!r) return Promise.reject('offline');
          /* Die Antwort kommt aus dem Zwischenspeicher - das muss die App
             wissen, sonst zeigt sie alte Werte als frische aus. */
          const kopf = new Headers(r.headers);
          kopf.set('X-Aus-Zwischenspeicher', '1');
          return r.blob().then(b => new Response(b, { status: r.status, headers: kopf }));
        }))
    );
    return;
  }

  // App-Bestandteile: aus dem Cache starten, im Hintergrund erneuern
  e.respondWith(
    caches.match(e.request).then(treffer => {
      const netz = fetch(e.request).then(res => {
        if (res && res.status === 200){
          const kopie = res.clone();
          caches.open(SHELL).then(c => c.put(e.request, kopie)).catch(() => {});
        }
        return res;
      }).catch(() => treffer);
      return treffer || netz;
    })
  );
});
