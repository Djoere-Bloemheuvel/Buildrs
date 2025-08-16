import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Main automation scheduler - runs every minute (FOR TESTING)
crons.interval(
  "automation-scheduler",
  { minutes: 1 }, // Check every minute for testing
  internal.automationSchedulerInternal.checkAndExecuteAutomations
);

// Peak hours scheduler - disabled during testing to avoid conflicts
// crons.cron(
//   "automation-scheduler-peak",
//   "0 6-12 * * *", // Every hour from 6 AM to 12 PM
//   internal.automationSchedulerInternal.checkAndExecuteAutomations
// );

// Daily health metrics generation - runs at 1 AM every day
crons.cron(
  "daily-health-metrics",
  "0 1 * * *", // 1:00 AM daily
  internal.automationEngine.generateHealthMetrics,
  { periodType: "daily" }
);

// Weekly health metrics generation - runs at 2 AM every Sunday
crons.cron(
  "weekly-health-metrics", 
  "0 2 * * 0", // 2:00 AM every Sunday
  internal.automationEngine.generateHealthMetrics,
  { periodType: "weekly" }
);

// Alert checking - runs every 6 hours to detect issues
crons.cron(
  "automation-alerts",
  "0 */6 * * *", // Every 6 hours
  internal.automationMonitoring.checkAutomationAlerts
);

// Cleanup old execution records - runs at 3 AM every day
crons.cron(
  "cleanup-old-executions",
  "0 3 * * *", // 3:00 AM daily
  internal.automationMaintenance.cleanupOldRecords
);

export default crons;