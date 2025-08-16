import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily fallback cronjob to enrich leads without function groups
// Runs every day at 02:00 AM (when N8N traffic is low)
crons.daily(
  "daily function group enrichment",
  {
    hourUTC: 2, // 2 AM UTC
    minuteUTC: 0,
  },
  internal.apolloProcessor.dailyFunctionGroupEnrichment
);

export default crons;