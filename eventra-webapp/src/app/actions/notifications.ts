'use server';

import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { auth } from '@/auth';
import { eq, and, desc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Get notifications for the current user
 */
export async function getNotifications(limit = 20) {
  const session = await auth();
  if (!session?.user?.id) return [];

  try {
    const results = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
    
    return results;
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return [];
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Auth required');

  try {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)));
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    throw new Error('Failed to update notification');
  }
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Auth required');

  try {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, session.user.id));
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    throw new Error('Failed to update notifications');
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Auth required');

  try {
    await db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)));
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    throw new Error('Failed to delete notification');
  }
}

/**
 * Create a notification (Internal helper for server actions)
 */
export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}) {
  try {
    const result = await db.insert(notifications).values({
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      link: data.link,
    }).returning();
    
    return result[0];
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}
