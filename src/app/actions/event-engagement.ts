'use server';

import { db } from '@/lib/db';
import { activityFeed } from '@/lib/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { validateRole, validateEventOwnership } from '@/lib/auth-utils';

export type DiscussionMessage = {
  id: string;
  eventId: string;
  authorId: string;
  content: string;
  isQuestion: boolean;
  isAnswered: boolean;
  likes: number;
  createdAt: Date;
};

export async function getEventDiscussion(eventId: string): Promise<DiscussionMessage[]> {
  await validateRole(['attendee', 'organizer', 'admin', 'professional']);

  try {
    const rows = await db
      .select()
      .from(activityFeed)
      .where(and(eq(activityFeed.type, 'event_discussion'), eq(activityFeed.targetId, eventId)))
      .orderBy(desc(activityFeed.createdAt));

    return rows.map((row) => {
      const meta = (row.metadata ?? {}) as { isQuestion?: boolean; isAnswered?: boolean; likes?: number };
      return {
        id: row.id,
        eventId: row.targetId || eventId,
        authorId: row.actorId || row.userId,
        content: row.content || '',
        isQuestion: !!meta.isQuestion,
        isAnswered: !!meta.isAnswered,
        likes: Number(meta.likes || 0),
        createdAt: row.createdAt,
      };
    });
  } catch (error) {
    console.error('getEventDiscussion Error:', error);
    return [];
  }
}

export async function createDiscussionMessage(input: { eventId: string; content: string; isQuestion: boolean }) {
  const user = await validateRole(['attendee', 'organizer', 'admin', 'professional']);

  try {
    const [row] = await db
      .insert(activityFeed)
      .values({
        userId: user.id,
        actorId: user.id,
        type: 'event_discussion',
        targetId: input.eventId,
        content: input.content,
        metadata: { isQuestion: input.isQuestion, isAnswered: false, likes: 0 },
      })
      .returning();

    return { success: true, id: row.id };
  } catch (error) {
    console.error('createDiscussionMessage Error:', error);
    return { success: false, id: null as string | null };
  }
}

export async function likeDiscussionMessage(id: string) {
  await validateRole(['attendee', 'organizer', 'admin', 'professional']);

  try {
    const row = await db.query.activityFeed.findFirst({ where: eq(activityFeed.id, id) });
    if (!row || row.type !== 'event_discussion') return { success: false };

    const current = (row.metadata ?? {}) as { likes?: number; isQuestion?: boolean; isAnswered?: boolean };
    await db
      .update(activityFeed)
      .set({ metadata: { ...current, likes: Number(current.likes || 0) + 1 } })
      .where(eq(activityFeed.id, id));

    return { success: true };
  } catch (error) {
    console.error('likeDiscussionMessage Error:', error);
    return { success: false };
  }
}

export async function markDiscussionMessageAnswered(id: string) {
  await validateRole(['organizer', 'admin']);

  try {
    const row = await db.query.activityFeed.findFirst({ where: eq(activityFeed.id, id) });
    if (!row || row.type !== 'event_discussion') return { success: false };
    if (row.targetId) await validateEventOwnership(row.targetId);

    const current = (row.metadata ?? {}) as Record<string, unknown>;
    await db
      .update(activityFeed)
      .set({ metadata: { ...current, isAnswered: true } })
      .where(eq(activityFeed.id, id));

    return { success: true };
  } catch (error) {
    console.error('markDiscussionMessageAnswered Error:', error);
    return { success: false };
  }
}

export type EventPoll = {
  id: string;
  eventId: string;
  question: string;
  options: string[];
  votes: Record<string, number>;
  isActive: boolean;
  createdAt: Date;
};

export async function getEventPolls(eventId: string): Promise<EventPoll[]> {
  await validateRole(['attendee', 'organizer', 'admin', 'professional']);

  try {
    const rows = await db
      .select()
      .from(activityFeed)
      .where(and(eq(activityFeed.type, 'event_poll'), eq(activityFeed.targetId, eventId)))
      .orderBy(desc(activityFeed.createdAt));

    return rows.map((row) => {
      const meta = (row.metadata ?? {}) as {
        options?: string[];
        votes?: Record<string, number>;
        isActive?: boolean;
      };
      return {
        id: row.id,
        eventId: row.targetId || eventId,
        question: row.content || '',
        options: Array.isArray(meta.options) ? meta.options : [],
        votes: meta.votes || {},
        isActive: meta.isActive ?? true,
        createdAt: row.createdAt,
      };
    });
  } catch (error) {
    console.error('getEventPolls Error:', error);
    return [];
  }
}

