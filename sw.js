/* PassbookHub service worker: makes the site installable as an app.
   Network first, so you always get the latest deploy. Only this site's own files are cached,
   as a fallback when you're offline. Firebase and Google requests are never touched. */
const CACHE = 'pbh-shell-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png'];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).catch(function () {}));
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL('./', self.location).pathname)) return;
  event.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        return hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error());
      });
    })
  );
});
