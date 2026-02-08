import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("events").collect();
  },
});

export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const id = args.id as Id<"events">;
    return await ctx.db.get(id);
  },
});

export const getByOrganizer = query({
  args: { organizerId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_organizer", (q) => q.eq("organizerId", args.organizerId))
      .collect();
  },
});

export const getByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

export const getPublished = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    location: v.any(),
    type: v.string(),
    category: v.string(),
    status: v.string(),
    organizerId: v.id("users"),
    imageUrl: v.optional(v.string()),
    capacity: v.number(),
    registeredCount: v.number(),
    isPaid: v.optional(v.boolean()),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    organizationId: v.optional(v.string()),
    agenda: v.optional(v.any()),
    speakers: v.optional(v.array(v.string())),
    waitlistEnabled: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("events", args);
    return eventId;
  },
});

export const update = mutation({
  args: {
    id: v.id("events"),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      startDate: v.optional(v.number()),
      endDate: v.optional(v.number()),
      location: v.optional(v.any()),
      type: v.optional(v.string()),
      category: v.optional(v.string()),
      status: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      capacity: v.optional(v.number()),
      registeredCount: v.optional(v.number()),
      isPaid: v.optional(v.boolean()),
      price: v.optional(v.number()),
      currency: v.optional(v.string()),
      targetAudience: v.optional(v.string()),
      agenda: v.optional(v.any()),
      speakers: v.optional(v.array(v.string())),
      waitlistEnabled: v.optional(v.boolean()),
      tags: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const { id, updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const cancelEvent = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.id);
    if (!event) throw new Error("Event not found");
    await ctx.db.patch(args.id, { status: "cancelled" });
    // Notify registered users
    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .collect();
    for (const reg of regs) {
      await ctx.db.insert("notifications", {
        userId: reg.userId,
        title: "Event Cancelled",
        message: `The event "${event.title}" has been cancelled.`,
        type: "event",
        read: false,
        createdAt: Date.now(),
        link: `/events/${args.id}`,
      });
    }
  },
});

export const completeEvent = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "completed" });
  },
});

export const publishEvent = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "published" });
  },
});

export const deleteEvent = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    // Cascading delete: remove registrations, tickets, reviews, certificates
    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .collect();
    for (const reg of regs) {
      if (reg.ticketId) {
        await ctx.db.delete(reg.ticketId);
      }
      await ctx.db.delete(reg._id);
    }
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .collect();
    for (const ticket of tickets) {
      await ctx.db.delete(ticket._id);
    }
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .collect();
    for (const review of reviews) {
      await ctx.db.delete(review._id);
    }
    const certs = await ctx.db
      .query("certificates")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .collect();
    for (const cert of certs) {
      await ctx.db.delete(cert._id);
    }
    await ctx.db.delete(args.id);
  },
});

export const getAttendees = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const userIds = regs.map((r) => r.userId);
    const attendees = [];
    for (const uid of userIds) {
      const user = await ctx.db.get(uid);
      const reg = regs.find((r) => r.userId === uid);
      if (user) attendees.push({ ...user, registrationStatus: reg?.status });
    }
    return attendees;
  },
});

export const cloneEvent = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.id);
    if (!event) throw new Error("Event not found");
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const { _id, _creationTime, registeredCount, ...rest } = event;
    return await ctx.db.insert("events", {
      ...rest,
      title: `${event.title} (Copy)`,
      status: "draft",
      registeredCount: 0,
      organizerId: userId,
    });
  },
});
