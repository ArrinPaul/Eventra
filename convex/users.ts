import { mutation, query } from "./_generated/server";
import { auth } from "./auth";
import { v } from "convex/values";
import { calculateLevel } from "./utils";
import { awardPointsInternal } from "./gamification";

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) return null;
    return await ctx.db.get(userId);
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const update = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    role: v.optional(v.union(v.literal("student"), v.literal("professional"), v.literal("organizer"), v.literal("admin"), v.literal("speaker"), v.literal("attendee"), v.literal("vendor"))),
    onboardingCompleted: v.optional(v.boolean()),
    college: v.optional(v.string()),
    degree: v.optional(v.union(v.literal("ug"), v.literal("pg"))),
    year: v.optional(v.number()),
    company: v.optional(v.string()),
    designation: v.optional(v.string()),
    country: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"), v.literal("prefer-not-to-say"))),
    bloodGroup: v.optional(v.string()),
    interests: v.optional(v.string()),
    notificationPreferences: v.optional(v.object({
      email: v.optional(v.boolean()),
      push: v.optional(v.boolean()),
      eventReminders: v.optional(v.boolean()),
      communityUpdates: v.optional(v.boolean()),
      marketingEmails: v.optional(v.boolean()),
    })),
    wishlist: v.optional(v.array(v.string())),
    eventRatings: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    await ctx.db.patch(userId, args);
  },
});

/**
 * Self-award points - DEPRECATED
 * This allows users to award themselves points which is a security issue.
 * Use gamification.addPoints with admin auth instead.
 */
export const awardPoints = mutation({
  args: { points: v.number(), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Security check: Only allow admins to use this function
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Only admins can award points");
    }
    if (!user) throw new Error("User not found");
    const currentXp = (user.xp || 0) + args.points;
    const newLevel = calculateLevel(currentXp);
    await ctx.db.patch(userId, {
      points: (user.points || 0) + args.points,
      xp: currentXp,
      level: newLevel,
    });
    await ctx.db.insert("points_history", {
      userId,
      points: args.points,
      reason: args.reason || "Points awarded",
      createdAt: Date.now(),
    });
  },
});

export const checkIn = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(userId, { checkedIn: true });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const getLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_points")
      .order("desc")
      .take(100); // Take 100 to filter out admins/organizers and still have enough for the limit
    
    return users
      .filter((u) => u.role !== "admin" && u.role !== "organizer")
      .slice(0, args.limit || 50);
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withSearchIndex("search_name", (q) => q.search("name", args.query))
      .take(20);
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const follow = mutation({
  args: { followingId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    if (userId === args.followingId) throw new Error("Cannot follow yourself");

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_both", (q) => q.eq("followerId", userId).eq("followingId", args.followingId))
      .unique();

    if (existing) return;

    await ctx.db.insert("follows", {
      followerId: userId,
      followingId: args.followingId,
      createdAt: Date.now(),
    });

    // Notify the user
    const me = await ctx.db.get(userId);
    await ctx.db.insert("notifications", {
      userId: args.followingId,
      title: "New Follower",
      message: `${me?.name || "Someone"} started following you.`,
      type: "community",
      read: false,
      createdAt: Date.now(),
      link: `/profile/${userId}`,
    });
  },
});

export const unfollow = mutation({
  args: { followingId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_both", (q) => q.eq("followerId", userId).eq("followingId", args.followingId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const getFollowStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUserId = await auth.getUserId(ctx);
    
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();
    
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();

    const isFollowing = currentUserId 
      ? await ctx.db
          .query("follows")
          .withIndex("by_both", (q) => q.eq("followerId", currentUserId).eq("followingId", args.userId))
          .unique()
          .then(f => !!f)
      : false;

    return {
      followerCount: followers.length,
      followingCount: following.length,
      isFollowing,
    };
  },
});

export const getEngagementScore = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const registrations = await ctx.db
      .query("registrations")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect();
    
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("senderId"), args.userId))
      .collect();
    
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect();
    
    const badges = await ctx.db
      .query("user_badges")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect();

    const stats = {
      eventCount: registrations.length,
      messageCount: messages.length,
      reviewCount: reviews.length,
      badgeCount: badges.length,
    };

    // Calculate score (simple weighted average)
    const score = (stats.eventCount * 20) + (stats.messageCount * 2) + (stats.reviewCount * 10) + (stats.badgeCount * 50);

    return {
      score,
      stats,
      percentile: 85, // Mock percentile for now
    };
  },
});

export const generateReferralCode = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (user?.referralCode) return user.referralCode;

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await ctx.db.patch(userId, { referralCode: code });
    return code;
  },
});

export const redeemReferral = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (user?.referredBy) throw new Error("Referral already redeemed");

    const referrer = await ctx.db
      .query("users")
      .withIndex("by_referral_code", (q) => q.eq("referralCode", args.code))
      .unique();

    if (!referrer) throw new Error("Invalid referral code");
    if (referrer._id === userId) throw new Error("Cannot refer yourself");

    // Update current user
    await ctx.db.patch(userId, { referredBy: args.code });
    
    // Reward both
    const referReward = 100;
    const newJoinReward = 50;
    
    // Reward referrer
    await awardPointsInternal(
      ctx,
      referrer._id,
      referReward,
      "Successful referral bonus"
    );

    await ctx.db.insert("notifications", {
      userId: referrer._id,
      title: "Referral Success! 🎁",
      message: `Someone joined using your code! You earned ${referReward} XP.`,
      type: "gamification",
      read: false,
      createdAt: Date.now(),
    });

    // Reward new user
    await awardPointsInternal(
      ctx,
      userId,
      newJoinReward,
      "Redeemed referral code"
    );

    return { success: true };
  },
});

export const getRecommended = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const currentUser = await ctx.db.get(userId);
    if (!currentUser) return [];

    const limit = args.limit || 5;
    const userInterests = currentUser.interests?.split(',').map(i => i.trim().toLowerCase()) || [];

    // Simple recommendation: users with at least one common interest
    const allUsers = await ctx.db.query("users")
      .filter(q => q.and(
        q.neq(q.field("_id"), userId),
        q.eq(q.field("onboardingCompleted"), true)
      ))
      .take(100);

    return allUsers
      .map(u => {
        const interests = u.interests?.split(',').map(i => i.trim().toLowerCase()) || [];
        const commonCount = interests.filter(i => userInterests.includes(i)).length;
        return { ...u, commonCount };
      })
      .sort((a, b) => b.commonCount - a.commonCount)
      .slice(0, limit);
  },
});
