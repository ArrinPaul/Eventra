import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";

export const sendRequest = mutation({
  args: {
    receiverId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    if (userId === args.receiverId) throw new Error("Cannot connect with yourself");

    // Check if connection already exists (either direction)
    const existing = await ctx.db
      .query("connections")
      .withIndex("by_requester", (q) => q.eq("requesterId", userId))
      .filter((q) => q.eq(q.field("receiverId"), args.receiverId))
      .first();
    if (existing) throw new Error("Connection request already exists");

    const reverse = await ctx.db
      .query("connections")
      .withIndex("by_requester", (q) => q.eq("requesterId", args.receiverId))
      .filter((q) => q.eq(q.field("receiverId"), userId))
      .first();
    if (reverse) throw new Error("Connection request already exists");

    await ctx.db.insert("connections", {
      requesterId: userId,
      receiverId: args.receiverId,
      status: "pending",
      createdAt: Date.now(),
    });

    // Send notification to receiver
    const sender = await ctx.db.get(userId);
    await ctx.db.insert("notifications", {
      userId: args.receiverId,
      type: "connection",
      title: "New Connection Request",
      message: `${sender?.name || "Someone"} wants to connect with you.`,
      read: false,
      link: "/networking",
      createdAt: Date.now(),
    });
  },
});

export const respondToRequest = mutation({
  args: {
    connectionId: v.id("connections"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const connection = await ctx.db.get(args.connectionId);
    if (!connection) throw new Error("Connection not found");
    if (connection.receiverId !== userId) throw new Error("Not authorized");
    if (connection.status !== "pending") throw new Error("Request already handled");

    await ctx.db.patch(args.connectionId, {
      status: args.accept ? "accepted" : "rejected",
    });

    if (args.accept) {
      const me = await ctx.db.get(userId);
      await ctx.db.insert("notifications", {
        userId: connection.requesterId,
        type: "connection",
        title: "Connection Accepted",
        message: `${me?.name || "Someone"} accepted your connection request!`,
        read: false,
        link: "/networking",
        createdAt: Date.now(),
      });
    }
  },
});

export const removeConnection = mutation({
  args: {
    connectionId: v.id("connections"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const connection = await ctx.db.get(args.connectionId);
    if (!connection) throw new Error("Connection not found");
    if (connection.requesterId !== userId && connection.receiverId !== userId) {
      throw new Error("Not authorized");
    }
    await ctx.db.delete(args.connectionId);
  },
});

export const getMyConnections = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const sent = await ctx.db
      .query("connections")
      .withIndex("by_requester", (q) => q.eq("requesterId", userId))
      .collect();
    const received = await ctx.db
      .query("connections")
      .withIndex("by_receiver", (q) => q.eq("receiverId", userId))
      .collect();

    const all = [...sent, ...received];
    const enriched = await Promise.all(
      all.map(async (c) => {
        const otherId = c.requesterId === userId ? c.receiverId : c.requesterId;
        const otherUser = await ctx.db.get(otherId);
        return {
          ...c,
          direction: c.requesterId === userId ? ("sent" as const) : ("received" as const),
          otherUser: otherUser
            ? { id: otherUser._id, name: otherUser.name, email: otherUser.email, image: otherUser.image, role: otherUser.role }
            : null,
        };
      })
    );
    return enriched;
  },
});

export const getConnectionStatus = query({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const sent = await ctx.db
      .query("connections")
      .withIndex("by_requester", (q) => q.eq("requesterId", userId))
      .filter((q) => q.eq(q.field("receiverId"), args.otherUserId))
      .first();
    if (sent) return { connectionId: sent._id, status: sent.status, direction: "sent" as const };

    const received = await ctx.db
      .query("connections")
      .withIndex("by_requester", (q) => q.eq("requesterId", args.otherUserId))
      .filter((q) => q.eq(q.field("receiverId"), userId))
      .first();
    if (received) return { connectionId: received._id, status: received.status, direction: "received" as const };

    return null;
  },
});
