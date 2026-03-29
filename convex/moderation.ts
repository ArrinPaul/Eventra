import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const flagPost = mutation({
  args: {
    postId: v.id("community_posts"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      // Allow internal calls (e.g. from AI flows)
    } else {
      const user = await ctx.db.get(userId);
      // Only admins or community moderators can flag manually (simple version)
      if (user?.role !== "admin") {
        // We could also check if they are an admin of the community where the post is
        throw new Error("Unauthorized");
      }
    }

    await ctx.db.patch(args.postId, {
      isFlagged: true,
      moderationReason: args.reason,
    });
  },
});

export const listFlaggedPosts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (user?.role !== "admin") throw new Error("Unauthorized");

    return await ctx.db
      .query("community_posts")
      .withIndex("by_flagged_created", (q) => q.eq("isFlagged", true))
      .order("desc")
      .take(args.limit ?? 100);
  },
});

export const reviewFlag = mutation({
  args: {
    postId: v.id("community_posts"),
    action: v.union(v.literal("approve"), v.literal("remove")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (user?.role !== "admin") throw new Error("Unauthorized");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    if (args.action === "approve") {
      await ctx.db.patch(args.postId, {
        isFlagged: false,
        moderationReason: undefined,
      });
      return { success: true, action: "approved" };
    }

    await ctx.db.delete(args.postId);
    return { success: true, action: "removed" };
  },
});

export const autoScanRecentPosts = internalMutation({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("community_posts")
      .withIndex("by_created")
      .order("desc")
      .take(args.limit ?? 100);

    const suspicious = ["spam", "scam", "hate", "abuse", "violence"];
    let flagged = 0;

    for (const post of posts) {
      const lower = post.content.toLowerCase();
      const hit = suspicious.find((w) => lower.includes(w));
      if (hit && !post.isFlagged) {
        await ctx.db.patch(post._id, {
          isFlagged: true,
          moderationReason: `Auto-flagged keyword: ${hit}`,
        });
        flagged += 1;
      }
    }

    return { scanned: posts.length, flagged };
  },
});
