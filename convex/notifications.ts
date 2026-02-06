import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const get = query({
  args: {},
  handler: async (ctx: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const markRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx: any, args: any) => {
    await ctx.db.patch(args.id, { read: true });
  },
});

export const deleteNotification = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx: any, args: any) => {
    await ctx.db.delete(args.id);
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return;
    
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .filter((q: any) => q.eq(q.field("read"), false))
      .collect();
      
    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
  },
});
