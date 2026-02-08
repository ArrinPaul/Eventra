'use server';

import { generateSmartNotifications } from '@/ai/flows/smart-notifications';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function sendSmartNotifications(userId: string) {
  try {
    // 1. Fetch user data
    const users = await convex.query(api.users.list) as any[];
    const user = users.find(u => u._id === userId || u.id === userId);
    if (!user) return { success: false, error: 'User not found' };

    // 2. Fetch upcoming events
    const allEvents = await convex.query(api.events.get) as any[];
    const upcomingEvents = allEvents
      .filter(e => e.startDate > Date.now() && e.status === 'published')
      .slice(0, 10);

    // 3. Generate AI notifications
    const result = await generateSmartNotifications({
      userName: user.name || 'Attendee',
      userInterests: user.interests ? user.interests.split(',').map((i: string) => i.trim()) : ['Tech', 'Networking'],
      upcomingEvents: upcomingEvents.map(e => ({
        title: e.title,
        category: e.category,
        startDate: e.startDate,
      })),
    });

    // 4. Save notifications to Convex
    for (const note of result.notifications) {
      await convex.mutation(api.notifications.create, {
        userId: user._id as any,
        title: note.title,
        message: note.message,
        type: note.type,
      });
    }

    return { success: true, count: result.notifications.length };
  } catch (error) {
    console.error('Smart notifications error:', error);
    return { success: false, error: 'Failed to generate notifications' };
  }
}
