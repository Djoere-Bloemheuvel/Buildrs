import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * CENTRAAL ACTIVITY LOGGING SYSTEEM
 * Houdt alle belangrijke CRM acties bij op account- en contact-niveau
 */

// Activity types voor verschillende CRM acties
export const ACTIVITY_TYPES = {
  // Contact Management
  CONTACT_CREATED: "contact_created",
  CONTACT_UPDATED: "contact_updated", 
  CONTACT_DELETED: "contact_deleted",
  CONTACT_STATUS_CHANGED: "contact_status_changed",
  CONTACT_TAGGED: "contact_tagged",
  CONTACT_ENRICHED: "contact_enriched",

  // Campaign Management
  CAMPAIGN_CREATED: "campaign_created",
  CAMPAIGN_UPDATED: "campaign_updated",
  CAMPAIGN_STARTED: "campaign_started",
  CAMPAIGN_PAUSED: "campaign_paused",
  CAMPAIGN_STOPPED: "campaign_stopped",
  CAMPAIGN_CONTACT_ADDED: "campaign_contact_added",
  CAMPAIGN_CONTACT_REMOVED: "campaign_contact_removed",

  // Deal Management
  DEAL_CREATED: "deal_created",
  DEAL_UPDATED: "deal_updated",
  DEAL_STAGE_CHANGED: "deal_stage_changed",
  DEAL_WON: "deal_won",
  DEAL_LOST: "deal_lost",
  DEAL_REOPENED: "deal_reopened",
  DEAL_VALUE_CHANGED: "deal_value_changed",

  // Communication Events
  EMAIL_SENT: "email_sent",
  EMAIL_RECEIVED: "email_received",
  EMAIL_OPENED: "email_opened",
  EMAIL_CLICKED: "email_clicked",
  EMAIL_REPLIED: "email_replied",
  LINKEDIN_MESSAGE_SENT: "linkedin_message_sent",
  LINKEDIN_CONNECTION_SENT: "linkedin_connection_sent",
  LINKEDIN_CONNECTION_ACCEPTED: "linkedin_connection_accepted",
  PHONE_CALL_MADE: "phone_call_made",
  PHONE_CALL_RECEIVED: "phone_call_received",
  MEETING_SCHEDULED: "meeting_scheduled",
  MEETING_COMPLETED: "meeting_completed",

  // Task & Project Management
  TASK_CREATED: "task_created",
  TASK_COMPLETED: "task_completed",
  TASK_ASSIGNED: "task_assigned",
  NOTE_ADDED: "note_added",
  
  // Account Management
  ACCOUNT_CREATED: "account_created",
  ACCOUNT_UPDATED: "account_updated",
  USER_INVITED: "user_invited",
  USER_REMOVED: "user_removed",
  
  // Data Management
  IMPORT_COMPLETED: "import_completed",
  EXPORT_COMPLETED: "export_completed",
  DATA_SYNC: "data_sync",
  
  // Automation
  AUTOMATION_TRIGGERED: "automation_triggered",
  AUTOMATION_COMPLETED: "automation_completed",
  WORKFLOW_EXECUTED: "workflow_executed",

  // System Events
  LOGIN: "login",
  LOGOUT: "logout",
  SETTINGS_CHANGED: "settings_changed",
  INTEGRATION_CONNECTED: "integration_connected",
  INTEGRATION_DISCONNECTED: "integration_disconnected",
} as const;

type ActivityType = typeof ACTIVITY_TYPES[keyof typeof ACTIVITY_TYPES];

/**
 * Log een activity - dit is de hoofdfunctie die overal gebruikt wordt
 */
