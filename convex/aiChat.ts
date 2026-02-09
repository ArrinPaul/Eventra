import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getSessions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("ai_chat_sessions")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getSessionMessages = query({
  args: { sessionId: v.id("ai_chat_sessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) return [];

    return await ctx.db
      .query("ai_chat_messages")
      .withIndex("by_session", (q: any) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();
  },
});

export const createSession = mutation({
  args: {
    title: v.string(),
    eventId: v.optional(v.id("events")),
    context: v.optional(v.object({
      userRole: v.string(),
      eventTitle: v.optional(v.string()),
      currentPage: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const sessionId = await ctx.db.insert("ai_chat_sessions", {
      userId,
      title: args.title,
      eventId: args.eventId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      context: args.context,
    });

    return sessionId;
  },
});

export const addMessage = mutation({
  args: {
    sessionId: v.id("ai_chat_sessions"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    actions: v.optional(v.array(v.object({
      label: v.string(),
      action: v.string(),
      data: v.optional(v.any()),
    }))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) throw new Error("Unauthorized");

    const messageId = await ctx.db.insert("ai_chat_messages", {
      sessionId: args.sessionId,
      role: args.role,
      content: args.content,
      createdAt: Date.now(),
      actions: args.actions,
    });

    await ctx.db.patch(args.sessionId, {
      lastActivity: Date.now(),
    });

    return messageId;
  },
});

export const deleteSession = mutation({
  args: { sessionId: v.id("ai_chat_sessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) throw new Error("Unauthorized");

    // Delete all messages in the session
    const messages = await ctx.db
      .query("ai_chat_messages")
      .withIndex("by_session", (q: any) => q.eq("sessionId", args.sessionId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    await ctx.db.delete(args.sessionId);
  },
});
