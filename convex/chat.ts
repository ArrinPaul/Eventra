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

      let participantNames = [];
      if (room.type === 'direct') {
        // For direct rooms, we want the other person's name
        for (const pid of room.participants) {
          if (pid !== userId) {
            const user = await ctx.db.get(pid);
            if (user) participantNames.push(user.name || "User");
          }
        }
      } else if (room.type === 'event') {
        participantNames = ["Event Group"];
      } else {
        participantNames = [room.name || "Group"];
      }

      // Get unread count using lastReadAt - more efficient
      const unreadCount = await ctx.db
        .query("messages")
        .withIndex("by_room", (q) => q.eq("roomId", room._id))
        .filter((q) => q.and(
          q.gt(q.field("sentAt"), membership.lastReadAt),
          q.neq(q.field("senderId"), userId)
        ))
        .collect()
        .then(messages => messages.length);
      
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

export const listMessages = query({
  args: { roomId: v.id("chat_rooms"), paginationOpts: v.paginationOpts() },
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

    // Basic file validation
    if (args.fileUrl && !args.fileType) {
      throw new Error("File type is required when providing a file URL");
    }

    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
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

    // Send notifications to other participants
    const room = await ctx.db.get(args.roomId);
    const sender = await ctx.db.get(userId);
    if (room) {
      // Limit notifications for large event rooms to avoid performance hits
      if (room.type === "event" && room.participants.length > 50) {
        // In large event rooms, maybe only notify the organizer if they are not the sender
        if (room.eventId) {
          const event = await ctx.db.get(room.eventId);
          if (event && event.organizerId !== userId) {
            await ctx.db.insert("notifications", {
              userId: event.organizerId,
              title: `New message in ${event.title}`,
              message: `${sender?.name || "User"}: ${args.content.substring(0, 50)}`,
              type: "chat",
              read: false,
              createdAt: now,
              link: `/chat?roomId=${args.roomId}`,
            });
          }
        }
      } else {
        for (const participantId of room.participants) {
          if (participantId !== userId) {
            let title = "New Message";
            if (room.type === "direct") {
              title = `Message from ${sender?.name || "User"}`;
            } else if (room.name) {
              title = `New message in ${room.name}`;
            }

            await ctx.db.insert("notifications", {
              userId: participantId,
              title,
              message: args.content.substring(0, 100) || (args.fileUrl ? "Shared an attachment" : "New message"),
              type: "chat",
              read: false,
              createdAt: now,
              link: `/chat?roomId=${args.roomId}`,
            });
          }
        }
      }
    }

    return messageId;
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

    // For direct messages, check if room already exists - Scalable approach
    if (args.type === "direct" && args.participants.length === 2) {
      const rooms = await ctx.db.query("chat_rooms")
        .withIndex("by_participants", (q) => q.eq("participants", args.participants[0]))
        .filter((q) => q.eq(q.field("type"), "direct"))
        .collect();
      
      const existing = rooms.find(
        (r) =>
          r.participants.length === 2 &&
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
