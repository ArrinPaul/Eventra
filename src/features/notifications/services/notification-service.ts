'use client';

import { getFunctions, httpsCallable } from 'firebase/functions';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './firebase';

// Initialize Functions
const functions = getFunctions(app);

// Notification types enum
export const NOTIFICATION_TYPES = {
  EVENT_REMINDER: 'event_reminder',
  EVENT_UPDATE: 'event_update',
  EVENT_STARTING: 'event_starting',
  REGISTRATION_CONFIRMED: 'registration_confirmed',
  CERTIFICATE_READY: 'certificate_ready',
  CONNECTION_REQUEST: 'connection_request',
  CONNECTION_ACCEPTED: 'connection_accepted',
  MESSAGE_RECEIVED: 'message_received',
  BADGE_EARNED: 'badge_earned',
  CHALLENGE_COMPLETED: 'challenge_completed',
  MEETING_SCHEDULED: 'meeting_scheduled',
  POST_LIKED: 'post_liked',
  COMMENT_RECEIVED: 'comment_received',
  WAITLIST_AVAILABLE: 'waitlist_available',
  SYSTEM: 'system'
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

// Send notification to a user
export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  data?: Record<string, any>,
  priority: 'normal' | 'high' = 'normal'
) {
  const sendNotificationFn = httpsCallable(functions, 'sendNotification');
  return sendNotificationFn({ userId, title, message, type, data, priority });
}

// Send bulk notifications
export async function sendBulkNotifications(
  userIds: string[],
  title: string,
  message: string,
  type: NotificationType,
  data?: Record<string, any>
) {
  const sendBulkNotificationsFn = httpsCallable(functions, 'sendBulkNotifications');
  return sendBulkNotificationsFn({ userIds, title, message, type, data });
}

// Schedule a notification for future delivery
export async function scheduleNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  scheduledFor: Date,
  data?: Record<string, any>
) {
  const scheduleNotificationFn = httpsCallable(functions, 'scheduleNotification');
  return scheduleNotificationFn({ 
    userId, 
    title, 
    message, 
    type, 
    scheduledFor: scheduledFor.toISOString(),
    data 
  });
}

// Mark notifications as read
export async function markNotificationsAsRead(notificationIds: string[]) {
  const markNotificationsAsReadFn = httpsCallable(functions, 'markNotificationsAsRead');
  return markNotificationsAsReadFn({ notificationIds });
}

// Subscribe to push notifications
export async function subscribeToNotifications(platform: 'web' | 'android' | 'ios' = 'web') {
  const subscribeToNotificationsFn = httpsCallable(functions, 'subscribeToNotifications');
  
  try {
    // Get FCM token
    const messaging = getMessaging(app);
    const fcmToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    });
    
    if (fcmToken) {
      await subscribeToNotificationsFn({ fcmToken, platform });
      return { success: true, token: fcmToken };
    }
    
    return { success: false, error: 'Failed to get FCM token' };
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    return { success: false, error };
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromNotifications(fcmToken: string) {
  const unsubscribeFromNotificationsFn = httpsCallable(functions, 'unsubscribeFromNotifications');
  return unsubscribeFromNotificationsFn({ fcmToken });
}

// Setup push notification listener
export function setupPushNotificationListener(
  onNotification: (notification: { title: string; body: string; data: any }) => void
) {
  if (typeof window === 'undefined') return () => {};
  
  try {
    const messaging = getMessaging(app);
    
    return onMessage(messaging, (payload) => {
      console.log('Push notification received:', payload);
      
      if (payload.notification) {
        onNotification({
          title: payload.notification.title || 'New Notification',
          body: payload.notification.body || '',
          data: payload.data || {}
        });
      }
    });
  } catch (error) {
    console.error('Error setting up push notification listener:', error);
    return () => {};
  }
}

// Request notification permission
export async function requestNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  
  const permission = await Notification.requestPermission();
  return permission;
}

// Check if notifications are supported
export function isNotificationsSupported(): boolean {
  return typeof window !== 'undefined' && 
         'Notification' in window && 
         'serviceWorker' in navigator;
}

// Get notification permission status
export function getNotificationPermission(): 'granted' | 'denied' | 'default' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

// Notification templates for common events
export const NotificationTemplates = {
  eventRegistration: (eventTitle: string) => ({
    title: 'Registration Confirmed! 🎉',
    message: `You're registered for "${eventTitle}". See you there!`,
    type: NOTIFICATION_TYPES.REGISTRATION_CONFIRMED
  }),
  
  eventReminder24h: (eventTitle: string) => ({
    title: 'Event Tomorrow! 📅',
    message: `"${eventTitle}" starts in 24 hours. Get ready!`,
    type: NOTIFICATION_TYPES.EVENT_REMINDER
  }),
  
  eventReminder1h: (eventTitle: string) => ({
    title: 'Event Starting Soon! ⏰',
    message: `"${eventTitle}" starts in 1 hour!`,
    type: NOTIFICATION_TYPES.EVENT_REMINDER
  }),
  
  eventStarting: (eventTitle: string) => ({
    title: 'Event Starting Now! 🚀',
    message: `"${eventTitle}" is starting! Join now.`,
    type: NOTIFICATION_TYPES.EVENT_STARTING
  }),
  
  certificateReady: (eventTitle: string) => ({
    title: 'Certificate Ready! 🏆',
    message: `Your certificate for "${eventTitle}" is ready to download.`,
    type: NOTIFICATION_TYPES.CERTIFICATE_READY
  }),
  
  connectionRequest: (userName: string) => ({
    title: 'New Connection Request! 👋',
    message: `${userName} wants to connect with you.`,
    type: NOTIFICATION_TYPES.CONNECTION_REQUEST
  }),
  
  connectionAccepted: (userName: string) => ({
    title: 'Connection Accepted! 🤝',
    message: `${userName} accepted your connection request.`,
    type: NOTIFICATION_TYPES.CONNECTION_ACCEPTED
  }),
  
  messageReceived: (senderName: string) => ({
    title: 'New Message! 💬',
    message: `${senderName} sent you a message.`,
    type: NOTIFICATION_TYPES.MESSAGE_RECEIVED
  }),
  
  badgeEarned: (badgeName: string) => ({
    title: 'Badge Earned! 🎖️',
    message: `You earned the "${badgeName}" badge!`,
    type: NOTIFICATION_TYPES.BADGE_EARNED
  }),
  
  challengeCompleted: (challengeName: string, xp: number) => ({
    title: 'Challenge Complete! 🏅',
    message: `You completed "${challengeName}" and earned ${xp} XP!`,
    type: NOTIFICATION_TYPES.CHALLENGE_COMPLETED
  }),
  
  meetingScheduled: (meetingTitle: string, dateTime: string) => ({
    title: 'Meeting Scheduled! 📆',
    message: `"${meetingTitle}" is scheduled for ${dateTime}.`,
    type: NOTIFICATION_TYPES.MEETING_SCHEDULED
  }),
  
  postLiked: (userName: string) => ({
    title: 'Post Liked! ❤️',
    message: `${userName} liked your post.`,
    type: NOTIFICATION_TYPES.POST_LIKED
  }),
  
  commentReceived: (userName: string) => ({
    title: 'New Comment! 💬',
    message: `${userName} commented on your post.`,
    type: NOTIFICATION_TYPES.COMMENT_RECEIVED
  }),
  
  waitlistAvailable: (eventTitle: string) => ({
    title: 'Spot Available! 🎫',
    message: `A spot opened up for "${eventTitle}". Register now!`,
    type: NOTIFICATION_TYPES.WAITLIST_AVAILABLE
  })
};
