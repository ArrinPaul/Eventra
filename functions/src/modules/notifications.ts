import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Send notification to user
export const sendNotification = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { userId, title, message, type, data: notificationData, priority } = data;

  if (!userId || !title || !message || !type) {
    throw new functions.https.HttpsError('invalid-argument', 'userId, title, message, and type are required');
  }

  try {
    // Create notification document
    const notificationRef = await db.collection('notifications').add({
      userId,
      title,
      message,
      type,
      data: notificationData || {},
      read: false,
      priority: priority || 'normal',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      )
    });

    // Get user's FCM tokens for push notifications
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (userData?.fcmTokens && userData.fcmTokens.length > 0) {
      // Send push notification
      const payload = {
        notification: {
          title,
          body: message,
          badge: '1'
        },
        data: {
          notificationId: notificationRef.id,
          type,
          ...notificationData
        },
        android: {
          priority: (priority === 'high' ? 'high' : 'normal') as 'high' | 'normal',
          notification: {
            icon: 'ic_notification',
            color: '#FF6B6B',
            sound: 'default'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: await getUnreadNotificationCount(userId)
            }
          }
        }
      };

      // Send to all user's devices
      const response = await admin.messaging().sendMulticast({
        tokens: userData.fcmTokens,
        ...payload
      });

      // Remove invalid tokens
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (resp.error && 
            (resp.error.code === 'messaging/invalid-registration-token' ||
             resp.error.code === 'messaging/registration-token-not-registered')) {
          invalidTokens.push(userData.fcmTokens[idx]);
        }
      });

      if (invalidTokens.length > 0) {
        await db.collection('users').doc(userId).update({
          fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens)
        });
      }

      console.log(`Sent notification to ${userData.fcmTokens.length - invalidTokens.length} devices`);
    }

    // Update user's notification count
    await db.collection('users').doc(userId).update({
      unreadNotifications: admin.firestore.FieldValue.increment(1),
      lastNotificationAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { 
      success: true, 
      notificationId: notificationRef.id 
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send notification');
  }
});

// Get unread notification count for a user
async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const snapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .count()
      .get();
    
    return snapshot.data().count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

// Send bulk notifications
export const sendBulkNotifications = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { userIds, title, message, type, data: notificationData } = data;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'userIds array is required');
  }

  if (!title || !message || !type) {
    throw new functions.https.HttpsError('invalid-argument', 'title, message, and type are required');
  }

  try {
    const batch = db.batch();
    const notificationRefs: admin.firestore.DocumentReference[] = [];
    const allFcmTokens: string[] = [];

    // Create notification documents for each user
    for (const userId of userIds) {
      const notificationRef = db.collection('notifications').doc();
      notificationRefs.push(notificationRef);

      batch.set(notificationRef, {
        userId,
        title,
        message,
        type,
        data: notificationData || {},
        read: false,
        priority: 'normal',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        )
      });

      // Update user notification count
      batch.update(db.collection('users').doc(userId), {
        unreadNotifications: admin.firestore.FieldValue.increment(1),
        lastNotificationAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await batch.commit();

    // Get FCM tokens for push notifications
    const usersSnapshot = await db.collection('users')
      .where(admin.firestore.FieldPath.documentId(), 'in', userIds.slice(0, 10)) // Firestore 'in' limit
      .get();

    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      if (userData.fcmTokens && userData.fcmTokens.length > 0) {
        allFcmTokens.push(...userData.fcmTokens);
      }
    });

    // Send push notifications in batches
    if (allFcmTokens.length > 0) {
      const batchSize = 500; // FCM batch limit
      const batches = [];

      for (let i = 0; i < allFcmTokens.length; i += batchSize) {
        batches.push(allFcmTokens.slice(i, i + batchSize));
      }

      const payload = {
        notification: {
          title,
          body: message
        },
        data: {
          type,
          ...notificationData
        }
      };

      for (const tokenBatch of batches) {
        try {
          await admin.messaging().sendMulticast({
            tokens: tokenBatch,
            ...payload
          });
        } catch (error) {
          console.error('Error sending batch notification:', error);
        }
      }
    }

    return { 
      success: true, 
      notificationsSent: userIds.length,
      pushNotificationsSent: allFcmTokens.length
    };
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send bulk notifications');
  }
});

