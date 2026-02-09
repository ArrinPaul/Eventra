import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

const locationValidator = v.optional(v.union(
  v.string(),
  v.object({
    venue: v.optional(v.union(v.string(), v.object({ name: v.optional(v.string()), address: v.optional(v.string()), city: v.optional(v.string()), country: v.optional(v.string()) }))),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    virtualLink: v.optional(v.string()),
  })
));

const agendaValidator = v.optional(v.array(v.object({
  title: v.string(),
  startTime: v.optional(v.string()),
  endTime: v.optional(v.string()),
  description: v.optional(v.string()),
  speaker: v.optional(v.string()),
  type: v.optional(v.string()),
})));

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("events").collect();
  },
});

export const list = query({
  args: { paginationOpts: v.any() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const getById = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
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

export const listByOrganizer = query({
  args: { organizerId: v.id("users"), paginationOpts: v.any() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_organizer", (q) => q.eq("organizerId", args.organizerId))
      .order("desc")
      .paginate(args.paginationOpts);
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

export const listByStatus = query({
  args: { status: v.string(), paginationOpts: v.any() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .paginate(args.paginationOpts);
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
    location: locationValidator,
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
    agenda: agendaValidator,
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
      location: locationValidator,
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
      agenda: agendaValidator,
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
    // Collect ticket IDs from registrations for dedup
    const deletedTicketIds = new Set<string>();
    for (const reg of regs) {
      if (reg.ticketId) {
        await ctx.db.delete(reg.ticketId);
        deletedTicketIds.add(reg.ticketId.toString());
      }
      await ctx.db.delete(reg._id);
    }
    // Delete remaining tickets not linked from registrations
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .collect();
    for (const ticket of tickets) {
      if (!deletedTicketIds.has(ticket._id.toString())) {
        await ctx.db.delete(ticket._id);
      }
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

export const getAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("events").collect();
    const registrations = await ctx.db.query("registrations").collect();
    const users = await ctx.db.query("users").collect();
    const reviews = await ctx.db.query("reviews").collect();

    const now = Date.now();
    const upcomingEvents = events.filter((e) => e.status === "published" && (e.startDate || 0) > now);
    const pastEvents = events.filter((e) => e.status === "completed" || (e.startDate || 0) < now);

    // Events by category
    const byCategory: Record<string, number> = {};
    events.forEach((e) => {
      const cat = (e as any).category || "Uncategorized";
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    });

    // Registrations over last 30 days
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const recentRegistrations = registrations.filter((r) => (r as any).registeredAt > thirtyDaysAgo);

    // Average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + ((r as any).rating || 0), 0) / reviews.length
      : 0;

    return {
      totalEvents: events.length,
      activeEvents: events.filter((e) => e.status === "published").length,
      upcomingEvents: upcomingEvents.length,
      completedEvents: pastEvents.length,
      totalRegistrations: registrations.length,
      totalUsers: users.length,
      recentRegistrations: recentRegistrations.length,
      averageRating: Math.round(avgRating * 10) / 10,
      eventsByCategory: byCategory,
      eventsByStatus: events.reduce((acc: Record<string, number>, e) => {
        acc[e.status || "draft"] = (acc[e.status || "draft"] || 0) + 1;
        return acc;
      }, {}),
    };
  },
});

// Internal mutation called by cron to auto-complete past events
export const autoCompletePastEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const events = await ctx.db.query("events").collect();
    let completed = 0;
    for (const event of events) {
      if (event.status === "published" && event.endDate && event.endDate < now) {
        await ctx.db.patch(event._id, { status: "completed" });
        completed++;
      }
    }
    return { completed };
  },
});
