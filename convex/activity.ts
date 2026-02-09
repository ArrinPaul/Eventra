import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { auth } from "./auth";

/**
 * Get the activity feed for the current user
 */
export const getMyFeed = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    const limit = args.limit || 50;
    return await ctx.db
      .query("activity_feed")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

/**
 * Get the activity feed for a specific user (public)
 */
export const getUserFeed = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    return await ctx.db
      .query("activity_feed")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

/**
 * Get the global activity feed (latest across all users)
 */
export const getGlobalFeed = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 30;
    const items = await ctx.db
      .query("activity_feed")
      .order("desc")
      .take(limit);

    // Enrich with user info
    return await Promise.all(
      items.map(async (item: any) => {
        const user = await ctx.db.get(item.userId);
        return {
          ...item,
          userName: user?.name || "Unknown",
          userImage: user?.image,
        };
      })
    );
  },
});

/**
 * Log an activity event (called internally from other mutations)
 */
export const logActivity = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("activity_feed", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

/**
 * Public mutation for logging activity from frontend (e.g., profile view)
 */
export const log = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.insert("activity_feed", {
      userId,
      type: args.type,
      title: args.title,
      description: args.description,
      link: args.link,
      createdAt: Date.now(),
    });
  },
});
