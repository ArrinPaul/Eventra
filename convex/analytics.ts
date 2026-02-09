import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const createShareLink = mutation({
  args: { eventId: v.id("events"), expiresDays: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const event = await ctx.db.get(args.eventId);
    if (!event || event.organizerId !== userId) throw new Error("Not authorized");

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const shareId = await ctx.db.insert("shared_reports", {
      eventId: args.eventId,
      token,
      createdBy: userId,
      createdAt: Date.now(),
      expiresAt: args.expiresDays ? Date.now() + (args.expiresDays * 24 * 60 * 60 * 1000) : undefined,
      viewCount: 0,
    });

    return { token };
  },
});

export const getSharedReport = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const report = await ctx.db
      .query("shared_reports")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!report) return null;
    if (report.expiresAt && report.expiresAt < Date.now()) return null;

    const event = await ctx.db.get(report.eventId);
    if (!event) return null;

    // Record view count (optional, would need mutation but queries are read-only)
    // Return event and basic analytics
    return {
      eventTitle: event.title,
      description: event.description,
      category: event.category,
      registeredCount: event.registeredCount,
      capacity: event.capacity,
      startDate: event.startDate,
      status: event.status,
    };
  },
});
