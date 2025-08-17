import { v } from "convex/values";
import { internalMutation, internalQuery, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * ACTIVITY SECURITY AUDITOR
 * Detecteert verdachte patronen in activity logs en voorkomt abuse
 */

// Security patterns to detect
const SUSPICIOUS_PATTERNS = {
  // Bulk operations that might indicate automation abuse
  BULK_CONTACT_CREATION: {
    action: "contact_created",
    threshold: 50, // 50+ contacts in 5 minutes
    timeWindow: 5 * 60 * 1000,
  },
  
  BULK_DEAL_CREATION: {
    action: "deal_created", 
    threshold: 20, // 20+ deals in 5 minutes
    timeWindow: 5 * 60 * 1000,
  },
  
  // Excessive updates that might indicate API abuse
  EXCESSIVE_UPDATES: {
    actions: ["contact_updated", "deal_updated", "campaign_updated"],
    threshold: 100, // 100+ updates in 10 minutes
    timeWindow: 10 * 60 * 1000,
  },
  
  // Suspicious login patterns
  RAPID_LOGINS: {
    action: "login",
    threshold: 10, // 10+ logins in 1 minute
    timeWindow: 60 * 1000,
  },
} as const;

/**
 * Security audit check - runs after each activity log
 */
export const performSecurityAudit = internalAction({
  args: {
    clientId: v.id("clients"),
    userId: v.optional(v.string()),
    action: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      const now = args.timestamp;
      
      // Check for bulk contact creation abuse
      if (args.action === SUSPICIOUS_PATTERNS.BULK_CONTACT_CREATION.action) {
        const recentActivities = await ctx.runQuery(internal.activitySecurityAuditor.getRecentActivitiesByAction, {
          clientId: args.clientId,
          userId: args.userId,
          action: args.action,
          since: now - SUSPICIOUS_PATTERNS.BULK_CONTACT_CREATION.timeWindow,
        });
        
        if (recentActivities.length >= SUSPICIOUS_PATTERNS.BULK_CONTACT_CREATION.threshold) {
          await ctx.runMutation(internal.activitySecurityAuditor.reportSecurityIncident, {
            type: "bulk_contact_creation_abuse",
            severity: "medium",
            clientId: args.clientId,
            userId: args.userId,
            evidence: {
              pattern: "BULK_CONTACT_CREATION",
              count: recentActivities.length,
              threshold: SUSPICIOUS_PATTERNS.BULK_CONTACT_CREATION.threshold,
              timeWindow: SUSPICIOUS_PATTERNS.BULK_CONTACT_CREATION.timeWindow,
              activities: recentActivities.map(a => a._id),
            },
          });
        }
      }
      
      // Check for excessive updates
      if (SUSPICIOUS_PATTERNS.EXCESSIVE_UPDATES.actions.includes(args.action)) {
        const recentUpdates = await ctx.runQuery(internal.activitySecurityAuditor.getRecentUpdateActivities, {
          clientId: args.clientId,
          userId: args.userId,
          since: now - SUSPICIOUS_PATTERNS.EXCESSIVE_UPDATES.timeWindow,
        });
        
        if (recentUpdates.length >= SUSPICIOUS_PATTERNS.EXCESSIVE_UPDATES.threshold) {
          await ctx.runMutation(internal.activitySecurityAuditor.reportSecurityIncident, {
            type: "excessive_update_activity",
            severity: "high",
            clientId: args.clientId,
            userId: args.userId,
            evidence: {
              pattern: "EXCESSIVE_UPDATES",
              count: recentUpdates.length,
              threshold: SUSPICIOUS_PATTERNS.EXCESSIVE_UPDATES.threshold,
              updateTypes: recentUpdates.reduce((acc, a) => {
                acc[a.action] = (acc[a.action] || 0) + 1;
                return acc;
              }, {} as Record<string, number>),
            },
          });
        }
      }
      
      // Check for rapid login abuse
      if (args.action === SUSPICIOUS_PATTERNS.RAPID_LOGINS.action) {
        const recentLogins = await ctx.runQuery(internal.activitySecurityAuditor.getRecentActivitiesByAction, {
          clientId: args.clientId,
          userId: args.userId,
          action: args.action,
          since: now - SUSPICIOUS_PATTERNS.RAPID_LOGINS.timeWindow,
        });
        
        if (recentLogins.length >= SUSPICIOUS_PATTERNS.RAPID_LOGINS.threshold) {
          await ctx.runMutation(internal.activitySecurityAuditor.reportSecurityIncident, {
            type: "rapid_login_attempts",
            severity: "critical",
            clientId: args.clientId,
            userId: args.userId,
            evidence: {
              pattern: "RAPID_LOGINS",
              count: recentLogins.length,
              threshold: SUSPICIOUS_PATTERNS.RAPID_LOGINS.threshold,
              loginTimes: recentLogins.map(a => a.timestamp),
            },
          });
        }
      }
      
    } catch (error) {
      console.error("Security audit failed:", error);
      // Don't throw - security audit should not break main operations
    }
  },
});

