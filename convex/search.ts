import { v } from "convex/values";
import { query } from "./_generated/server";

export const globalSearch = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return { events: [], users: [], communities: [] };
    const q = args.query.toLowerCase();

    // 1. Search Events
    const events = await ctx.db
      .query("events")
      .withSearchIndex("search_title", (q) => q.search("title", args.query))
      .take(5);

    // 2. Search Users
    const users = await ctx.db
      .query("users")
      .withSearchIndex("search_name", (q) => q.search("name", args.query))
      .take(5);

    // 3. Search Communities
    const communities = await ctx.db
      .query("communities")
      .withSearchIndex("search_name", (q) => q.search("name", args.query))
      .take(5);

    return {
      events: events.map(e => ({ _id: e._id, title: e.title, category: e.category, startDate: e.startDate })),
      users: users.map(u => ({ _id: u._id, name: u.name, image: u.image, role: u.role })),
      communities: communities.map(c => ({ _id: c._id, name: c.name, category: c.category })),
    };
  },
});
