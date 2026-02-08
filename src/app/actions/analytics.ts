'use server';

import { generateAnalyticsInsights } from '@/ai/flows/analytics-insights';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export interface OrganizerAnalytics {
  totalEvents: number;
  totalRegistrations: number;
  totalRevenue: number;
  averageRegistrationRate: number;
  popularEvents: Array<{ title: string, count: number }>;
  aiInsights?: string;
}

export async function getOrganizerAnalytics(userId: string): Promise<OrganizerAnalytics> {
  try {
    // 1. Fetch all events for this organizer
    const allEvents = await convex.query(api.events.get) as any[];
    const organizerEvents = allEvents.filter(e => e.organizerId === userId);

    if (organizerEvents.length === 0) {
      return {
        totalEvents: 0,
        totalRegistrations: 0,
        totalRevenue: 0,
        averageRegistrationRate: 0,
        popularEvents: [],
        aiInsights: "No events found. Start by creating an event to see insights!"
      };
    }

    const totalEvents = organizerEvents.length;
    const totalRegistrations = organizerEvents.reduce((sum, e) => sum + (e.registeredCount || 0), 0);
    const totalRevenue = organizerEvents.reduce((sum, e) => sum + (e.isPaid ? (e.price || 0) * (e.registeredCount || 0) : 0), 0);
    
    const popularEvents = organizerEvents
      .sort((a, b) => (b.registeredCount || 0) - (a.registeredCount || 0))
      .slice(0, 5)
      .map(e => ({ title: e.title, count: e.registeredCount || 0 }));

    // 2. Prepare data for AI insights
    const popularityData = popularEvents.map(e => `${e.title}: ${e.count} attendees`).join(', ');

    // 3. Call AI Flow
    const aiResult = await generateAnalyticsInsights({
      sessionPopularity: popularityData
    });

    return {
      totalEvents,
      totalRegistrations,
      totalRevenue,
      averageRegistrationRate: totalRegistrations / totalEvents,
      popularEvents,
      aiInsights: aiResult.insights
    };

  } catch (error) {
    console.error('Analytics error:', error);
    return {
      totalEvents: 0,
      totalRegistrations: 0,
      totalRevenue: 0,
      averageRegistrationRate: 0,
      popularEvents: [],
      aiInsights: "Error generating analytics insights."
    };
  }
}
