import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

/**
 * Validate a discount code
 */
export const validate = query({
  args: { 
    code: v.string(), 
    eventId: v.optional(v.id("events")) 
  },
  handler: async (ctx, args) => {
    const code = await ctx.db
      .query("discount_codes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .unique();

    if (!code) return { valid: false, message: "Invalid code" };
    if (!code.isActive) return { valid: false, message: "Code is inactive" };
    
    if (code.expiryDate && code.expiryDate < Date.now()) {
      return { valid: false, message: "Code has expired" };
    }
    
    if (code.maxUses && code.usedCount >= code.maxUses) {
      return { valid: false, message: "Code usage limit reached" };
    }
    
    if (code.eventId && args.eventId && code.eventId !== args.eventId) {
      return { valid: false, message: "Code not valid for this event" };
    }

    return { 
      valid: true, 
      type: code.type, 
      value: code.value,
      id: code._id
    };
  },
});

/**
 * Create a new discount code
 */
export const create = mutation({
  args: {
    code: v.string(),
    type: v.union(v.literal("percentage"), v.literal("fixed")),
    value: v.number(),
    eventId: v.optional(v.id("events")),
    maxUses: v.optional(v.number()),
    expiryDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    
    // Check if user is organizer of the event or admin
    if (args.eventId) {
      const event = await ctx.db.get(args.eventId);
      if (!event) throw new Error("Event not found");
      if (event.organizerId !== userId && !event.coOrganizerIds?.includes(userId)) {
        const user = await ctx.db.get(userId);
        if (user?.role !== "admin") throw new Error("Unauthorized");
      }
    } else {
       // Platform-wide codes only by admins
       const user = await ctx.db.get(userId);
       if (user?.role !== "admin") throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("discount_codes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .unique();
    
    if (existing) throw new Error("Code already exists");

    return await ctx.db.insert("discount_codes", {
      ...args,
      code: args.code.toUpperCase(),
      usedCount: 0,
      isActive: true,
    });
  },
});

/**
 * Increment usage count
 * Internal or called after successful payment
 */
export const incrementUsage = mutation({
  args: { codeId: v.id("discount_codes") },
  handler: async (ctx, args) => {
    const code = await ctx.db.get(args.codeId);
    if (!code) return;
    
    await ctx.db.patch(args.codeId, {
      usedCount: code.usedCount + 1,
    });
  },
});

/**
 * List codes for an event
 */
export const listByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("discount_codes")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
  },
});

/**
 * Deactivate a code
 */
export const deactivate = mutation({
  args: { id: v.id("discount_codes") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    
    const code = await ctx.db.get(args.id);
    if (!code) throw new Error("Code not found");

    // Check if user is organizer of the event or admin
    if (code.eventId) {
      const event = await ctx.db.get(code.eventId);
      if (event && event.organizerId !== userId && !event.coOrganizerIds?.includes(userId)) {
        const user = await ctx.db.get(userId);
        if (user?.role !== "admin") throw new Error("Unauthorized");
      }
    } else {
       const user = await ctx.db.get(userId);
       if (user?.role !== "admin") throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, { isActive: false });
  },
});
