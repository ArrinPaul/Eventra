'use server';

import { db } from '@/lib/db';
import { users, events, tickets, activityFeed } from '@/lib/db/schema';
import { and, count, desc, eq, gte, ilike, or, sql } from 'drizzle-orm';
import { validateRole } from '@/lib/auth-utils';

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  points: number;
  level: number;
  createdAt: Date;
};

export async function listAdminUsers(filters?: {
  search?: string;
  role?: string;
  limit?: number;
}): Promise<AdminUserRow[]> {
  await validateRole(['admin']);

  try {
    const conditions = [];
    if (filters?.search) {
      conditions.push(or(ilike(users.name, `%${filters.search}%`), ilike(users.email, `%${filters.search}%`)));
    }
    if (filters?.role && filters.role !== 'all') {
      conditions.push(eq(users.role, filters.role));
    }

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        points: users.points,
        level: users.level,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(users.createdAt))
      .limit(filters?.limit ?? 100);

    return rows;
  } catch (error) {
    console.error('listAdminUsers Error:', error);
    return [];
  }
}

export async function updateAdminUserRole(userId: string, role: string) {
  await validateRole(['admin']);

  try {
    const [updated] = await db
      .update(users)
      .set({ role: role as any, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({ id: users.id, role: users.role });

    return { success: !!updated, user: updated ?? null };
  } catch (error) {
    console.error('updateAdminUserRole Error:', error);
    return { success: false, user: null as { id: string; role: string } | null };
  }
}

export async function listModerationEvents(status?: string) {
  await validateRole(['admin']);

  try {
    return await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        status: events.status,
        category: events.category,
        capacity: events.capacity,
        organizerId: events.organizerId,
        createdAt: events.createdAt,
      })
      .from(events)
      .where(status && status !== 'all' ? eq(events.status, status) : undefined)
      .orderBy(desc(events.createdAt))
      .limit(200);
  } catch (error) {
    console.error('listModerationEvents Error:', error);
    return [];
  }
}

export async function moderateEventStatus(eventId: string, action: 'approve' | 'reject' | 'suspend') {
  await validateRole(['admin']);

  const nextStatus = action === 'approve' ? 'published' : action === 'reject' ? 'cancelled' : 'draft';

  try {
    const [updated] = await db
      .update(events)
      .set({ status: nextStatus as any, updatedAt: new Date() })
      .where(eq(events.id, eventId))
      .returning({ id: events.id, status: events.status });

    return { success: !!updated, event: updated ?? null };
  } catch (error) {
    console.error('moderateEventStatus Error:', error);
    return { success: false, event: null as { id: string; status: string } | null };
  }
}

export type SystemSettings = {
  siteName: string;
  supportEmail: string;
  chatEnabled: boolean;
  feedEnabled: boolean;
  gamificationEnabled: boolean;
  aiRecommendations: boolean;
};

const defaultSettings: SystemSettings = {
  siteName: 'Eventra',
  supportEmail: 'support@eventra.app',
  chatEnabled: true,
  feedEnabled: true,
  gamificationEnabled: true,
  aiRecommendations: true,
};

export async function getSystemSettings(): Promise<SystemSettings> {
  await validateRole(['admin']);

  try {
    const latest = await db.query.activityFeed.findFirst({
      where: and(eq(activityFeed.type, 'admin_setting'), eq(activityFeed.targetId, 'global')),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });

    const raw = (latest?.metadata ?? {}) as Partial<SystemSettings>;
    return {
      ...defaultSettings,
      ...raw,
    };
  } catch (error) {
    console.error('getSystemSettings Error:', error);
    return defaultSettings;
  }
}

export async function updateSystemSettings(partial: Partial<SystemSettings>) {
  const user = await validateRole(['admin']);

  try {
    const merged = { ...(await getSystemSettings()), ...partial };

    await db.insert(activityFeed).values({
      userId: user.id,
      actorId: user.id,
      type: 'admin_setting',
      targetId: 'global',
      content: 'Updated admin settings',
      metadata: merged,
    });

    return { success: true, settings: merged };
  } catch (error) {
    console.error('updateSystemSettings Error:', error);
    return { success: false, settings: await getSystemSettings() };
  }
}

