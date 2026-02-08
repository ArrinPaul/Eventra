import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every hour to auto-complete events whose endDate has passed
crons.interval(
  "auto-complete past events",
  { hours: 1 },
  internal.events.autoCompletePastEvents
);

export default crons;
