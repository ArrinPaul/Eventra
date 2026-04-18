'use server';

import { db } from '@/lib/db';
import { activityFeed } from '@/lib/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { validateEventOwnership, validateRole } from '@/lib/auth-utils';

export type AnnouncementType = 'info' | 'warning' | 'urgent';

export type AnnouncementItem = {
  id: string;
  content: string;
  type: AnnouncementType;
  expiresAt: number | null;
  active: boolean;
  createdAt: Date;
};

export async function listAnnouncements(eventId: string): Promise<AnnouncementItem[]> {
  await validateRole(['organizer', 'admin']);

  try {
    const rows = await db
      .select()
      .from(activityFeed)
      .where(and(eq(activityFeed.type, 'organizer_announcement'), eq(activityFeed.targetId, eventId)))
      .orderBy(desc(activityFeed.createdAt));

    return rows.map((row) => {
      const meta = (row.metadata ?? {}) as { type?: AnnouncementType; expiresAt?: number | null; active?: boolean };
      return {
        id: row.id,
        content: row.content ?? '',
        type: meta.type ?? 'info',
        expiresAt: meta.expiresAt ?? null,
        active: meta.active ?? true,
        createdAt: row.createdAt,
      };
    });
  } catch (error) {
    console.error('listAnnouncements Error:', error);
    return [];
  }
}

export async function createAnnouncement(input: {
  eventId: string;
  content: string;
  type: AnnouncementType;
  expiresHours: number;
}) {
  const user = await validateRole(['organizer', 'admin']);
  await validateEventOwnership(input.eventId);

  try {
    const expiresAt = Date.now() + Math.max(1, input.expiresHours) * 60 * 60 * 1000;
    const [row] = await db
      .insert(activityFeed)
      .values({
        userId: user.id,
        actorId: user.id,
        type: 'organizer_announcement',
        targetId: input.eventId,
        content: input.content,
        metadata: { type: input.type, expiresAt, active: true },
      })
      .returning();

    return { success: true, id: row.id };
  } catch (error) {
    console.error('createAnnouncement Error:', error);
    return { success: false, id: null as string | null };
  }
}

export async function updateAnnouncement(input: {
  id: string;
  content: string;
  type: AnnouncementType;
  expiresHours: number;
}) {
  await validateRole(['organizer', 'admin']);

  try {
    const existing = await db.query.activityFeed.findFirst({ where: eq(activityFeed.id, input.id) });
    if (!existing || existing.type !== 'organizer_announcement') {
      return { success: false };
    }

    await validateEventOwnership(existing.targetId || '');

    const expiresAt = Date.now() + Math.max(1, input.expiresHours) * 60 * 60 * 1000;
    await db
      .update(activityFeed)
      .set({
        content: input.content,
        metadata: { type: input.type, expiresAt, active: true },
      })
      .where(eq(activityFeed.id, input.id));

    return { success: true };
  } catch (error) {
    console.error('updateAnnouncement Error:', error);
    return { success: false };
  }
}

export async function deactivateAnnouncement(id: string) {
  await validateRole(['organizer', 'admin']);

  try {
    const existing = await db.query.activityFeed.findFirst({ where: eq(activityFeed.id, id) });
    if (!existing || existing.type !== 'organizer_announcement') return { success: false };
    await validateEventOwnership(existing.targetId || '');

    const current = (existing.metadata ?? {}) as Record<string, unknown>;
    await db
      .update(activityFeed)
      .set({ metadata: { ...current, active: false } })
      .where(eq(activityFeed.id, id));

    return { success: true };
  } catch (error) {
    console.error('deactivateAnnouncement Error:', error);
    return { success: false };
  }
}

export type WebhookItem = {
  id: string;
  url: string;
  events: string[];
  secret: string;
  createdAt: Date;
};

function randomSecret(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export async function listWebhooks(eventId?: string): Promise<WebhookItem[]> {
  await validateRole(['organizer', 'admin']);

  try {
    const rows = await db
      .select()
      .from(activityFeed)
      .where(eventId ? and(eq(activityFeed.type, 'organizer_webhook'), eq(activityFeed.targetId, eventId)) : eq(activityFeed.type, 'organizer_webhook'))
      .orderBy(desc(activityFeed.createdAt));

    return rows.map((row) => {
      const meta = (row.metadata ?? {}) as { events?: string[]; secret?: string };
      return {
        id: row.id,
        url: row.content || '',
        events: Array.isArray(meta.events) ? meta.events : [],
        secret: meta.secret || '',
        createdAt: row.createdAt,
      };
    });
  } catch (error) {
    console.error('listWebhooks Error:', error);
    return [];
  }
}

export async function createWebhook(input: { eventId?: string; url: string; events: string[] }) {
  const user = await validateRole(['organizer', 'admin']);
  if (input.eventId) await validateEventOwnership(input.eventId);

  try {
    const [row] = await db
      .insert(activityFeed)
      .values({
        userId: user.id,
        actorId: user.id,
        type: 'organizer_webhook',
        targetId: input.eventId || null,
        content: input.url,
        metadata: { events: input.events, secret: randomSecret() },
      })
      .returning();

    return { success: true, id: row.id };
  } catch (error) {
    console.error('createWebhook Error:', error);
    return { success: false, id: null as string | null };
  }
}

export async function deleteWebhook(id: string) {
  await validateRole(['organizer', 'admin']);

  try {
    const existing = await db.query.activityFeed.findFirst({ where: eq(activityFeed.id, id) });
    if (!existing || existing.type !== 'organizer_webhook') return { success: false };
    if (existing.targetId) await validateEventOwnership(existing.targetId);

    await db.delete(activityFeed).where(eq(activityFeed.id, id));
    return { success: true };
  } catch (error) {
    console.error('deleteWebhook Error:', error);
    return { success: false };
  }
}
