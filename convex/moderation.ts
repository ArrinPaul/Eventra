import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
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
