import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const createShareLink = mutation({
  args: { eventId: v.id("events"), expiresDays: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const event = await ctx.db.get(args.eventId);
    if (!event || event.organizerId !== userId) throw new Error("Not authorized");

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const shareId = await ctx.db.insert("shared_reports", {
      eventId: args.eventId,
      token,
      createdBy: userId,
      createdAt: Date.now(),
      expiresAt: args.expiresDays ? Date.now() + (args.expiresDays * 24 * 60 * 60 * 1000) : undefined,
      viewCount: 0,
    });

    return { token };
  },
});

export const getSharedReport = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const report = await ctx.db
      .query("shared_reports")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!report) return null;
    if (report.expiresAt && report.expiresAt < Date.now()) return null;

    const event = await ctx.db.get(report.eventId);
    if (!event) return null;

    return {
      eventTitle: event.title,
      description: event.description,
      category: event.category,
      registeredCount: event.registeredCount,
      capacity: event.capacity,
      startDate: event.startDate,
      status: event.status,
      viewCount: report.viewCount,
    };
  },
});

export const incrementReportView = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const report = await ctx.db
      .query("shared_reports")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (report) {
      await ctx.db.patch(report._id, {
        viewCount: report.viewCount + 1
      });
    }
  },
});

export const getOrganizerRevenue = query({
  args: { organizerId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    
    const targetId = args.organizerId || userId;
    const now = Date.now();
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    // 1. Get all events for this organizer
    const events = await ctx.db
      .query("events")
      .withIndex("by_organizer", (q) => q.eq("organizerId", targetId))
      .collect();
    
    // 2. Get all tickets for these events
    let totalRevenue = 0;
    let recentRevenue = 0;
    let previousMonthRevenue = 0;
    const revenueByEvent = [];
    const revenueByTier: Record<string, number> = {};
    const dailyRevenue: Record<string, number> = {};

    for (const event of events) {
      const tickets = await ctx.db
        .query("tickets")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect();
      
      const confirmedTickets = tickets.filter(t => t.status === "confirmed" || t.status === "refunded");
      
      let eventRevenue = 0;
      for (const ticket of confirmedTickets) {
        if (ticket.status === "confirmed") {
          const price = ticket.price || 0;
          eventRevenue += price;
          totalRevenue += price;
          
          if (ticket.purchaseDate > oneMonthAgo) {
            recentRevenue += price;
          } else if (ticket.purchaseDate > oneMonthAgo - (30 * 24 * 60 * 60 * 1000)) {
            previousMonthRevenue += price;
          }
          
          // By Tier
          const tier = ticket.ticketTypeId || "Standard";
          revenueByTier[tier] = (revenueByTier[tier] || 0) + price;
          
          // By Day
          const dateStr = new Date(ticket.purchaseDate).toISOString().split('T')[0];
          dailyRevenue[dateStr] = (dailyRevenue[dateStr] || 0) + price;
        }
      }
      
      revenueByEvent.push({
        eventId: event._id,
        title: event.title,
        revenue: eventRevenue,
        ticketCount: confirmedTickets.length,
      });
    }

    const revenueTrend = previousMonthRevenue === 0 
      ? 100 
      : Math.round(((recentRevenue - previousMonthRevenue) / previousMonthRevenue) * 100);

    return {
      totalRevenue,
      recentRevenue,
      revenueTrend,
      revenueByEvent: revenueByEvent.sort((a, b) => b.revenue - a.revenue),
      revenueByTier,
      dailyRevenue: Object.entries(dailyRevenue)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  },
});
