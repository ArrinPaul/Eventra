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
  args: {
    status: v.optional(v.string()),
    paginationOpts: v.paginationOpts(),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) throw new Error("Unauthorized");

    if (args.status && args.status !== "all") {
      return await ctx.db
        .query("events")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    return await ctx.db
      .query("events")
      .order("desc")
      .paginate(args.paginationOpts);
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
    
    // Sample newest users to avoid full table scans on every dashboard load.
    const userSample = await ctx.db.query("users").order("desc").take(3000);
    const recentUsers = userSample.filter((u: any) => u._creationTime > oneMonthAgo).length;
    const previousMonthUsers = userSample.filter((u: any) => (
      u._creationTime > oneMonthAgo - (30 * 24 * 60 * 60 * 1000) && u._creationTime < oneMonthAgo
    )).length;

    const userTrend = previousMonthUsers === 0 
      ? 100 
      : Math.round(((recentUsers - previousMonthUsers) / previousMonthUsers) * 100);

    const sampleUsers = userSample.slice(0, 1000);
    const sampleEvents = await ctx.db.query("events").order("desc").take(1000);
    const activeEvents = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .count();

    return {
      totalUsers,
      totalEvents,
      totalRegistrations,
      userTrend,
      activeEvents,
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

    const sampleUsers = await ctx.db.query("users").order("desc").take(2000);
    const now = Date.now();
    const sixMonthsAgo = now - (6 * 30 * 24 * 60 * 60 * 1000);

    const usersByMonth: Record<string, number> = {};
    sampleUsers
      .filter((u: any) => u._creationTime >= sixMonthsAgo)
      .forEach((u: any) => {
        const d = new Date(u._creationTime);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        usersByMonth[monthKey] = (usersByMonth[monthKey] || 0) + 1;
      });

    const engagement = {
      messages: await ctx.db.query("messages").count(),
      registrations: await ctx.db.query("registrations").count(),
      badgesEarned: await ctx.db.query("user_badges").count(),
    };

    const registrationsSample = await ctx.db.query("registrations").order("desc").take(5000);
    const messagesSample = await ctx.db.query("messages").order("desc").take(5000);
    const reviewsSample = await ctx.db.query("reviews").order("desc").take(5000);

    const dailySeries: Record<string, { registrations: number; messages: number; reviews: number }> = {};
    const upsertDay = (ts: number, field: "registrations" | "messages" | "reviews") => {
      const key = new Date(ts).toISOString().split("T")[0];
      if (!dailySeries[key]) {
        dailySeries[key] = { registrations: 0, messages: 0, reviews: 0 };
      }
      dailySeries[key][field] += 1;
    };

    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    registrationsSample.forEach((r: any) => {
      const ts = r.registrationDate || r._creationTime;
      if (ts >= thirtyDaysAgo) upsertDay(ts, "registrations");
    });
    messagesSample.forEach((m: any) => {
      const ts = m.sentAt || m._creationTime;
      if (ts >= thirtyDaysAgo) upsertDay(ts, "messages");
    });
    reviewsSample.forEach((r: any) => {
      const ts = r.createdAt || r._creationTime;
      if (ts >= thirtyDaysAgo) upsertDay(ts, "reviews");
    });

    const demographicsByRole = sampleUsers.reduce((acc: Record<string, number>, u: any) => {
      const role = u.role || "attendee";
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    const demographicsByCountry = sampleUsers.reduce((acc: Record<string, number>, u: any) => {
      if (!u.country) return acc;
      acc[u.country] = (acc[u.country] || 0) + 1;
      return acc;
    }, {});

    return {
      growthData: Object.entries(usersByMonth)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      engagement,
      engagementTrends: Object.entries(dailySeries)
        .map(([date, value]) => ({ date, ...value }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      demographics: {
        byRole: demographicsByRole,
        byCountry: demographicsByCountry,
      },
    };
  }
});