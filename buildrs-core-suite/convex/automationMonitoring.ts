import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ===============================
// MONITORING QUERIES
// ===============================

export const getAutomationHealthDashboard = query({
  args: {
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    // Get client automations
    const automations = await ctx.db
      .query("clientAutomations")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId as Id<"clients">))
      .collect();

    const automationHealth = await Promise.all(
      automations.map(async (automation) => {
        // Get recent executions
        const recentExecutions = await ctx.db
          .query("automationExecutions")
          .withIndex("by_client_automation", (q) => q.eq("clientAutomationId", automation._id))
          .filter((q) => q.gte(q.field("executedAt"), oneDayAgo))
          .order("desc")
          .take(50);

        // Get latest health metrics
        const latestHealthMetrics = await ctx.db
          .query("automationHealthMetrics")
          .withIndex("by_automation", (q) => q.eq("clientAutomationId", automation._id))
          .order("desc")
          .first();

        // Calculate current health status
        const totalExecutions = recentExecutions.length;
        const successfulExecutions = recentExecutions.filter(e => e.success).length;
        const failureRate = totalExecutions > 0 ? ((totalExecutions - successfulExecutions) / totalExecutions) : 0;
        
        let currentHealthStatus = "healthy";
        if (failureRate > 0.5) currentHealthStatus = "critical";
        else if (failureRate > 0.2) currentHealthStatus = "warning";
        else if (automation.consecutiveFailures && automation.consecutiveFailures > 2) currentHealthStatus = "warning";

        // Get template info
        const template = await ctx.db.get(automation.templateId);

        return {
          automation: {
            id: automation._id,
            customName: automation.customName,
            templateName: template?.name,
            isActive: automation.isActive,
            isPaused: automation.isPaused,
            executionTime: automation.executionTime,
            dailyLimit: automation.dailyLimit,
            lastExecuted: automation.lastExecuted,
            totalConverted: automation.totalConverted,
            consecutiveFailures: automation.consecutiveFailures || 0,
          },
          health: {
            status: currentHealthStatus,
            totalExecutions24h: totalExecutions,
            successfulExecutions24h: successfulExecutions,
            failureRate24h: failureRate,
            lastError: automation.lastError,
            nextRetryAt: automation.nextRetryAt,
          },
          metrics: latestHealthMetrics,
          recentExecutions: recentExecutions.slice(0, 10), // Last 10 executions
        };
      })
    );

    // Overall client stats
    const allExecutions = await ctx.db
      .query("automationExecutions")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId as Id<"clients">))
      .filter((q) => q.gte(q.field("executedAt"), oneWeekAgo))
      .collect();

    const overallStats = {
      totalAutomations: automations.length,
      activeAutomations: automations.filter(a => a.isActive && !a.isPaused).length,
      totalExecutions7d: allExecutions.length,
      successfulExecutions7d: allExecutions.filter(e => e.success).length,
      totalLeadsConverted7d: allExecutions.reduce((sum, e) => sum + e.leadsConverted, 0),
      totalCreditsUsed7d: allExecutions.reduce((sum, e) => sum + (e.creditsUsed || 0), 0),
    };

    return {
      overallStats,
      automationHealth,
      lastUpdated: now,
    };
  },
});

export const getExecutionHistory = query({
  args: {
    clientAutomationId: v.id("clientAutomations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const executions = await ctx.db
      .query("automationExecutions")
      .withIndex("by_client_automation", (q) => q.eq("clientAutomationId", args.clientAutomationId))
      .order("desc")
      .take(args.limit || 100);

    return executions;
  },
});

export const getHealthTrends = query({
  args: {
    clientId: v.string(),
    periodType: v.string(), // "daily", "weekly"
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysToQuery = args.days || 30;
    const periodStart = Date.now() - (daysToQuery * 24 * 60 * 60 * 1000);

    const metrics = await ctx.db
      .query("automationHealthMetrics")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId as Id<"clients">))
      .filter((q) => q.and(
        q.eq(q.field("periodType"), args.periodType),
        q.gte(q.field("periodStart"), periodStart)
      ))
      .order("asc")
      .collect();

    // Group by automation
    const trendsByAutomation = metrics.reduce((acc, metric) => {
      const automationId = metric.clientAutomationId;
      if (!acc[automationId]) {
        acc[automationId] = [];
      }
      acc[automationId].push(metric);
      return acc;
    }, {} as Record<string, typeof metrics>);

    return {
      trends: trendsByAutomation,
      periodType: args.periodType,
      periodStart,
      periodEnd: Date.now(),
    };
  },
});

