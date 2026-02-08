import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("communities").collect();
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
    // Delete posts
    const posts = await ctx.db.query("community_posts")
      .withIndex("by_community", (q) => q.eq("communityId", args.id)).collect();
    for (const p of posts) await ctx.db.delete(p._id);
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
      throw new Error("This community is private. Request access from the admin.");
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
  args: { communityId: v.id("communities") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("community_members")
      .withIndex("by_community", (q) => q.eq("communityId", args.communityId))
      .collect();
    const enriched = [];
    for (const m of members) {
      const user = await ctx.db.get(m.userId);
      if (user) enriched.push({ ...m, name: user.name, image: user.image, email: user.email });
    }
    return enriched;
  },
});