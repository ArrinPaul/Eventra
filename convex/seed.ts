import { internalMutation } from "./_generated/server";

/**
 * Seed the database with initial badges and challenges
 */
export const seedGamification = internalMutation({
  args: {},
  handler: async (ctx) => {
    // 1. Seed Badges
    const badges = [
      {
        name: "Newcomer",
        description: "Join your first event",
        icon: "🌱",
        criteria: "Attend 1 event",
        structured_criteria: { type: "attendance", threshold: 1 },
        category: "attendance",
        xpReward: 100,
        rarity: "common",
      },
      {
        name: "Regular",
        description: "Attend 5 events",
        icon: "⭐",
        criteria: "Attend 5 events",
        structured_criteria: { type: "attendance", threshold: 5 },
        category: "attendance",
        xpReward: 500,
        rarity: "uncommon",
      },
      {
        name: "Super Fan",
        description: "Attend 10 events",
        icon: "🔥",
        criteria: "Attend 10 events",
        structured_criteria: { type: "attendance", threshold: 10 },
        category: "attendance",
        xpReward: 1000,
        rarity: "rare",
      },
      {
        name: "Rising Star",
        description: "Reach 100 points",
        icon: "✨",
        criteria: "Earn 100 points",
        structured_criteria: { type: "points", threshold: 100 },
        category: "points",
        xpReward: 100,
        rarity: "common",
      },
      {
        name: "Elite Member",
        description: "Reach 1000 points",
        icon: "🏆",
        criteria: "Earn 1000 points",
        structured_criteria: { type: "points", threshold: 1000 },
        category: "points",
        xpReward: 500,
        rarity: "rare",
      },
    ];

    for (const badge of badges) {
      const existing = await ctx.db
        .query("badges")
        .filter((q) => q.eq(q.field("name"), badge.name))
        .unique();
      if (!existing) {
        await ctx.db.insert("badges", badge as any);
      }
    }

    // 2. Seed Challenges
    const challenges = [
      {
        title: "Early Bird",
        description: "Check in to 3 events this month",
        type: "attendance",
        xpReward: 300,
        criteria: "3 check-ins",
        target: 3,
        icon: "🌅",
        isActive: true,
      },
      {
        title: "Social Butterfly",
        description: "Join 5 communities",
        type: "social",
        xpReward: 200,
        criteria: "5 communities",
        target: 5,
        icon: "🦋",
        isActive: true,
      },
      {
        title: "Active Contributor",
        description: "Create 10 posts in any community",
        type: "engagement",
        xpReward: 500,
        criteria: "10 posts",
        target: 10,
        icon: "✍️",
        isActive: true,
      },
    ];

    for (const challenge of challenges) {
      const existing = await ctx.db
        .query("challenges")
        .filter((q) => q.eq(q.field("title"), challenge.title))
        .unique();
      if (!existing) {
        await ctx.db.insert("challenges", challenge);
      }
    }
  },
});
