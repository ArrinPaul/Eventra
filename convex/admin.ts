import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

// Check if user is admin
async function isAdmin(ctx: QueryCtx) {
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
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) {
      throw new Error("Unauthorized");
    }

    let users = await ctx.db.query("users").collect();

    if (args.role && args.role !== "all") {
      users = users.filter((u: any) => u.role === args.role);
    }

    if (args.search) {
      const search = args.search.toLowerCase();
      users = users.filter(
        (u: any) =>
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
    role: v.union(
      v.literal("student"),
      v.literal("professional"),
      v.literal("organizer"),
      v.literal("admin"),
      v.literal("speaker"),
      v.literal("attendee"),
      v.literal("vendor")
    ),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) throw new Error("Unauthorized");
    await ctx.db.patch(args.userId, { role: args.role });
    await logAuditAction(ctx, "updateUserRole", { userId: args.userId, role: args.role });
  },
});

export const updateUserStatus = mutation({
  args: {
    userId: v.id("users"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) throw new Error("Unauthorized");
    await ctx.db.patch(args.userId, { status: args.status });
    await logAuditAction(ctx, "updateUserStatus", { userId: args.userId, status: args.status });
  },
});

// --- Event Moderation ---
export const getEventsForModeration = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) throw new Error("Unauthorized");

    let events = await ctx.db.query("events").order("desc").collect();
    if (args.status && args.status !== "all") {
      events = events.filter((e: any) => e.status === args.status);
    }
    return events;
  },
});

export const moderateEvent = mutation({
  args: {
    eventId: v.id("events"),
    action: v.union(v.literal("approve"), v.literal("reject"), v.literal("suspend")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) throw new Error("Unauthorized");

    const statusMap: Record<string, string> = {
      approve: "published",
      reject: "cancelled",
      suspend: "cancelled",
    };

    await ctx.db.patch(args.eventId, { status: statusMap[args.action] });

    const event = await ctx.db.get(args.eventId);
    if (event) {
      await ctx.db.insert("notifications", {
        userId: event.organizerId,
        title: `Event ${args.action === "approve" ? "Approved" : args.action === "reject" ? "Rejected" : "Suspended"}`,
        message: `Your event "${event.title}" has been ${args.action}ed.${args.reason ? ` Reason: ${args.reason}` : ""}`,
        type: "admin",
        read: false,
        createdAt: Date.now(),
      });
    }

    await logAuditAction(ctx, `moderateEvent:${args.action}`, { eventId: args.eventId, reason: args.reason });
  },
});

// --- System Settings ---
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) throw new Error("Unauthorized");
    return await ctx.db.query("system_settings").collect();
  },
});

export const updateSetting = mutation({
  args: {
    key: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("system_settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("system_settings", {
        key: args.key,
        value: args.value,
        updatedAt: Date.now(),
      });
    }

    await logAuditAction(ctx, "updateSetting", { key: args.key });
  },
});

// --- Audit Log ---
async function logAuditAction(ctx: MutationCtx, action: string, details: Record<string, unknown>) {
  const userId = await auth.getUserId(ctx);
  if (!userId) return;
  await ctx.db.insert("audit_log", {
    userId,
    action,
    resource: action.split(":")[0],
    details: JSON.stringify(details),
    createdAt: Date.now(),
  });
}

export const getAuditLog = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) throw new Error("Unauthorized");

    const logs = await ctx.db.query("audit_log").order("desc").take(args.limit ?? 100);
    const enriched = [];
    for (const log of logs) {
      const user = await ctx.db.get(log.userId);
      enriched.push({ ...log, userName: user?.name ?? "Unknown" });
    }
    return enriched;
  },
});

// --- Dashboard Stats ---
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) throw new Error("Unauthorized");

    const users = await ctx.db.query("users").collect();
    const events = await ctx.db.query("events").collect();
    const registrations = await ctx.db.query("registrations").collect();

    return {
      totalUsers: users.length,
      totalEvents: events.length,
      totalRegistrations: registrations.length,
      activeEvents: events.filter((e: any) => e.status === "published").length,
      usersByRole: users.reduce((acc: any, u: any) => {
        const role = u.role ?? "attendee";
        acc[role] = (acc[role] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>),
            eventsByStatus: events.reduce((acc: any, e: any) => {
              const status = e.status ?? "draft";
              acc[status] = (acc[status] ?? 0) + 1;
              return acc;
            }, {} as Record<string, number>),
          };
        },
      });
      
      export const getDetailedAnalytics = query({
        args: {},
        handler: async (ctx) => {
          if (!(await isAdmin(ctx))) throw new Error("Unauthorized");
      
          const users = await ctx.db.query("users").collect();
          const registrations = await ctx.db.query("registrations").collect();
          const messages = await ctx.db.query("messages").collect();
          const badges = await ctx.db.query("user_badges").collect();
      
          // Group users by month
          const usersByMonth: Record<string, number> = {};
          users.forEach((u: any) => {
            const month = new Date(u._creationTime).toLocaleString('default', { month: 'short' });
            usersByMonth[month] = (usersByMonth[month] || 0) + 1;
          });
      
          // Activity distribution
          const engagement = {
            messages: messages.length,
            registrations: registrations.length,
            badgesEarned: badges.length,
          };
      
          return {
            growthData: Object.entries(usersByMonth).map(([name, value]) => ({ name, value })),
            engagement,
          };
        }
      });
      