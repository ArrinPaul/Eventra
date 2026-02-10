import { query, mutation, internalMutation, QueryCtx, MutationCtx, InternalMutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";
import { internal } from "./_generated/api";

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
  args: { limit: v.optional(v.number()) },
  handler: async (ctx: QueryCtx, args) => {
    return await ctx.db
      .query("events")
      .order("desc")
      .take(args.limit || 100);
  },
});

export const list = query({
  args: { paginationOpts: v.any() },
  handler: async (ctx: QueryCtx, args) => {
    return await ctx.db
      .query("events")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const getById = query({
  args: { id: v.id("events") },
  handler: async (ctx: QueryCtx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByOrganizer = query({
  args: { organizerId: v.id("users") },
  handler: async (ctx: QueryCtx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_organizer", (q: any) => q.eq("organizerId", args.organizerId))
      .collect();
  },
});

export const getManagedEvents = query({
  args: { userId: v.id("users") },
  handler: async (ctx: QueryCtx, args) => {
    // Collect events where user is main organizer
    const owned = await ctx.db
      .query("events")
      .withIndex("by_organizer", (q: any) => q.eq("organizerId", args.userId))
      .collect();
    
    // Collect events where user is co-organizer using the new index
    const coOrganized = await ctx.db
      .query("events")
      .withIndex("by_co_organizer", (q: any) => q.eq("coOrganizerIds", args.userId))
      .collect();

    // Deduplicate and sort (user could be both, though unlikely with current logic)
    const allManaged = [...owned];
    const ownedIds = new Set(owned.map(e => e._id.toString()));
    
    for (const event of coOrganized) {
      if (!ownedIds.has(event._id.toString())) {
        allManaged.push(event);
      }
    }

    return allManaged.sort((a, b) => b.startDate - a.startDate);
  },
});

export const getBySpeaker = query({
  args: { speakerName: v.string() },
  handler: async (ctx: QueryCtx, args) => {
    // Use the new speaker index
    return await ctx.db
      .query("events")
      .withIndex("by_speaker", (q: any) => q.eq("speakers", args.speakerName))
      .filter((q: any) => q.or(
        q.eq(q.field("status"), "published"),
        q.eq(q.field("status"), "completed")
      ))
      .collect();
  },
});

export const listByOrganizer = query({
  args: { organizerId: v.id("users"), paginationOpts: v.any() },
  handler: async (ctx: QueryCtx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_organizer", (q: any) => q.eq("organizerId", args.organizerId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const getByStatus = query({
  args: { status: v.string() },
  handler: async (ctx: QueryCtx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_status", (q: any) => q.eq("status", args.status))
      .collect();
  },
});

export const listByStatus = query({
  args: { status: v.string(), paginationOpts: v.any() },
  handler: async (ctx: QueryCtx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_status", (q: any) => q.eq("status", args.status))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const getPublished = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    return await ctx.db
      .query("events")
      .withIndex("by_status", (q: any) => q.eq("status", "published"))
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
    coOrganizerIds: v.optional(v.array(v.id("users"))),
    imageUrl: v.optional(v.string()),
    capacity: v.number(),
    registeredCount: v.optional(v.number()), // Now optional as we force it to 0
    isPaid: v.optional(v.boolean()),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    organizationId: v.optional(v.string()),
    agenda: agendaValidator,
    speakers: v.optional(v.array(v.string())),
    waitlistEnabled: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    ticketTiers: v.optional(v.array(v.object({
      name: v.string(),
      price: v.number(),
      capacity: v.number(),
      registeredCount: v.number(),
      description: v.optional(v.string()),
    }))),
    isRecurring: v.optional(v.boolean()),
    recurrenceRule: v.optional(v.object({
      frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
      interval: v.number(),
      endDate: v.optional(v.number()),
    })),
    parentEventId: v.optional(v.id("events")),
  },
  handler: async (ctx: MutationCtx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized: You must be logged in to create an event");

    const user = await ctx.db.get(userId);
    if (!user || (user.role !== "organizer" && user.role !== "admin")) {
      throw new Error("Unauthorized: Only organizers or admins can create events");
    }

    // Force registeredCount to 0 and organizerId to the current user
    const eventId = await ctx.db.insert("events", {
      ...args,
      organizerId: userId,
      registeredCount: 0,
    });
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
      coOrganizerIds: v.optional(v.array(v.id("users"))),
      ticketTiers: v.optional(v.array(v.object({
        name: v.string(),
        price: v.number(),
        capacity: v.number(),
        registeredCount: v.number(),
        description: v.optional(v.string()),
      }))),
      isRecurring: v.optional(v.boolean()),
      recurrenceRule: v.optional(v.object({
        frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
        interval: v.number(),
        endDate: v.optional(v.number()),
      })),
    }),
  },
  handler: async (ctx: MutationCtx, args) => {
    const { id, updates } = args;
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const event = await ctx.db.get(id);
    if (!event) throw new Error("Event not found");

    const isCoOrganizer = event.coOrganizerIds?.includes(userId);
    if (event.organizerId !== userId && !isCoOrganizer) {
      throw new Error("Not authorized to update this event");
    }

    await ctx.db.patch(id, updates);
  },
});

export const cancelEvent = mutation({
  args: { id: v.id("events") },
  handler: async (ctx: MutationCtx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const event = await ctx.db.get(args.id);
    if (!event) throw new Error("Event not found");

    const isCoOrganizer = event.coOrganizerIds?.includes(userId);
    if (event.organizerId !== userId && !isCoOrganizer) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.id, { status: "cancelled" });
    
    // Trigger Webhook
    await ctx.scheduler.runAfter(0, internal.webhooks.trigger, {
      eventType: "event.cancelled",
      eventId: args.id,
      payload: { title: event.title, organizerId: event.organizerId },
    });

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
  handler: async (ctx: MutationCtx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const event = await ctx.db.get(args.id);
    if (!event) throw new Error("Event not found");

    if (event.organizerId !== userId && !event.coOrganizerIds?.includes(userId)) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.id, { status: "completed" });
  },
});

export const publishEvent = mutation({
  args: { id: v.id("events") },
  handler: async (ctx: MutationCtx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const event = await ctx.db.get(args.id);
    if (!event) throw new Error("Event not found");

    if (event.organizerId !== userId && !event.coOrganizerIds?.includes(userId)) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.id, { status: "published" });
  },
});

export const deleteEvent = mutation({
  args: { id: v.id("events") },
  handler: async (ctx: MutationCtx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const event = await ctx.db.get(args.id);
    if (!event) throw new Error("Event not found");

    if (event.organizerId !== userId) {
      throw new Error("Only the main organizer can delete the event");
    }

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
  handler: async (ctx: QueryCtx, args) => {
    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const userIds = regs.map((r) => r.userId);
    const users = await Promise.all(userIds.map((uid) => ctx.db.get(uid)));
    const userMap = new Map(users.filter((u): u is NonNullable<typeof u> => u !== null).map(u => [u._id.toString(), u]));

    return regs.map(reg => {
      const user = userMap.get(reg.userId.toString());
      return user ? { ...user, registrationStatus: reg.status } : null;
    }).filter((u): u is NonNullable<typeof u> => u !== null);
  },
});

export const cloneEvent = mutation({
  args: { id: v.id("events") },
  handler: async (ctx: MutationCtx, args) => {
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
  handler: async (ctx: QueryCtx) => {
    const now = Date.now();
    
    // Efficiently get counts using .count() instead of .collect().length
    const totalEvents = await ctx.db.query("events").count();
    const totalRegistrations = await ctx.db.query("registrations").count();
    const totalUsers = await ctx.db.query("users").count();
    
    // Get counts for specific statuses
    const activeEvents = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .count();
      
    const completedEvents = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .count();

    const upcomingEvents = await ctx.db
      .query("events")
      .withIndex("by_status_endDate", (q) => q.eq("status", "published").gt("endDate", now))
      .count();

    // For breakdown by category, we still might need to collect or use an aggregation table
    // For now, let's keep it simple but more efficient for totals.
    const allEvents = await ctx.db.query("events").collect();
    const eventsByCategory: Record<string, number> = {};
    const eventsByStatus: Record<string, number> = {};

    allEvents.forEach(e => {
      const cat = e.category || "Uncategorized";
      eventsByCategory[cat] = (eventsByCategory[cat] || 0) + 1;
      
      const status = e.status || "draft";
      eventsByStatus[status] = (eventsByStatus[status] || 0) + 1;
    });

    const reviews = await ctx.db.query("reviews").collect();
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : 0;

    return {
      totalEvents,
      activeEvents,
      upcomingEvents,
      completedEvents,
      totalRegistrations,
      totalUsers,
      eventsByCategory,
      eventsByStatus,
      averageRating: Math.round(avgRating * 10) / 10,
      recentRegistrations: 0,
    };
  },
});

// Internal mutation called by cron to auto-complete past events
export const autoCompletePastEvents = internalMutation({
  args: {},
  handler: async (ctx: InternalMutationCtx) => {
    const now = Date.now();
    const events = await ctx.db
      .query("events")
      .withIndex("by_status_endDate", (q) => 
        q.eq("status", "published").lt("endDate", now)
      )
      .collect();
    
    let completed = 0;
    for (const event of events) {
      await ctx.db.patch(event._id, { status: "completed" });
      completed++;
    }
    return { completed };
  },
});

export const addReaction = mutation({
  args: { eventId: v.id("events"), emoji: v.string() },
  handler: async (ctx: MutationCtx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("event_reactions")
      .withIndex("by_user_event", (q) => q.eq("userId", userId).eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("emoji"), args.emoji))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return;
    }

    await ctx.db.insert("event_reactions", {
      userId,
      eventId: args.eventId,
      emoji: args.emoji,
    });
  },
});

export const getReactions = query({
  args: { eventId: v.id("events") },
  handler: async (ctx: QueryCtx, args) => {
    const reactions = await ctx.db
      .query("event_reactions")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const currentUserId = await auth.getUserId(ctx);

    // Group by emoji
    const grouped: Record<string, { count: number, me: boolean }> = {};
    reactions.forEach(r => {
      if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, me: false };
      grouped[r.emoji].count++;
      if (r.userId === currentUserId) grouped[r.emoji].me = true;
    });

    return grouped;
  },
});
