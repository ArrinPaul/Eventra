import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const sendRequest = mutation({
  args: {
    receiverId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) throw new Error("User not found");
    if (user._id === args.receiverId) throw new Error("Cannot connect with yourself");

    // Check if connection already exists (either direction)
    const existing = await ctx.db
      .query("connections")
      .withIndex("by_requester", (q) => q.eq("requesterId", user._id))
      .filter((q) => q.eq(q.field("receiverId"), args.receiverId))
      .first();
    if (existing) throw new Error("Connection request already exists");

    const reverse = await ctx.db
      .query("connections")
      .withIndex("by_requester", (q) => q.eq("requesterId", args.receiverId))
      .filter((q) => q.eq(q.field("receiverId"), user._id))
      .first();
    if (reverse) throw new Error("Connection request already exists");

    await ctx.db.insert("connections", {
      requesterId: user._id,
      receiverId: args.receiverId,
      status: "pending",
      createdAt: Date.now(),
    });

    // Send notification to receiver
    await ctx.db.insert("notifications", {
      userId: args.receiverId,
      type: "connection",
      title: "New Connection Request",
      message: `${user.name || "Someone"} wants to connect with you.`,
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) throw new Error("User not found");

    const connection = await ctx.db.get(args.connectionId);
    if (!connection) throw new Error("Connection not found");
    if (connection.receiverId !== user._id) throw new Error("Not authorized");
    if (connection.status !== "pending") throw new Error("Request already handled");

    await ctx.db.patch(args.connectionId, {
      status: args.accept ? "accepted" : "rejected",
    });

    if (args.accept) {
      await ctx.db.insert("notifications", {
        userId: connection.requesterId,
        type: "connection",
        title: "Connection Accepted",
        message: `${user.name || "Someone"} accepted your connection request!`,
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) throw new Error("User not found");

    const connection = await ctx.db.get(args.connectionId);
    if (!connection) throw new Error("Connection not found");
    if (connection.requesterId !== user._id && connection.receiverId !== user._id) {
      throw new Error("Not authorized");
    }
    await ctx.db.delete(args.connectionId);
  },
});

export const getMyConnections = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) return [];

    const sent = await ctx.db
      .query("connections")
      .withIndex("by_requester", (q) => q.eq("requesterId", user._id))
      .collect();
    const received = await ctx.db
      .query("connections")
      .withIndex("by_receiver", (q) => q.eq("receiverId", user._id))
      .collect();

    const all = [...sent, ...received];
    const enriched = await Promise.all(
      all.map(async (c) => {
        const otherId = c.requesterId === user._id ? c.receiverId : c.requesterId;
        const otherUser = await ctx.db.get(otherId);
        return {
          ...c,
          direction: c.requesterId === user._id ? ("sent" as const) : ("received" as const),
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) return null;

    const sent = await ctx.db
      .query("connections")
      .withIndex("by_requester", (q) => q.eq("requesterId", user._id))
      .filter((q) => q.eq(q.field("receiverId"), args.otherUserId))
      .first();
    if (sent) return { connectionId: sent._id, status: sent.status, direction: "sent" as const };

    const received = await ctx.db
      .query("connections")
      .withIndex("by_requester", (q) => q.eq("requesterId", args.otherUserId))
      .filter((q) => q.eq(q.field("receiverId"), user._id))
      .first();
    if (received) return { connectionId: received._id, status: received.status, direction: "received" as const };

    return null;
  },
});
