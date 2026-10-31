// Adamův důl: nejdřív síť (ať se hra aktualizuje), bez internetu poslední uložená verze
const CACHE = 'adamuv-dul-v1';
// version.json se nikdy nebere z mezipaměti, jinak by hra novou verzi nepoznala
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']))); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || e.request.url.includes('version.json')) return;
  e.respondWith(fetch(e.request).then(res => {
    if (res.ok && (e.request.url.startsWith(self.location.origin) || e.request.url.includes('fonts.g'))) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});

// Ranní upozornění (src/app/push.js, server worker/push.ts): zpráva přijde prázdná, text uložila hra do mezipaměti
self.addEventListener('push', e => {
  e.waitUntil((async () => {
    let t = { title: 'Schoolcraft', body: 'Dobré ráno! Čeká tě dnešní úkol.' };
    try { const r = await (await caches.open('schoolcraft-upozorneni')).match('/__upozorneni'); if (r) t = { ...t, ...await r.json() }; } catch (x) { /* obecný text */ }
    await self.registration.showNotification(t.title, { body: t.body, icon: 'icon-192.png', badge: 'icon-192.png', tag: 'denni-ukol', renotify: true });
  })());
});
// klepnutí na upozornění: otevřít hru (nebo přepnout na už otevřenou)
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => { const c = cs.find(x => 'focus' in x); return c ? c.focus() : self.clients.openWindow('./'); }));
});
