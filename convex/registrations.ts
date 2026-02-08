import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

/**
 * Register for an event
 * Automatically creates a confirmed registration and a unique ticket
 */
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
    
    // 1. Create unique ticket number
    const ticketNumber = `EVT-${args.eventId.substring(0, 4)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // 2. Create the ticket
    const ticketId = await ctx.db.insert("tickets", {
      eventId: args.eventId,
      userId,
      ticketNumber,
      status: "confirmed",
      price: event.price || 0,
      purchaseDate: Date.now(),
    });

    // 3. Create the registration linked to the ticket
    const regId = await ctx.db.insert("registrations", {
      userId,
      eventId: args.eventId,
      status: "confirmed",
      registrationDate: Date.now(),
      ticketId,
    });
    
    // 4. Update event attendee count
    await ctx.db.patch(args.eventId, {
      registeredCount: (event.registeredCount || 0) + 1,
    });

    // 5. Award XP for registration
    const user = await ctx.db.get(userId);
    await ctx.db.patch(userId, {
      points: (user.points || 0) + 50,
      xp: (user.xp || 0) + 50,
    });

    await ctx.db.insert("points_history", {
      userId,
      points: 50,
      reason: `Registered for event: ${event.title}`,
      createdAt: Date.now(),
    });
    
    return regId;
  },
});

/**
 * Get registration status for the current user
 */
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