// Mark notifications as read
export const markNotificationsAsRead = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { notificationIds } = data;
  const userId = context.auth.uid;

  if (!notificationIds || !Array.isArray(notificationIds)) {
    throw new functions.https.HttpsError('invalid-argument', 'notificationIds array is required');
  }

  try {
    const batch = db.batch();

    // Update notifications
    for (const notificationId of notificationIds) {
      const notificationRef = db.collection('notifications').doc(notificationId);
      batch.update(notificationRef, {
        read: true,
        readAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await batch.commit();

    // Update user's unread count
    const currentCount = await getUnreadNotificationCount(userId);
    await db.collection('users').doc(userId).update({
      unreadNotifications: currentCount
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw new functions.https.HttpsError('internal', 'Failed to mark notifications as read');
  }
});

// Subscribe to FCM token
export const subscribeToNotifications = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { fcmToken, platform } = data;
  const userId = context.auth.uid;

  if (!fcmToken) {
    throw new functions.https.HttpsError('invalid-argument', 'fcmToken is required');
  }

  try {
    // Add token to user's FCM tokens array
    await db.collection('users').doc(userId).update({
      fcmTokens: admin.firestore.FieldValue.arrayUnion(fcmToken),
      lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
      platform: platform || 'unknown'
    });

    // Subscribe to topic notifications
    await admin.messaging().subscribeToTopic([fcmToken], 'all-users');

    return { success: true };
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    throw new functions.https.HttpsError('internal', 'Failed to subscribe');
  }
});

// Unsubscribe from FCM token
export const unsubscribeFromNotifications = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { fcmToken } = data;
  const userId = context.auth.uid;

  if (!fcmToken) {
    throw new functions.https.HttpsError('invalid-argument', 'fcmToken is required');
  }

  try {
    // Remove token from user's FCM tokens array
    await db.collection('users').doc(userId).update({
      fcmTokens: admin.firestore.FieldValue.arrayRemove(fcmToken)
    });

    // Unsubscribe from topic notifications
    await admin.messaging().unsubscribeFromTopic([fcmToken], 'all-users');

    return { success: true };
  } catch (error) {
    console.error('Error unsubscribing from notifications:', error);
    throw new functions.https.HttpsError('internal', 'Failed to unsubscribe');
  }
});

// Schedule notification (for future delivery)
export const scheduleNotification = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { 
    userId, 
    title, 
    message, 
    type, 
    scheduledFor, 
    data: notificationData 
  } = data;

  if (!userId || !title || !message || !type || !scheduledFor) {
    throw new functions.https.HttpsError('invalid-argument', 
      'userId, title, message, type, and scheduledFor are required');
  }

  try {
    const scheduledTime = new Date(scheduledFor);
    
    if (scheduledTime <= new Date()) {
      throw new functions.https.HttpsError('invalid-argument', 
        'Scheduled time must be in the future');
    }

    // Create scheduled notification document
    const scheduledNotificationRef = await db.collection('scheduledNotifications').add({
      userId,
      title,
      message,
      type,
      data: notificationData || {},
      scheduledFor: admin.firestore.Timestamp.fromDate(scheduledTime),
      status: 'scheduled',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid
    });

    return { 
      success: true, 
      scheduledNotificationId: scheduledNotificationRef.id 
    };
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw new functions.https.HttpsError('internal', 'Failed to schedule notification');
  }
});

// Process scheduled notifications (triggered by cron job)
export const processScheduledNotifications = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    console.log('Processing scheduled notifications...');
    
    try {
      const now = admin.firestore.Timestamp.now();
      
      // Get notifications ready to be sent
      const scheduledNotificationsSnapshot = await db.collection('scheduledNotifications')
        .where('status', '==', 'scheduled')
        .where('scheduledFor', '<=', now)
        .limit(100)
        .get();

      if (scheduledNotificationsSnapshot.empty) {
        console.log('No scheduled notifications to process');
        return null;
      }

      const batch = db.batch();
      const notifications = [];

      for (const doc of scheduledNotificationsSnapshot.docs) {
        const notificationData = doc.data();
        
        // Create actual notification
        const notificationRef = db.collection('notifications').doc();
        batch.set(notificationRef, {
          userId: notificationData.userId,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          data: notificationData.data || {},
          read: false,
          priority: 'normal',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: admin.firestore.Timestamp.fromDate(
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          )
        });

        // Mark scheduled notification as sent
        batch.update(doc.ref, {
          status: 'sent',
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          actualNotificationId: notificationRef.id
        });

        // Update user notification count
        batch.update(db.collection('users').doc(notificationData.userId), {
          unreadNotifications: admin.firestore.FieldValue.increment(1),
          lastNotificationAt: admin.firestore.FieldValue.serverTimestamp()
        });

        notifications.push({
          userId: notificationData.userId,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          data: notificationData.data
        });
      }

      await batch.commit();

      // Send push notifications
      for (const notification of notifications) {
        try {
          const userDoc = await db.collection('users').doc(notification.userId).get();
          const userData = userDoc.data();

          if (userData?.fcmTokens && userData.fcmTokens.length > 0) {
            await admin.messaging().sendMulticast({
              tokens: userData.fcmTokens,
              notification: {
                title: notification.title,
                body: notification.message
              },
              data: {
                type: notification.type,
                ...notification.data
              }
            });
          }
        } catch (error) {
          console.error(`Error sending push notification to user ${notification.userId}:`, error);
        }
      }

      console.log(`Processed ${notifications.length} scheduled notifications`);
      return null;
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
      throw error;
    }
  });

