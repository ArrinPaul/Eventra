import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { auth } from "./auth";
import { api, internal } from "./_generated/api";
import { awardPointsInternal } from "./gamification";

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

export const getMyTickets = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    // Enrich with event data
    const enriched = [];
    for (const ticket of tickets) {
      const event = await ctx.db.get(ticket.eventId);
      enriched.push({ ...ticket, event });
    }
    return enriched;
  },
});

export const createTicket = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.id("users"),
    ticketNumber: v.string(),
    price: v.number(),
    status: v.string(),
    attendeeName: v.optional(v.string()),
    attendeeEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const callerId = await auth.getUserId(ctx);
    if (!callerId) {
      throw new Error("Unauthorized: Authentication required");
    }
    
    const caller = await ctx.db.get(callerId);
    if (!caller || caller.role !== "admin") {
      throw new Error("Unauthorized: Only admins can create tickets manually");
    }
    
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

/**
 * Check in a ticket by ID or ticketNumber, scoped to a specific event
 */
export const checkInTicket = mutation({
  args: {
    id: v.optional(v.id("tickets")),
    ticketNumber: v.optional(v.string()),
    eventId: v.optional(v.id("events")),
  },
  handler: async (ctx, args) => {
    let ticket;
    if (args.id) {
      ticket = await ctx.db.get(args.id);
    } else if (args.ticketNumber) {
      ticket = await ctx.db
        .query("tickets")
        .withIndex("by_ticket_number", (q) => q.eq("ticketNumber", args.ticketNumber))
        .unique();
    }

    if (!ticket) throw new Error("Ticket not found");
    if (ticket.status === "checked-in") throw new Error("Ticket already checked in");
    if (ticket.status === "cancelled") throw new Error("Ticket is cancelled");

    // Scope check: ensure ticket belongs to the selected event
    if (args.eventId && ticket.eventId !== args.eventId) {
      throw new Error("Ticket does not belong to the selected event");
    }

    await ctx.db.patch(ticket._id, {
      status: "checked-in",
      checkInStatus: "checked_in",
    });

    // Update registration
    const registration = await ctx.db
      .query("registrations")
      .withIndex("by_event_user", (q) => q.eq("eventId", ticket.eventId).eq("userId", ticket.userId))
      .unique();

    if (registration) {
      await ctx.db.patch(registration._id, {
        status: "checked-in",
        checkedIn: true,
        checkInTime: Date.now(),
      });
    }

    // Award XP for check-in
    const event = await ctx.db.get(ticket.eventId);
    await awardPointsInternal(
      ctx,
      ticket.userId,
      100,
      `Checked in to ${event?.title || "an event"}`,
      `/events/${ticket.eventId}`
    );

    await ctx.db.patch(ticket.userId, { checkedIn: true });

    // Notification
    await ctx.db.insert("notifications", {
      userId: ticket.userId,
      title: "Checked In! ✅",
      message: `You've been checked in to "${event?.title || "the event"}". Enjoy!`,
      type: "event",
      read: false,
      createdAt: Date.now(),
    });

    // Trigger Webhook
    await ctx.scheduler.runAfter(0, internal.webhooks.trigger, {
      eventType: "checkin.completed",
      eventId: ticket.eventId,
      payload: { userId: ticket.userId, ticketNumber: ticket.ticketNumber, attendeeName: ticket.attendeeName },
    });

    // Trigger Challenge Progress
    await ctx.scheduler.runAfter(0, api.gamification.triggerChallengeProgress, {
      userId: ticket.userId,
      type: "attendance",
    });

    return { success: true, ticket };
  },
});

/**
 * Cancel (refund) a ticket
 */
export const cancelTicket = mutation({
  args: { ticketId: v.id("tickets"), status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");
    if (ticket.userId !== userId) throw new Error("Not your ticket");
    if (ticket.status === "cancelled" || ticket.status === "refunded") {
      throw new Error("Ticket already cancelled");
    }

    const newStatus = args.status || "cancelled";
    await ctx.db.patch(args.ticketId, { status: newStatus as any });

    // Cancel linked registration
    const reg = await ctx.db
      .query("registrations")
      .withIndex("by_event_user", (q) => q.eq("eventId", ticket.eventId).eq("userId", userId))
      .unique();
    if (reg) {
      await ctx.db.patch(reg._id, { status: newStatus });
    }

    // Decrement event count
    const event = await ctx.db.get(ticket.eventId);
    if (event) {
      await ctx.db.patch(ticket.eventId, {
        registeredCount: Math.max(0, (event.registeredCount || 1) - 1),
      });
    }

    return { success: true };
  },
});
