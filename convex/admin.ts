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
    paginationOpts: v.paginationOpts(),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) {
      throw new Error("Unauthorized");
    }

    let query = ctx.db.query("users");

    if (args.role && args.role !== "all") {
      // In a real app with more users, you'd use a combined index.
      // For now we filter after fetch or use a simple index if available.
      // Users table has searchIndex on name but no combined index for role + status.
    }

    // We'll use a basic paginate for now, and filter the page results
    // Better: use specialized indexes for role/status if many users.
    const results = await query.order("desc").paginate(args.paginationOpts);

    let page = results.page;
    if (args.role && args.role !== "all") {
      page = page.filter((u: any) => u.role === args.role);
    }
    if (args.search) {
      const search = args.search.toLowerCase();
      page = page.filter((u: any) => u.name?.toLowerCase().includes(search) || u.email?.toLowerCase().includes(search));
    }

    return { ...results, page };
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

    const totalUsers = await ctx.db.query("users").count();
    const totalEvents = await ctx.db.query("events").count();
    const totalRegistrations = await ctx.db.query("registrations").count();
    
    const now = Date.now();
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    const recentUsers = await ctx.db
      .query("users")
      .filter((q) => q.gt(q.field("_creationTime"), oneMonthAgo))
      .collect()
      .then(users => users.length);
      
    const previousMonthUsers = await ctx.db
      .query("users")
      .filter((q) => q.and(
        q.gt(q.field("_creationTime"), oneMonthAgo - (30 * 24 * 60 * 60 * 1000)),
        q.lt(q.field("_creationTime"), oneMonthAgo)
      ))
      .collect()
      .then(users => users.length);

    const userTrend = previousMonthUsers === 0 
      ? 100 
      : Math.round(((recentUsers - previousMonthUsers) / previousMonthUsers) * 100);

    // For distribution, we still need some collection but limit it
    const sampleUsers = await ctx.db.query("users").take(1000);
    const sampleEvents = await ctx.db.query("events").take(1000);

    return {
      totalUsers,
      totalEvents,
      totalRegistrations,
      userTrend,
      activeEvents: sampleEvents.filter((e: any) => e.status === "published").length,
      usersByRole: sampleUsers.reduce((acc: any, u: any) => {
        const role = u.role ?? "attendee";
        acc[role] = (acc[role] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      eventsByStatus: sampleEvents.reduce((acc: any, e: any) => {
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

    const sampleUsers = await ctx.db.query("users").order("desc").take(500);
    
    // Group users by month
    const usersByMonth: Record<string, number> = {};
    sampleUsers.forEach((u: any) => {
      const month = new Date(u._creationTime).toLocaleString('default', { month: 'short' });
      usersByMonth[month] = (usersByMonth[month] || 0) + 1;
    });

    // Activity distribution - use counts where possible
    const engagement = {
      messages: await ctx.db.query("messages").count(),
      registrations: await ctx.db.query("registrations").count(),
      badgesEarned: await ctx.db.query("user_badges").count(),
    };

    return {
      growthData: Object.entries(usersByMonth)
        .map(([name, value]) => ({ name, value }))
        .reverse(), // Chromological order
      engagement,
    };
  }
});