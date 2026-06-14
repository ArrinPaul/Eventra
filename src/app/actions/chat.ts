'use server';

import { db } from '@/lib/db';
import { chatRooms, chatMessages, users, chatParticipants } from '@/lib/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { aiChatbotFlow } from '@/lib/ai';

const sendMessageSchema = z.object({
  roomId: z.string().uuid(),
  content: z.string().min(1).max(2000),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

const createRoomSchema = z.object({
  name: z.string().max(100).optional(),
  type: z.enum(['direct', 'group', 'event']),
  eventId: z.string().uuid().optional(),
  participantIds: z.array(z.string()).optional(), // For group or direct
});

/**
 * Get all chat rooms the current user is a participant in
 */
export async function getChatRooms() {
  const { userId } = await auth();
  if (!userId) return [];

  try {
    const userRooms = await db
      .select({
        id: chatRooms.id,
        name: chatRooms.name,
        type: chatRooms.type,
        eventId: chatRooms.eventId,
        createdAt: chatRooms.createdAt,
      })
      .from(chatRooms)
      .innerJoin(chatParticipants, eq(chatRooms.id, chatParticipants.roomId))
      .where(eq(chatParticipants.userId, userId))
      .orderBy(desc(chatRooms.createdAt));
    
    return userRooms;
  } catch (error) {
    console.error('getChatRooms Error:', error);
    return [];
  }
}

/**
 * Get messages for a specific room with security check
 */
export async function getChatMessages(roomId: string, limit: number = 50) {
  const { userId } = await auth();
  if (!userId) return [];

  try {
    // Security: Check if user is a participant
    const isParticipant = await db
      .select()
      .from(chatParticipants)
      .where(and(eq(chatParticipants.roomId, roomId), eq(chatParticipants.userId, userId)))
      .limit(1);

    if (isParticipant.length === 0) throw new Error('Not a participant');

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
    
    return messages.reverse();
  } catch (error) {
    console.error('getChatMessages Error:', error);
    return [];
  }
}

/**
 * Send a message with validation and security check
 */
export async function sendMessage(rawInput: any) {
  const { userId } = await auth();
  if (!userId) throw new Error('Authentication required');

  const validated = sendMessageSchema.safeParse(rawInput);
  if (!validated.success) return { success: false, error: 'Invalid message' };

  const { roomId, content, imageUrl } = validated.data;

  try {
    // Security check
    const isParticipant = await db
      .select()
      .from(chatParticipants)
      .where(and(eq(chatParticipants.roomId, roomId), eq(chatParticipants.userId, userId)))
      .limit(1);

    if (isParticipant.length === 0) throw new Error('Not a participant');

    const newMessage = await db.insert(chatMessages).values({
      roomId,
      senderId: userId,
      content,
      imageUrl,
    }).returning();

    return { success: true, message: newMessage[0] };
  } catch (error) {
    console.error('sendMessage Error:', error);
    return { success: false, error: 'Failed to send' };
  }
}

/**
 * Generate AI-suggested replies based on recent conversation context
 */
export async function getAISuggestedReplies(roomId: string) {
  const { userId } = await auth();
  if (!userId) return [];

  try {
    const recentMessages = await getChatMessages(roomId, 5);
    if (recentMessages.length === 0) return [];

    const context = recentMessages
      .map(m => `${m.sender.name}: ${m.message.content}`)
      .join('\n');

    const prompt = `
      Given the following recent chat messages in an event group, suggest 3 short, professional, and helpful replies that a user could send.
      
      CONVERSATION:
      ${context}
      
      Return the suggestions as a JSON array of strings.
    `;

    const { answer } = await aiChatbotFlow({
      question: prompt,
      eventContext: "General Networking Chat",
    });

    try {
      // Very basic extraction if the AI didn't follow JSON format perfectly
      const match = answer.match(/\[[\s\S]*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
      return [answer.split('\n')[0]]; // Fallback
    } catch (e) {
      return [];
    }
  } catch (error) {
    console.error('getAISuggestedReplies Error:', error);
    return [];
  }
}

/**
 * Create a new chat room and add participants
 */
export async function createChatRoom(rawInput: any) {
  const { userId } = await auth();
  if (!userId) throw new Error('Authentication required');

  const validated = createRoomSchema.safeParse(rawInput);
  if (!validated.success) throw new Error('Invalid room data');

  const { name, type, eventId, participantIds } = validated.data;

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Create Room
      const newRoom = await tx.insert(chatRooms).values({
        name,
        type,
        eventId,
      }).returning();

      const roomId = newRoom[0].id;

      // 2. Add Creator
      await tx.insert(chatParticipants).values({
        roomId,
        userId: userId,
      });

      // 3. Add other participants if provided
      if (participantIds && participantIds.length > 0) {
        const participants = participantIds
          .filter(id => id !== userId)
          .map(id => ({ roomId, userId: id }));
        
        if (participants.length > 0) {
          await tx.insert(chatParticipants).values(participants);
        }
      }

      return newRoom[0];
    });

    revalidatePath('/chat');
    return result;
  } catch (error) {
    console.error('createChatRoom Error:', error);
    throw new Error('Failed to create room');
  }
}
