'use server';

import { getUserRegistrations } from './registrations';
import { getEvents } from './events';
import { getActivityFeed } from './feed';
import { auth } from '@clerk/nextjs/server';

export async function getDashboardData() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Fetch all data in parallel on the server
  const [registrations, featuredEvents, activities] = await Promise.all([
    getUserRegistrations(),
    getEvents({ limit: 4 }), // Reduced limit for cleaner UI
    getActivityFeed({ userId, limit: 5 })  // Reduced limit for cleaner UI
  ]);

  return {
    registrations,
    featuredEvents,
    activities
  };
}
