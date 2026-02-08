import { mutation, query } from "./_generated/server";
import { auth } from "./auth";
import { v } from "convex/values";

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) return null;
    return await ctx.db.get(userId);
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const update = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    role: v.optional(v.union(v.literal("student"), v.literal("professional"), v.literal("organizer"), v.literal("admin"), v.literal("speaker"), v.literal("attendee"), v.literal("vendor"))),
    onboardingCompleted: v.optional(v.boolean()),
    college: v.optional(v.string()),
    degree: v.optional(v.union(v.literal("ug"), v.literal("pg"))),
    year: v.optional(v.number()),
    company: v.optional(v.string()),
    designation: v.optional(v.string()),
    country: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"), v.literal("prefer-not-to-say"))),
    bloodGroup: v.optional(v.string()),
    interests: v.optional(v.string()),
    notificationPreferences: v.optional(v.object({
      email: v.optional(v.boolean()),
      push: v.optional(v.boolean()),
      eventReminders: v.optional(v.boolean()),
      communityUpdates: v.optional(v.boolean()),
      marketingEmails: v.optional(v.boolean()),
    })),
    wishlist: v.optional(v.array(v.string())),
    eventRatings: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    await ctx.db.patch(userId, args);
  },
});

export const awardPoints = mutation({
  args: { points: v.number(), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    const currentXp = (user.xp || 0) + args.points;
    const newLevel = Math.floor(currentXp / 500) + 1;
    await ctx.db.patch(userId, {
      points: (user.points || 0) + args.points,
      xp: currentXp,
      level: newLevel,
    });
    await ctx.db.insert("points_history", {
      userId,
      points: args.points,
      reason: args.reason || "Points awarded",
      createdAt: Date.now(),
    });
  },
});

export const checkIn = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(userId, { checkedIn: true });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const getLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    return users
      .filter((u) => u.role !== "admin" && u.role !== "organizer")
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, args.limit || 50);
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    const q = args.query.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    ).slice(0, 20);
  },
});
