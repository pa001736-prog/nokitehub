importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

// This will be replaced or we can fetch it from a known location
// For now, we'll try to fetch it from the config file if possible, 
// but service workers are tricky with imports.
// We'll use a placeholder that the app will update or we'll just use the standard init.

firebase.initializeApp({
  apiKey: "AIzaSyAoANvFidl_W6EvmUradBn7QMe1J_ZWaaY",
  authDomain: "gen-lang-client-0179262246.firebaseapp.com",
  projectId: "gen-lang-client-0179262246",
  storageBucket: "gen-lang-client-0179262246.firebasestorage.app",
  messagingSenderId: "988811860348",
  appId: "1:988811860348:web:b6afd4c639a2bab2e06cf9"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/logoo.png',
    badge: '/logoo.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.link || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
