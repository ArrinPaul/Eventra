import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const getRooms = query({
  args: {},
  handler: async (ctx: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("chat_rooms")
      .filter((q: any) => q.contains(q.field("participants"), userId))
      .collect();
  },
});

export const getMessages = query({
  args: { roomId: v.id("chat_rooms") },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_room", (q: any) => q.eq("roomId", args.roomId))
      .collect();
  },
});

export const sendMessage = mutation({
  args: {
    roomId: v.id("chat_rooms"),
    content: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    
    await ctx.db.insert("messages", {
      roomId: args.roomId,
      senderId: userId,
      content: args.content,
      sentAt: Date.now(),
      readBy: [userId],
    });
    
    await ctx.db.patch(args.roomId, {
      lastMessageAt: Date.now(),
    });
  },
});

export const createRoom = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    participants: v.array(v.id("users")),
  },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.insert("chat_rooms", args);
  },
});
