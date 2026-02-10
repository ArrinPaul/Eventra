import { v } from "convex/values";
import { mutation, query, MutationCtx } from "./_generated/server";
import { auth } from "./auth";
import { calculateLevel } from "./utils";
import { Id } from "./_generated/dataModel";

/**
 * Get all badge definitions
 */
export const getBadgeDefinitions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("badges").collect();
  },
});

/**
 * Get badges earned by a specific user
 */
export const getUserBadges = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userBadges = await ctx.db
      .query("user_badges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const allBadges = await ctx.db.query("badges").collect();
    const badgeMap = new Map(allBadges.map(b => [b._id.toString(), b]));

    return userBadges
      .map((ub: any) => {
        const badge = badgeMap.get(ub.badgeId.toString());
        return badge ? { ...badge, awardedAt: ub.awardedAt } : null;
      })
      .filter((b): b is NonNullable<typeof b> => b !== null);
  },
});

/**
 * Get point history for the current user
 */
export const getPointsHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("points_history")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

/**
 * Standalone addPoints mutation – awards XP, updates level, logs history
 * ADMIN ONLY - Manual point awarding for system/admin purposes
 */
export const addPoints = mutation({
  args: {
    userId: v.id("users"),
    points: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Auth check: Only admins or the system can award points manually
    const callerId = await auth.getUserId(ctx);
    if (callerId) {
      const caller = await ctx.db.get(callerId);
      if (!caller || caller.role !== "admin") {
        throw new Error("Unauthorized: Only admins can award points manually");
      }
    }
    // If callerId is null, allow system-level calls (e.g., from internal mutations)
    
    return await awardPointsInternal(
      ctx, 
      args.userId, 
      args.points, 
      args.reason ?? "Points awarded manually by admin"
    );
  },
});

/**
 * Internal helper to award points/XP, log history, and check for badges.
 * Use this instead of manual DB patches to ensure the gamification loop is consistent.
 */
export async function awardPointsInternal(
  ctx: MutationCtx, 
  userId: Id<"users">, 
  points: number, 
  reason: string,
  link?: string
) {
  const user = await ctx.db.get(userId);
  if (!user) return;

  const currentPoints = user.points ?? 0;
  const newPoints = currentPoints + points;
  const currentXp = (user.xp ?? 0) + points;
  const newLevel = calculateLevel(currentXp);

  await ctx.db.patch(userId, { 
    points: newPoints, 
    xp: currentXp, 
    level: newLevel 
  });

  await ctx.db.insert("points_history", {
    userId,
    points,
    reason,
    createdAt: Date.now(),
  });

  // Log to Activity Feed for social proof
  await ctx.db.insert("activity_feed", {
    userId,
    type: "points_earned",
    title: `Earned ${points} XP`,
    description: reason,
    link: link,
    createdAt: Date.now(),
  });

  // Check for automatic badge triggers
  await checkBadgeTriggers(ctx, userId, newPoints);

  return { newPoints, newLevel };
}

/**
 * Check and award automatic badges based on milestones
 */
async function checkBadgeTriggers(ctx: MutationCtx, userId: Id<"users">, totalPoints: number) {
  const badges = await ctx.db.query("badges").collect();
  const userBadges = await ctx.db
    .query("user_badges")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();
  const earnedBadgeIds = new Set(userBadges.map((ub: any) => ub.badgeId.toString()));

  // Count events attended
  const registrations = await ctx.db
    .query("registrations")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();
  const confirmedCount = registrations.filter((r: any) => r.status === "confirmed" || r.checkedIn).length;

  for (const badge of badges) {
    if (earnedBadgeIds.has(badge._id.toString())) continue;

    let shouldAward = false;
    
    if (badge.structured_criteria) {
      const { type, threshold } = badge.structured_criteria;
      if (type === "points" && totalPoints >= threshold) shouldAward = true;
      if (type === "attendance" && confirmedCount >= threshold) shouldAward = true;
    } else {
      // Fallback to legacy string matching for safety
      const criteria = badge.criteria?.toLowerCase() ?? "";
      if (criteria.includes("100 points") && totalPoints >= 100) shouldAward = true;
      if (criteria.includes("500 points") && totalPoints >= 500) shouldAward = true;
      if (criteria.includes("1000 points") && totalPoints >= 1000) shouldAward = true;
      if (criteria.includes("first event") && confirmedCount >= 1) shouldAward = true;
      if (criteria.includes("5 events") && confirmedCount >= 5) shouldAward = true;
      if (criteria.includes("10 events") && confirmedCount >= 10) shouldAward = true;
    }

    if (shouldAward) {
      await ctx.db.insert("user_badges", {
        userId,
        badgeId: badge._id,
        awardedAt: Date.now(),
      });

      await ctx.db.insert("notifications", {
        userId,
        title: "New Badge Earned! 🏆",
        message: `You've earned the ${badge.name} badge!`,
        type: "gamification",
        read: false,
        createdAt: Date.now(),
        link: `/gamification`,
      });

      await ctx.db.insert("activity_feed", {
        userId,
        type: "badge_earned",
        title: `Earned the ${badge.name} badge!`,
        description: badge.description,
        createdAt: Date.now(),
        link: `/gamification`,
      });
    }
  }
}