export const logActivity = mutation({
  args: {
    // Core identifiers
    clientId: v.id("clients"),
    userId: v.optional(v.string()), // Clerk user ID of system
    
    // Activity details
    action: v.string(), // ACTIVITY_TYPES value
    description: v.string(), // Human readable description
    
    // Related entities (optional)
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    dealId: v.optional(v.id("deals")),
    campaignId: v.optional(v.id("campaigns")),
    taskId: v.optional(v.id("tasks")),
    projectId: v.optional(v.id("projects")),
    noteId: v.optional(v.id("notes")),
    
    // Additional metadata
    metadata: v.optional(v.any()),
    
    // Auto-categorization
    category: v.optional(v.string()), // "contact", "deal", "campaign", "system", etc.
    priority: v.optional(v.string()), // "low", "medium", "high", "critical"
    isSystemGenerated: v.optional(v.boolean()),
    
    // Custom timestamp (defaults to now)
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const now = Date.now();
      
      // Validate required fields
      if (!args.clientId) {
        throw new Error("Client ID is required");
      }
      
      if (!args.action || args.action.trim().length === 0) {
        throw new Error("Action is required");
      }
      
      if (!args.description || args.description.trim().length === 0) {
        throw new Error("Description is required");
      }
      
      // Auto-determine category if not provided
      let category = args.category;
      if (!category) {
        if (args.contactId) category = "contact";
        else if (args.dealId) category = "deal";
        else if (args.campaignId) category = "campaign";
        else if (args.companyId) category = "company";
        else if (args.taskId || args.projectId) category = "project";
        else category = "system";
      }
      
      // Auto-determine priority based on action type
      let priority = args.priority || "medium";
      if (args.action.includes("created") || args.action.includes("won") || args.action.includes("lost")) {
        priority = "high";
      } else if (args.action.includes("opened") || args.action.includes("clicked")) {
        priority = "low";
      }
      
      // Validate that related entities exist and belong to client
      if (args.contactId) {
        const contact = await ctx.db.get(args.contactId);
        if (!contact || contact.clientId !== args.clientId) {
          throw new Error("Contact not found or doesn't belong to client");
        }
      }
      
      if (args.dealId) {
        const deal = await ctx.db.get(args.dealId);
        if (!deal || deal.clientId !== args.clientId) {
          throw new Error("Deal not found or doesn't belong to client");
        }
      }
      
      if (args.campaignId) {
        const campaign = await ctx.db.get(args.campaignId);
        if (!campaign || campaign.clientId !== args.clientId) {
          throw new Error("Campaign not found or doesn't belong to client");
        }
      }
      
      // Create the activity log entry
      const activityId = await ctx.db.insert("activityLog", {
        clientId: args.clientId,
        userId: args.userId,
        action: args.action,
        description: args.description.trim(),
        contactId: args.contactId,
        companyId: args.companyId,
        dealId: args.dealId,
        campaignId: args.campaignId,
        taskId: args.taskId,
        projectId: args.projectId,
        noteId: args.noteId,
        metadata: args.metadata,
        category,
        priority,
        isSystemGenerated: args.isSystemGenerated || false,
        timestamp: args.timestamp || now,
        createdAt: now,
      });
      
      console.log(`Activity logged: ${args.action} for client ${args.clientId}`, {
        activityId,
        contactId: args.contactId,
        dealId: args.dealId,
        campaignId: args.campaignId,
      });
      
      return activityId;
    } catch (error) {
      console.error("Failed to log activity:", error);
      throw error;
    }
  },
});

/**
 * Bulk log multiple activities (voor import/sync operaties)
 */
