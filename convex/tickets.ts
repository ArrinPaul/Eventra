import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByEventId = query({
  args: { eventId: v.id("events") },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_event", (q: any) => q.eq("eventId", args.eventId))
      .collect();
  },
});

export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect();
  },
});

export const createTicket = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.id("users"),
    ticketNumber: v.string(),
    price: v.number(),
    status: v.string(),
    attendeeName: v.string(),
    attendeeEmail: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.insert("tickets", {
      ...args,
      purchaseDate: Date.now(),
    });
  },
});

export const updateTicketStatus = mutation({
  args: {
    id: v.id("tickets"),
    status: v.union(v.literal("confirmed"), v.literal("pending"), v.literal("cancelled"), v.literal("checked-in"), v.literal("refunded")),
    checkInStatus: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      checkInStatus: args.checkInStatus,
    });
  },
});

export const getTicketByNumber = query({
  args: { ticketNumber: v.string() },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_ticket_number", (q: any) => q.eq("ticketNumber", args.ticketNumber))
      .unique();
  },
});

/**
 * Check in a ticket by ID or ticketNumber
 */
export const checkInTicket = mutation({
  args: { 
    id: v.optional(v.id("tickets")),
    ticketNumber: v.optional(v.string())
  },
  handler: async (ctx: any, args: any) => {
    let ticket;
    if (args.id) {
      ticket = await ctx.db.get(args.id);
    } else if (args.ticketNumber) {
      ticket = await ctx.db
        .query("tickets")
        .withIndex("by_ticket_number", (q: any) => q.eq("ticketNumber", args.ticketNumber))
        .unique();
    }

    if (!ticket) throw new Error("Ticket not found");
    if (ticket.status === "checked-in") throw new Error("Ticket already checked in");
    
    await ctx.db.patch(ticket._id, {
      status: "checked-in",
      checkInStatus: "checked_in",
    });

    // Also update registration
    const registration = await ctx.db
      .query("registrations")
      .withIndex("by_event_user", (q: any) => q.eq("eventId", ticket.eventId).eq("userId", ticket.userId))
      .unique();
      
    if (registration) {
      await ctx.db.patch(registration._id, {
        status: "checked-in",
        checkedIn: true,
        checkInTime: Date.now(),
      });
    }

    // Award XP for check-in
    const user = await ctx.db.get(ticket.userId);
    if (user) {
      await ctx.db.patch(user._id, {
        points: (user.points || 0) + 100,
        xp: (user.xp || 0) + 100,
        checkedIn: true,
      });
      
      await ctx.db.insert("points_history", {
        userId: user._id,
        points: 100,
        reason: "Event Check-in",
        createdAt: Date.now(),
      });
    }
    
    return { success: true, ticket };
  },
});