/**
 * Get recent activities by action for pattern detection
 */
export const getRecentActivitiesByAction = internalQuery({
  args: {
    clientId: v.id("clients"),
    userId: v.optional(v.string()),
    action: v.string(),
    since: v.number(),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("activityLog")
      .withIndex("by_client_timestamp", q => 
        q.eq("clientId", args.clientId).gte("timestamp", args.since)
      )
      .filter(q => q.eq(q.field("action"), args.action));
    
    if (args.userId) {
      query = query.filter(q => q.eq(q.field("userId"), args.userId));
    }
    
    return await query.collect();
  },
});

/**
 * Get recent update activities (contact_updated, deal_updated, etc.)
 */
export const getRecentUpdateActivities = internalQuery({
  args: {
    clientId: v.id("clients"),
    userId: v.optional(v.string()),
    since: v.number(),
  },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activityLog")
      .withIndex("by_client_timestamp", q => 
        q.eq("clientId", args.clientId).gte("timestamp", args.since)
      )
      .collect();
    
    return activities.filter(activity => {
      if (args.userId && activity.userId !== args.userId) return false;
      return SUSPICIOUS_PATTERNS.EXCESSIVE_UPDATES.actions.includes(activity.action);
    });
  },
});

/**
 * Report a security incident
 */
