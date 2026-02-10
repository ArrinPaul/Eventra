import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Check for events starting in the next 24 hours and send reminders
 */
export const checkAndSendReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const twentyFourHoursFromNow = now + 24 * 60 * 60 * 1000;
    
    // 1. Get published events starting in the next 24 hours
    const upcomingEvents = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .filter((q) => 
        q.and(
          q.gt(q.field("startDate"), now),
          q.lt(q.field("startDate"), twentyFourHoursFromNow)
        )
      )
      .collect();

    let remindersSent = 0;

    for (const event of upcomingEvents) {
      // 2. Get all confirmed registrations for this event
      const registrations = await ctx.db
        .query("registrations")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .filter((q) => q.eq(q.field("status"), "confirmed"))
        .collect();

      for (const reg of registrations) {
        // 3. Check if we've already sent a reminder for this event to this user
        const existingReminder = await ctx.db
          .query("notifications")
          .withIndex("by_user", (q) => q.eq("userId", reg.userId))
          .filter((q) => 
            q.and(
              q.eq(q.field("type"), "email"),
              q.eq(q.field("message"), `REMINDER_EMAIL:${event.title}`)
            )
          )
          .first();

        if (!existingReminder) {
          // Send In-app notification
          await ctx.db.insert("notifications", {
            userId: reg.userId,
            title: "Event Reminder ⏰",
            message: `"${event.title}" is starting soon!`,
            type: "event",
            read: false,
            createdAt: Date.now(),
            link: `/events/${event._id}`,
          });

          // Trigger Email
          await ctx.db.insert("notifications", {
            userId: reg.userId,
            title: "Reminder Email",
            message: `REMINDER_EMAIL:${event.title}`,
            type: "email",
            read: false,
            createdAt: Date.now(),
          });
          
          remindersSent++;
        }
      }
    }

    return { remindersSent };
  },
});
