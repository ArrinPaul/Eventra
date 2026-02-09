import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const submit = mutation({
  args: {
    eventId: v.id("events"),
    rating: v.number(),
    comment: v.optional(v.string()),
    responses: v.optional(v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    if (args.rating < 1 || args.rating > 5) throw new Error("Rating must be between 1 and 5");

    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .unique();

    if (existing) {
      return await ctx.db.patch(existing._id, {
        rating: args.rating,
        comment: args.comment,
        responses: args.responses,
        createdAt: Date.now(),
      });
    }

    return await ctx.db.insert("reviews", {
      eventId: args.eventId,
      userId,
      rating: args.rating,
      comment: args.comment,
      responses: args.responses,
      createdAt: Date.now(),
    });
  },
});

export const getByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const enriched = [];
    for (const review of reviews) {
      const user = await ctx.db.get(review.userId);
      enriched.push({
        ...review,
        userName: user?.name ?? "Anonymous",
        userImage: user?.image,
      });
    }
    return enriched;
  },
});

export const getEventRating = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    if (reviews.length === 0) return { average: 0, count: 0 };

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      average: Math.round((sum / reviews.length) * 10) / 10,
      count: reviews.length,
    };
  },
});
