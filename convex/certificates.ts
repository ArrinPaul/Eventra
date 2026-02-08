import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const issue = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.id("users"),
    certificateNumber: v.string(),
    personalizedMessage: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.insert("certificates", {
      ...args,
      issueDate: Date.now(),
    });
  },
});

export const getByUser = query({
  args: {},
  handler: async (ctx: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    
    const certs = await ctx.db
      .query("certificates")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();
      
    const enriched = [];
    for (const cert of certs) {
      const event = await ctx.db.get(cert.eventId);
      enriched.push({ ...cert, event });
    }
    return enriched;
  },
});

export const getByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("certificates")
      .withIndex("by_event", (q: any) => q.eq("eventId", args.eventId))
      .collect();
  },
});

export const getByEventAndUser = query({
  args: { eventId: v.id("events"), userId: v.id("users") },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("certificates")
      .withIndex("by_event", (q: any) => q.eq("eventId", args.eventId))
      .filter((q: any) => q.eq(q.field("userId"), args.userId))
      .unique();
  },
});
