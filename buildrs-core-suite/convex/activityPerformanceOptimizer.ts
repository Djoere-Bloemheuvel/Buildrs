import { v } from "convex/values";
import { internalMutation, internalQuery, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * ACTIVITY PERFORMANCE OPTIMIZER
 * Optimizes activity log performance through intelligent archiving and caching
 */

/**
 * Archive old activities to reduce query load
 */
export const archiveOldActivities = internalMutation({
  args: {
    archiveAfterMonths: v.optional(v.number()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const archiveAfter = args.archiveAfterMonths || 6; // Default 6 months
    const batchSize = args.batchSize || 100;
    const cutoffDate = Date.now() - (archiveAfter * 30 * 24 * 60 * 60 * 1000);
    
    console.log(`Starting archive of activities older than ${archiveAfter} months...`);
    
    // Get old activities in batches
    const oldActivities = await ctx.db
      .query("activityLog")
      .withIndex("by_timestamp", q => q.lt("timestamp", cutoffDate))
      .take(batchSize);
    
    if (oldActivities.length === 0) {
      console.log("No activities to archive");
      return { archivedCount: 0 };
    }
    
    // Create archive entries (simplified format for long-term storage)
    const archiveEntries = oldActivities.map(activity => ({
      originalId: activity._id,
      clientId: activity.clientId,
      action: activity.action,
      category: activity.category,
      timestamp: activity.timestamp,
      description: activity.description,
      userId: activity.userId,
      isSystemGenerated: activity.isSystemGenerated,
      // Store minimal metadata for space efficiency
      entityIds: {
        contactId: activity.contactId,
        dealId: activity.dealId,
        campaignId: activity.campaignId,
        companyId: activity.companyId,
      },
      archivedAt: Date.now(),
    }));
    
    // Insert archive entries
    for (const entry of archiveEntries) {
      await ctx.db.insert("activityArchive", entry);
    }
    
    // Delete original entries
    for (const activity of oldActivities) {
      await ctx.db.delete(activity._id);
    }
    
    console.log(`Archived ${oldActivities.length} activities`);
    return { archivedCount: oldActivities.length };
  },
});

/**
 * Generate activity summary for faster dashboard queries
 */
export const generateDailySummaries = internalMutation({
  args: {
    targetDate: v.optional(v.string()), // YYYY-MM-DD format
  },
  handler: async (ctx, args) => {
    const targetDate = args.targetDate || new Date().toISOString().split('T')[0];
    const startOfDay = new Date(`${targetDate}T00:00:00.000Z`).getTime();
    const endOfDay = new Date(`${targetDate}T23:59:59.999Z`).getTime();
    
    console.log(`Generating daily summary for ${targetDate}...`);
    
    // Get all activities for the day
    const activities = await ctx.db
      .query("activityLog")
      .withIndex("by_timestamp", q => 
        q.gte("timestamp", startOfDay).lte("timestamp", endOfDay)
      )
      .collect();
    
    if (activities.length === 0) {
      console.log(`No activities found for ${targetDate}`);
      return { date: targetDate, clientSummaries: [] };
    }
    
    // Group by client
    const clientGroups = activities.reduce((acc, activity) => {
      const clientId = activity.clientId;
      if (!acc[clientId]) {
        acc[clientId] = [];
      }
      acc[clientId].push(activity);
      return acc;
    }, {} as Record<string, any[]>);
    
    const clientSummaries = [];
    
    // Generate summary for each client
    for (const [clientId, clientActivities] of Object.entries(clientGroups)) {
      const summary = {
        clientId,
        date: targetDate,
        totalActivities: clientActivities.length,
        byCategory: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        byUser: {} as Record<string, number>,
        topActions: [] as Array<{ action: string; count: number }>,
        uniqueContacts: new Set(clientActivities.map(a => a.contactId).filter(Boolean)).size,
        uniqueDeals: new Set(clientActivities.map(a => a.dealId).filter(Boolean)).size,
        uniqueCampaigns: new Set(clientActivities.map(a => a.campaignId).filter(Boolean)).size,
        systemGenerated: clientActivities.filter(a => a.isSystemGenerated).length,
        userGenerated: clientActivities.filter(a => !a.isSystemGenerated).length,
        createdAt: Date.now(),
      };
      
      // Aggregate statistics
      const actionCounts = new Map<string, number>();
      
      for (const activity of clientActivities) {
        // By category
        summary.byCategory[activity.category] = (summary.byCategory[activity.category] || 0) + 1;
        
        // By priority
        summary.byPriority[activity.priority] = (summary.byPriority[activity.priority] || 0) + 1;
        
        // By user
        const user = activity.userId || "system";
        summary.byUser[user] = (summary.byUser[user] || 0) + 1;
        
        // Action counts
        actionCounts.set(activity.action, (actionCounts.get(activity.action) || 0) + 1);
      }
      
      // Top actions
      summary.topActions = Array.from(actionCounts.entries())
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      // Check if summary already exists for this client/date
      const existingSummary = await ctx.db
        .query("activityDailySummaries")
        .withIndex("by_client_date", q => 
          q.eq("clientId", clientId).eq("date", targetDate)
        )
        .first();
      
      if (existingSummary) {
        // Update existing summary
        await ctx.db.patch(existingSummary._id, summary);
      } else {
        // Create new summary
        await ctx.db.insert("activityDailySummaries", summary);
      }
      
      clientSummaries.push(summary);
    }
    
    console.log(`Generated daily summaries for ${clientSummaries.length} clients on ${targetDate}`);
    return { date: targetDate, clientSummaries };
  },
});

/**
 * Get cached daily summaries for faster dashboard performance
 */
export const getCachedClientStats = internalQuery({
  args: {
    clientId: v.id("clients"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const summaries = await ctx.db
      .query("activityDailySummaries")
      .withIndex("by_client_date", q => q.eq("clientId", args.clientId))
      .filter(q => 
        q.gte(q.field("date"), startDate.toISOString().split('T')[0]) &&
        q.lte(q.field("date"), endDate.toISOString().split('T')[0])
      )
      .collect();
    
    if (summaries.length === 0) {
      return null; // No cached data available
    }
    
    // Aggregate summaries
    const aggregated = {
      totalActivities: summaries.reduce((sum, s) => sum + s.totalActivities, 0),
      byCategory: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      byUser: {} as Record<string, number>,
      topActions: [] as Array<{ action: string; count: number }>,
      uniqueContacts: new Set<string>(),
      uniqueDeals: new Set<string>(),
      uniqueCampaigns: new Set<string>(),
      systemGenerated: summaries.reduce((sum, s) => sum + s.systemGenerated, 0),
      userGenerated: summaries.reduce((sum, s) => sum + s.userGenerated, 0),
      avgPerDay: Math.round(summaries.reduce((sum, s) => sum + s.totalActivities, 0) / days),
      dailyBreakdown: summaries.map(s => ({
        date: s.date,
        total: s.totalActivities,
        systemGenerated: s.systemGenerated,
        userGenerated: s.userGenerated,
      })),
    };
    
    // Merge category, priority, and user stats
    const actionCounts = new Map<string, number>();
    
    for (const summary of summaries) {
      // Categories
      for (const [category, count] of Object.entries(summary.byCategory)) {
        aggregated.byCategory[category] = (aggregated.byCategory[category] || 0) + count;
      }
      
      // Priorities
      for (const [priority, count] of Object.entries(summary.byPriority)) {
        aggregated.byPriority[priority] = (aggregated.byPriority[priority] || 0) + count;
      }
      
      // Users
      for (const [user, count] of Object.entries(summary.byUser)) {
        aggregated.byUser[user] = (aggregated.byUser[user] || 0) + count;
      }
      
      // Actions
      for (const action of summary.topActions) {
        actionCounts.set(action.action, (actionCounts.get(action.action) || 0) + action.count);
      }
    }
    
    // Top actions across all days
    aggregated.topActions = Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return aggregated;
  },
});

/**
 * Optimize database by cleaning up orphaned references
 */
export const cleanupOrphanedActivities = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;
    
    console.log("Starting cleanup of orphaned activity references...");
    
    // Get activities with contact references
    const activitiesWithContacts = await ctx.db
      .query("activityLog")
      .withIndex("by_contact")
      .take(batchSize);
    
    let cleanupCount = 0;
    
    for (const activity of activitiesWithContacts) {
      if (activity.contactId) {
        const contact = await ctx.db.get(activity.contactId);
        if (!contact) {
          // Contact no longer exists, remove reference
          await ctx.db.patch(activity._id, { contactId: undefined });
          cleanupCount++;
        }
      }
    }
    
    // Similar cleanup for deals, campaigns, etc.
    const activitiesWithDeals = await ctx.db
      .query("activityLog")
      .withIndex("by_deal")
      .take(batchSize);
    
    for (const activity of activitiesWithDeals) {
      if (activity.dealId) {
        const deal = await ctx.db.get(activity.dealId);
        if (!deal) {
          await ctx.db.patch(activity._id, { dealId: undefined });
          cleanupCount++;
        }
      }
    }
    
    console.log(`Cleaned up ${cleanupCount} orphaned references`);
    return { cleanupCount };
  },
});

