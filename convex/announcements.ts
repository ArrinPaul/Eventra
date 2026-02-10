import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const create = mutation({
  args: {
    eventId: v.id("events"),
    content: v.string(),
    type: v.union(v.literal("info"), v.literal("warning"), v.literal("urgent")),
    expiresHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const event = await ctx.db.get(args.eventId);
    if (!event || event.organizerId !== userId) throw new Error("Not authorized");

    return await ctx.db.insert("announcements", {
      eventId: args.eventId,
      organizerId: userId,
      content: args.content,
      type: args.type,
      isActive: true,
      createdAt: Date.now(),
      expiresAt: args.expiresHours ? Date.now() + (args.expiresHours * 60 * 60 * 1000) : undefined,
    });
  },
});

export const getActiveByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const announcements = await ctx.db
      .query("announcements")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Filter out expired ones
    return announcements.filter(a => !a.expiresAt || a.expiresAt > Date.now());
  },
});

export const deactivate = mutation({
  args: { id: v.id("announcements") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    
    const announcement = await ctx.db.get(args.id);
    if (!announcement) throw new Error("Not found");
    
    await ctx.db.patch(args.id, { isActive: false });
  },
});
