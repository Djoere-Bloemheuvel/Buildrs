import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

// ===============================
// DATA MAINTENANCE & CLEANUP
// ===============================

export const cleanupOldRecords = internalMutation({
  args: {
    daysToKeep: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysToKeep = args.daysToKeep || 90; // Default: keep 90 days of data
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    console.log(`🧹 Starting cleanup of automation records older than ${daysToKeep} days`);

    let totalDeleted = 0;

    try {
      // Cleanup old execution records
      const oldExecutions = await ctx.db
        .query("automationExecutions")
        .withIndex("by_executed_at")
        .filter((q) => q.lt(q.field("executedAt"), cutoffDate))
        .collect();

      for (const execution of oldExecutions) {
        await ctx.db.delete(execution._id);
        totalDeleted++;
      }

      console.log(`🗑️ Deleted ${oldExecutions.length} old execution records`);

      // Cleanup old health metrics (keep more recent ones, but clean very old ones)
      const healthCutoffDate = Date.now() - (180 * 24 * 60 * 60 * 1000); // 6 months
      const oldHealthMetrics = await ctx.db
        .query("automationHealthMetrics")
        .withIndex("by_period")
        .filter((q) => q.lt(q.field("periodEnd"), healthCutoffDate))
        .collect();

      for (const metric of oldHealthMetrics) {
        await ctx.db.delete(metric._id);
        totalDeleted++;
      }

      console.log(`📊 Deleted ${oldHealthMetrics.length} old health metric records`);

      // Archive completed automations that haven't run in 6 months
      const automationCutoffDate = Date.now() - (180 * 24 * 60 * 60 * 1000);
      const staleAutomations = await ctx.db
        .query("clientAutomations")
        .filter((q) => q.and(
          q.eq(q.field("isActive"), false),
          q.lt(q.field("lastExecuted"), automationCutoffDate)
        ))
        .collect();

      // For now, just log stale automations (don't delete them as they contain important config)
      if (staleAutomations.length > 0) {
        console.log(`⚠️ Found ${staleAutomations.length} stale inactive automations (not deleting, just flagging)`);
      }

      return {
        success: true,
        totalRecordsDeleted: totalDeleted,
        executionsDeleted: oldExecutions.length,
        healthMetricsDeleted: oldHealthMetrics.length,
        staleAutomationsFound: staleAutomations.length,
        cutoffDate,
        daysToKeep,
      };

    } catch (error) {
      console.error("❌ Cleanup failed:", error);
      return {
        success: false,
        error: error.message,
        totalRecordsDeleted: totalDeleted,
      };
    }
  },
});