export interface PlatformStats {
  totalEvents: number;
  activeEvents: number;
  totalUsers: number;
  totalRegistrations: number;
  eventsByCategory: Record<string, number>;
  eventsByStatus: Record<string, number>;
  recentRegistrations: number;
  upcomingEvents: number;
  completedEvents: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [allEvents, allUsers, allTickets, recentTickets] = await Promise.all([
      db.select({ id: events.id, category: events.category, status: events.status, startDate: events.startDate, endDate: events.endDate }).from(events),
      db.select({ value: count() }).from(users),
      db.select({ value: count() }).from(tickets),
      db.select({ value: count() }).from(tickets).where(gte(tickets.purchaseDate, thirtyDaysAgo)),
    ]);

    const eventsByCategory: Record<string, number> = {};
    const eventsByStatus: Record<string, number> = {};
    let activeEvents = 0;
    let upcomingEvents = 0;
    let completedEvents = 0;

    for (const e of allEvents) {
      eventsByCategory[e.category] = (eventsByCategory[e.category] || 0) + 1;
      eventsByStatus[e.status] = (eventsByStatus[e.status] || 0) + 1;
      if (e.status === 'published') activeEvents++;
      if (e.startDate && e.startDate > now) upcomingEvents++;
      if (e.endDate && e.endDate < now) completedEvents++;
    }

    return {
      totalEvents: allEvents.length,
      activeEvents,
      totalUsers: allUsers[0]?.value ?? 0,
      totalRegistrations: allTickets[0]?.value ?? 0,
      eventsByCategory,
      eventsByStatus,
      recentRegistrations: recentTickets[0]?.value ?? 0,
      upcomingEvents,
      completedEvents,
    };
  } catch (error) {
    console.error('getPlatformStats Error:', error);
    return {
      totalEvents: 0,
      activeEvents: 0,
      totalUsers: 0,
      totalRegistrations: 0,
      eventsByCategory: {},
      eventsByStatus: {},
      recentRegistrations: 0,
      upcomingEvents: 0,
      completedEvents: 0,
    };
  }
}

export interface AdminAnalytics {
  stats: { totalUsers: number; activeEvents: number; totalRegistrations: number; userTrend: number };
  detailed: {
    engagement: { registrations: number; messages: number; badgesEarned: number };
    usersByRole: Record<string, number>;
    eventsByStatus: Record<string, number>;
  };
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  await validateRole(['admin']);

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [allUsers, allEvents, currentTickets, previousTickets] = await Promise.all([
      db.select({ role: users.role }).from(users),
      db.select({ status: events.status }).from(events),
      db.select({ value: count() }).from(tickets).where(gte(tickets.purchaseDate, thirtyDaysAgo)),
      db.select({ value: count() }).from(tickets).where(and(gte(tickets.purchaseDate, sixtyDaysAgo), sql`${tickets.purchaseDate} < ${thirtyDaysAgo}`)),
    ]);

    const usersByRole: Record<string, number> = {};
    for (const u of allUsers) {
      usersByRole[u.role] = (usersByRole[u.role] || 0) + 1;
    }

    const eventsByStatus: Record<string, number> = {};
    let activeEvents = 0;
    for (const e of allEvents) {
      eventsByStatus[e.status] = (eventsByStatus[e.status] || 0) + 1;
      if (e.status === 'published') activeEvents++;
    }

    const currentReg = currentTickets[0]?.value ?? 0;
    const previousReg = previousTickets[0]?.value ?? 0;
    const userTrend = previousReg > 0 ? Math.round(((currentReg - previousReg) / previousReg) * 100) : currentReg > 0 ? 100 : 0;

    return {
      stats: {
        totalUsers: allUsers.length,
        activeEvents,
        totalRegistrations: currentReg,
        userTrend,
      },
      detailed: {
        engagement: { registrations: currentReg, messages: 0, badgesEarned: 0 },
        usersByRole,
        eventsByStatus,
      },
    };
  } catch (error) {
    console.error('getAdminAnalytics Error:', error);
    return {
      stats: { totalUsers: 0, activeEvents: 0, totalRegistrations: 0, userTrend: 0 },
      detailed: { engagement: { registrations: 0, messages: 0, badgesEarned: 0 }, usersByRole: {}, eventsByStatus: {} },
    };
  }
}
