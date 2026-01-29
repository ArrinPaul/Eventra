// Firebase Messaging Service Worker
// This service worker handles push notifications when the app is in the background

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY,
  authDomain: self.FIREBASE_AUTH_DOMAIN,
  projectId: self.FIREBASE_PROJECT_ID,
  storageBucket: self.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID,
  appId: self.FIREBASE_APP_ID
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'EventOS';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: payload.data?.notificationId || 'default',
    data: payload.data,
    actions: getNotificationActions(payload.data?.type),
    vibrate: [200, 100, 200],
    requireInteraction: payload.data?.priority === 'high'
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Get notification actions based on type
function getNotificationActions(type) {
  switch (type) {
    case 'event_reminder':
    case 'event_starting':
      return [
        { action: 'view', title: 'View Event', icon: '/icons/eye.png' },
        { action: 'dismiss', title: 'Dismiss', icon: '/icons/x.png' }
      ];
    case 'connection_request':
      return [
        { action: 'accept', title: 'Accept', icon: '/icons/check.png' },
        { action: 'view', title: 'View Profile', icon: '/icons/user.png' }
      ];
    case 'message_received':
      return [
        { action: 'reply', title: 'Reply', icon: '/icons/reply.png' },
        { action: 'view', title: 'View', icon: '/icons/eye.png' }
      ];
    case 'certificate_ready':
      return [
        { action: 'download', title: 'Download', icon: '/icons/download.png' },
        { action: 'dismiss', title: 'Later', icon: '/icons/clock.png' }
      ];
    default:
      return [
        { action: 'view', title: 'View', icon: '/icons/eye.png' },
        { action: 'dismiss', title: 'Dismiss', icon: '/icons/x.png' }
      ];
  }
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);

  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action;
  let url = '/';

  // Determine URL based on notification type and action
  switch (data.type) {
    case 'event_reminder':
    case 'event_starting':
    case 'event_update':
      url = `/events/${data.eventId}`;
      break;
    case 'registration_confirmed':
      url = `/tickets`;
      break;
    case 'certificate_ready':
      url = action === 'download' ? `/certificates/${data.certificateId}` : '/certificates';
      break;
    case 'connection_request':
    case 'connection_accepted':
      url = action === 'view' ? `/networking` : '/networking';
      break;
    case 'message_received':
      url = `/chat/${data.conversationId || ''}`;
      break;
    case 'badge_earned':
    case 'challenge_completed':
      url = '/gamification';
      break;
    case 'meeting_scheduled':
      url = '/networking?tab=meetings';
      break;
    case 'post_liked':
    case 'comment_received':
      url = data.postId ? `/community/post/${data.postId}` : '/community';
      break;
    default:
      url = '/notifications';
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification closed:', event);
});

// Install event
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activated');
  event.waitUntil(clients.claim());
});
