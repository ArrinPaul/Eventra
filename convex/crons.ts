import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every hour to auto-complete events whose endDate has passed
crons.interval(
  "auto-complete past events",
  { hours: 1 },
  internal.events.autoCompletePastEvents
);

crons.daily(
  "send event reminders",
  { hourUTC: 4, minuteUTC: 0 }, // 4 AM UTC
  internal.reminders.checkAndSendReminders
);

export default crons;