// ===============================
// ALERTING SYSTEM
// ===============================

export const checkAutomationAlerts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const alerts = [];

    // Get all client automations
    const allAutomations = await ctx.db
      .query("clientAutomations")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    for (const automation of allAutomations) {
      const alertsForAutomation = [];

      // Alert 1: Consecutive failures
      if (automation.consecutiveFailures && automation.consecutiveFailures >= 3) {
        alertsForAutomation.push({
          type: "consecutive_failures",
          severity: automation.consecutiveFailures >= 5 ? "critical" : "warning",
          message: `Automation heeft ${automation.consecutiveFailures} opeenvolgende fouten`,
          data: {
            consecutiveFailures: automation.consecutiveFailures,
            lastError: automation.lastError,
          },
        });
      }

      // Alert 2: No recent executions (should have executed in last 25 hours)
      const expectedInterval = 25 * 60 * 60 * 1000; // 25 hours to account for scheduling variance
      if (automation.lastExecuted && (now - automation.lastExecuted) > expectedInterval) {
        alertsForAutomation.push({
          type: "missing_execution",
          severity: "warning",
          message: `Automation heeft meer dan 24 uur niet gedraaid`,
          data: {
            lastExecuted: automation.lastExecuted,
            hoursSinceLastExecution: Math.round((now - automation.lastExecuted) / (60 * 60 * 1000)),
          },
        });
      }

      // Alert 3: Low conversion rate
      const recentExecutions = await ctx.db
        .query("automationExecutions")
        .withIndex("by_client_automation", (q) => q.eq("clientAutomationId", automation._id))
        .filter((q) => q.gte(q.field("executedAt"), now - (7 * 24 * 60 * 60 * 1000)))
        .collect();

      if (recentExecutions.length >= 5) {
        const totalProcessed = recentExecutions.reduce((sum, e) => sum + e.leadsProcessed, 0);
        const totalConverted = recentExecutions.reduce((sum, e) => sum + e.leadsConverted, 0);
        const conversionRate = totalProcessed > 0 ? (totalConverted / totalProcessed) : 0;

        if (conversionRate < 0.1) { // Less than 10% conversion rate
          alertsForAutomation.push({
            type: "low_conversion_rate",
            severity: "warning",
            message: `Lage conversie rate: ${(conversionRate * 100).toFixed(1)}%`,
            data: {
              conversionRate,
              totalProcessed,
              totalConverted,
              executionsAnalyzed: recentExecutions.length,
            },
          });
        }
      }

      // Alert 4: High credit usage
      const last24hExecutions = recentExecutions.filter(e => e.executedAt > (now - 24 * 60 * 60 * 1000));
      const creditsUsed24h = last24hExecutions.reduce((sum, e) => sum + (e.creditsUsed || 0), 0);
      
      if (creditsUsed24h > automation.dailyLimit * 1.5) { // Using 50% more credits than expected
        alertsForAutomation.push({
          type: "high_credit_usage",
          severity: "warning",
          message: `Hoog kredietverbruik: ${creditsUsed24h} credits in 24u (verwacht: ${automation.dailyLimit})`,
          data: {
            creditsUsed24h,
            expectedCredits: automation.dailyLimit,
            overagePercentage: ((creditsUsed24h - automation.dailyLimit) / automation.dailyLimit * 100),
          },
        });
      }

      // Add alerts for this automation
      if (alertsForAutomation.length > 0) {
        const template = await ctx.db.get(automation.templateId);
        alerts.push({
          automationId: automation._id,
          clientId: automation.clientId,
          automationName: automation.customName || template?.name || "Unnamed Automation",
          alerts: alertsForAutomation,
          timestamp: now,
        });
      }
    }

    // Store alerts for historical tracking (optional)
    for (const alert of alerts) {
      // You could store these in a separate alerts table for historical tracking
      console.log(`🚨 ALERT for automation ${alert.automationName}:`, alert.alerts);
    }

    return {
      alertsGenerated: alerts.length,
      alerts,
      timestamp: now,
    };
  },
});

// ===============================
// PERFORMANCE ANALYTICS
// ===============================

