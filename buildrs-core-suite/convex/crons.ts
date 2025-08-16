import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// ===============================
// BULK CONVERT AUTOMATION
// ===============================

// Ultra simple bulk convert - runs once per day
crons.daily(
  "bulk-convert-automation",
  { hourUTC: 9, minuteUTC: 0 }, // Run daily at 9:00 AM UTC (11:00 AM CET)
  internal.bulkConvert.runBulkConvert
);

// ===============================
// DATA ENRICHMENT
// ===============================

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