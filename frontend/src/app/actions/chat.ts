'use server';

import { db } from '@/lib/db';
import { chatRooms, chatMessages, users, communityMembers } from '@/lib/db/schema';
import { auth } from '@/auth';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { validateRole } from '@/lib/auth-utils';

/**
 * Get all chat rooms for the current user
 */
export async function getChatRooms() {
  const session = await auth();
  if (!session?.user?.id) return [];

  try {
    // In a full implementation, we'd have a room_participants table.
    // For now, we'll fetch rooms where the user might be involved.
    // This is simplified.
    const rooms = await db
      .select()
      .from(chatRooms)
      .orderBy(desc(chatRooms.createdAt));
    
    return rooms;
  } catch (error) {
    console.error('Failed to fetch chat rooms:', error);
    return [];
  }
}

/**
 * Get messages for a specific room
 */
export async function getChatMessages(roomId: string, limit: number = 50) {
  try {
    const messages = await db
      .select({
        message: chatMessages,
        sender: {
          id: users.id,
          name: users.name,
          image: users.image,
        }
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.senderId, users.id))
      .where(eq(chatMessages.roomId, roomId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
    
    return messages.reverse(); // Return in chronological order
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return [];
  }
}

/**
 * Send a message
 */
export async function sendMessage(data: { roomId: string, content: string, imageUrl?: string }) {
  const user = await auth();
  if (!user?.user?.id) throw new Error('Authentication required');

  try {
    const newMessage = await db.insert(chatMessages).values({
      roomId: data.roomId,
      senderId: user.user.id,
      content: data.content,
      imageUrl: data.imageUrl,
    }).returning();

    return { success: true, message: newMessage[0] };
  } catch (error) {
    console.error('Failed to send message:', error);
    throw new Error('Database operation failed');
  }
}

/**
 * Create or get a direct message room
 */
export async function createChatRoom(data: { name?: string, type: 'direct' | 'group' | 'event', eventId?: string }) {
  const user = await auth();
  if (!user?.user?.id) throw new Error('Authentication required');

  try {
    const newRoom = await db.insert(chatRooms).values({
      name: data.name,
      type: data.type,
      eventId: data.eventId,
    }).returning();

    revalidatePath('/chat');
    return newRoom[0];
  } catch (error) {
    console.error('Failed to create chat room:', error);
    throw new Error('Database operation failed');
  }
}
