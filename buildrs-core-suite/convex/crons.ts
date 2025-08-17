import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// ===============================
// BULK CONVERT AUTOMATION
// ===============================

// Ultra simple bulk convert - runs once per day
crons.daily(
  "bulk-convert-automation",
  { hourUTC: 5, minuteUTC: 0 }, // Run daily at 5:00 AM UTC (7:00 AM CET)
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

// Daily fallback cronjob to enrich companies without companySummary
// Runs every day at 03:00 AM (after function group enrichment)
crons.daily(
  "daily company summary enrichment",
  {
    hourUTC: 3, // 3 AM UTC
    minuteUTC: 0,
  },
  internal.apolloProcessor.dailyCompanySummaryEnrichment
);

// ===============================
// EMAIL SYNC AUTOMATION
// ===============================

/**
 * Email sync cron job - runs every 15 minutes during business hours
 * This provides real-time email monitoring while respecting API rate limits
 */
crons.interval(
  "sync-emails-frequent",
  { minutes: 15 },
  internal.emailSync.syncAllEmailAccounts,
  {}
);

/**
 * Daily email sync - comprehensive sync at night
 * This catches any missed emails and performs maintenance tasks
 */
crons.daily(
  "sync-emails-daily",
  { hourUTC: 1, minuteUTC: 0 }, // 1 AM UTC (before enrichment jobs)
  internal.emailSync.syncAllEmailAccounts,
  {}
);

/**
 * Token refresh check - runs every hour
 * Proactively refreshes OAuth tokens before they expire
 */
crons.hourly(
  "refresh-oauth-tokens",
  { minuteUTC: 30 },
  internal.emailAccounts.refreshExpiredTokens,
  {}
);

/**
 * Weekly cleanup of old communications data
 * Runs every Sunday at 4 AM UTC to clean up old data (if configured)
 */
crons.weekly(
  "cleanup-old-communications",
  { dayOfWeek: "sunday", hourUTC: 4, minuteUTC: 0 },
  internal.emailSync.cleanupOldCommunications,
  { maxAgeMonths: 24 }
);

export default crons;