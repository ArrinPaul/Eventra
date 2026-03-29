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

    const file = await ctx.db
      .query("files")
      .withIndex("by_storageId", (q: any) => q.eq("storageId", args.storageId))
      .unique();

    if (!file || file.userId !== userId) return null;
    return file;
  },
});

export const deleteFile = mutation({
  args: { id: v.id("files") },
  handler: async (ctx: MutationCtx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const file = await ctx.db.get(args.id);
    if (!file) throw new Error("File not found");
    if (file.userId !== userId) throw new Error("Not authorized");

    await ctx.storage.delete(file.storageId);
    await ctx.db.delete(args.id);

    return { success: true };
  },
});