/**
 * Performance health check
 */
export const performHealthCheck = internalAction({
  args: {
    clientId: v.optional(v.id("clients")),
  },
  handler: async (ctx, args) => {
    const health = {
      timestamp: Date.now(),
      status: "healthy" as "healthy" | "warning" | "critical",
      metrics: {
        totalActivities: 0,
        oldActivities: 0,
        orphanedActivities: 0,
        avgQueryTime: 0,
        cacheHitRate: 0,
      },
      recommendations: [] as string[],
    };
    
    try {
      // Check total activity count
      const startTime = Date.now();
      const recentActivities = await ctx.runQuery(internal.activityLogger.getClientActivities, {
        clientId: args.clientId || "k123456789" as any, // Use a sample client if none provided
        limit: 1000,
      });
      health.metrics.avgQueryTime = Date.now() - startTime;
      health.metrics.totalActivities = recentActivities?.length || 0;
      
      // Check for old activities (>6 months)
      const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);
      const oldActivities = await ctx.runQuery(internal.activityLogger.getClientActivities, {
        clientId: args.clientId || "k123456789" as any,
        since: 0,
        limit: 10000,
      });
      
      if (oldActivities) {
        health.metrics.oldActivities = oldActivities.filter(a => a.timestamp < sixMonthsAgo).length;
      }
      
      // Performance recommendations
      if (health.metrics.totalActivities > 10000) {
        health.recommendations.push("Consider archiving old activities to improve query performance");
        health.status = "warning";
      }
      
      if (health.metrics.avgQueryTime > 1000) {
        health.recommendations.push("Query time is high, consider optimizing indexes or archiving data");
        health.status = "warning";
      }
      
      if (health.metrics.oldActivities > 5000) {
        health.recommendations.push("Large number of old activities detected, archiving recommended");
        health.status = "warning";
      }
      
      // Check for missing daily summaries
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const cachedStats = await ctx.runQuery(internal.activityPerformanceOptimizer.getCachedClientStats, {
        clientId: args.clientId || "k123456789" as any,
        days: 1,
      });
      
      if (!cachedStats) {
        health.recommendations.push("No cached summaries found, consider generating daily summaries for better performance");
      } else {
        health.metrics.cacheHitRate = 100; // We have cached data
      }
      
    } catch (error) {
      console.error("Health check failed:", error);
      health.status = "critical";
      health.recommendations.push("System health check failed, manual investigation required");
    }
    
    return health;
  },
});