import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

// Check if user is admin
async function isAdmin(ctx: any) {
  const userId = await auth.getUserId(ctx);
  if (userId === null) return false;
  const user = await ctx.db.get(userId);
  return user?.role === "admin";
}

export const getUsers = query({
  args: {
    role: v.optional(v.string()),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    if (!(await isAdmin(ctx))) {
      throw new Error("Unauthorized");
    }

    let users = await ctx.db.query("users").collect();

    if (args.role && args.role !== "all") {
      users = users.filter((u) => u.role === args.role);
    }

    if (args.search) {
      const search = args.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.name?.toLowerCase().includes(search) ||
          u.email?.toLowerCase().includes(search)
      );
    }

    return users;
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("student"), v.literal("professional"), v.literal("organizer"), v.literal("admin"), v.literal("speaker"), v.literal("attendee")),
  },
  handler: async (ctx: any, args: any) => {
    if (!(await isAdmin(ctx))) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(args.userId, { role: args.role });
  },
});

export const updateUserStatus = mutation({
  args: {
    userId: v.id("users"),
    status: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    if (!(await isAdmin(ctx))) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(args.userId, { status: args.status });
  },
});
