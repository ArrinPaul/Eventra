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

export const checkInTicket = mutation({
  args: { id: v.id("tickets") },
  handler: async (ctx: any, args: any) => {
    const ticket = await ctx.db.get(args.id);
    if (!ticket) throw new Error("Ticket not found");
    
    await ctx.db.patch(args.id, {
      status: "checked-in",
      checkInStatus: "checked_in",
    });
    
    return true;
  },
});