import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { auth } from "./auth";
import { internal } from "./_generated/api";
import { awardPointsInternal } from "./gamification";

/**
 * Register for an event
 * Checks capacity, creates ticket, awards XP, sends notification
 */
export const register = mutation({
  args: { 
    eventId: v.id("events"), 
    status: v.optional(v.string()),
    tierName: v.optional(v.string()),
    discountId: v.optional(v.id("discount_codes"))
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    if (event.status !== "published") {
      throw new Error("Event is not available for registration");
    }

    const existing = await ctx.db
      .query("registrations")
      .withIndex("by_event_user", (q: any) => q.eq("eventId", args.eventId).eq("userId", userId))
      .unique();

    if (existing) {
      if (existing.status === 'pending' && args.status === 'confirmed') {
         // Upgrade pending to confirmed if called from webhook/success
         await ctx.db.patch(existing._id, { status: 'confirmed' });
         if (existing.ticketId) await ctx.db.patch(existing.ticketId, { status: 'confirmed' });
         
         // If discount was applied, increment it now
         if (args.discountId) {
           const code = await ctx.db.get(args.discountId);
           if (code) await ctx.db.patch(args.discountId, { usedCount: code.usedCount + 1 });
         }

         return existing._id;
      }
      return existing._id;
    }

    // Capacity enforcement
    // ...
    // (I need to keep the code in between, so I'll be more precise)

    // Capacity enforcement
    let isFull = event.registeredCount >= event.capacity;
    let selectedTier: any = null;

    if (args.tierName && event.ticketTiers) {
      selectedTier = (event.ticketTiers as any[]).find((t: any) => t.name === args.tierName);
      if (selectedTier) {
        isFull = selectedTier.registeredCount >= selectedTier.capacity;
      }
    }

    if (isFull && !event.waitlistEnabled) {
      throw new Error("Event is at full capacity");
    }

    const isWaitlisted = isFull && event.waitlistEnabled;
    const status = args.status || (isWaitlisted ? "waitlisted" : "confirmed");

    // ... (rest of registration logic)

    // Get user info for ticket
    const user = await ctx.db.get(userId);
    const ticketNumber = `EVT-${args.eventId.substring(0, 4)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const ticketId = await ctx.db.insert("tickets", {
      eventId: args.eventId,
      userId,
      ticketNumber,
      status,
      price: selectedTier ? selectedTier.price : (event.price || 0),
      purchaseDate: Date.now(),
      attendeeName: user?.name || "Attendee",
      attendeeEmail: user?.email || "",
      ticketTypeId: args.tierName,
    });

    const regId = await ctx.db.insert("registrations", {
      userId,
      eventId: args.eventId,
      status,
      registrationDate: Date.now(),
      ticketId,
    });

    if (args.discountId && status === 'confirmed') {
      const code = await ctx.db.get(args.discountId);
      if (code) await ctx.db.patch(args.discountId, { usedCount: code.usedCount + 1 });
    }

    if (status === 'confirmed') {
      await ctx.scheduler.runAfter(0, internal.webhooks.trigger, {
        eventType: "registration.created",
        eventId: args.eventId,
        payload: { userId, ticketNumber, registrationId: regId },
      });
    }

    if (!isWaitlisted) {
      // Update global count
      await ctx.db.patch(args.eventId, {
        registeredCount: (event.registeredCount || 0) + 1,
      });

      // Update tier count if applicable
      if (args.tierName && event.ticketTiers) {
        const updatedTiers = (event.ticketTiers as any[]).map((t: any) => 
          t.name === args.tierName 
            ? { ...t, registeredCount: (t.registeredCount || 0) + 1 }
            : t
        );
        await ctx.db.patch(args.eventId, { ticketTiers: updatedTiers });
      }
    }

    // Award XP
    await awardPointsInternal(
      ctx,
      userId,
      50,
      `Registered for event: ${event.title}`,
      `/events/${args.eventId}`
    );

    // Send notification
    await ctx.db.insert("notifications", {
      userId,
      title: isWaitlisted ? "Added to Waitlist" : "Registration Confirmed! 🎉",
      message: isWaitlisted
        ? `You've been added to the waitlist for "${event.title}".`
        : `You're registered for "${event.title}". Your ticket: ${ticketNumber}`,
      type: "event",
      read: false,
      createdAt: Date.now(),
      link: `/tickets`,
    });

    // Trigger email confirmation
    if (status === 'confirmed') {
      await ctx.db.insert("notifications", {
        userId,
        title: "Registration Email",
        message: `CONFIRMATION_EMAIL:${args.eventId}:${ticketNumber}`,
        type: "email",
        read: false,
        createdAt: Date.now(),
      });
    }

    return regId;
  },
});

/**
 * Cancel registration
 */
