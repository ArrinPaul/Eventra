import { v } from "convex/values";
import { mutation, query, internalAction } from "./_generated/server";
import { api } from "./_generated/api";
import { auth } from "./auth";

async function signWebhookPayload(secret: string, timestamp: number, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${payload}`));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const create = mutation({
  args: {
    eventId: v.optional(v.id("events")),
    url: v.string(),
    events: v.array(v.union(v.literal("registration.created"), v.literal("checkin.completed"), v.literal("event.cancelled"))),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const secret = "whsec_" + Math.random().toString(36).substring(2, 15);

    return await ctx.db.insert("webhooks", {
      ...args,
      userId,
      secret,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("webhooks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const toggleActive = mutation({
  args: { id: v.id("webhooks"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    
    const webhook = await ctx.db.get(args.id);
    if (webhook?.userId !== userId) throw new Error("Not authorized");

    await ctx.db.patch(args.id, { isActive: args.isActive });
  },
});

export const deleteWebhook = mutation({
  args: { id: v.id("webhooks") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    
    const webhook = await ctx.db.get(args.id);
    if (webhook?.userId !== userId) throw new Error("Not authorized");

    await ctx.db.delete(args.id);
  },
});

export const trigger = internalAction({
  args: {
    eventType: v.union(v.literal("registration.created"), v.literal("checkin.completed"), v.literal("event.cancelled")),
    eventId: v.id("events"),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    // 1. Find active webhooks for this event or platform-wide
    const webhooks = await ctx.runQuery(api.webhooks.getMatchingWebhooks, {
      eventId: args.eventId,
      eventType: args.eventType,
    });

    for (const webhook of webhooks) {
      try {
        const timestamp = Date.now();
        const body = JSON.stringify({
          event: args.eventType,
          eventId: args.eventId,
          timestamp,
          data: args.payload,
        });
        const signature = await signWebhookPayload(webhook.secret, timestamp, body);

        await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Eventra-Signature': `t=${timestamp},v1=${signature}`,
            'X-Eventra-Event': args.eventType,
          },
          body,
        });
      } catch (e) {
        console.error(`Failed to trigger webhook ${webhook.url}:`, e);
      }
    }
  },
});

export const getMatchingWebhooks = query({
  args: { eventId: v.id("events"), eventType: v.string() },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return [];

    const eventHooks = await ctx.db
      .query("webhooks")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const platformHooks = await ctx.db
      .query("webhooks")
      .filter((q) => 
        q.and(
          q.eq(q.field("eventId"), undefined),
          q.eq(q.field("isActive"), true)
        )
      )
      .collect();

    return [...eventHooks, ...platformHooks].filter(h => h.events.includes(args.eventType as any));
  },
});
