'use server';

import { validateRole } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { events, tickets, ticketTiers } from '@/lib/db/schema';
import { and, eq, gte, lt, sql, sum } from 'drizzle-orm';
import { ai } from '@/lib/ai';

export interface OrganizerAnalytics {
  totalEvents: number;
  totalRegistrations: number;
  totalRevenue: number;
  averageRegistrationRate: number;
  aiInsights: string;
  popularEvents: Array<{ title: string; count: number }>;
}

export async function getOrganizerAnalytics(organizerId: string): Promise<OrganizerAnalytics> {
  // Guard: Organizers or Admins only
  const user = await validateRole(['organizer', 'admin']);
  
  // Ensure they only see their own analytics unless admin
  if (user.role !== 'admin' && user.id !== organizerId) {
    throw new Error('Forbidden: Access denied');
  }

  try {
    // 1. Get stats
    const organizerEvents = await db
      .select()
      .from(events)
      .where(eq(events.organizerId, organizerId));

    const totalEvents = organizerEvents.length;
    const totalRegistrations = organizerEvents.reduce((acc, e) => acc + e.registeredCount, 0);
    
    // Revenue (Sum of all confirmed registrations for organizer's events)
    const revenueData = await db
      .select({ total: sum(tickets.price) })
      .from(tickets)
      .innerJoin(events, eq(tickets.eventId, events.id))
      .where(eq(events.organizerId, organizerId));
    
    const totalRevenue = Number(revenueData[0]?.total || 0);

    const averageRegistrationRate = totalEvents > 0 
      ? (organizerEvents.reduce((acc, e) => acc + (e.capacity > 0 ? (e.registeredCount / e.capacity) : 0), 0) / totalEvents) * 100 
      : 0;

    const popularEvents = organizerEvents
      .sort((a, b) => b.registeredCount - a.registeredCount)
      .slice(0, 5)
      .map(e => ({ title: e.title, count: e.registeredCount }));

    // 2. Get AI Insights
    const aiInsights = await getAIAnalyticsInsights({
      totalEvents,
      totalRegistrations,
      totalRevenue,
      popularEvents
    });

    return {
      totalEvents,
      totalRegistrations,
      totalRevenue,
      averageRegistrationRate,
      aiInsights,
      popularEvents,
    };
  } catch (error) {
    console.error('Analytics Error:', error);
    return {
      totalEvents: 0,
      totalRegistrations: 0,
      totalRevenue: 0,
      averageRegistrationRate: 0,
      aiInsights: 'Failed to load analytics',
      popularEvents: [],
    };
  }
}

export async function getAIAnalyticsInsights(data: any) { 
  await validateRole(['organizer', 'admin']);
  
  try {
    const prompt = `
      Analyze these organizer metrics and provide 2-3 sentences of strategic advice.
      Metrics: ${JSON.stringify(data)}
      
      Focus on growth, revenue optimization, and attendee engagement.
    `;
    
    const result = await ai.generate(prompt);
    return result.text;
  } catch (error) {
    console.error('AI Insights Error:', error);
    return 'Unable to generate AI insights at this time.';
  }
}

export interface OrganizerRevenueDashboard {
  totalRevenue: number;
  revenueTrend: number;
  ticketTrend: number;
  revenueByEvent: Array<{ title: string; revenue: number; ticketCount: number }>;
  dailyRevenue: Array<{ date: string; amount: number }>;
  revenueByTier: Record<string, number>;
}

export async function getOrganizerRevenueDashboard(): Promise<OrganizerRevenueDashboard> {
  const user = await validateRole(['organizer', 'admin']);

  try {
    const now = new Date();
    const currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - 30);

    const previousStart = new Date(now);
    previousStart.setDate(previousStart.getDate() - 60);

    const currentTotals = await db
      .select({
        revenue: sql<string>`COALESCE(SUM(${tickets.price}::numeric), 0)`,
        count: sql<string>`COUNT(${tickets.id})`,
      })
      .from(tickets)
      .innerJoin(events, eq(tickets.eventId, events.id))
      .where(
        and(
          eq(events.organizerId, user.id),
          eq(tickets.status, 'confirmed'),
          gte(tickets.purchaseDate, currentStart)
        )
      );

    const previousTotals = await db
      .select({
        revenue: sql<string>`COALESCE(SUM(${tickets.price}::numeric), 0)`,
        count: sql<string>`COUNT(${tickets.id})`,
      })
      .from(tickets)
      .innerJoin(events, eq(tickets.eventId, events.id))
      .where(
        and(
          eq(events.organizerId, user.id),
          eq(tickets.status, 'confirmed'),
          gte(tickets.purchaseDate, previousStart),
          lt(tickets.purchaseDate, currentStart)
        )
      );

    const currentRevenue = Number(currentTotals[0]?.revenue || 0);
    const previousRevenue = Number(previousTotals[0]?.revenue || 0);
    const currentTickets = Number(currentTotals[0]?.count || 0);
    const previousTickets = Number(previousTotals[0]?.count || 0);

    const revenueTrend = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : currentRevenue > 0 ? 100 : 0;
    const ticketTrend = previousTickets > 0 ? ((currentTickets - previousTickets) / previousTickets) * 100 : currentTickets > 0 ? 100 : 0;

    const byEventRows = await db
      .select({
        title: events.title,
        revenue: sql<string>`COALESCE(SUM(${tickets.price}::numeric), 0)`,
        ticketCount: sql<string>`COUNT(${tickets.id})`,
      })
      .from(events)
      .leftJoin(tickets, and(eq(tickets.eventId, events.id), eq(tickets.status, 'confirmed')))
      .where(eq(events.organizerId, user.id))
      .groupBy(events.id, events.title);

    const dailyRows = await db
      .select({
        day: sql<string>`DATE(${tickets.purchaseDate})::text`,
        amount: sql<string>`COALESCE(SUM(${tickets.price}::numeric), 0)`,
      })
      .from(tickets)
      .innerJoin(events, eq(tickets.eventId, events.id))
      .where(
        and(
          eq(events.organizerId, user.id),
          eq(tickets.status, 'confirmed'),
          gte(tickets.purchaseDate, currentStart)
        )
      )
      .groupBy(sql`DATE(${tickets.purchaseDate})`)
      .orderBy(sql`DATE(${tickets.purchaseDate})`);

    const tierRows = await db
      .select({
        tierName: ticketTiers.name,
        amount: sql<string>`COALESCE(SUM(${tickets.price}::numeric), 0)`,
      })
      .from(tickets)
      .innerJoin(events, eq(tickets.eventId, events.id))
      .leftJoin(ticketTiers, eq(tickets.tierId, ticketTiers.id))
      .where(and(eq(events.organizerId, user.id), eq(tickets.status, 'confirmed')))
      .groupBy(ticketTiers.name);

    return {
      totalRevenue: currentRevenue,
      revenueTrend,
      ticketTrend,
      revenueByEvent: byEventRows.map((row) => ({
        title: row.title,
        revenue: Number(row.revenue || 0),
        ticketCount: Number(row.ticketCount || 0),
      })),
      dailyRevenue: dailyRows.map((row) => ({
        date: row.day,
        amount: Number(row.amount || 0),
      })),
      revenueByTier: Object.fromEntries(
        tierRows.map((row) => [row.tierName || 'General', Number(row.amount || 0)])
      ),
    };
  } catch (error) {
    console.error('getOrganizerRevenueDashboard Error:', error);
    return {
      totalRevenue: 0,
      revenueTrend: 0,
      ticketTrend: 0,
      revenueByEvent: [],
      dailyRevenue: [],
      revenueByTier: {},
    };
  }
}