/**
 * Award a badge to a user (manual)
 * ADMIN ONLY - Manual badge awarding
 */
export const awardBadge = mutation({
  args: {
    userId: v.id("users"),
    badgeId: v.id("badges"),
  },
  handler: async (ctx, args) => {
    // Auth check: Only admins can award badges manually
    const callerId = await auth.getUserId(ctx);
    if (!callerId) throw new Error("Unauthorized");
    const caller = await ctx.db.get(callerId);
    if (!caller || caller.role !== "admin") {
      throw new Error("Unauthorized: Only admins can award badges manually");
    }
    
    const existing = await ctx.db
      .query("user_badges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("badgeId"), args.badgeId))
      .unique();

    if (existing) return;

    const badge = await ctx.db.get(args.badgeId);
    if (!badge) throw new Error("Badge not found");

    await ctx.db.insert("user_badges", {
      userId: args.userId,
      badgeId: args.badgeId,
      awardedAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId: args.userId,
      title: "New Badge Earned! 🏆",
      message: `You've earned the ${badge.name} badge!`,
      type: "gamification",
      read: false,
      createdAt: Date.now(),
      link: `/gamification`,
    });

    await ctx.db.insert("activity_feed", {
      userId: args.userId,
      type: "badge_earned",
      title: `Earned the ${badge.name} badge!`,
      description: badge.description,
      createdAt: Date.now(),
      link: `/gamification`,
    });
  },
});

/**
 * Get challenges list
 */
export const getChallenges = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("challenges").collect();
  },
});

/**
 * Get user's challenge progress
 */
export const getUserChallenges = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const userChallenges = await ctx.db
      .query("user_challenges")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const allChallenges = await ctx.db.query("challenges").collect();
    const challengeMap = new Map(allChallenges.map(c => [c._id.toString(), c]));

    return userChallenges
      .map((uc: any) => {
        const challenge = challengeMap.get(uc.challengeId.toString());
        return challenge ? { ...uc, challenge } : null;
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  },
});

/**
 * Join a challenge
 */
export const joinChallenge = mutation({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("user_challenges")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("challengeId"), args.challengeId))
      .unique();
    if (existing) return existing._id;

    return await ctx.db.insert("user_challenges", {
      userId,
      challengeId: args.challengeId,
      progress: 0,
      completed: false,
      startedAt: Date.now(),
    });
  },
});

/**
 * Update challenge progress
 */
export const updateChallengeProgress = mutation({
  args: {
    challengeId: v.id("challenges"),
    progress: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const uc = await ctx.db
      .query("user_challenges")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("challengeId"), args.challengeId))
      .unique();
    if (!uc) throw new Error("Challenge not joined");

    const challenge = await ctx.db.get(args.challengeId);
    const isComplete = challenge && args.progress >= (challenge.target ?? 1);

    await ctx.db.patch(uc._id, {
      progress: args.progress,
      completed: isComplete ? true : false,
      completedAt: isComplete ? Date.now() : undefined,
    });

    if (isComplete && challenge?.xpReward) {
      await awardPointsInternal(
        ctx,
        userId,
        challenge.xpReward,
        `Completed challenge: ${challenge.title}`,
        `/gamification`
      );
    }
  },
});

/**
 * Internal mutation to update challenge progress based on event triggers
 * (e.g., attending an event, posting in a community)
 */
export const triggerChallengeProgress = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(), // "attendance", "engagement", "social"
    increment: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userChallenges = await ctx.db
      .query("user_challenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("completed"), false))
      .collect();

    if (userChallenges.length === 0) return;

    for (const uc of userChallenges) {
      const challenge = await ctx.db.get(uc.challengeId);
      if (!challenge || challenge.type !== args.type) continue;

      const newProgress = uc.progress + (args.increment || 1);
      const isComplete = newProgress >= (challenge.target ?? 1);

      await ctx.db.patch(uc._id, {
        progress: newProgress,
        completed: isComplete,
        completedAt: isComplete ? Date.now() : undefined,
      });

      if (isComplete && challenge.xpReward) {
        await awardPointsInternal(
          ctx,
          args.userId,
          challenge.xpReward,
          `Completed challenge: ${challenge.title}`,
          `/gamification`
        );
      }
    }
  },
});

/**
 * Get a user's gamification profile (level, xp, badge count)
 */
export const getProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const badgeCount = (
      await ctx.db
        .query("user_badges")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect()
    ).length;

    const xp = (user as any).xp || (user as any).points || 0;
    const level = calculateLevel(xp);

    return {
      xp,
      level,
      points: (user as any).points || 0,
      badgeCount,
    };
  },
});
