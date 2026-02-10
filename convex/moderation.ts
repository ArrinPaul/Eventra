import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";

export const flagPost = mutation({
  args: {
    postId: v.id("community_posts"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    // Only admins or automated flows should call this
    // In a real app, we'd check permissions here
    await ctx.db.patch(args.postId, {
      isFlagged: true,
      moderationReason: args.reason,
    });
  },
});
