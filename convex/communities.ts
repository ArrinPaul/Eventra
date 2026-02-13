import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const list = query({
  args: { 
    paginationOpts: v.paginationOpts(),
    search: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    if (args.search) {
      return await ctx.db
        .query("communities")
        .withSearchIndex("search_name", (q) => q.search("name", args.search!))
        .paginate(args.paginationOpts);
    }
    
    return await ctx.db
      .query("communities")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const getById = query({
  args: { id: v.id("communities") },
  handler: async (ctx, args) => {
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
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const communityId = await ctx.db.insert("communities", {
      ...args,
      createdBy: userId,
      membersCount: 1,
      imageUrl: "",
    });

    await ctx.db.insert("community_members", {
      communityId,
      userId,
      role: "admin",
      joinedAt: Date.now(),
    });

    return communityId;
  },
});

export const update = mutation({
  args: {
    id: v.id("communities"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const community = await ctx.db.get(args.id);
    if (!community) throw new Error("Not found");
    if (community.createdBy !== userId) throw new Error("Not authorized");
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteCommunity = mutation({
  args: { id: v.id("communities") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const community = await ctx.db.get(args.id);
    if (!community) throw new Error("Not found");
    if (community.createdBy !== userId) throw new Error("Not authorized");
    
    // Delete members
    const members = await ctx.db.query("community_members")
      .withIndex("by_community", (q) => q.eq("communityId", args.id)).collect();
    for (const m of members) await ctx.db.delete(m._id);

    // Delete join requests
    const requests = await ctx.db.query("community_join_requests")
      .withIndex("by_community", (q) => q.eq("communityId", args.id)).collect();
    for (const r of requests) await ctx.db.delete(r._id);

    // Delete posts and their associated likes/comments
    const posts = await ctx.db.query("community_posts")
      .withIndex("by_community", (q) => q.eq("communityId", args.id)).collect();
    for (const p of posts) {
      // Delete post likes
      const likes = await ctx.db.query("post_likes")
        .withIndex("by_post", (q) => q.eq("postId", p._id)).collect();
      for (const l of likes) await ctx.db.delete(l._id);
      // Delete post comments
      const comments = await ctx.db.query("comments")
        .withIndex("by_post", (q) => q.eq("postId", p._id)).collect();
      for (const c of comments) await ctx.db.delete(c._id);
      await ctx.db.delete(p._id);
    }
    await ctx.db.delete(args.id);
  },
});

export const join = mutation({
  args: { id: v.id("communities") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const community = await ctx.db.get(args.id);
    if (!community) throw new Error("Not found");

    if (community.isPrivate) {
      throw new Error("This community is private. Use requestJoin instead.");
    }

    const existing = await ctx.db
      .query("community_members")
      .withIndex("by_community_user", (q) => q.eq("communityId", args.id).eq("userId", userId))
      .unique();

    if (existing) return;

    await ctx.db.insert("community_members", {
      communityId: args.id,
      userId,
      role: "member",
      joinedAt: Date.now(),
    });

    await ctx.db.patch(args.id, {
      membersCount: community.membersCount + 1,
    });

    // Notify creator
    await ctx.db.insert("notifications", {
      userId: community.createdBy,
      title: "New Member",
      message: `Someone joined your community "${community.name}".`,
      type: "community",
      read: false,
      createdAt: Date.now(),
      link: `/community/${args.id}`,
    });

    // Trigger Challenge Progress
    const { api } = await import("./_generated/api");
    await ctx.scheduler.runAfter(0, (api as any).gamification.triggerChallengeProgress, {
      userId,
      type: "social",
    });
  },
});

export const requestJoin = mutation({
  args: { communityId: v.id("communities") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("community_join_requests")
      .withIndex("by_community_user", (q) => q.eq("communityId", args.communityId).eq("userId", userId))
      .unique();

    if (existing) {
      if (existing.status === 'pending') return;
      if (existing.status === 'approved') return;
      // If rejected, they can try again or we can block them. For now, allow retry.
      await ctx.db.delete(existing._id);
    }

    await ctx.db.insert("community_join_requests", {
      communityId: args.communityId,
      userId,
      status: "pending",
      createdAt: Date.now(),
    });

    // Notify creator
    const community = await ctx.db.get(args.communityId);
    if (community) {
      await ctx.db.insert("notifications", {
        userId: community.createdBy,
        title: "New Join Request",
        message: `Someone wants to join your community "${community.name}".`,
        type: "community",
        read: false,
        createdAt: Date.now(),
        link: `/community/${args.communityId}/manage`,
      });
    }
  },
});

export const getJoinRequests = query({
  args: { communityId: v.id("communities") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const community = await ctx.db.get(args.communityId);
    if (!community || community.createdBy !== userId) {
      throw new Error("Unauthorized");
    }

    const requests = await ctx.db
      .query("community_join_requests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .filter((q) => q.eq(q.field("communityId"), args.communityId))
      .collect();

    const enriched = [];
    for (const req of requests) {
      const user = await ctx.db.get(req.userId);
      if (user) {
        enriched.push({ ...req, userName: user.name, userImage: user.image });
      }
    }
    return enriched;
  },
});

export const respondToJoinRequest = mutation({
  args: { 
    requestId: v.id("community_join_requests"), 
    action: v.union(v.literal("approved"), v.literal("rejected")) 
  },
  handler: async (ctx, args) => {
    const callerId = await auth.getUserId(ctx);
    if (!callerId) throw new Error("Unauthorized");

    const req = await ctx.db.get(args.requestId);
    if (!req) throw new Error("Request not found");

    const community = await ctx.db.get(req.communityId);
    if (!community || community.createdBy !== callerId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.requestId, { status: args.action });

    if (args.action === "approved") {
      await ctx.db.insert("community_members", {
        communityId: req.communityId,
        userId: req.userId,
        role: "member",
        joinedAt: Date.now(),
      });

      await ctx.db.patch(req.communityId, {
        membersCount: community.membersCount + 1,
      });
    }

    // Notify user
    await ctx.db.insert("notifications", {
      userId: req.userId,
      title: args.action === "approved" ? "Request Approved! 🎉" : "Request Rejected",
      message: args.action === "approved" 
        ? `You've been accepted into "${community.name}".`
        : `Your request to join "${community.name}" was not approved.`,
      type: "community",
      read: false,
      createdAt: Date.now(),
      link: args.action === "approved" ? `/community/${req.communityId}` : undefined,
    });
  },
});

export const leave = mutation({
  args: { id: v.id("communities") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const community = await ctx.db.get(args.id);
    if (!community) throw new Error("Not found");

    if (community.createdBy === userId) {
      throw new Error("Community creator cannot leave. Transfer ownership or delete the community.");
    }

    const membership = await ctx.db
      .query("community_members")
      .withIndex("by_community_user", (q) => q.eq("communityId", args.id).eq("userId", userId))
      .unique();

    if (!membership) return;

    await ctx.db.delete(membership._id);
    await ctx.db.patch(args.id, {
      membersCount: Math.max(0, community.membersCount - 1),
    });
  },
});

export const getMemberStatus = query({
  args: { communityId: v.id("communities") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("community_members")
      .withIndex("by_community_user", (q) => q.eq("communityId", args.communityId).eq("userId", userId))
      .unique();
  },
});

export const getMembers = query({
  args: { communityId: v.id("communities"), paginationOpts: v.paginationOpts() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("community_members")
      .withIndex("by_community", (q) => q.eq("communityId", args.communityId))
      .paginate(args.paginationOpts);

    return {
      ...results,
      page: await Promise.all(
        results.page.map(async (m) => {
          const user = await ctx.db.get(m.userId);
          return { ...m, name: user?.name, image: user?.image, email: user?.email };
        })
      ),
    };
  },
});

export const updateMemberRole = mutation({
  args: {
    communityId: v.id("communities"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const callerId = await auth.getUserId(ctx);
    if (!callerId) throw new Error("Unauthorized");

    const community = await ctx.db.get(args.communityId);
    if (!community) throw new Error("Community not found");

    // Only community creator can promote/demote
    if (community.createdBy !== callerId) {
      throw new Error("Only the community creator can manage roles");
    }

    const membership = await ctx.db
      .query("community_members")
      .withIndex("by_community_user", (q) => q.eq("communityId", args.communityId).eq("userId", args.userId))
      .unique();

    if (!membership) throw new Error("User is not a member");

    await ctx.db.patch(membership._id, { role: args.role });
  },
});

export const removeMember = mutation({
  args: {
    communityId: v.id("communities"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const callerId = await auth.getUserId(ctx);
    if (!callerId) throw new Error("Unauthorized");

    const community = await ctx.db.get(args.communityId);
    if (!community) throw new Error("Community not found");

    // Only creator or admin can remove members
    const callerMembership = await ctx.db
      .query("community_members")
      .withIndex("by_community_user", (q) => q.eq("communityId", args.communityId).eq("userId", callerId))
      .unique();

    if (community.createdBy !== callerId && callerMembership?.role !== "admin") {
      throw new Error("Not authorized to remove members");
    }

    if (args.userId === community.createdBy) {
      throw new Error("Cannot remove the community creator");
    }

    const membership = await ctx.db
      .query("community_members")
      .withIndex("by_community_user", (q) => q.eq("communityId", args.communityId).eq("userId", args.userId))
      .unique();

    if (!membership) return;

    await ctx.db.delete(membership._id);
    await ctx.db.patch(args.communityId, {
      membersCount: Math.max(0, community.membersCount - 1),
    });
  },
});