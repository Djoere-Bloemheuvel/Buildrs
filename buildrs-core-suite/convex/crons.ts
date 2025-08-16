import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// ===============================
// SIMPLE SMART CONVERSION AUTOMATION
// ===============================

// Simple Smart Conversion Automation - runs every 6 hours to process all active automations
crons.interval(
  "simple-smart-conversion-automation", 
  { hours: 6 }, // Run every 6 hours automatically
  internal.simpleSmartConversion.runAllSmartConversions
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