export const cancel = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const reg = await ctx.db
      .query("registrations")
      .withIndex("by_event_user", (q) => q.eq("eventId", args.eventId).eq("userId", userId))
      .unique();

    if (!reg) throw new Error("Registration not found");

    await ctx.db.patch(reg._id, { status: "cancelled" });

    if (reg.ticketId) {
      await ctx.db.patch(reg.ticketId, { status: "cancelled" });
    }

    const event = await ctx.db.get(args.eventId);
    if (event && reg.status === "confirmed") {
      await ctx.db.patch(args.eventId, {
        registeredCount: Math.max(0, (event.registeredCount || 1) - 1),
      });

      // Auto-promote from waitlist
      if (event.waitlistEnabled) {
        const waitlisted = await ctx.db
          .query("registrations")
          .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
          .filter((q) => q.eq(q.field("status"), "waitlisted"))
          .first();

        if (waitlisted) {
          await ctx.db.patch(waitlisted._id, { status: "confirmed" });
          if (waitlisted.ticketId) {
            await ctx.db.patch(waitlisted.ticketId, { status: "confirmed" });
          }
          await ctx.db.patch(args.eventId, {
            registeredCount: (event.registeredCount || 1),
          });
          await ctx.db.insert("notifications", {
            userId: waitlisted.userId,
            title: "You're In! 🎉",
            message: `A spot opened up for "${event.title}" and you've been promoted from the waitlist!`,
            type: "event",
            read: false,
            createdAt: Date.now(),
            link: `/tickets`,
          });
        }
      }
    }
  },
});

/**
 * Get registration status for the current user
 */
export const getRegistration = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("registrations")
      .withIndex("by_event_user", (q) => q.eq("eventId", args.eventId).eq("userId", userId))
      .unique();
  },
});

export const getByEvents = query({
  args: { eventIds: v.array(v.id("events")) },
  handler: async (ctx, args) => {
    const allRegs = [];
    for (const eventId of args.eventIds) {
      const regs = await ctx.db
        .query("registrations")
        .withIndex("by_event", (q) => q.eq("eventId", eventId))
        .collect();
      allRegs.push(...regs);
    }
    return allRegs;
  },
});

export const getByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Enrich with ticket info
    const enriched = [];
    for (const reg of regs) {
      if (reg.ticketId) {
        const ticket = await ctx.db.get(reg.ticketId);
        enriched.push({ ...reg, ticketNumber: ticket?.ticketNumber });
      } else {
        enriched.push(reg);
      }
    }
    return enriched;
  },
});

export const getUpcoming = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const now = Date.now();
    const enriched = [];

    for (const reg of regs) {
      const event = await ctx.db.get(reg.eventId);
      // Only include upcoming or live events
      if (event && (event.endDate > now)) {
        enriched.push({ ...reg, event });
      }
    }

    return enriched.sort((a, b) => (a.event?.startDate || 0) - (b.event?.startDate || 0));
  },
});



export const confirmPayment = internalMutation({



  args: { 



    eventId: v.id("events"), 



    userId: v.id("users"),



    tierName: v.optional(v.string()),



    stripePaymentId: v.optional(v.string())



  },



  handler: async (ctx, args) => {



    const { eventId, userId, tierName, stripePaymentId } = args;



    const event = await ctx.db.get(eventId);



    if (!event) return;







    const existing = await ctx.db



      .query("registrations")



      .withIndex("by_event_user", (q: any) => q.eq("eventId", eventId).eq("userId", userId))



      .unique();







    if (existing && existing.status === 'confirmed') return;







    const ticketNumber = `EVT-${eventId.substring(0, 4)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;



    const user = await ctx.db.get(userId);







    let selectedTier: any = null;



    if (tierName && event.ticketTiers) {



      selectedTier = (event.ticketTiers as any[]).find((t: any) => t.name === tierName);



    }







    const ticketId = await ctx.db.insert("tickets", {



      eventId,



      userId,



      ticketNumber,



      status: "confirmed",



      price: selectedTier ? selectedTier.price : (event.price || 0),



      purchaseDate: Date.now(),



      attendeeName: user?.name || "Attendee",



      attendeeEmail: user?.email || "",



      ticketTypeId: tierName,



      stripePaymentId,



    });







    if (existing) {



      await ctx.db.patch(existing._id, { status: "confirmed", ticketId });



    } else {



      await ctx.db.insert("registrations", {



        userId,



        eventId,



        status: "confirmed",



        registrationDate: Date.now(),



        ticketId,



      });



    }







    await ctx.db.patch(eventId, {



      registeredCount: (event.registeredCount || 0) + 1,



    });







    // Update tier count if applicable



    if (tierName && event.ticketTiers) {



      const updatedTiers = (event.ticketTiers as any[]).map((t: any) => 



        t.name === tierName 



          ? { ...t, registeredCount: (t.registeredCount || 0) + 1 }



          : t



      );



      await ctx.db.patch(eventId, { ticketTiers: updatedTiers });



    }







    await ctx.db.insert("notifications", {

      userId,

      title: "Payment Confirmed! 🎉",

      message: `Your payment for "${event.title}" was successful. Your ticket: ${ticketNumber}`,

      type: "event",

      read: false,

      createdAt: Date.now(),

            link: `/tickets`,

          });

      

          // Trigger email confirmation

          await ctx.db.insert("notifications", {

            userId,

            title: "Registration Email",

            message: `CONFIRMATION_EMAIL:${eventId}:${ticketNumber}`,

            type: "email",

            read: false,

            createdAt: Date.now(),

          });

        }

      });

      
