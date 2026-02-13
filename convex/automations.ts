import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("automations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    triggerType: v.string(),
    triggerConfig: v.any(),
    actions: v.array(v.object({
      id: v.string(),
      type: v.string(),
      config: v.any(),
      delay: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    return await ctx.db.insert("automations", {
      ...args,
      userId,
      isActive: true,
      runCount: 0,
      successCount: 0,
      errorCount: 0,
    });
  },
});

export const toggle = mutation({
  args: { id: v.id("automations"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const automation = await ctx.db.get(args.id);
    if (!automation || automation.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.id, { isActive: args.isActive });
  },
});

export const deleteAutomation = mutation({
  args: { id: v.id("automations") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const automation = await ctx.db.get(args.id);
    if (!automation || automation.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.id);
  },
});