export const getPerformanceAnalytics = query({
  args: {
    clientId: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const periodStart = Date.now() - (days * 24 * 60 * 60 * 1000);

    // Get all executions in period
    const executions = await ctx.db
      .query("automationExecutions")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId as Id<"clients">))
      .filter((q) => q.gte(q.field("executedAt"), periodStart))
      .collect();

    // Group by template type
    const templateStats = new Map();
    
    for (const execution of executions) {
      const template = await ctx.db.get(execution.templateId);
      const templateKey = template?.key || "unknown";
      
      if (!templateStats.has(templateKey)) {
        templateStats.set(templateKey, {
          templateName: template?.name || "Unknown",
          totalExecutions: 0,
          successfulExecutions: 0,
          totalLeadsProcessed: 0,
          totalLeadsConverted: 0,
          totalCreditsUsed: 0,
          avgExecutionTime: 0,
          executionTimes: [],
        });
      }
      
      const stats = templateStats.get(templateKey);
      stats.totalExecutions++;
      if (execution.success) stats.successfulExecutions++;
      stats.totalLeadsProcessed += execution.leadsProcessed;
      stats.totalLeadsConverted += execution.leadsConverted;
      stats.totalCreditsUsed += execution.creditsUsed || 0;
      if (execution.executionDurationMs) {
        stats.executionTimes.push(execution.executionDurationMs);
      }
    }

    // Calculate averages
    const templateAnalytics = Array.from(templateStats.entries()).map(([key, stats]) => {
      const avgExecutionTime = stats.executionTimes.length > 0 
        ? stats.executionTimes.reduce((a, b) => a + b, 0) / stats.executionTimes.length 
        : 0;
      
      return {
        templateKey: key,
        templateName: stats.templateName,
        totalExecutions: stats.totalExecutions,
        successRate: stats.totalExecutions > 0 ? (stats.successfulExecutions / stats.totalExecutions) : 0,
        conversionRate: stats.totalLeadsProcessed > 0 ? (stats.totalLeadsConverted / stats.totalLeadsProcessed) : 0,
        avgLeadsPerExecution: stats.totalExecutions > 0 ? (stats.totalLeadsProcessed / stats.totalExecutions) : 0,
        avgCreditsPerExecution: stats.totalExecutions > 0 ? (stats.totalCreditsUsed / stats.totalExecutions) : 0,
        avgExecutionTimeMs: avgExecutionTime,
        totalLeadsConverted: stats.totalLeadsConverted,
        totalCreditsUsed: stats.totalCreditsUsed,
      };
    });

    // Overall stats
    const overallStats = {
      totalExecutions: executions.length,
      successfulExecutions: executions.filter(e => e.success).length,
      totalLeadsProcessed: executions.reduce((sum, e) => sum + e.leadsProcessed, 0),
      totalLeadsConverted: executions.reduce((sum, e) => sum + e.leadsConverted, 0),
      totalCreditsUsed: executions.reduce((sum, e) => sum + (e.creditsUsed || 0), 0),
      avgExecutionTime: executions.length > 0 
        ? executions.reduce((sum, e) => sum + (e.executionDurationMs || 0), 0) / executions.length 
        : 0,
    };

    return {
      periodStart,
      periodEnd: Date.now(),
      days,
      overallStats,
      templateAnalytics,
      executionHistory: executions.slice(0, 100), // Recent 100 executions
    };
  },
});

// ===============================
// AUTOMATION CONTROL
// ===============================

export const pauseAutomation = mutation({
  args: {
    clientAutomationId: v.id("clientAutomations"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.clientAutomationId, {
      isPaused: true,
      lastError: args.reason || "Manually paused",
      updatedAt: Date.now(),
    });

    return { success: true, message: "Automation paused" };
  },
});

export const resumeAutomation = mutation({
  args: {
    clientAutomationId: v.id("clientAutomations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.clientAutomationId, {
      isPaused: false,
      lastError: undefined,
      nextRetryAt: undefined,
      consecutiveFailures: 0,
      updatedAt: Date.now(),
    });

    return { success: true, message: "Automation resumed" };
  },
});

export const manuallyExecuteAutomation = mutation({
  args: {
    clientAutomationId: v.id("clientAutomations"),
  },
  handler: async (ctx, args) => {
    try {
      const result = await ctx.runMutation("automationEngine:executeAutomationSafely", {
        clientAutomationId: args.clientAutomationId,
        executionType: "manual",
        triggerSource: "user",
      });

      return {
        success: result.success,
        message: result.success 
          ? `Automation executed: ${result.leadsConverted || 0} leads converted`
          : `Automation failed: ${result.errorMessage}`,
        result,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to execute automation: ${error.message}`,
      };
    }
  },
});