// Clean up expired notifications
export const cleanupExpiredNotifications = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    console.log('Cleaning up expired notifications...');
    
    try {
      const now = admin.firestore.Timestamp.now();
      
      // Get expired notifications
      const expiredNotificationsSnapshot = await db.collection('notifications')
        .where('expiresAt', '<', now)
        .limit(500) // Process in batches
        .get();

      if (expiredNotificationsSnapshot.empty) {
        console.log('No expired notifications to clean up');
        return null;
      }

      const batch = db.batch();

      expiredNotificationsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log(`Deleted ${expiredNotificationsSnapshot.docs.length} expired notifications`);
      
      // Clean up old scheduled notifications
      const oldScheduledSnapshot = await db.collection('scheduledNotifications')
        .where('status', '==', 'sent')
        .where('sentAt', '<', admin.firestore.Timestamp.fromDate(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        ))
        .limit(500)
        .get();

      if (!oldScheduledSnapshot.empty) {
        const scheduledBatch = db.batch();
        oldScheduledSnapshot.docs.forEach(doc => {
          scheduledBatch.delete(doc.ref);
        });
        await scheduledBatch.commit();
        
        console.log(`Deleted ${oldScheduledSnapshot.docs.length} old scheduled notifications`);
      }

      return null;
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      throw error;
    }
  });

// Send event reminders
export const sendEventReminders = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    console.log('Sending event reminders...');
    
    try {
      const now = new Date();
      const reminderTimes = [
        new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours
        new Date(now.getTime() + 60 * 60 * 1000), // 1 hour
        new Date(now.getTime() + 15 * 60 * 1000), // 15 minutes
      ];

      for (const reminderTime of reminderTimes) {
        const eventsSnapshot = await db.collection('events')
          .where('startTime', '>=', admin.firestore.Timestamp.fromDate(new Date(reminderTime.getTime() - 5 * 60 * 1000)))
          .where('startTime', '<=', admin.firestore.Timestamp.fromDate(new Date(reminderTime.getTime() + 5 * 60 * 1000)))
          .get();

        for (const eventDoc of eventsSnapshot.docs) {
          const event = eventDoc.data();
          
          // Get registered users for this event
          const registrationsSnapshot = await db.collection('registrations')
            .where('eventId', '==', eventDoc.id)
            .where('status', '==', 'registered')
            .get();

          const userIds = registrationsSnapshot.docs.map(doc => doc.data().userId);

          if (userIds.length > 0) {
            const timeDiff = reminderTime.getTime() - now.getTime();
            const timeText = timeDiff > 12 * 60 * 60 * 1000 ? '24 hours' :
                           timeDiff > 30 * 60 * 1000 ? '1 hour' : '15 minutes';

            // Send individual notifications to each user
            const promises = userIds.map(userId => {
              return admin.firestore().collection('notifications').add({
                userId,
                title: `Event Reminder: ${event.title}`,
                message: `Your event "${event.title}" starts in ${timeText}`,
                type: 'event_reminder',
                read: false,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                data: {
                  eventId: eventDoc.id,
                  eventTitle: event.title,
                  startTime: event.startTime.toDate().toISOString(),
                  reminderType: timeText
                }
              });
            });
            await Promise.all(promises);
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error sending event reminders:', error);
      throw error;
    }
  });

export const notificationFunctions = {
  sendNotification,
  sendBulkNotifications,
  markNotificationsAsRead,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  scheduleNotification,
  processScheduledNotifications,
  cleanupExpiredNotifications,
  sendEventReminders
};