export async function createEventPoll(input: { eventId: string; question: string; options: string[] }) {
  const user = await validateRole(['organizer', 'admin']);
  await validateEventOwnership(input.eventId);

  try {
    const [row] = await db
      .insert(activityFeed)
      .values({
        userId: user.id,
        actorId: user.id,
        type: 'event_poll',
        targetId: input.eventId,
        content: input.question,
        metadata: { options: input.options, votes: {}, isActive: true },
      })
      .returning();

    return { success: true, id: row.id };
  } catch (error) {
    console.error('createEventPoll Error:', error);
    return { success: false, id: null as string | null };
  }
}

export async function toggleEventPoll(id: string) {
  await validateRole(['organizer', 'admin']);

  try {
    const row = await db.query.activityFeed.findFirst({ where: eq(activityFeed.id, id) });
    if (!row || row.type !== 'event_poll') return { success: false };
    if (row.targetId) await validateEventOwnership(row.targetId);

    const current = (row.metadata ?? {}) as Record<string, unknown>;
    const isActive = Boolean(current.isActive ?? true);

    await db
      .update(activityFeed)
      .set({ metadata: { ...current, isActive: !isActive } })
      .where(eq(activityFeed.id, id));

    return { success: true };
  } catch (error) {
    console.error('toggleEventPoll Error:', error);
    return { success: false };
  }
}

export async function deleteEventPoll(id: string) {
  await validateRole(['organizer', 'admin']);

  try {
    const row = await db.query.activityFeed.findFirst({ where: eq(activityFeed.id, id) });
    if (!row || row.type !== 'event_poll') return { success: false };
    if (row.targetId) await validateEventOwnership(row.targetId);

    await db.delete(activityFeed).where(eq(activityFeed.id, id));
    return { success: true };
  } catch (error) {
    console.error('deleteEventPoll Error:', error);
    return { success: false };
  }
}

export async function voteEventPoll(input: { id: string; optionIndex: number }) {
  const user = await validateRole(['attendee', 'organizer', 'admin', 'professional']);

  try {
    const row = await db.query.activityFeed.findFirst({ where: eq(activityFeed.id, input.id) });
    if (!row || row.type !== 'event_poll') return { success: false };

    const current = (row.metadata ?? {}) as {
      options?: string[];
      votes?: Record<string, number>;
      isActive?: boolean;
    };

    if (!current.isActive) return { success: false };

    const votes = { ...(current.votes || {}) };
    votes[user.id] = input.optionIndex;

    await db
      .update(activityFeed)
      .set({ metadata: { ...current, votes } })
      .where(eq(activityFeed.id, input.id));

    return { success: true };
  } catch (error) {
    console.error('voteEventPoll Error:', error);
    return { success: false };
  }
}

export type EventReactionStat = {
  emoji: string;
  count: number;
  me: boolean;
};

export async function getEventReactions(eventId: string): Promise<EventReactionStat[]> {
  const user = await validateRole(['attendee', 'organizer', 'admin', 'professional']);

  try {
    const rows = await db
      .select()
      .from(activityFeed)
      .where(and(eq(activityFeed.type, 'event_reaction'), eq(activityFeed.targetId, eventId)));

    const counts = new Map<string, number>();
    const mine = new Set<string>();

    for (const row of rows) {
      const meta = (row.metadata ?? {}) as { emoji?: string };
      const emoji = meta.emoji;
      if (!emoji) continue;
      counts.set(emoji, Number(counts.get(emoji) || 0) + 1);
      if (row.userId === user.id) mine.add(emoji);
    }

    return Array.from(counts.entries()).map(([emoji, count]) => ({
      emoji,
      count,
      me: mine.has(emoji),
    }));
  } catch (error) {
    console.error('getEventReactions Error:', error);
    return [];
  }
}

export async function addEventReaction(input: { eventId: string; emoji: string }) {
  const user = await validateRole(['attendee', 'organizer', 'admin', 'professional']);

  try {
    const rows = await db
      .select()
      .from(activityFeed)
      .where(
        and(
          eq(activityFeed.type, 'event_reaction'),
          eq(activityFeed.targetId, input.eventId),
          eq(activityFeed.userId, user.id)
        )
      );

    const existing = rows.find((row) => ((row.metadata ?? {}) as { emoji?: string }).emoji === input.emoji);

    if (existing) {
      await db.delete(activityFeed).where(eq(activityFeed.id, existing.id));
      return { success: true, reacted: false };
    }

    await db.insert(activityFeed).values({
      userId: user.id,
      actorId: user.id,
      type: 'event_reaction',
      targetId: input.eventId,
      content: 'Reacted to event',
      metadata: { emoji: input.emoji },
    });

    return { success: true, reacted: true };
  } catch (error) {
    console.error('addEventReaction Error:', error);
    return { success: false, reacted: false };
  }
}
