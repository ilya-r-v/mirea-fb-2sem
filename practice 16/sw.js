const CACHE_NAME         = 'taskflow-shell-v1';
const DYNAMIC_CACHE_NAME = 'taskflow-dynamic-v1';

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/favicon.ico',
  '/icons/icon-16x16.png',
  '/icons/icon-32x32.png',
  '/icons/icon-48x48.png',
  '/icons/icon-64x64.png',
  '/icons/icon-128x128.png',
  '/icons/icon-256x256.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', event => {
  console.log('[SW] Установка, кэшируем App Shell...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => {
        console.log('[SW] App Shell закэширован');
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Активация, удаляем старые кэши...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== DYNAMIC_CACHE_NAME)
          .map(k => {
            console.log('[SW] Удаляем кэш:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (url.origin !== location.origin) return;

  if (url.pathname.startsWith('/content/')) {
    event.respondWith(
      fetch(event.request)
        .then(networkRes => {
          const clone = networkRes.clone();
          caches.open(DYNAMIC_CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
          return networkRes;
        })
        .catch(() =>
          caches.match(event.request)
            .then(cached => cached || caches.match('/content/home.html'))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(networkRes => {
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return networkRes;
      }).catch(() => {
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});

self.addEventListener('push', event => {
  console.log('[SW] Получено push-уведомление');
  let data = { title: 'TaskFlow', body: 'Новая задача добавлена!' };
  if (event.data) {
    try { data = event.data.json(); }
    catch { data.body = event.data.text(); }
  }

  const options = {
    body:  data.body,
    icon:  '/icons/icon-128x128.png',
    badge: '/icons/icon-48x48.png',
    vibrate: [200, 100, 200],
    tag: 'taskflow-task',
    data: { url: '/' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        if (clientList.length > 0) return clientList[0].focus();
        return clients.openWindow('/');
      })
  );
});