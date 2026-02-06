import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const register = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");
    
    const existing = await ctx.db
      .query("registrations")
      .withIndex("by_event_user", (q: any) => q.eq("eventId", args.eventId).eq("userId", userId))
      .unique();
      
    if (existing) return existing._id;
    
    const regId = await ctx.db.insert("registrations", {
      userId,
      eventId: args.eventId,
      status: "confirmed",
      registrationDate: Date.now(),
    });
    
    await ctx.db.patch(args.eventId, {
      registeredCount: (event.registeredCount || 0) + 1,
    });
    
    return regId;
  },
});

export const getRegistration = query({
  args: { eventId: v.id("events") },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;
    
    return await ctx.db
      .query("registrations")
      .withIndex("by_event_user", (q: any) => q.eq("eventId", args.eventId).eq("userId", userId))
      .unique();
  },
});
