import { v } from "convex/values";
import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { auth } from "./auth";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveFile = mutation({
  args: {
    storageId: v.string(),
    name: v.string(),
    contentType: v.string(),
    size: v.number(),
    userId: v.id("users"),
  },
  handler: async (ctx: MutationCtx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("File not found in storage");
    
    return await ctx.db.insert("files", {
      ...args,
      userId: userId, // Ensure it's for the current user
      url,
    });
  },
});

export const getMetadata = query({
  args: { storageId: v.string() },
  handler: async (ctx: QueryCtx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("files")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .filter((q: any) => q.eq(q.field("storageId"), args.storageId))
      .first();
  },
});
