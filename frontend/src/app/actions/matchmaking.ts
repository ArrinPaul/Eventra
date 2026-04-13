'use server';

import { validateRole } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { ne, eq, and } from 'drizzle-orm';
import { matchmakingFlow, generateEmbedding } from '@/lib/ai';
import { auth } from '@/auth';
import { sql } from 'drizzle-orm';

/**
 * Find AI-powered connection matches for the user
 */
export async function getMatches() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Auth required');

  try {
    // 1. Get current user
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id)
    });

    if (!user) throw new Error('User not found');

    // 2. Generate user embedding if needed
    if (!user.embedding && (user.interests || user.bio)) {
      const content = `${user.interests || ''} ${user.bio || ''} ${user.role}`;
      const embedding = await generateEmbedding(content);
      const vectorData = embedding[0].embedding;
      await db.update(users).set({ embedding: vectorData }).where(eq(users.id, user.id));
      user.embedding = vectorData;
    }

    // 3. Get potential matches using vector proximity if embeddings exist
    let potentialMatches: any[] = [];
    
    if (user.embedding) {
      const userVector = user.embedding as number[];
      const others = await db
        .select({
          id: users.id,
          name: users.name,
          role: users.role,
          interests: users.interests,
          bio: users.bio,
          embedding: users.embedding,
        })
        .from(users)
        .where(and(ne(users.id, user.id), sql`embedding IS NOT NULL`))
        .limit(50);

      // Manual similarity for candidate selection
      potentialMatches = others.map(other => {
        const otherVector = other.embedding as number[];
        if (!otherVector) return { ...other, similarity: 0 };
        
        let dotProduct = 0;
        let magA = 0;
        let magB = 0;
        const len = Math.min(userVector.length, otherVector.length);
        for (let i = 0; i < len; i++) {
          dotProduct += userVector[i] * otherVector[i];
          magA += userVector[i] * userVector[i];
          magB += otherVector[i] * otherVector[i];
        }
        const similarity = dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
        return { ...other, similarity };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);
    } else {
      // Fallback to random
      potentialMatches = await db
        .select({
          id: users.id,
          name: users.name,
          role: users.role,
          interests: users.interests,
          bio: users.bio,
        })
        .from(users)
        .where(ne(users.id, user.id))
        .limit(10);
    }

    // 4. Run AI flow for final ranking and reasoning
    const { matches } = await matchmakingFlow({
      userProfile: user,
      potentialMatches,
    });

    return matches;
  } catch (error) {
    console.error('Matchmaking Error:', error);
    return [];
  }
}

// Aliases for frontend compatibility
export async function getMatchmakingRecommendations() {
  return getMatches();
}

export type MatchmakingResult = Awaited<ReturnType<typeof getMatches>>[number];