export const reportSecurityIncident = internalMutation({
  args: {
    type: v.string(),
    severity: v.string(),
    clientId: v.id("clients"),
    userId: v.optional(v.string()),
    evidence: v.any(),
  },
  handler: async (ctx, args) => {
    const incidentId = `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const incident = await ctx.db.insert("securityIncidents", {
      incidentId,
      type: args.type,
      severity: args.severity,
      description: `Activity pattern security incident: ${args.type}`,
      sourceIp: "internal", // Activity-based, not IP-based
      userAgent: undefined,
      status: "detected",
      detectedAt: Date.now(),
      evidence: {
        ...args.evidence,
        clientId: args.clientId,
        userId: args.userId,
      },
    });
    
    console.warn(`🚨 Security incident detected: ${args.type}`, {
      incidentId,
      clientId: args.clientId,
      userId: args.userId,
      severity: args.severity,
      evidence: args.evidence,
    });
    
    // For critical incidents, we might want to trigger alerts
    if (args.severity === "critical") {
      // Could trigger email alerts, webhooks, etc.
      console.error(`🚨 CRITICAL SECURITY INCIDENT: ${incidentId}`, args.evidence);
    }
    
    return incident;
  },
});

/**
 * Get security incidents for monitoring
 */
export const getSecurityIncidents = internalQuery({
  args: {
    clientId: v.optional(v.id("clients")),
    severity: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("securityIncidents");
    
    if (args.severity) {
      query = query.withIndex("by_severity", q => q.eq("severity", args.severity));
    } else if (args.status) {
      query = query.withIndex("by_status", q => q.eq("status", args.status));
    } else {
      query = query.withIndex("by_detected_at");
    }
    
    const incidents = await query
      .order("desc")
      .take(args.limit || 50);
    
    // Filter by clientId if provided (since we can't do this in the index easily)
    if (args.clientId) {
      return incidents.filter(incident => 
        incident.evidence?.clientId === args.clientId
      );
    }
    
    return incidents;
  },
});

/**
 * Auto-resolve incidents after investigation period
 */
export const autoResolveOldIncidents = internalMutation({
  args: {
    maxAgeHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxAge = args.maxAgeHours || 72; // Default 72 hours
    const cutoffTime = Date.now() - (maxAge * 60 * 60 * 1000);
    
    const oldIncidents = await ctx.db
      .query("securityIncidents")
      .withIndex("by_detected_at", q => q.lt("detectedAt", cutoffTime))
      .filter(q => q.eq(q.field("status"), "detected"))
      .collect();
    
    let resolvedCount = 0;
    for (const incident of oldIncidents) {
      await ctx.db.patch(incident._id, {
        status: "auto_resolved",
        resolvedAt: Date.now(),
      });
      resolvedCount++;
    }
    
    console.log(`Auto-resolved ${resolvedCount} old security incidents`);
    return { resolvedCount };
  },
});

/**
 * Data quality audit - check for suspicious data patterns
 */
export const auditDataQuality = internalAction({
  args: {
    clientId: v.id("clients"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 7;
    const since = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const activities = await ctx.runQuery(internal.activityLogger.getClientActivities, {
      clientId: args.clientId,
      since,
      limit: 1000,
    });
    
    const issues = [];
    
    // Check for activities without proper related entities
    const orphanedActivities = activities.filter(activity => {
      if (activity.category === "contact" && !activity.contactId) return true;
      if (activity.category === "deal" && !activity.dealId) return true;
      if (activity.category === "campaign" && !activity.campaignId) return true;
      return false;
    });
    
    if (orphanedActivities.length > 0) {
      issues.push({
        type: "orphaned_activities",
        severity: "medium",
        count: orphanedActivities.length,
        description: `${orphanedActivities.length} activities have category but missing related entity ID`,
        activities: orphanedActivities.slice(0, 10).map(a => a._id),
      });
    }
    
    // Check for suspicious descriptions (empty, too long, suspicious patterns)
    const suspiciousDescriptions = activities.filter(activity => {
      if (!activity.description || activity.description.trim().length === 0) return true;
      if (activity.description.length > 500) return true;
      if (activity.description.includes('<script>') || activity.description.includes('javascript:')) return true;
      return false;
    });
    
    if (suspiciousDescriptions.length > 0) {
      issues.push({
        type: "suspicious_descriptions",
        severity: "high",
        count: suspiciousDescriptions.length,
        description: `${suspiciousDescriptions.length} activities have suspicious or invalid descriptions`,
        activities: suspiciousDescriptions.slice(0, 10).map(a => a._id),
      });
    }
    
    // Check for high frequency of system-generated activities (might indicate loop or bug)
    const systemActivities = activities.filter(a => a.isSystemGenerated);
    const systemActivityRate = systemActivities.length / activities.length;
    
    if (systemActivityRate > 0.8 && activities.length > 100) {
      issues.push({
        type: "excessive_system_activities",
        severity: "medium",
        count: systemActivities.length,
        rate: Math.round(systemActivityRate * 100),
        description: `${Math.round(systemActivityRate * 100)}% of activities are system-generated, which might indicate automation issues`,
      });
    }
    
    return {
      clientId: args.clientId,
      auditPeriod: `${days} days`,
      totalActivities: activities.length,
      issuesFound: issues.length,
      issues,
      auditedAt: Date.now(),
    };
  },
});