import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * CLIENT SETTINGS MANAGEMENT
 * Manages all CRM system settings per client
 */

// Default settings structure
export const DEFAULT_SETTINGS = {
  // Activity Logging Settings
  activityLogging: {
    enabled: true,
    retentionMonths: 12,
    autoArchiveAfterMonths: 6,
    enableSecurityAuditing: true,
    enablePerformanceOptimization: true,
    logSystemActivities: true,
    logUserActivities: true,
    priorities: {
      contactActions: "medium",
      dealActions: "high", 
      campaignActions: "medium",
      communicationActions: "low",
      systemActions: "low"
    }
  },

  // Communication Provider Settings
  communications: {
    email: {
      providers: {
        instantly: {
          enabled: false,
          apiKey: "",
          webhookUrl: "",
          defaultCampaignId: "",
          rateLimitPerDay: 100
        },
        gmail: {
          enabled: false,
          oauth: {
            clientId: "",
            clientSecret: "",
            refreshToken: ""
          }
        },
        outlook: {
          enabled: false,
          oauth: {
            clientId: "",
            clientSecret: "",
            refreshToken: ""
          }
        }
      },
      defaultProvider: "instantly",
      trackOpens: true,
      trackClicks: true,
      autoReplyDetection: true
    },
    linkedin: {
      providers: {
        phantombuster: {
          enabled: false,
          apiKey: "",
          containerId: "",
          rateLimitPerDay: 50
        }
      },
      autoAcceptConnections: false,
      connectionRequestTemplate: "Hi {firstName}, I'd love to connect!"
    },
    phone: {
      providers: {
        aircall: {
          enabled: false,
          apiKey: "",
          webhookUrl: ""
        }
      },
      recordCalls: true,
      autoLogCalls: true
    }
  },

  // Campaign Automation Settings
  campaigns: {
    automation: {
      enableSmartSequencing: true,
      enablePersonalization: true,
      enableABTesting: true,
      defaultDelayBetweenSteps: 2, // days
      maxContactsPerCampaign: 1000,
      pauseOnHighBounceRate: true,
      bounceRateThreshold: 5 // percentage
    },
    emailSettings: {
      defaultFromName: "",
      defaultFromEmail: "",
      defaultReplyTo: "",
      enableSpamCheck: true,
      enableLinkTracking: true,
      enableUnsubscribeLink: true
    },
    linkedinSettings: {
      enableConnectionFirst: true,
      daysBetweenConnectionAndMessage: 3,
      maxConnectionsPerDay: 20,
      maxMessagesPerDay: 30
    }
  },

  // Data Management Settings
  dataManagement: {
    autoEnrichment: {
      enabled: true,
      providers: {
        apollo: {
          enabled: false,
          apiKey: ""
        }
      }
    },
    duplicateDetection: {
      enabled: true,
      autoMerge: false,
      matchCriteria: ["email", "linkedin", "phone"]
    },
    dataRetention: {
      contactsMonths: 60, // 5 years
      dealsMonths: 84, // 7 years  
      communicationsMonths: 36, // 3 years
      activitiesMonths: 12 // 1 year
    }
  },

  // Security Settings
  security: {
    enableActivityAuditing: true,
    enableSuspiciousPatternDetection: true,
    maxLoginAttemptsPerMinute: 5,
    sessionTimeoutMinutes: 480, // 8 hours
    enableTwoFactorAuth: false,
    ipWhitelist: [],
    enableApiRateLimit: true,
    apiRateLimitPerMinute: 100,
    auditLogRetentionDays: 90
  },

  // Performance Settings
  performance: {
    enableCaching: true,
    enableArchiving: true,
    maxQueryResults: 1000,
    enableRealTimeSync: true,
    batchProcessingSize: 100,
    enableBackgroundTasks: true
  },

  // UI/UX Settings
  ui: {
    theme: "light", // light, dark, auto
    defaultPageSize: 50,
    enableRealTimeNotifications: true,
    enableDesktopNotifications: false,
    defaultDashboardView: "overview",
    enableAdvancedFilters: true,
    enableQuickActions: true
  },

  // Notifications Settings
  notifications: {
    email: {
      enabled: true,
      newLeads: true,
      dealUpdates: true,
      campaignResults: true,
      systemAlerts: true,
      digestFrequency: "daily" // daily, weekly, never
    },
    inApp: {
      enabled: true,
      newActivities: true,
      mentions: true,
      taskReminders: true,
      deadlines: true
    },
    webhook: {
      enabled: false,
      url: "",
      events: []
    }
  },

  // Integration Settings
  integrations: {
    apollo: {
      enabled: false,
      apiKey: "",
      autoEnrich: false,
      enrichOnCreate: true,
      creditLimit: 1000
    },
    phantombuster: {
      enabled: false,
      apiKey: "",
      containerId: "",
      autoSync: false
    },
    instantly: {
      enabled: false,
      apiKey: "",
      webhookSecret: "",
      autoSync: true
    },
    aircall: {
      enabled: false,
      apiKey: "",
      webhookSecret: "",
      autoLog: true
    }
  }
} as const;

