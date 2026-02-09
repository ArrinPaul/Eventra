import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const listByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("event_discussions")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .collect();

    const enriched = [];
    for (const msg of messages) {
      const user = await ctx.db.get(msg.userId);
      enriched.push({
        ...msg,
        authorName: user?.name || "Anonymous",
        authorImage: user?.image,
        authorRole: user?.role || "attendee",
      });
    }
    return enriched;
  },
});

export const create = mutation({
  args: {
    eventId: v.id("events"),
    content: v.string(),
    isQuestion: v.boolean(),
    parentMessageId: v.optional(v.id("event_discussions")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const messageId = await ctx.db.insert("event_discussions", {
      ...args,
      userId,
      likes: 0,
      createdAt: Date.now(),
      isAnswered: args.isQuestion ? false : undefined,
    });

    // Notify organizer if it's a question
    if (args.isQuestion) {
      const event = await ctx.db.get(args.eventId);
      if (event) {
        await ctx.db.insert("notifications", {
          userId: event.organizerId,
          title: "New Question",
          message: `Someone asked a question about your event "${event.title}".`,
          type: "event",
          read: false,
          createdAt: Date.now(),
          link: `/events/${args.eventId}?tab=discussion`,
        });
      }
    }

    return messageId;
  },
});

export const like = mutation({
  args: { id: v.id("event_discussions") },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get(args.id);
    if (!msg) return;
    await ctx.db.patch(args.id, { likes: msg.likes + 1 });
  },
});

export const markAsAnswered = mutation({
  args: { id: v.id("event_discussions") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const msg = await ctx.db.get(args.id);
    if (!msg) return;

    const event = await ctx.db.get(msg.eventId);
    if (event?.organizerId !== userId && !event?.coOrganizerIds?.includes(userId)) {
      throw new Error("Only organizers can mark as answered");
    }

    await ctx.db.patch(args.id, { isAnswered: true });
  },
});
