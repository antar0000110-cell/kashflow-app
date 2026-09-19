// KashFlow Enterprise Financial OS - Service Worker
// Push Notifications & Background Sync Engine

const CACHE_NAME = 'kashflow-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for Push events (Web Push API)
self.addEventListener('push', (event) => {
  let data = {
    title: '🔔 New Financial Alert - KashFlow',
    body: 'A new transaction update has been received.',
    icon: '/assets/icon-192.png',
    badge: '/assets/icon-192.png',
    tag: 'kashflow-financial-alert',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/assets/icon-192.png',
    badge: data.badge || '/assets/icon-192.png',
    tag: data.tag || `kashflow-${Date.now()}`,
    renotify: true,
    requireInteraction: data.requireInteraction ?? true,
    vibrate: [200, 100, 200, 100, 200],
    data: data.data || { url: '/' },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// Handle notification click: Bring app to focus or open window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
