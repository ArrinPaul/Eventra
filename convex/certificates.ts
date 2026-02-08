import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const issue = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.id("users"),
    certificateNumber: v.string(),
    personalizedMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Prevent duplicates
    const existing = await ctx.db
      .query("certificates")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .unique();
    if (existing) return existing._id;

    const certId = await ctx.db.insert("certificates", {
      ...args,
      issueDate: Date.now(),
    });

    // Notify the user
    const event = await ctx.db.get(args.eventId);
    await ctx.db.insert("notifications", {
      userId: args.userId,
      title: "Certificate Ready!",
      message: `Your certificate for "${event?.title ?? "event"}" is ready to download.`,
      type: "certificate",
      read: false,
      createdAt: Date.now(),
      link: `/certificates`,
    });

    return certId;
  },
});

export const bulkIssue = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");
    if (event.organizerId !== userId) throw new Error("Not authorized");

    const registrations = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("status"), "confirmed"))
      .collect();

    let issued = 0;
    for (const reg of registrations) {
      const existing = await ctx.db
        .query("certificates")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .filter((q) => q.eq(q.field("userId"), reg.userId))
        .unique();
      if (existing) continue;

      const certNumber = `CERT-${event.title.substring(0, 4).toUpperCase()}-${Date.now()}-${issued}`;
      await ctx.db.insert("certificates", {
        eventId: args.eventId,
        userId: reg.userId,
        certificateNumber: certNumber,
        issueDate: Date.now(),
      });

      await ctx.db.insert("notifications", {
        userId: reg.userId,
        title: "Certificate Ready!",
        message: `Your certificate for "${event.title}" is ready to download.`,
        type: "certificate",
        read: false,
        createdAt: Date.now(),
        link: `/certificates`,
      });
      issued++;
    }

    return { issued };
  },
});

export const getByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const certs = await ctx.db
      .query("certificates")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const enriched = [];
    for (const cert of certs) {
      const event = await ctx.db.get(cert.eventId);
      enriched.push({ ...cert, event });
    }
    return enriched;
  },
});

export const getByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("certificates")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
  },
});

export const getByEventAndUser = query({
  args: { eventId: v.id("events"), userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("certificates")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .unique();
  },
});

export const verify = query({
  args: { certificateNumber: v.string() },
  handler: async (ctx, args) => {
    const cert = await ctx.db
      .query("certificates")
      .withIndex("by_certificate_number", (q) => q.eq("certificateNumber", args.certificateNumber))
      .unique();

    if (!cert) return null;

    const event = await ctx.db.get(cert.eventId);
    const user = await ctx.db.get(cert.userId);

    return {
      valid: true,
      certificateNumber: cert.certificateNumber,
      eventTitle: event?.title ?? "Unknown Event",
      attendeeName: user?.name ?? "Unknown",
      issueDate: cert.issueDate,
      personalizedMessage: cert.personalizedMessage,
    };
  },
});
