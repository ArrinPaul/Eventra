import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const submit = mutation({
  args: {
    eventId: v.id("events"),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_event", (q: any) => q.eq("eventId", args.eventId))
      .filter((q: any) => q.eq(q.field("userId"), userId))
      .unique();

    if (existing) {
      return await ctx.db.patch(existing._id, {
        rating: args.rating,
        comment: args.comment,
        createdAt: Date.now(),
      });
    }

    return await ctx.db.insert("reviews", {
      eventId: args.eventId,
      userId,
      rating: args.rating,
      comment: args.comment,
      createdAt: Date.now(),
    });
  },
});

export const getByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("reviews")
      .withIndex("by_event", (q: any) => q.eq("eventId", args.eventId))
      .collect();
  },
});
