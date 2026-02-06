import { mutation, query } from "./_generated/server";
import { auth } from "./auth";
import { v } from "convex/values";

export const viewer = query({
  args: {},
  handler: async (ctx: any) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});

export const update = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    role: v.optional(v.union(v.literal("student"), v.literal("professional"), v.literal("organizer"), v.literal("admin"), v.literal("speaker"), v.literal("attendee"))),
    onboardingCompleted: v.optional(v.boolean()),
    
    // Student fields
    college: v.optional(v.string()),
    degree: v.optional(v.union(v.literal("ug"), v.literal("pg"))),
    year: v.optional(v.number()),
    
    // Professional fields
    company: v.optional(v.string()),
    designation: v.optional(v.string()),
    country: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"), v.literal("prefer-not-to-say"))),
    bloodGroup: v.optional(v.string()),
    
    interests: v.optional(v.string()),
    organizationName: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }
    await ctx.db.patch(userId, args);
  },
});

export const awardPoints = mutation({
  args: { points: v.number() },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    const currentPoints = user?.points || 0;
    await ctx.db.patch(userId, { points: currentPoints + args.points });
  },
});

export const checkIn = mutation({
  args: {},
  handler: async (ctx: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(userId, { checkedIn: true });
  },
});

export const list = query({
  args: {},
  handler: async (ctx: any) => {
    return await ctx.db.query("users").collect();
  },
});
