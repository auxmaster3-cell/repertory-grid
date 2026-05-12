const CACHE_NAME = 'rgc-v1';
const ASSETS = ['/', '/index.html', '/static/js/bundle.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});

self.addEventListener('sync', (e) => {
  if (e.tag.startsWith('coach-reminder-')) {
    e.waitUntil(
      self.registration.showNotification('Repertory Grid Coach', {
        body: 'Прошло 2 недели. Как продвигается ваш план действий? Загляните в приложение, чтобы отметить прогресс.',
        icon: '/logo192.png',
        badge: '/favicon.ico',
        tag: 'coaching-reminder',
        data: { url: '/' },
        actions: [
          { action: 'open', title: 'Открыть' },
          { action: 'later', title: 'Напомнить позже' }
        ]
      })
    );
  }
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  if (e.action === 'open') {
    e.waitUntil(clients.openWindow('/'));
  } else if (e.action === 'later') {
    e.waitUntil(
      self.registration.sync.register('coach-reminder-later')
    );
  }
});
