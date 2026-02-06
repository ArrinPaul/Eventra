import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByEventId = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
  },
});

export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.id("users"),
    ticketTypeId: v.optional(v.string()),
    ticketNumber: v.string(),
    status: v.string(),
    price: v.number(),
    purchaseDate: v.number(),
    qrCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tickets", args);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("tickets"),
    status: v.string(),
    checkInStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      checkInStatus: args.checkInStatus,
    });
  },
});

export const getTicketByNumber = query({
  args: { ticketNumber: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_ticket_number", (q) => q.eq("ticketNumber", args.ticketNumber))
      .unique();
  },
});

export const checkInTicket = mutation({
  args: { id: v.id("tickets") },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.id);
    if (!ticket) throw new Error("Ticket not found");
    
    await ctx.db.patch(args.id, {
      status: "checked-in",
      checkInStatus: "checked_in",
    });
    
    return true;
  },
});
