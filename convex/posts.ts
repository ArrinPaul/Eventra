import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const list = query({
  args: { paginationOpts: v.paginationOpts() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    const results = await ctx.db
      .query("community_posts")
      .filter((q) => q.neq(q.field("isFlagged"), true))
      .order("desc")
      .paginate(args.paginationOpts);

    // Enrich with author info
    const enriched = [];
    for (const post of results.page) {
      const author = await ctx.db.get(post.authorId);
      const commentCount = (await ctx.db
        .query("comments")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect()).length;
      
      let meLiked = false;
      if (userId) {
        const like = await ctx.db
          .query("post_likes")
          .withIndex("by_user_post", (q) => q.eq("userId", userId).eq("postId", post._id))
          .unique();
        meLiked = !!like;
      }

      enriched.push({
        ...post,
        authorName: author?.name || "Anonymous",
        authorImage: author?.image,
        authorRole: author?.role,
        commentCount,
        meLiked,
      });
    }
    
    return { ...results, page: enriched };
  },
});

export const listByCommunity = query({
  args: { communityId: v.id("communities") },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("community_posts")
      .withIndex("by_community", (q) => q.eq("communityId", args.communityId))
      .filter((q) => q.neq(q.field("isFlagged"), true))
      .order("desc")
      .collect();
    const enriched = [];
    for (const post of posts) {
      const author = await ctx.db.get(post.authorId);
      const commentCount = (await ctx.db
        .query("comments")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect()).length;
      enriched.push({
        ...post,
        authorName: author?.name || "Anonymous",
        authorImage: author?.image,
        commentCount,
      });
    }
    return enriched;
  },
});

export const create = mutation({
  args: {
    content: v.string(),
    communityId: v.id("communities"),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Check membership
    const membership = await ctx.db
      .query("community_members")
      .withIndex("by_community_user", (q) => q.eq("communityId", args.communityId).eq("userId", userId))
      .unique();
    if (!membership) throw new Error("You must be a member of this community to post");

    const postId = await ctx.db.insert("community_posts", {
      communityId: args.communityId,
      authorId: userId,
      content: args.content,
      imageUrl: args.imageUrl,
      likes: 0,
      createdAt: Date.now(),
    });

    // Log to Activity Feed
    const community = await ctx.db.get(args.communityId);
    await ctx.db.insert("activity_feed", {
      userId,
      type: "post_created",
      title: "Shared a new post",
      description: community ? `In ${community.name}` : undefined,
      createdAt: Date.now(),
      link: `/community/${args.communityId}`,
    });

    // Trigger Challenge Progress
    const { api } = await import("./_generated/api");
    await ctx.scheduler.runAfter(0, (api as any).gamification.triggerChallengeProgress, {
      userId,
      type: "engagement",
    });

    return postId;
  },
});

export const update = mutation({
  args: {
    id: v.id("community_posts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const post = await ctx.db.get(args.id);
    if (!post) throw new Error("Post not found");
    if (post.authorId !== userId) throw new Error("Not your post");

    await ctx.db.patch(args.id, {
      content: args.content,
    });
  },
});

export const like = mutation({
  args: { id: v.id("community_posts") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Check if already liked
    const existing = await ctx.db
      .query("post_likes")
      .withIndex("by_user_post", (q) => q.eq("userId", userId).eq("postId", args.id))
      .unique();

    const post = await ctx.db.get(args.id);
    if (!post) throw new Error("Post not found");

    if (existing) {
      // Unlike
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.id, { likes: Math.max(0, post.likes - 1) });
      return { liked: false };
    } else {
      // Like
      await ctx.db.insert("post_likes", {
        postId: args.id,
        userId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.id, { likes: post.likes + 1 });
      return { liked: true };
    }
  },
});

export const hasLiked = query({
  args: { postId: v.id("community_posts") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return false;
    const existing = await ctx.db
      .query("post_likes")
      .withIndex("by_user_post", (q) => q.eq("userId", userId).eq("postId", args.postId))
      .unique();
    return !!existing;
  },
});

export const deletePost = mutation({
  args: { id: v.id("community_posts") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const post = await ctx.db.get(args.id);
    if (!post) throw new Error("Post not found");
    if (post.authorId !== userId) throw new Error("Not your post");
    // Delete comments
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.id))
      .collect();
    for (const c of comments) await ctx.db.delete(c._id);
    // Delete likes
    const likes = await ctx.db
      .query("post_likes")
      .withIndex("by_post", (q) => q.eq("postId", args.id))
      .collect();
    for (const l of likes) await ctx.db.delete(l._id);
    await ctx.db.delete(args.id);
  },
});

// Comments
export const getComments = query({
  args: { postId: v.id("community_posts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    const enriched = [];
    for (const c of comments) {
      const author = await ctx.db.get(c.authorId);
      enriched.push({
        ...c,
        authorName: author?.name || "Anonymous",
        authorImage: author?.image,
      });
    }
    return enriched;
  },
});

export const addComment = mutation({
  args: {
    postId: v.id("community_posts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    // Check membership
    const membership = await ctx.db
      .query("community_members")
      .withIndex("by_community_user", (q) => q.eq("communityId", post.communityId).eq("userId", userId))
      .unique();
    if (!membership) throw new Error("You must be a member of this community to comment");

    return await ctx.db.insert("comments", {
      postId: args.postId,
      authorId: userId,
      content: args.content,
      createdAt: Date.now(),
    });
  },
});