export const logBulkActivities = mutation({
  args: {
    activities: v.array(v.object({
      clientId: v.id("clients"),
      userId: v.optional(v.string()),
      action: v.string(),
      description: v.string(),
      contactId: v.optional(v.id("contacts")),
      companyId: v.optional(v.id("companies")),
      dealId: v.optional(v.id("deals")),
      campaignId: v.optional(v.id("campaigns")),
      metadata: v.optional(v.any()),
      category: v.optional(v.string()),
      priority: v.optional(v.string()),
      timestamp: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    try {
      const activityIds = [];
      const now = Date.now();
      
      for (const activity of args.activities) {
        const activityId = await ctx.db.insert("activityLog", {
          ...activity,
          description: activity.description.trim(),
          category: activity.category || "system",
          priority: activity.priority || "medium",
          isSystemGenerated: true,
          timestamp: activity.timestamp || now,
          createdAt: now,
        });
        
        activityIds.push(activityId);
      }
      
      console.log(`Bulk logged ${activityIds.length} activities`);
      return activityIds;
    } catch (error) {
      console.error("Failed to bulk log activities:", error);
      throw error;
    }
  },
});

/**
 * Get activities voor een specifiek contact
 */
export const getContactActivities = query({
  args: {
    clientId: v.id("clients"),
    contactId: v.id("contacts"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    category: v.optional(v.string()),
    since: v.optional(v.number()), // timestamp
  },
  handler: async (ctx, args) => {
    try {
      const limit = Math.min(args.limit || 50, 200); // Max 200 items
      
      let query = ctx.db
        .query("activityLog")
        .withIndex("by_contact", q => q.eq("contactId", args.contactId))
        .filter(q => q.eq(q.field("clientId"), args.clientId));
      
      if (args.category) {
        query = query.filter(q => q.eq(q.field("category"), args.category));
      }
      
      if (args.since) {
        query = query.filter(q => q.gte(q.field("timestamp"), args.since));
      }
      
      const activities = await query
        .order("desc")
        .take(limit);
      
      // Enrich with user information
      const enrichedActivities = [];
      for (const activity of activities) {
        let userName = "System";
        if (activity.userId) {
          // In een echte implementatie zou je hier de user info ophalen
          // uit Clerk of een users table
          userName = "User"; // Placeholder
        }
        
        enrichedActivities.push({
          ...activity,
          userName,
          timeAgo: formatTimeAgo(activity.timestamp),
        });
      }
      
      return enrichedActivities;
    } catch (error) {
      console.error("Failed to get contact activities:", error);
      throw error;
    }
  },
});

/**
 * Get activities voor een hele account/client
 */
export const getClientActivities = query({
  args: {
    clientId: v.id("clients"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    category: v.optional(v.string()),
    priority: v.optional(v.string()),
    since: v.optional(v.number()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const limit = Math.min(args.limit || 50, 200);
      
      let query = ctx.db
        .query("activityLog")
        .withIndex("by_client", q => q.eq("clientId", args.clientId));
      
      if (args.category) {
        query = query.filter(q => q.eq(q.field("category"), args.category));
      }
      
      if (args.priority) {
        query = query.filter(q => q.eq(q.field("priority"), args.priority));
      }
      
      if (args.userId) {
        query = query.filter(q => q.eq(q.field("userId"), args.userId));
      }
      
      if (args.since) {
        query = query.filter(q => q.gte(q.field("timestamp"), args.since));
      }
      
      const activities = await query
        .order("desc")
        .take(limit);
      
      // Enrich activities met gerelateerde data
      const enrichedActivities = [];
      for (const activity of activities) {
        let relatedEntity = null;
        
        // Load gerelateerde entiteit voor context
        if (activity.contactId) {
          const contact = await ctx.db.get(activity.contactId);
          if (contact) {
            relatedEntity = {
              type: "contact",
              name: `${contact.firstName} ${contact.lastName}`.trim(),
              email: contact.email,
            };
          }
        } else if (activity.dealId) {
          const deal = await ctx.db.get(activity.dealId);
          if (deal) {
            relatedEntity = {
              type: "deal",
              name: deal.title,
              value: deal.value,
            };
          }
        } else if (activity.campaignId) {
          const campaign = await ctx.db.get(activity.campaignId);
          if (campaign) {
            relatedEntity = {
              type: "campaign",
              name: campaign.name,
            };
          }
        }
        
        enrichedActivities.push({
          ...activity,
          relatedEntity,
          timeAgo: formatTimeAgo(activity.timestamp),
        });
      }
      
      return enrichedActivities;
    } catch (error) {
      console.error("Failed to get client activities:", error);
      throw error;
    }
  },
});

/**
 * Get activity statistics voor dashboard
 */
export const getActivityStats = query({
  args: {
    clientId: v.id("clients"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const days = args.days || 30;
      const since = Date.now() - (days * 24 * 60 * 60 * 1000);
      
      const activities = await ctx.db
        .query("activityLog")
        .withIndex("by_client", q => q.eq("clientId", args.clientId))
        .filter(q => q.gte(q.field("timestamp"), since))
        .collect();
      
      const stats = {
        totalActivities: activities.length,
        byCategory: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        byUser: {} as Record<string, number>,
        byDay: {} as Record<string, number>,
        topActions: [] as Array<{ action: string; count: number }>,
        avgPerDay: Math.round(activities.length / days),
      };
      
      // Aggregate statistics
      const actionCounts = new Map<string, number>();
      
      for (const activity of activities) {
        // By category
        stats.byCategory[activity.category || "unknown"] = 
          (stats.byCategory[activity.category || "unknown"] || 0) + 1;
        
        // By priority
        stats.byPriority[activity.priority || "medium"] = 
          (stats.byPriority[activity.priority || "medium"] || 0) + 1;
        
        // By user
        const user = activity.userId || "system";
        stats.byUser[user] = (stats.byUser[user] || 0) + 1;
        
        // By day
        const day = new Date(activity.timestamp).toISOString().split('T')[0];
        stats.byDay[day] = (stats.byDay[day] || 0) + 1;
        
        // Action counts
        actionCounts.set(activity.action, (actionCounts.get(activity.action) || 0) + 1);
      }
      
      // Top actions
      stats.topActions = Array.from(actionCounts.entries())
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      return stats;
    } catch (error) {
      console.error("Failed to get activity stats:", error);
      throw error;
    }
  },
});

/**
 * Helper functions
 */

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/**
 * Internal functions voor system-generated activities
 */

export const logSystemActivity = internalMutation({
  args: {
    clientId: v.id("clients"),
    action: v.string(),
    description: v.string(),
    contactId: v.optional(v.id("contacts")),
    dealId: v.optional(v.id("deals")),
    campaignId: v.optional(v.id("campaigns")),
    metadata: v.optional(v.any()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activityLog", {
      ...args,
      userId: undefined, // System generated
      isSystemGenerated: true,
      priority: "medium",
      timestamp: Date.now(),
      createdAt: Date.now(),
    });
  },
});

/**
 * INTERNAL ACTIVITY LOGGER - Voor gebruik vanuit andere mutations
 * Dit is de functie die gebruikt moet worden vanuit contacts.ts, deals.ts, etc.
 */
export const logActivityInternal = internalMutation({
  args: {
    // Core identifiers
    clientId: v.id("clients"),
    userId: v.optional(v.string()), // Clerk user ID of system
    
    // Activity details
    action: v.string(), // ACTIVITY_TYPES value
    description: v.string(), // Human readable description
    
    // Related entities (optional)
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    dealId: v.optional(v.id("deals")),
    campaignId: v.optional(v.id("campaigns")),
    taskId: v.optional(v.id("tasks")),
    projectId: v.optional(v.id("projects")),
    noteId: v.optional(v.id("notes")),
    
    // Additional metadata
    metadata: v.optional(v.any()),
    
    // Auto-categorization
    category: v.optional(v.string()), // "contact", "deal", "campaign", "system", etc.
    priority: v.optional(v.string()), // "low", "medium", "high", "critical"
    isSystemGenerated: v.optional(v.boolean()),
    
    // Custom timestamp (defaults to now)
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const now = Date.now();
      
      // Validate required fields
      if (!args.clientId) {
        throw new Error("Client ID is required");
      }
      
      if (!args.action || args.action.trim().length === 0) {
        throw new Error("Action is required");
      }
      
      if (!args.description || args.description.trim().length === 0) {
        throw new Error("Description is required");
      }
      
      // Auto-determine category if not provided
      let category = args.category;
      if (!category) {
        if (args.contactId) category = "contact";
        else if (args.dealId) category = "deal";
        else if (args.campaignId) category = "campaign";
        else if (args.companyId) category = "company";
        else if (args.taskId || args.projectId) category = "project";
        else category = "system";
      }
      
      // Auto-determine priority based on action type
      let priority = args.priority || "medium";
      if (args.action.includes("created") || args.action.includes("won") || args.action.includes("lost")) {
        priority = "high";
      } else if (args.action.includes("opened") || args.action.includes("clicked")) {
        priority = "low";
      }
      
      // Create the activity log entry
      const activityId = await ctx.db.insert("activityLog", {
        clientId: args.clientId,
        userId: args.userId,
        action: args.action,
        description: args.description.trim(),
        contactId: args.contactId,
        companyId: args.companyId,
        dealId: args.dealId,
        campaignId: args.campaignId,
        taskId: args.taskId,
        projectId: args.projectId,
        noteId: args.noteId,
        metadata: args.metadata,
        category,
        priority,
        isSystemGenerated: args.isSystemGenerated || false,
        timestamp: args.timestamp || now,
        createdAt: now,
      });
      
      console.log(`Activity logged: ${args.action} for client ${args.clientId}`, {
        activityId,
        contactId: args.contactId,
        dealId: args.dealId,
        campaignId: args.campaignId,
      });
      
      // Run security audit in background (don't await to avoid slowing down main operation)
      ctx.runAction(internal.activitySecurityAuditor.performSecurityAudit, {
        clientId: args.clientId,
        userId: args.userId,
        action: args.action,
        timestamp: args.timestamp || now,
      }).catch(error => {
        console.error("Security audit failed (non-blocking):", error);
      });
      
      return activityId;
    } catch (error) {
      console.error("Failed to log activity internally:", error);
      // Don't throw - we don't want activity logging to break main operations
      return null;
    }
  },
});

/**
 * Cleanup oude activities (run via cron)
 */
export const cleanupOldActivities = internalMutation({
  args: {
    maxAgeMonths: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxAge = args.maxAgeMonths || 12; // Default 12 maanden
    const cutoffDate = Date.now() - (maxAge * 30 * 24 * 60 * 60 * 1000);
    
    console.log(`Cleaning up activities older than ${maxAge} months...`);
    
    const oldActivities = await ctx.db
      .query("activityLog")
      .filter(q => q.lt(q.field("timestamp"), cutoffDate))
      .collect();
    
    let deletedCount = 0;
    for (const activity of oldActivities) {
      await ctx.db.delete(activity._id);
      deletedCount++;
    }
    
    console.log(`Cleaned up ${deletedCount} old activities`);
    return { deletedCount };
  },
});

/**
 * Export activity log voor compliance/backup
 */
export const exportActivities = query({
  args: {
    clientId: v.id("clients"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    format: v.optional(v.string()), // "json" or "csv"
  },
  handler: async (ctx, args) => {
    try {
      let query = ctx.db
        .query("activityLog")
        .withIndex("by_client", q => q.eq("clientId", args.clientId));
      
      if (args.startDate) {
        query = query.filter(q => q.gte(q.field("timestamp"), args.startDate));
      }
      
      if (args.endDate) {
        query = query.filter(q => q.lte(q.field("timestamp"), args.endDate));
      }
      
      const activities = await query.collect();
      
      // Format voor export
      const exportData = activities.map(activity => ({
        id: activity._id,
        timestamp: new Date(activity.timestamp).toISOString(),
        action: activity.action,
        description: activity.description,
        category: activity.category,
        priority: activity.priority,
        userId: activity.userId,
        isSystemGenerated: activity.isSystemGenerated,
        contactId: activity.contactId,
        dealId: activity.dealId,
        campaignId: activity.campaignId,
        metadata: activity.metadata,
      }));
      
      return {
        activities: exportData,
        count: exportData.length,
        exportedAt: new Date().toISOString(),
        clientId: args.clientId,
      };
    } catch (error) {
      console.error("Failed to export activities:", error);
      throw error;
    }
  },
});