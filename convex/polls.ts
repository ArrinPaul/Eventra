import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const create = mutation({
  args: {
    eventId: v.id("events"),
    question: v.string(),
    options: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const event = await ctx.db.get(args.eventId);
    if (event?.organizerId !== userId && !event?.coOrganizerIds?.includes(userId)) {
      throw new Error("Only organizers can create polls");
    }

    return await ctx.db.insert("event_polls", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
      createdBy: userId,
    });
  },
});

export const toggleActive = mutation({
  args: { id: v.id("event_polls"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    
    const poll = await ctx.db.get(args.id);
    if (!poll) return;

    const event = await ctx.db.get(poll.eventId);
    if (event?.organizerId !== userId && !event?.coOrganizerIds?.includes(userId)) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, { isActive: args.isActive });
  },
});

export const submitResponse = mutation({
  args: { pollId: v.id("event_polls"), optionIndex: v.number() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const poll = await ctx.db.get(args.pollId);
    if (!poll || !poll.isActive) throw new Error("Poll is not active");

    const existing = await ctx.db
      .query("poll_responses")
      .withIndex("by_user_poll", (q) => q.eq("userId", userId).eq("pollId", args.pollId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { optionIndex: args.optionIndex });
    } else {
      await ctx.db.insert("poll_responses", {
        pollId: args.pollId,
        userId,
        optionIndex: args.optionIndex,
        createdAt: Date.now(),
      });
    }
  },
});

export const getByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const polls = await ctx.db
      .query("event_polls")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .collect();

    const currentUserId = await auth.getUserId(ctx);

    const enriched = [];
    for (const poll of polls) {
      const responses = await ctx.db
        .query("poll_responses")
        .withIndex("by_poll", (q) => q.eq("pollId", poll._id))
        .collect();

      const myResponse = responses.find(r => r.userId === currentUserId);
      
      const counts = new Array(poll.options.length).fill(0);
      responses.forEach(r => counts[r.optionIndex]++);

      enriched.push({
        ...poll,
        totalVotes: responses.length,
        results: counts,
        myVote: myResponse?.optionIndex,
      });
    }
    return enriched;
  },
});
