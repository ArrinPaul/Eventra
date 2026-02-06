import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx: any) => {
    return await ctx.db.query("community_posts").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    content: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    
    return await ctx.db.insert("community_posts", {
      communityId: "temp" as any, // Need to handle communities properly later
      authorId: userId,
      content: args.content,
      imageUrl: args.imageUrl,
      likes: 0,
      createdAt: Date.now(),
    });
  },
});

export const like = mutation({
  args: { id: v.id("community_posts") },
  handler: async (ctx: any, args: any) => {
    const post = await ctx.db.get(args.id);
    if (!post) throw new Error("Post not found");
    await ctx.db.patch(args.id, { likes: post.likes + 1 });
  },
});