export const archiveInactiveAutomations = internalMutation({
  args: {
    daysInactive: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysInactive = args.daysInactive || 30;
    const cutoffDate = Date.now() - (daysInactive * 24 * 60 * 60 * 1000);

    console.log(`📦 Archiving automations inactive for ${daysInactive} days`);

    try {
      // Find automations that are inactive and haven't executed recently
      const inactiveAutomations = await ctx.db
        .query("clientAutomations")
        .filter((q) => q.and(
          q.eq(q.field("isActive"), false),
          q.or(
            q.eq(q.field("lastExecuted"), undefined),
            q.lt(q.field("lastExecuted"), cutoffDate)
          )
        ))
        .collect();

      let archivedCount = 0;

      for (const automation of inactiveAutomations) {
        // Add archive metadata without deleting
        await ctx.db.patch(automation._id, {
          isArchived: true,
          archivedAt: Date.now(),
          archivedReason: `Inactive for ${daysInactive} days`,
          updatedAt: Date.now(),
        });
        archivedCount++;
      }

      console.log(`📦 Archived ${archivedCount} inactive automations`);

      return {
        success: true,
        archivedCount,
        daysInactive,
        cutoffDate,
      };

    } catch (error) {
      console.error("❌ Archiving failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

export const generateMaintenanceReport = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("📋 Generating automation system maintenance report");

    try {
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

      // Count all automations by status
      const allAutomations = await ctx.db.query("clientAutomations").collect();
      const activeAutomations = allAutomations.filter(a => a.isActive && !a.isPaused);
      const pausedAutomations = allAutomations.filter(a => a.isActive && a.isPaused);
      const inactiveAutomations = allAutomations.filter(a => !a.isActive);

      // Count executions
      const executions24h = await ctx.db
        .query("automationExecutions")
        .withIndex("by_executed_at")
        .filter((q) => q.gte(q.field("executedAt"), oneDayAgo))
        .collect();

      const executions7d = await ctx.db
        .query("automationExecutions")
        .withIndex("by_executed_at")
        .filter((q) => q.gte(q.field("executedAt"), oneWeekAgo))
        .collect();

      // Count errors and failures
      const failures24h = executions24h.filter(e => !e.success);
      const failures7d = executions7d.filter(e => !e.success);

      // Count automations with consecutive failures
      const problemAutomations = allAutomations.filter(a => 
        a.consecutiveFailures && a.consecutiveFailures >= 3
      );

      // Count health metrics
      const healthMetrics = await ctx.db.query("automationHealthMetrics").collect();
      const recentHealthMetrics = healthMetrics.filter(m => m.lastHealthCheck > oneDayAgo);

      // System health assessment
      const totalExecutions24h = executions24h.length;
      const successRate24h = totalExecutions24h > 0 ? 
        ((totalExecutions24h - failures24h.length) / totalExecutions24h) : 1;

      let systemHealthStatus = "healthy";
      if (successRate24h < 0.8) systemHealthStatus = "critical";
      else if (successRate24h < 0.9) systemHealthStatus = "warning";
      else if (problemAutomations.length > 0) systemHealthStatus = "warning";

      const report = {
        timestamp: now,
        systemHealth: {
          status: systemHealthStatus,
          successRate24h,
          totalExecutions24h,
          failures24h: failures24h.length,
          problemAutomations: problemAutomations.length,
        },
        automationStats: {
          total: allAutomations.length,
          active: activeAutomations.length,
          paused: pausedAutomations.length,
          inactive: inactiveAutomations.length,
        },
        executionStats: {
          executions24h: executions24h.length,
          executions7d: executions7d.length,
          failures24h: failures24h.length,
          failures7d: failures7d.length,
          successRate7d: executions7d.length > 0 ? 
            ((executions7d.length - failures7d.length) / executions7d.length) : 1,
        },
        healthMetrics: {
          total: healthMetrics.length,
          recent: recentHealthMetrics.length,
        },
        recommendations: [],
      };

      // Generate recommendations
      if (successRate24h < 0.9) {
        report.recommendations.push({
          type: "performance",
          message: "Lage success rate gedetecteerd - controleer automation configuraties",
          priority: "high",
        });
      }

      if (problemAutomations.length > 0) {
        report.recommendations.push({
          type: "reliability",
          message: `${problemAutomations.length} automations hebben herhaalde fouten - handmatige controle vereist`,
          priority: "high",
        });
      }

      if (activeAutomations.length === 0) {
        report.recommendations.push({
          type: "utilization",
          message: "Geen actieve automations - systeem wordt niet gebruikt",
          priority: "medium",
        });
      }

      console.log(`📊 Maintenance report generated: ${systemHealthStatus} system health`);

      return report;

    } catch (error) {
      console.error("❌ Failed to generate maintenance report:", error);
      return {
        timestamp: Date.now(),
        error: error.message,
        systemHealth: { status: "error" },
      };
    }
  },
});

export const optimizeAutomationPerformance = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("⚡ Optimizing automation performance");

    try {
      let optimizationsApplied = 0;
      const optimizations = [];

      // Find automations with poor performance
      const allAutomations = await ctx.db.query("clientAutomations").collect();
      
      for (const automation of allAutomations) {
        if (!automation.isActive) continue;

        // Get recent execution history
        const recentExecutions = await ctx.db
          .query("automationExecutions")
          .withIndex("by_client_automation", (q) => q.eq("clientAutomationId", automation._id))
          .filter((q) => q.gte(q.field("executedAt"), Date.now() - (7 * 24 * 60 * 60 * 1000)))
          .collect();

        if (recentExecutions.length < 3) continue; // Need some history

        // Analyze performance patterns
        const avgExecutionTime = recentExecutions.reduce((sum, e) => sum + (e.executionDurationMs || 0), 0) / recentExecutions.length;
        const failureRate = recentExecutions.filter(e => !e.success).length / recentExecutions.length;
        const avgLeadsPerExecution = recentExecutions.reduce((sum, e) => sum + e.leadsProcessed, 0) / recentExecutions.length;

        // Optimization 1: Reduce daily limit for low-performing automations
        if (failureRate > 0.3 && automation.dailyLimit > 10) {
          const newLimit = Math.max(10, Math.floor(automation.dailyLimit * 0.8));
          await ctx.db.patch(automation._id, {
            dailyLimit: newLimit,
            lastError: `Auto-optimized: reduced daily limit from ${automation.dailyLimit} to ${newLimit} due to high failure rate`,
            updatedAt: Date.now(),
          });
          
          optimizations.push({
            automationId: automation._id,
            type: "reduce_daily_limit",
            oldValue: automation.dailyLimit,
            newValue: newLimit,
            reason: `High failure rate: ${(failureRate * 100).toFixed(1)}%`,
          });
          optimizationsApplied++;
        }

        // Optimization 2: Adjust execution time for better performance windows
        if (avgExecutionTime > 60000 && automation.executionTime.startsWith("09")) { // Slow during peak hours
          const newTime = "07:00"; // Move to earlier, less busy time
          await ctx.db.patch(automation._id, {
            executionTime: newTime,
            lastError: `Auto-optimized: moved execution time from ${automation.executionTime} to ${newTime} for better performance`,
            updatedAt: Date.now(),
          });

          optimizations.push({
            automationId: automation._id,
            type: "adjust_execution_time",
            oldValue: automation.executionTime,
            newValue: newTime,
            reason: `Slow execution during peak hours: ${avgExecutionTime}ms avg`,
          });
          optimizationsApplied++;
        }

        // Optimization 3: Pause automations with very low conversion
        const totalConverted = recentExecutions.reduce((sum, e) => sum + e.leadsConverted, 0);
        if (recentExecutions.length >= 5 && totalConverted === 0) {
          await ctx.db.patch(automation._id, {
            isPaused: true,
            lastError: "Auto-paused: no successful conversions in recent executions",
            updatedAt: Date.now(),
          });

          optimizations.push({
            automationId: automation._id,
            type: "pause_ineffective",
            reason: `No conversions in last ${recentExecutions.length} executions`,
          });
          optimizationsApplied++;
        }
      }

      console.log(`⚡ Applied ${optimizationsApplied} performance optimizations`);

      return {
        success: true,
        optimizationsApplied,
        optimizations,
        timestamp: Date.now(),
      };

    } catch (error) {
      console.error("❌ Performance optimization failed:", error);
      return {
        success: false,
        error: error.message,
        optimizationsApplied: 0,
      };
    }
  },
});