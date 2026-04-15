'use server';

import { validateRole } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { events, tickets, ticketTiers } from '@/lib/db/schema';
import { eq, sql, sum } from 'drizzle-orm';
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
