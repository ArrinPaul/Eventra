import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx: any) => {
    return await ctx.db.query("communities").collect();
  },
});

export const getById = query({
  args: { id: v.id("communities") },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    category: v.string(),
    isPrivate: v.boolean(),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    
    return await ctx.db.insert("communities", {
      ...args,
      createdBy: userId,
      membersCount: 1,
      imageUrl: "",
    });
  },
});

export const join = mutation({
  args: { id: v.id("communities") },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    
    const community = await ctx.db.get(args.id);
    if (!community) throw new Error("Not found");
    
    await ctx.db.patch(args.id, {
      membersCount: community.membersCount + 1,
    });
  },
});
