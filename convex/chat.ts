import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const getRooms = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const memberships = await ctx.db
      .query("room_members")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const enriched = [];
    for (const membership of memberships) {
      const room = await ctx.db.get(membership.roomId);
      if (!room) continue;

      const participantNames = [];
      for (const pid of room.participants) {
        if (pid !== userId) {
          const user = await ctx.db.get(pid);
          if (user) participantNames.push(user.name || "User");
        }
      }

      // Get unread count using lastReadAt
      const unreadMessages = await ctx.db
        .query("messages")
        .withIndex("by_room", (q) => q.eq("roomId", room._id))
        .filter((q) => q.gt(q.field("sentAt"), membership.lastReadAt))
        .collect();
      
      const unreadCount = unreadMessages.filter(m => m.senderId !== userId).length;
      
      const lastMessage = await ctx.db
        .query("messages")
        .withIndex("by_room", (q) => q.eq("roomId", room._id))
        .order("desc")
        .first();

      enriched.push({
        ...room,
        participantNames,
        unreadCount,
        lastMessagePreview: lastMessage?.content?.substring(0, 50),
      });
    }
    // Sort by last message time or creation time
    return enriched.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
  },
});

export const getMessages = query({
  args: { roomId: v.id("chat_rooms") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    // Enrich with sender info
    const enriched = [];
    for (const msg of messages) {
      const sender = await ctx.db.get(msg.senderId);
      enriched.push({
        ...msg,
        senderName: sender?.name || "User",
        senderImage: sender?.image,
      });
    }
    return enriched;
  },
});

export const listMessages = query({
  args: { roomId: v.id("chat_rooms"), paginationOpts: v.any() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("messages")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...results,
      page: await Promise.all(
        results.page.map(async (msg: any) => {
          const sender = await ctx.db.get(msg.senderId);
          return {
            ...msg,
            senderName: sender?.name || "User",
            senderImage: sender?.image,
          };
        })
      ),
    };
  },
});

export const sendMessage = mutation({
  args: {
    roomId: v.id("chat_rooms"),
    content: v.string(),
    fileUrl: v.optional(v.string()),
    fileType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const now = Date.now();
    await ctx.db.insert("messages", {
      roomId: args.roomId,
      senderId: userId,
      content: args.content,
      sentAt: now,
      readBy: [userId],
      fileUrl: args.fileUrl,
      fileType: args.fileType,
    });

    await ctx.db.patch(args.roomId, {
      lastMessageAt: now,
    });

    // Update sender's lastReadAt
    const membership = await ctx.db
      .query("room_members")
      .withIndex("by_user_room", (q) => q.eq("userId", userId).eq("roomId", args.roomId))
      .unique();
    if (membership) {
      await ctx.db.patch(membership._id, { lastReadAt: now });
    }
  },
});

export const markMessagesRead = mutation({
  args: { roomId: v.id("chat_rooms") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return;

    const membership = await ctx.db
      .query("room_members")
      .withIndex("by_user_room", (q) => q.eq("userId", userId).eq("roomId", args.roomId))
      .unique();

    if (membership) {
      await ctx.db.patch(membership._id, { lastReadAt: Date.now() });
    }

    // Legacy support: also update messages readBy if needed, but lastReadAt is primary now
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(50); // Just update recent ones

    for (const msg of messages) {
      if (!msg.readBy.includes(userId)) {
        await ctx.db.patch(msg._id, {
          readBy: [...msg.readBy, userId],
        });
      }
    }
  },
});

export const createRoom = mutation({
  args: {
    name: v.optional(v.string()),
    type: v.union(v.literal("group"), v.literal("direct"), v.literal("event")),
    participants: v.array(v.id("users")),
    eventId: v.optional(v.id("events")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // For direct messages, check if room already exists
    if (args.type === "direct" && args.participants.length === 2) {
      const rooms = await ctx.db.query("chat_rooms")
        .withIndex("by_type", (q) => q.eq("type", "direct"))
        .collect();
      
      const existing = rooms.find(
        (r) =>
          r.participants.length === 2 &&
          r.participants.includes(args.participants[0]) &&
          r.participants.includes(args.participants[1])
      );
      if (existing) return existing._id;
    }

    const roomId = await ctx.db.insert("chat_rooms", {
      name: args.name,
      type: args.type,
      participants: args.participants,
      eventId: args.eventId,
      lastMessageAt: Date.now(),
    });

    // Create memberships
    for (const pid of args.participants) {
      await ctx.db.insert("room_members", {
        roomId,
        userId: pid,
        lastReadAt: Date.now(),
      });
    }

    return roomId;
  },
});

export const createEventChatRoom = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    // Check if room already exists for this event
    const existing = await ctx.db
      .query("chat_rooms")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();
    if (existing) return existing._id;

    // Get all registered attendees
    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    const participants = [event.organizerId, ...regs.map((r) => r.userId)];

    const roomId = await ctx.db.insert("chat_rooms", {
      name: event.title,
      type: "event",
      participants,
      eventId: args.eventId,
      lastMessageAt: Date.now(),
    });

    // Create memberships
    for (const pid of participants) {
      await ctx.db.insert("room_members", {
        roomId,
        userId: pid,
        lastReadAt: Date.now(),
      });
    }

    return roomId;
  },
});