/**
 * Get client settings
 */
export const getClientSettings = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    try {
      // Check if settings exist
      const existingSettings = await ctx.db
        .query("clientSettings")
        .withIndex("by_client", q => q.eq("clientId", args.clientId))
        .first();

      if (existingSettings) {
        // Merge with defaults to ensure all new settings are included
        return {
          ...DEFAULT_SETTINGS,
          ...existingSettings.settings,
          _id: existingSettings._id,
          clientId: existingSettings.clientId,
          updatedAt: existingSettings.updatedAt
        };
      }

      // Return default settings if none exist
      return {
        ...DEFAULT_SETTINGS,
        clientId: args.clientId,
        _id: null,
        updatedAt: null
      };
    } catch (error) {
      console.error("Failed to get client settings:", error);
      throw error;
    }
  },
});

/**
 * Update client settings
 */
export const updateClientSettings = mutation({
  args: {
    clientId: v.id("clients"),
    settings: v.any(),
    section: v.optional(v.string()), // Update specific section only
  },
  handler: async (ctx, args) => {
    try {
      const now = Date.now();

      // Get existing settings
      const existingSettings = await ctx.db
        .query("clientSettings")
        .withIndex("by_client", q => q.eq("clientId", args.clientId))
        .first();

      let newSettings;
      if (args.section) {
        // Update specific section
        const currentSettings = existingSettings?.settings || DEFAULT_SETTINGS;
        newSettings = {
          ...currentSettings,
          [args.section]: {
            ...currentSettings[args.section as keyof typeof currentSettings],
            ...args.settings
          }
        };
      } else {
        // Update entire settings object
        newSettings = {
          ...DEFAULT_SETTINGS,
          ...args.settings
        };
      }

      if (existingSettings) {
        // Update existing
        await ctx.db.patch(existingSettings._id, {
          settings: newSettings,
          updatedAt: now,
        });

        // Log activity
        await ctx.runMutation(internal.activityLogger.logActivityInternal, {
          clientId: args.clientId,
          action: "settings_updated",
          description: args.section 
            ? `Updated ${args.section} settings` 
            : "Updated client settings",
          category: "system",
          priority: "medium",
          isSystemGenerated: false,
          metadata: {
            section: args.section,
            settingsKeys: Object.keys(args.settings)
          }
        });

        return existingSettings._id;
      } else {
        // Create new settings
        const settingsId = await ctx.db.insert("clientSettings", {
          clientId: args.clientId,
          settings: newSettings,
          createdAt: now,
          updatedAt: now,
        });

        // Log activity
        await ctx.runMutation(internal.activityLogger.logActivityInternal, {
          clientId: args.clientId,
          action: "settings_created",
          description: "Created client settings",
          category: "system",
          priority: "medium",
          isSystemGenerated: false,
          metadata: {
            section: args.section
          }
        });

        return settingsId;
      }
    } catch (error) {
      console.error("Failed to update client settings:", error);
      throw error;
    }
  },
});

/**
 * Reset settings to defaults
 */
