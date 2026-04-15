'use server';

import { db } from '@/lib/db';
import { activityFeed, users, events, posts } from '@/lib/db/schema';
import { auth } from '@/auth';
import { eq, desc, and, or, sql, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export type ActivityType = 'registration' | 'post' | 'comment' | 'event_created' | 'badge_awarded' | 'community_joined';

/**
 * Log a new activity to the feed
 */
export async function logActivity(data: {
  userId: string;
  type: ActivityType;
  actorId?: string;
  targetId?: string;
  content?: string;
  metadata?: any;
}) {
  try {
    const newActivity = await db.insert(activityFeed).values({
      userId: data.userId,
      type: data.type,
      actorId: data.actorId || data.userId,
      targetId: data.targetId,
      content: data.content,
      metadata: data.metadata,
    }).returning();

    return newActivity[0];
  } catch (error) {
    console.error('Failed to log activity:', error);
    return null;
  }
}

/**
 * Get the global or user-specific activity feed
 */
export async function getActivityFeed(options?: { userId?: string, limit?: number }) {
  try {
    const query = db
      .select({
        activity: activityFeed,
        user: {
          id: users.id,
          name: users.name,
          image: users.image,
        },
        actor: {
          id: users.id, // We'll need another join if actor is different, but for now we assume same or handle in UI
          name: users.name,
          image: users.image,
        }
      })
      .from(activityFeed)
      .innerJoin(users, eq(activityFeed.userId, users.id))
      .orderBy(desc(activityFeed.createdAt))
      .limit(options?.limit || 50);

    if (options?.userId) {
      // In a real social app, this would be "feed from people I follow"
      // For now, it's just filtered by the user.
      query.where(eq(activityFeed.userId, options.userId));
    }

    const results = await query;
    return results;
  } catch (error) {
    console.error('Failed to fetch activity feed:', error);
    return [];
  }
}

/**
 * Get personalized feed (from connections)
 */
export async function getPersonalizedFeed() {
  const session = await auth();
  if (!session?.user?.id) return getActivityFeed();

  try {
    // 1. Get user follows
    const userFollows = await db.execute(sql`
      SELECT following_id FROM follows WHERE follower_id = ${session.user.id}
    `);
    
    const followingIds = (userFollows as any).map((f: any) => f.following_id);
    
    if (followingIds.length === 0) {
      return getActivityFeed();
    }

    // 2. Add self to the list
    followingIds.push(session.user.id);

    // 3. Get activities from followed users
    const results = await db
      .select({
        activity: activityFeed,
        user: {
          id: users.id,
          name: users.name,
          image: users.image,
        }
      })
      .from(activityFeed)
      .innerJoin(users, eq(activityFeed.userId, users.id))
      .where(inArray(activityFeed.userId, followingIds))
      .orderBy(desc(activityFeed.createdAt))
      .limit(50);

    return results;
  } catch (error) {
    console.error('Failed to fetch personalized feed:', error);
    return getActivityFeed();
  }
}
