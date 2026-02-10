import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const get = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 50);
  },
});

export const list = query({
  args: { paginationOpts: v.paginationOpts() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return 0;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("read", false))
      .collect();

    return unread.length;
  },
});

export const markRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const notification = await ctx.db.get(args.id);
    if (!notification) throw new Error("Notification not found");
    if (notification.userId !== userId) throw new Error("Not authorized");

    await ctx.db.patch(args.id, { read: true });
  },
});

export const deleteNotification = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const notification = await ctx.db.get(args.id);
    if (!notification) throw new Error("Notification not found");
    if (notification.userId !== userId) throw new Error("Not authorized");

    await ctx.db.delete(args.id);
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("read", false))
      .collect();

    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.string(),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check notification preferences
    const user = await ctx.db.get(args.userId);
    if (user?.notificationPreferences) {
      const prefs = user.notificationPreferences;
      // Map notification types to preference keys
      const typeToPreference: Record<string, keyof typeof prefs> = {
        event: "eventReminders",
        certificate: "email",
        gamification: "push",
        admin: "email",
        community: "communityUpdates",
        marketing: "marketingEmails",
      };
      const prefKey = typeToPreference[args.type];
      if (prefKey && prefs[prefKey] === false) return null; // User opted out
    }

    return await ctx.db.insert("notifications", {
      ...args,
      read: false,
      createdAt: Date.now(),
    });
  },
});

export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return;

    const all = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const n of all) {
      await ctx.db.delete(n._id);
    }
  },
});
