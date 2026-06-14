'use server';

import { createHash } from 'node:crypto';
import { validateRole } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { aiRecommendationCache, events, users } from '@/lib/db/schema';
import { and, eq, ne } from 'drizzle-orm';
import { recommendationFlow, contentRecommendationFlow, connectionRecommendationFlow } from '@/lib/ai';

export interface RecommendationBundle {
	events: Array<{ id: string; title: string; category?: string; score?: number }>;
	sessions: Array<{ id: string; title: string; track?: string; score?: number }>;
	people: Array<{ id: string; name: string; role?: string; score?: number }>;
}

export type AIEventRecommendation = {
  eventId: string;
  relevanceScore: number;
  reason: string;
};

export type AIContentRecommendation = {
  contentId: string;
  relevanceScore: number;
  reason: string;
};

export type AIConnectionRecommendation = {
  userId: string;
  strength: number;
  conversationStarter: string;
};

const RECOMMENDATION_CACHE_TTL_MS = 1000 * 60 * 15;

function buildRecommendationCacheKey(payload: {
  userId: string;
  userRole: string | null;
  interests: string[];
  eventIds: string[];
}) {
  const normalized = {
    userId: payload.userId,
    userRole: payload.userRole ?? 'unknown',
    interests: payload.interests.map((interest) => interest.toLowerCase()).sort(),
    eventIds: payload.eventIds.sort(),
  };

  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}

function isCacheFresh(updatedAt: Date) {
  return Date.now() - updatedAt.getTime() < RECOMMENDATION_CACHE_TTL_MS;
}

/**
 * Get personalized recommendations using Genkit
 */
export async function getAIRecommendations(userId?: string): Promise<AIEventRecommendation[]> {
  const caller = await validateRole(['attendee', 'organizer', 'admin', 'professional']);
  const targetUserId = userId || caller.id;

  if (targetUserId !== caller.id && caller.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  try {
    // 1. Get User Profile
    const user = await db.query.users.findFirst({
      where: eq(users.id, targetUserId)
    });

    if (!user) throw new Error('User not found');

    // 2. Get Available Events
    const availableEvents = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        category: events.category,
      })
      .from(events)
      .where(ne(events.status, 'cancelled'))
      .limit(20);

    // 3. Run AI Recommendation Flow
    const interests = user.interests
      ? user.interests.split(',').map((i: string) => i.trim()).filter(Boolean)
      : [];
    
    const eventIds = availableEvents.map((event) => event.id);
    const cacheKey = buildRecommendationCacheKey({
      userId: targetUserId,
      userRole: user.role,
      interests,
      eventIds,
    });

    const cached = await db.query.aiRecommendationCache.findFirst({
      where: and(
        eq(aiRecommendationCache.userId, targetUserId),
        eq(aiRecommendationCache.cacheKey, cacheKey),
      ),
    });

    if (cached && isCacheFresh(cached.updatedAt)) {
      return cached.payload as AIEventRecommendation[];
    }

    const { recommendations } = await recommendationFlow({
      userInterests: interests,
      userRole: user.role,
      availableEvents: availableEvents as any,
    });

    const resolvedRecommendations = (recommendations || []) as AIEventRecommendation[];
    const now = new Date();

    await db.insert(aiRecommendationCache)
      .values({
        userId: targetUserId,
        cacheKey,
        payload: resolvedRecommendations,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [aiRecommendationCache.userId, aiRecommendationCache.cacheKey],
        set: {
          payload: resolvedRecommendations,
          updatedAt: now,
        },
      });

    return resolvedRecommendations;
  } catch (error) {
    console.error('Recommendation Error:', error);
    return [];
  }
}

// Keep other mock functions for now as they are not primary Phase 3 goals
export async function getPersonalizedRecommendations(userId?: string): Promise<RecommendationBundle> {
  const caller = await validateRole(['attendee', 'organizer', 'admin', 'professional']);
  const targetUserId = userId || caller.id;

  if (targetUserId !== caller.id && caller.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  return {
    events: [],
    sessions: [],
    people: [],
  };
}

export async function getAIContentRecommendations(userId?: string): Promise<AIContentRecommendation[]> {
  const caller = await validateRole(['attendee', 'organizer', 'admin', 'professional']);
  const targetUserId = userId || caller.id;

  if (targetUserId !== caller.id && caller.role !== 'admin') {
    throw new Error('Unauthorized');
  }
	
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, targetUserId)
    });

    if (!user) throw new Error('User not found');

    // In a real app, we'd fetch from a 'content' or 'resources' table
    const mockContent = [
      { id: '1', title: 'Mastering Event Networking', category: 'Professional Development' },
      { id: '2', title: 'The Future of AI in Events', category: 'Technology' },
      { id: '3', title: 'Sustainability in Large Scale Gatherings', category: 'Environment' }
    ];

    const interests = user.interests ? user.interests.split(',').map((i: string) => i.trim()) : [];

    const { recommendedContent } = await contentRecommendationFlow({
      userInterests: interests,
      availableContent: mockContent,
    });

    return (recommendedContent || []) as AIContentRecommendation[];
  } catch (error) {
    console.error('Content Recommendation Error:', error);
    return [];
  }
}

export async function getAIConnectionRecommendations(userId?: string): Promise<AIConnectionRecommendation[]> {
  const caller = await validateRole(['attendee', 'organizer', 'admin', 'professional']);
  const targetUserId = userId || caller.id;

  if (targetUserId !== caller.id && caller.role !== 'admin') {
    throw new Error('Unauthorized');
  }
	
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, targetUserId)
    });

    if (!user) throw new Error('User not found');

    const others = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
        interests: users.interests,
      })
      .from(users)
      .where(ne(users.id, targetUserId))
      .limit(10);

    const { connections } = await connectionRecommendationFlow({
      userProfile: user,
      network: others,
    });

    return (connections || []) as AIConnectionRecommendation[];
  } catch (error) {
    console.error('Connection Recommendation Error:', error);
    return [];
  }
}
