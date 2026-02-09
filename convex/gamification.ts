import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

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
 */
export const addPoints = mutation({
  args: {
    userId: v.id("users"),
    points: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const currentPoints = user.points ?? 0;
    const newPoints = currentPoints + args.points;
    const currentXp = (user.xp ?? 0) + args.points;
    const newLevel = Math.floor(currentXp / 500) + 1;

    await ctx.db.patch(args.userId, { points: newPoints, xp: currentXp, level: newLevel });

    await ctx.db.insert("points_history", {
      userId: args.userId,
      points: args.points,
      reason: args.reason ?? "Points awarded",
      createdAt: Date.now(),
    });

    // Check for automatic badge triggers
    await checkBadgeTriggers(ctx, args.userId, newPoints);

    return { newPoints, newLevel };
  },
});

/**
 * Check and award automatic badges based on milestones
 */
async function checkBadgeTriggers(ctx: any, userId: any, totalPoints: number) {
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
  const confirmedCount = registrations.filter((r: any) => r.status === "confirmed").length;

  for (const badge of badges) {
    if (earnedBadgeIds.has(badge._id.toString())) continue;

    let shouldAward = false;
    const criteria = badge.criteria?.toLowerCase() ?? "";

    // Points-based triggers
    if (criteria.includes("100 points") && totalPoints >= 100) shouldAward = true;
    if (criteria.includes("500 points") && totalPoints >= 500) shouldAward = true;
    if (criteria.includes("1000 points") && totalPoints >= 1000) shouldAward = true;

    // Attendance-based triggers
    if (criteria.includes("first event") && confirmedCount >= 1) shouldAward = true;
    if (criteria.includes("5 events") && confirmedCount >= 5) shouldAward = true;
    if (criteria.includes("10 events") && confirmedCount >= 10) shouldAward = true;
    if (criteria.includes("attend 5") && confirmedCount >= 5) shouldAward = true;
    if (criteria.includes("attend 10") && confirmedCount >= 10) shouldAward = true;

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
    }
  }
}

/**
 * Award a badge to a user (manual)
 */
export const awardBadge = mutation({
  args: {
    userId: v.id("users"),
    badgeId: v.id("badges"),
  },
  handler: async (ctx, args) => {
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
      // Award points on completion
      const user = await ctx.db.get(userId);
      if (user) {
        const currentPoints = user.points ?? 0;
        const newPoints = currentPoints + challenge.xpReward;
        const currentXp = (user.xp ?? 0) + challenge.xpReward;
        const newLevel = Math.floor(currentXp / 500) + 1;
        await ctx.db.patch(userId, { points: newPoints, xp: currentXp, level: newLevel });

        await ctx.db.insert("points_history", {
          userId,
          points: challenge.xpReward,
          reason: `Completed challenge: ${challenge.title}`,
          createdAt: Date.now(),
        });
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
    const level = Math.floor(xp / 500) + 1;

    return {
      xp,
      level,
      points: (user as any).points || 0,
      badgeCount,
    };
  },
});
