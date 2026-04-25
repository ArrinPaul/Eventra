'use server';

import { db } from '@/lib/db';
import { users, notifications, badges, userBadges, tickets, posts } from '@/lib/db/schema';
import { eq, and, sql, desc, count } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { logActivity } from './feed';

/**
 * Award a badge to a user
 */
export async function awardBadge(userId: string, badgeCode: string) {
  try {
    const badge = await db.query.badges.findFirst({
      where: eq(badges.name, badgeCode),
    });

    if (!badge) return null;

    const existing = await db.query.userBadges.findFirst({
      where: and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badge.id)),
    });

    if (existing) return null;

    await db.insert(userBadges).values({
      userId,
      badgeId: badge.id,
    });

    // Notify
    await db.insert(notifications).values({
      userId,
      title: 'New Badge Unlocked!',
      message: `You've earned the "${badge.name}" badge!`,
      type: 'success',
    });

    // ACTIVITY FEED INTEGRATION: Log badge unlock
    await logActivity({
      userId,
      type: 'badge_awarded',
      targetId: badge.id,
      content: `Unlocked the "${badge.name}" badge! 🏆`,
      metadata: { badgeName: badge.name, badgeIcon: badge.icon }
    });

    return { success: true, badge };
  } catch (error) {
    console.error('Failed to award badge:', error);
    return null;
  }
}

/**
 * Check and award badges based on user's current stats and activities
 */
export async function checkAndAwardBadges(userId: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) return;

    // Fetch all available badges
    const allBadges = await db.select().from(badges);
    
    // Fetch user's current badges
    const userBadgeRecords = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
    const userBadgeIds = new Set(userBadgeRecords.map(ub => ub.badgeId));

    for (const badge of allBadges) {
      if (userBadgeIds.has(badge.id)) continue;

      const criteria = badge.criteria as any;
      let eligible = false;

      switch (criteria.type) {
        case 'level':
          if (user.level >= criteria.value) eligible = true;
          break;
        case 'points':
          if (user.points >= criteria.value) eligible = true;
          break;
        case 'events_attended':
          const tCount = await db.select({ value: count() }).from(tickets).where(and(eq(tickets.userId, userId), eq(tickets.status, 'checked-in')));
          if (tCount[0].value >= criteria.value) eligible = true;
          break;
        case 'community_posts':
          const pCount = await db.select({ value: count() }).from(posts).where(eq(posts.authorId, userId));
          if (pCount[0].value >= criteria.value) eligible = true;
          break;
      }

      if (eligible) {
        await awardBadge(userId, badge.name);
      }
    }
  } catch (error) {
    console.error('Failed to check badges:', error);
  }
}

/**
 * Award XP to a user and handle level-ups
 */
export async function awardXP(userId: string, amount: number, reason: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) return null;

    const newXP = user.xp + amount;
    const newPoints = user.points + amount;
    
    const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;
    const leveledUp = newLevel > user.level;

    await db.update(users).set({
      xp: newXP,
      points: newPoints,
      level: newLevel,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));

    // Notify user of XP gain
    await db.insert(notifications).values({
      userId,
      title: `+${amount} XP!`,
      message: `You earned XP for: ${reason}`,
      type: 'success',
    });

    if (leveledUp) {
      await db.insert(notifications).values({
        userId,
        title: `Level Up!`,
        message: `Congratulations! You reached Level ${newLevel}!`,
        type: 'success',
      });

      // ACTIVITY FEED INTEGRATION: Log level up
      await logActivity({
        userId,
        type: 'badge_awarded',
        content: `Reached Level ${newLevel}! 🚀`,
        metadata: { level: newLevel }
      });
    }

    // Check for badge triggers in background
    checkAndAwardBadges(userId).catch(err => console.error('Badge check failed:', err));

    revalidatePath('/');
    return { success: true, newLevel, leveledUp };
  } catch (error) {
    console.error('Failed to award XP:', error);
    return null;
  }
}

/**
 * Get gamification stats for a specific user
 */
export async function getUserStats(userId: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) return null;

    const [tCount] = await db.select({ value: count() }).from(tickets).where(and(eq(tickets.userId, userId), eq(tickets.status, 'checked-in')));
    const [pCount] = await db.select({ value: count() }).from(posts).where(eq(posts.authorId, userId));
    const [bCount] = await db.select({ value: count() }).from(userBadges).where(eq(userBadges.userId, userId));

    return {
      level: user.level,
      xp: user.xp,
      points: user.points,
      attended: tCount.value,
      posts: pCount.value,
      badgeCount: bCount.value
    };
  } catch (error) {
    console.error('getUserStats Error:', error);
    return null;
  }
}

/**
 * Get all badges earned by a user
 */
export async function getUserBadges(userId: string) {
  try {
    const results = await db
      .select({
        badge: badges,
        awardedAt: userBadges.awardedAt
      })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.awardedAt));
    
    return results;
  } catch (error) {
    console.error('getUserBadges Error:', error);
    return [];
  }
}

/**
 * Get all available badge definitions
 */
export async function getAllBadges() {
  try {
    return await db.select().from(badges);
  } catch (error) {
    console.error('getAllBadges Error:', error);
    return [];
  }
}

/**
 * Get the global leaderboard
 */
export async function getLeaderboard(limit = 10) {
  try {
    const results = await db
      .select({
        id: users.id,
        name: users.name,
        image: users.image,
        points: users.points,
        level: users.level,
      })
      .from(users)
      .orderBy(desc(users.points))
      .limit(limit);
    
    return results;
  } catch (error) {
    console.error('Leaderboard error:', error);
    return [];
  }
}
