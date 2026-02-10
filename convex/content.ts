import { v } from "convex/values";
import { query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("content").collect();
  },
});

export const getByType = query({
  args: { type: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("content")
      .withIndex("by_type", (q) => q.eq("type", args.type as any))
      .collect();
  },
});
