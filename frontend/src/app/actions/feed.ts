'use server';

import { db } from '@/lib/db';
import { events, posts, tickets, users, communities } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export interface FeedItem {
  id: string;
  type: 'event' | 'post' | 'registration';
  content: any;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  timestamp: Date;
}

/**
 * Get aggregated activity feed for the user
 */
export async function getActivityFeed(limit: number = 20) {
  try {
    // 1. Fetch recent events
    const recentEvents = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        imageUrl: events.imageUrl,
        category: events.category,
        startDate: events.startDate,
        organizerId: events.organizerId,
        createdAt: events.createdAt,
      })
      .from(events)
      .orderBy(desc(events.createdAt))
      .limit(limit);

    // 2. Fetch recent posts
    const recentPosts = await db
      .select({
        post: posts,
        author: {
          id: users.id,
          name: users.name,
          image: users.image,
        },
        community: communities,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .leftJoin(communities, eq(posts.communityId, communities.id))
      .orderBy(desc(posts.createdAt))
      .limit(limit);

    // 3. Fetch recent tickets/registrations (Public visibility only if needed)
    // For this feed, we'll just show "Someone registered for X" (generalized)
    const recentRegistrations = await db
      .select({
        id: tickets.id,
        eventId: tickets.eventId,
        userId: tickets.userId,
        purchaseDate: tickets.purchaseDate,
        user: {
          id: users.id,
          name: users.name,
          image: users.image,
        },
        eventTitle: events.title,
      })
      .from(tickets)
      .innerJoin(users, eq(tickets.userId, users.id))
      .innerJoin(events, eq(tickets.eventId, events.id))
      .orderBy(desc(tickets.purchaseDate))
      .limit(limit);

    // 4. Transform and Merge
    const feed: FeedItem[] = [
      ...recentEvents.map(e => ({
        id: e.id,
        type: 'event' as const,
        content: e,
        user: { id: e.organizerId, name: 'Organizer', image: null }, // Would join users to get real name
        timestamp: e.createdAt,
      })),
      ...recentPosts.map(p => ({
        id: p.post.id,
        type: 'post' as const,
        content: p.post,
        user: p.author,
        timestamp: p.post.createdAt,
      })),
      ...recentRegistrations.map(r => ({
        id: r.id,
        type: 'registration' as const,
        content: { eventTitle: r.eventTitle, eventId: r.eventId },
        user: r.user,
        timestamp: r.purchaseDate,
      })),
    ];

    // 5. Final Sort
    return feed
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

  } catch (error) {
    console.error('Failed to fetch activity feed:', error);
    return [];
  }
}
