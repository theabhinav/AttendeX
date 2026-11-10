// Service Worker for AttendX Web Push Notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'AttendX Reminder', body: event.data.text() };
    }
  }

  const title = data.title || 'AttendX Class Alert';
  const options = {
    body: data.body || 'You have an upcoming class.',
    icon: '/logo.svg',
    badge: '/logo.svg',
    data: data.url || '/',
    vibrate: [100, 50, 100],
    actions: data.actions || [
      { action: 'open', title: 'View Timetable' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
