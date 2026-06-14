'use server';

import { getUserRegistrations } from './registrations';
import { getEvents } from './events';
import { getActivityFeed } from './feed';
import { getUserStats, getLeaderboard } from './gamification';
import { getOrganizerRevenueDashboard } from './analytics';
import { auth } from '@clerk/nextjs/server';
import { validateRole } from '@/lib/auth-utils';

export async function getDashboardData() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Check if organizer for relevant data
  let organizerStats = null;
  try {
    const user = await validateRole(['organizer', 'admin']);
    if (user) {
      organizerStats = await getOrganizerRevenueDashboard();
    }
  } catch (e) {
    // Not an organizer, skip
  }

  // Fetch all data in parallel on the server
  const [registrations, featuredEvents, activities, userStats, leaderboard] = await Promise.all([
    getUserRegistrations(),
    getEvents({ limit: 4 }),
    getActivityFeed({ userId, limit: 5 }),
    getUserStats(userId),
    getLeaderboard(5)
  ]);

  return {
    registrations,
    featuredEvents,
    activities,
    userStats,
    leaderboard,
    organizerStats
  };
}