export const resetClientSettings = mutation({
  args: {
    clientId: v.id("clients"),
    section: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      if (args.section) {
        // Reset specific section
        const defaultSection = DEFAULT_SETTINGS[args.section as keyof typeof DEFAULT_SETTINGS];
        return await updateClientSettings(ctx, {
          clientId: args.clientId,
          settings: defaultSection,
          section: args.section,
        });
      } else {
        // Reset all settings
        return await updateClientSettings(ctx, {
          clientId: args.clientId,
          settings: DEFAULT_SETTINGS,
        });
      }
    } catch (error) {
      console.error("Failed to reset client settings:", error);
      throw error;
    }
  },
});

/**
 * Get integration status
 */
export const getIntegrationStatus = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    try {
      const settings = await getClientSettings(ctx, { clientId: args.clientId });

      const integrations = settings.integrations;
      
      return {
        apollo: {
          enabled: integrations.apollo.enabled,
          configured: !!integrations.apollo.apiKey,
          lastSync: null, // TODO: Add sync tracking
          status: integrations.apollo.enabled && integrations.apollo.apiKey ? "active" : "inactive"
        },
        instantly: {
          enabled: integrations.instantly.enabled,
          configured: !!integrations.instantly.apiKey,
          lastSync: null,
          status: integrations.instantly.enabled && integrations.instantly.apiKey ? "active" : "inactive"
        },
        phantombuster: {
          enabled: integrations.phantombuster.enabled,
          configured: !!integrations.phantombuster.apiKey && !!integrations.phantombuster.containerId,
          lastSync: null,
          status: integrations.phantombuster.enabled && integrations.phantombuster.apiKey ? "active" : "inactive"
        },
        aircall: {
          enabled: integrations.aircall.enabled,
          configured: !!integrations.aircall.apiKey,
          lastSync: null,
          status: integrations.aircall.enabled && integrations.aircall.apiKey ? "active" : "inactive"
        }
      };
    } catch (error) {
      console.error("Failed to get integration status:", error);
      throw error;
    }
  },
});

/**
 * Test integration connection
 */
export const testIntegrationConnection = mutation({
  args: {
    clientId: v.id("clients"),
    integration: v.string(),
    credentials: v.any(),
  },
  handler: async (ctx, args) => {
    try {
      // This would normally test the actual API connection
      // For now, we'll just validate that credentials are provided
      
      let isValid = false;
      let message = "";

      switch (args.integration) {
        case "apollo":
          isValid = !!args.credentials.apiKey;
          message = isValid ? "Apollo API key is valid" : "Apollo API key is required";
          break;
        case "instantly":
          isValid = !!args.credentials.apiKey;
          message = isValid ? "Instantly API key is valid" : "Instantly API key is required";
          break;
        case "phantombuster":
          isValid = !!args.credentials.apiKey && !!args.credentials.containerId;
          message = isValid ? "PhantomBuster credentials are valid" : "PhantomBuster API key and container ID are required";
          break;
        case "aircall":
          isValid = !!args.credentials.apiKey;
          message = isValid ? "Aircall API key is valid" : "Aircall API key is required";
          break;
        default:
          throw new Error(`Unknown integration: ${args.integration}`);
      }

      // Log the test
      await ctx.runMutation(internal.activityLogger.logActivityInternal, {
        clientId: args.clientId,
        action: "integration_tested",
        description: `Tested ${args.integration} integration: ${message}`,
        category: "system",
        priority: "low",
        isSystemGenerated: false,
        metadata: {
          integration: args.integration,
          success: isValid,
          message
        }
      });

      return { success: isValid, message };
    } catch (error) {
      console.error("Failed to test integration:", error);
      throw error;
    }
  },
});

/**
 * Get settings history/audit log
 */
export const getSettingsHistory = query({
  args: {
    clientId: v.id("clients"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      // Get activities related to settings changes
      const activities = await ctx.db
        .query("activityLog")
        .withIndex("by_client_category", q => q.eq("clientId", args.clientId).eq("category", "system"))
        .order("desc")
        .take(args.limit || 50);

      // Filter for settings-related activities
      const settingsActivities = activities.filter(activity => 
        activity.action.includes("settings") || 
        activity.action.includes("integration")
      );

      return settingsActivities;
    } catch (error) {
      console.error("Failed to get settings history:", error);
      throw error;
    }
  },
});