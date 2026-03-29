import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { auth } from "./auth";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("automations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    triggerType: v.string(),
    triggerConfig: v.any(),
    actions: v.array(v.object({
      id: v.string(),
      type: v.string(),
      config: v.any(),
      delay: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    return await ctx.db.insert("automations", {
      ...args,
      userId,
      isActive: true,
      runCount: 0,
      successCount: 0,
      errorCount: 0,
    });
  },
});

export const toggle = mutation({
  args: { id: v.id("automations"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const automation = await ctx.db.get(args.id);
    if (!automation || automation.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.id, { isActive: args.isActive });
  },
});

export const deleteAutomation = mutation({
  args: { id: v.id("automations") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const automation = await ctx.db.get(args.id);
    if (!automation || automation.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.id);
  },
});

export const getActiveByUserAndTrigger = internalQuery({
  args: {
    userId: v.id("users"),
    triggerType: v.string(),
  },
  handler: async (ctx, args) => {
    const automations = await ctx.db
      .query("automations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return automations.filter((a) => a.isActive && a.triggerType === args.triggerType);
  },
});

export const recordExecution = internalMutation({
  args: {
    id: v.id("automations"),
    success: v.boolean(),
  },
  handler: async (ctx, args) => {
    const automation = await ctx.db.get(args.id);
    if (!automation) return;

    await ctx.db.patch(args.id, {
      runCount: (automation.runCount || 0) + 1,
      successCount: (automation.successCount || 0) + (args.success ? 1 : 0),
      errorCount: (automation.errorCount || 0) + (args.success ? 0 : 1),
      lastRun: Date.now(),
    });
  },
});

export const executeForTrigger = internalAction({
  args: {
    userId: v.id("users"),
    triggerType: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const automations = await ctx.runQuery(internal.automations.getActiveByUserAndTrigger, {
      userId: args.userId,
      triggerType: args.triggerType,
    });

    for (const automation of automations) {
      let success = true;
      try {
        for (const action of automation.actions) {
          if (action.type === "email") {
            await ctx.runMutation(api.notifications.create, {
              userId: args.userId,
              title: `Automation: ${automation.name}`,
              message: `Email workflow executed for trigger '${args.triggerType}'.`,
              type: "email",
              link: "/integrations/automation",
            });
            continue;
          }

          if (action.type === "notification" || action.type === "in_app") {
            await ctx.runMutation(api.notifications.create, {
              userId: args.userId,
              title: `Automation Executed: ${automation.name}`,
              message: `Trigger '${args.triggerType}' processed successfully.`,
              type: "admin",
              link: "/integrations/automation",
            });
            continue;
          }

          if (action.type === "webhook") {
            const webhookUrl = action.config?.url || automation.n8nWebhookUrl;
            if (webhookUrl) {
              const response = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  triggerType: args.triggerType,
                  payload: args.payload,
                  automationId: automation._id,
                  executedAt: Date.now(),
                }),
              });
              if (!response.ok) throw new Error(`Webhook failed: ${response.status}`);
            }
            continue;
          }
        }
      } catch (error) {
        success = false;
        console.error(`Automation ${automation._id} failed for trigger ${args.triggerType}`, error);
      }

      await ctx.runMutation(internal.automations.recordExecution, {
        id: automation._id,
        success,
      });
    }
  },
});
