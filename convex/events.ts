import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("events").collect();
  },
});

export const getById = query({
  args: { id: v.string() },
  handler: async (ctx: any, args: any) => {
    // Normalize ID - handled by Convex usually but good for robustness
    const id = args.id as any; 
    return await ctx.db.get(id);
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
  },
  handler: async (ctx: any, args: any) => {
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
      status: v.optional(v.string()),
      registeredCount: v.optional(v.number()),
      // Add other fields as needed
    }),
  },
  handler: async (ctx: any, args: any) => {
    const { id, updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteEvent = mutation({
  args: { id: v.id("events") },
  handler: async (ctx: any, args: any) => {
    await ctx.db.delete(args.id);
  },
});

export const getAttendees = query({
  args: { eventId: v.id("events") },
  handler: async (ctx: any, args: any) => {
    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q: any) => q.eq("eventId", args.eventId))
      .collect();
      
    const attendees = [];
    for (const reg of regs) {
      const user = await ctx.db.get(reg.userId);
      if (user) attendees.push({ ...user, registrationStatus: reg.status });
    }
    return attendees;
  },
});
