import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

/**
 * Get all badge definitions
 */
export const getBadgeDefinitions = query({
  args: {},
  handler: async (ctx: any) => {
    return await ctx.db.query("badges").collect();
  },
});

/**
 * Get badges earned by a specific user
 */
export const getUserBadges = query({
  args: { userId: v.id("users") },
  handler: async (ctx: any, args: any) => {
    const userBadges = await ctx.db
      .query("user_badges")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect();
      
    const badges = [];
    for (const ub of userBadges) {
      const badge = await ctx.db.get(ub.badgeId);
      if (badge) badges.push({ ...badge, awardedAt: ub.awardedAt });
    }
    return badges;
  },
});

/**
 * Get point history for the current user
 */
export const getPointsHistory = query({
  args: {},
  handler: async (ctx: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("points_history")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

/**
 * Internal: Award a badge to a user
 */
export const awardBadge = mutation({
  args: { 
    userId: v.id("users"), 
    badgeId: v.id("badges") 
  },
  handler: async (ctx: any, args: any) => {
    const existing = await ctx.db
      .query("user_badges")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .filter((q: any) => q.eq(q.field("badgeId"), args.badgeId))
      .unique();
      
    if (existing) return;
    
    const badge = await ctx.db.get(args.badgeId);
    if (!badge) throw new Error("Badge not found");
    
    await ctx.db.insert("user_badges", {
      userId: args.userId,
      badgeId: args.badgeId,
      awardedAt: Date.now(),
    });
    
    // Create notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      title: "New Badge Earned! 🏆",
      message: `You've earned the ${badge.name} badge!`,
      type: "gamification",
      read: false,
      createdAt: Date.now(),
    });
  },
});
