'use server';

import { db } from '@/lib/db';
import { users, notifications, badges, userBadges } from '@/lib/db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

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
          // Count tickets for this user
          const ticketCount = await db.execute(sql`SELECT COUNT(*) FROM tickets WHERE user_id = ${userId} AND status = 'checked_in'`);
          if (Number((ticketCount as any)[0].count) >= criteria.value) eligible = true;
          break;
        case 'community_posts':
          const postCount = await db.execute(sql`SELECT COUNT(*) FROM posts WHERE author_id = ${userId}`);
          if (Number((postCount as any)[0].count) >= criteria.value) eligible = true;
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
    
    // Simple leveling logic: Level = floor(sqrt(XP / 100)) + 1
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
 * Award a badge to a user
 */
export async function awardBadge(userId: string, badgeCode: string) {
  try {
    // 1. Find the badge by code (assuming badge name is used as code for now or we query by name)
    const badge = await db.query.badges.findFirst({
      where: eq(badges.name, badgeCode),
    });

    if (!badge) return null;

    // 2. Check if user already has it
    const existing = await db.query.userBadges.findFirst({
      where: and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badge.id)),
    });

    if (existing) return null;

    // 3. Award badge
    await db.insert(userBadges).values({
      userId,
      badgeId: badge.id,
    });

    // 4. Notify
    await db.insert(notifications).values({
      userId,
      title: 'New Badge Unlocked!',
      message: `You've earned the "${badge.name}" badge!`,
      type: 'success',
    });

    return { success: true, badge };
  } catch (error) {
    console.error('Failed to award badge:', error);
    return null;
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

import { and } from 'drizzle-orm';
