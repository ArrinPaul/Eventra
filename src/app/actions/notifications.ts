'use server';

import { db } from '@/core/config/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

// Notification types
export type NotificationType = 
  | 'event_reminder'
  | 'event_update'
  | 'event_starting'
  | 'registration_confirmed'
  | 'certificate_ready'
  | 'connection_request'
  | 'connection_accepted'
  | 'message_received'
  | 'badge_earned'
  | 'challenge_completed'
  | 'meeting_scheduled'
  | 'post_liked'
  | 'comment_received'
  | 'waitlist_available'
  | 'system';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, any>;
  priority?: 'normal' | 'high';
}

// Create a notification in Firestore
export async function createNotification({
  userId,
  title,
  message,
  type,
  data = {},
  priority = 'normal'
}: CreateNotificationParams) {
  try {
    const notificationRef = await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type,
      data,
      read: false,
      priority,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    });

    return { success: true, notificationId: notificationRef.id };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
}

// Send registration confirmation notification
export async function sendRegistrationConfirmation(
  userId: string,
  eventId: string,
  eventTitle: string,
  ticketNumber: string
) {
  return createNotification({
    userId,
    title: 'Registration Confirmed! ðŸŽ‰',
    message: `You're registered for "${eventTitle}". Your ticket number is ${ticketNumber}.`,
    type: 'registration_confirmed',
    data: { eventId, eventTitle, ticketNumber }
  });
}

// Send event reminder notification
export async function sendEventReminder(
  userId: string,
  eventId: string,
  eventTitle: string,
  timeUntil: '24h' | '1h' | '15min'
) {
  const timeText = timeUntil === '24h' ? '24 hours' : timeUntil === '1h' ? '1 hour' : '15 minutes';
  const emoji = timeUntil === '15min' ? 'ðŸš€' : timeUntil === '1h' ? 'â°' : 'ðŸ“…';

  return createNotification({
    userId,
    title: `Event ${timeUntil === '15min' ? 'Starting Soon' : 'Reminder'}! ${emoji}`,
    message: `"${eventTitle}" starts in ${timeText}!`,
    type: timeUntil === '15min' ? 'event_starting' : 'event_reminder',
    data: { eventId, eventTitle, reminderType: timeUntil },
    priority: timeUntil === '15min' ? 'high' : 'normal'
  });
}

// Send certificate ready notification
export async function sendCertificateReady(
  userId: string,
  eventId: string,
  eventTitle: string,
  certificateId: string
) {
  return createNotification({
    userId,
    title: 'Certificate Ready! ðŸ†',
    message: `Your certificate for "${eventTitle}" is ready to download.`,
    type: 'certificate_ready',
    data: { eventId, eventTitle, certificateId }
  });
}

// Send connection request notification
export async function sendConnectionRequest(
  userId: string,
  fromUserId: string,
  fromUserName: string,
  fromUserPhoto?: string
) {
  return createNotification({
    userId,
    title: 'New Connection Request! ðŸ‘‹',
    message: `${fromUserName} wants to connect with you.`,
    type: 'connection_request',
    data: { fromUserId, fromUserName, fromUserPhoto }
  });
}

// Send connection accepted notification
export async function sendConnectionAccepted(
  userId: string,
  acceptedByUserId: string,
  acceptedByUserName: string
) {
  return createNotification({
    userId,
    title: 'Connection Accepted! ðŸ¤',
    message: `${acceptedByUserName} accepted your connection request.`,
    type: 'connection_accepted',
    data: { acceptedByUserId, acceptedByUserName }
  });
}

// Send message notification
export async function sendMessageNotification(
  userId: string,
  fromUserId: string,
  fromUserName: string,
  conversationId: string,
  messagePreview?: string
) {
  return createNotification({
    userId,
    title: `New Message from ${fromUserName} ðŸ’¬`,
    message: messagePreview ? `"${messagePreview.substring(0, 50)}${messagePreview.length > 50 ? '...' : ''}"` : 'You have a new message.',
    type: 'message_received',
    data: { fromUserId, fromUserName, conversationId }
  });
}

// Send badge earned notification
export async function sendBadgeEarned(
  userId: string,
  badgeId: string,
  badgeName: string,
  badgeDescription: string,
  xpEarned?: number
) {
  return createNotification({
    userId,
    title: 'Badge Earned! ðŸŽ–ï¸',
    message: `You earned the "${badgeName}" badge${xpEarned ? ` and ${xpEarned} XP` : ''}!`,
    type: 'badge_earned',
    data: { badgeId, badgeName, badgeDescription, xpEarned }
  });
}

// Send challenge completed notification
export async function sendChallengeCompleted(
  userId: string,
  challengeId: string,
  challengeName: string,
  xpReward: number,
  badgeReward?: string
) {
  return createNotification({
    userId,
    title: 'Challenge Complete! ðŸ…',
    message: `You completed "${challengeName}" and earned ${xpReward} XP${badgeReward ? ` + ${badgeReward} badge` : ''}!`,
    type: 'challenge_completed',
    data: { challengeId, challengeName, xpReward, badgeReward }
  });
}

// Send meeting scheduled notification
export async function sendMeetingScheduled(
  userId: string,
  meetingId: string,
  meetingTitle: string,
  scheduledTime: Date,
  organizerName: string
) {
  return createNotification({
    userId,
    title: 'Meeting Scheduled! ðŸ“†',
    message: `${organizerName} scheduled "${meetingTitle}" for ${scheduledTime.toLocaleDateString()} at ${scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
    type: 'meeting_scheduled',
    data: { meetingId, meetingTitle, scheduledTime: scheduledTime.toISOString(), organizerName }
  });
}

// Send post interaction notifications
export async function sendPostLiked(
  userId: string,
  postId: string,
  likedByName: string
) {
  return createNotification({
    userId,
    title: 'Post Liked! â¤ï¸',
    message: `${likedByName} liked your post.`,
    type: 'post_liked',
    data: { postId, likedByName }
  });
}

export async function sendCommentReceived(
  userId: string,
  postId: string,
  commenterId: string,
  commenterName: string,
  commentPreview?: string
) {
  return createNotification({
    userId,
    title: 'New Comment! ðŸ’¬',
    message: `${commenterName} commented: "${commentPreview?.substring(0, 50) || 'View comment'}"`,
    type: 'comment_received',
    data: { postId, commenterId, commenterName }
  });
}

// Send waitlist notification
export async function sendWaitlistAvailable(
  userId: string,
  eventId: string,
  eventTitle: string
) {
  return createNotification({
    userId,
    title: 'Spot Available! ðŸŽ«',
    message: `A spot opened up for "${eventTitle}". Register now before it fills up!`,
    type: 'waitlist_available',
    data: { eventId, eventTitle },
    priority: 'high'
  });
}

// Send event update notification
export async function sendEventUpdate(
  userId: string,
  eventId: string,
  eventTitle: string,
  updateType: 'time_change' | 'venue_change' | 'cancelled' | 'other',
  updateDetails?: string
) {
  const titles = {
    time_change: 'Event Time Changed! â°',
    venue_change: 'Venue Changed! ðŸ“',
    cancelled: 'Event Cancelled ðŸ˜”',
    other: 'Event Update! ðŸ“¢'
  };

  return createNotification({
    userId,
    title: titles[updateType],
    message: updateDetails || `"${eventTitle}" has been updated. Please check the event details.`,
    type: 'event_update',
    data: { eventId, eventTitle, updateType },
    priority: updateType === 'cancelled' ? 'high' : 'normal'
  });
}
