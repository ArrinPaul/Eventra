import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
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
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("File not found in storage");
    
    return await ctx.db.insert("files", {
      ...args,
      url,
    });
  },
});

export const getMetadata = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("files")
      .filter((q) => q.eq(q.field("storageId"), args.storageId))
      .first();
  },
});
