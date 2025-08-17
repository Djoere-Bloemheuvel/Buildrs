import { v } from "convex/values";
import { mutation, query, internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ===============================
// EMAIL ACCOUNT MANAGEMENT
// ===============================

export const createEmailAccount = mutation({
  args: {
    clientId: v.id("clients"),
    email: v.string(),
    provider: v.union(v.literal("gmail"), v.literal("outlook")),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    settings: v.optional(v.object({
      monitorInbound: v.boolean(),
      monitorOutbound: v.boolean(),
      autoMatchContacts: v.boolean(),
      syncFrequency: v.optional(v.number()),
      maxSyncMessages: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    // Check if email account already exists for this client
    const existing = await ctx.db
      .query("emailAccounts")
      .withIndex("by_email", q => q.eq("email", args.email))
      .filter(q => q.eq(q.field("clientId"), args.clientId))
      .first();
    
    if (existing) {
      throw new Error("Email account already exists for this client");
    }
    
    const now = Date.now();
    
    return await ctx.db.insert("emailAccounts", {
      clientId: args.clientId,
      email: args.email,
      provider: args.provider,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      tokenExpiresAt: args.tokenExpiresAt,
      lastSyncTimestamp: 0,
      isActive: true,
      isValid: true,
      settings: args.settings || {
        monitorInbound: true,
        monitorOutbound: true,
        autoMatchContacts: true,
        syncFrequency: 15, // 15 minutes default
        maxSyncMessages: 100,
      },
      totalMessagesSynced: 0,
      totalContactsMatched: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateEmailAccount = mutation({
  args: {
    emailAccountId: v.id("emailAccounts"),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    isValid: v.optional(v.boolean()),
    settings: v.optional(v.object({
      monitorInbound: v.optional(v.boolean()),
      monitorOutbound: v.optional(v.boolean()),
      autoMatchContacts: v.optional(v.boolean()),
      syncFrequency: v.optional(v.number()),
      maxSyncMessages: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.emailAccountId);
    if (!existing) {
      throw new Error("Email account not found");
    }
    
    const updates: any = {
      updatedAt: Date.now(),
    };
    
    if (args.accessToken !== undefined) updates.accessToken = args.accessToken;
    if (args.refreshToken !== undefined) updates.refreshToken = args.refreshToken;
    if (args.tokenExpiresAt !== undefined) updates.tokenExpiresAt = args.tokenExpiresAt;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.isValid !== undefined) updates.isValid = args.isValid;
    
    if (args.settings) {
      updates.settings = {
        ...existing.settings,
        ...args.settings,
      };
    }
    
    return await ctx.db.patch(args.emailAccountId, updates);
  },
});

export const updateSyncStatus = mutation({
  args: {
    emailAccountId: v.id("emailAccounts"),
    lastSyncTimestamp: v.number(),
    lastSyncStatus: v.string(),
    lastSyncError: v.optional(v.string()),
    messagesSynced: v.optional(v.number()),
    contactsMatched: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.emailAccountId);
    if (!existing) {
      throw new Error("Email account not found");
    }
    
    return await ctx.db.patch(args.emailAccountId, {
      lastSyncTimestamp: args.lastSyncTimestamp,
      lastSyncStatus: args.lastSyncStatus,
      lastSyncError: args.lastSyncError,
      totalMessagesSynced: (existing.totalMessagesSynced || 0) + (args.messagesSynced || 0),
      totalContactsMatched: (existing.totalContactsMatched || 0) + (args.contactsMatched || 0),
      updatedAt: Date.now(),
    });
  },
});

export const deleteEmailAccount = mutation({
  args: {
    emailAccountId: v.id("emailAccounts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.emailAccountId);
  },
});

// ===============================
// QUERIES
// ===============================

export const getClientEmailAccounts = query({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailAccounts")
      .withIndex("by_client", q => q.eq("clientId", args.clientId))
      .collect();
  },
});

export const getActiveEmailAccounts = query({
  args: {
    clientId: v.optional(v.id("clients")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("emailAccounts")
      .withIndex("by_active", q => q.eq("isActive", true));
    
    if (args.clientId) {
      query = query.filter(q => q.eq(q.field("clientId"), args.clientId));
    }
    
    return await query.collect();
  },
});

export const getEmailAccountById = query({
  args: {
    emailAccountId: v.id("emailAccounts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.emailAccountId);
  },
});

export const getEmailAccountByEmail = query({
  args: {
    email: v.string(),
    clientId: v.optional(v.id("clients")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("emailAccounts")
      .withIndex("by_email", q => q.eq("email", args.email));
    
    if (args.clientId) {
      query = query.filter(q => q.eq(q.field("clientId"), args.clientId));
    }
    
    return await query.first();
  },
});

// Get accounts that need syncing
export const getAccountsNeedingSync = query({
  args: {
    maxAgeMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxAge = args.maxAgeMinutes || 15; // Default 15 minutes
    const cutoffTime = Date.now() - (maxAge * 60 * 1000);
    
    const accounts = await ctx.db
      .query("emailAccounts")
      .withIndex("by_active", q => q.eq("isActive", true))
      .filter(q => q.eq(q.field("isValid"), true))
      .collect();
    
    return accounts.filter(account => {
      const lastSync = account.lastSyncTimestamp || 0;
      const syncFrequency = account.settings.syncFrequency || 15;
      const nextSyncTime = lastSync + (syncFrequency * 60 * 1000);
      
      return Date.now() >= nextSyncTime;
    });
  },
});

// ===============================
// STATS & ANALYTICS
// ===============================

export const getEmailAccountStats = query({
  args: {
    emailAccountId: v.id("emailAccounts"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.emailAccountId);
    if (!account) return null;
    
    const daysAgo = args.days || 30;
    const cutoffTimestamp = Date.now() - (daysAgo * 24 * 60 * 60 * 1000);
    
    // Get communications from this email account
    const communications = await ctx.db
      .query("communications")
      .withIndex("by_client", q => q.eq("clientId", account.clientId))
      .filter(q => 
        q.and(
          q.or(
            q.eq(q.field("fromEmail"), account.email),
            q.eq(q.field("toEmail"), account.email)
          ),
          q.gte(q.field("timestamp"), cutoffTimestamp)
        )
      )
      .collect();
    
    const stats = {
      totalMessages: communications.length,
      inbound: communications.filter(c => c.direction === "inbound").length,
      outbound: communications.filter(c => c.direction === "outbound").length,
      contactsReached: new Set(communications.map(c => c.contactId).filter(Boolean)).size,
      avgMessagesPerDay: 0,
      lastSyncStatus: account.lastSyncStatus,
      lastSyncTime: account.lastSyncTimestamp,
      totalSynced: account.totalMessagesSynced || 0,
      totalMatched: account.totalContactsMatched || 0,
    };
    
    if (daysAgo > 0) {
      stats.avgMessagesPerDay = Math.round(stats.totalMessages / daysAgo);
    }
    
    return stats;
  },
});

export const getClientEmailStats = query({
  args: {
    clientId: v.id("clients"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const accounts = await ctx.db
      .query("emailAccounts")
      .withIndex("by_client", q => q.eq("clientId", args.clientId))
      .collect();
    
    const daysAgo = args.days || 30;
    const cutoffTimestamp = Date.now() - (daysAgo * 24 * 60 * 60 * 1000);
    
    let totalMessages = 0;
    let totalInbound = 0;
    let totalOutbound = 0;
    let activeAccounts = 0;
    let totalSynced = 0;
    let totalMatched = 0;
    
    for (const account of accounts) {
      if (account.isActive) activeAccounts++;
      totalSynced += account.totalMessagesSynced || 0;
      totalMatched += account.totalContactsMatched || 0;
      
      // Get recent communications for this account
      const communications = await ctx.db
        .query("communications")
        .withIndex("by_client", q => q.eq("clientId", args.clientId))
        .filter(q => 
          q.and(
            q.or(
              q.eq(q.field("fromEmail"), account.email),
              q.eq(q.field("toEmail"), account.email)
            ),
            q.gte(q.field("timestamp"), cutoffTimestamp)
          )
        )
        .collect();
      
      totalMessages += communications.length;
      totalInbound += communications.filter(c => c.direction === "inbound").length;
      totalOutbound += communications.filter(c => c.direction === "outbound").length;
    }
    
    return {
      totalAccounts: accounts.length,
      activeAccounts,
      totalMessages,
      totalInbound,
      totalOutbound,
      totalSynced,
      totalMatched,
      avgMessagesPerDay: daysAgo > 0 ? Math.round(totalMessages / daysAgo) : 0,
    };
  },
});

// ===============================
// TOKEN MANAGEMENT
// ===============================

/**
 * Refresh expired OAuth tokens for all email accounts
 */
export const refreshExpiredTokens = internalAction({
  args: {},
  handler: async (ctx, args) => {
    console.log("Starting OAuth token refresh check...");
    
    try {
      // Get all active accounts
      const accounts = await ctx.runQuery(internal.emailAccounts.getActiveEmailAccounts, {});
      
      let refreshedCount = 0;
      let errorCount = 0;
      
      for (const account of accounts) {
        try {
          // Check if token is expired or expires within 1 hour
          const expiryBuffer = 60 * 60 * 1000; // 1 hour in milliseconds
          const tokenExpiresAt = account.tokenExpiresAt || 0;
          
          if (Date.now() >= (tokenExpiresAt - expiryBuffer)) {
            console.log(`Refreshing token for ${account.email} (${account.provider})`);
            
            if (!account.refreshToken) {
              console.error(`No refresh token available for ${account.email}`);
              // Mark account as invalid so it stops trying to sync
              await ctx.runMutation(internal.emailAccounts.updateEmailAccount, {
                emailAccountId: account._id,
                isValid: false,
              });
              errorCount++;
              continue;
            }
            
            // Refresh the token based on provider
            let newTokens;
            
            if (account.provider === "gmail") {
              // In a real implementation, you'd get these from environment variables
              const clientId = process.env.GMAIL_CLIENT_ID;
              const clientSecret = process.env.GMAIL_CLIENT_SECRET;
              
              if (!clientId || !clientSecret) {
                console.error("Gmail OAuth credentials not configured");
                continue;
              }
              
              // Import the Gmail integration class
              const { GmailIntegration } = await import("../src/utils/providers/GmailIntegration");
              newTokens = await GmailIntegration.refreshAccessToken(
                account.refreshToken,
                clientId,
                clientSecret
              );
            } else if (account.provider === "outlook") {
              // For Outlook/Microsoft Graph
              const clientId = process.env.OUTLOOK_CLIENT_ID;
              const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
              const tenantId = process.env.OUTLOOK_TENANT_ID || "common";
              
              if (!clientId || !clientSecret) {
                console.error("Outlook OAuth credentials not configured");
                continue;
              }
              
              const { OutlookIntegration } = await import("../src/utils/providers/OutlookIntegration");
              newTokens = await OutlookIntegration.refreshAccessToken(
                account.refreshToken,
                clientId,
                clientSecret,
                tenantId
              );
            } else {
              console.error(`Unknown provider: ${account.provider}`);
              continue;
            }
            
            // Update the account with new tokens
            await ctx.runMutation(internal.emailAccounts.updateEmailAccount, {
              emailAccountId: account._id,
              accessToken: newTokens.access_token,
              tokenExpiresAt: Date.now() + (newTokens.expires_in * 1000),
              refreshToken: newTokens.refresh_token || account.refreshToken,
              isValid: true,
            });
            
            refreshedCount++;
            console.log(`Successfully refreshed token for ${account.email}`);
            
          } else {
            console.log(`Token for ${account.email} still valid (expires ${new Date(tokenExpiresAt).toISOString()})`);
          }
          
        } catch (error) {
          console.error(`Failed to refresh token for ${account.email}:`, error);
          errorCount++;
          
          // Mark account as invalid if refresh fails
          await ctx.runMutation(internal.emailAccounts.updateEmailAccount, {
            emailAccountId: account._id,
            isValid: false,
          });
        }
      }
      
      console.log(`Token refresh completed: ${refreshedCount} refreshed, ${errorCount} errors`);
      
      return {
        success: true,
        refreshedCount,
        errorCount,
        totalChecked: accounts.length,
      };
      
    } catch (error) {
      console.error("Token refresh process failed:", error);
      throw error;
    }
  },
});

/**
 * Manually refresh tokens for a specific email account
 */
export const refreshAccountToken = internalAction({
  args: {
    emailAccountId: v.id("emailAccounts"),
  },
  handler: async (ctx, args) => {
    const account = await ctx.runQuery(internal.emailAccounts.getEmailAccountById, {
      emailAccountId: args.emailAccountId,
    });
    
    if (!account) {
      throw new Error("Email account not found");
    }
    
    if (!account.refreshToken) {
      throw new Error("No refresh token available");
    }
    
    console.log(`Manually refreshing token for ${account.email} (${account.provider})`);
    
    try {
      let newTokens;
      
      if (account.provider === "gmail") {
        const clientId = process.env.GMAIL_CLIENT_ID;
        const clientSecret = process.env.GMAIL_CLIENT_SECRET;
        
        if (!clientId || !clientSecret) {
          throw new Error("Gmail OAuth credentials not configured");
        }
        
        const { GmailIntegration } = await import("../src/utils/providers/GmailIntegration");
        newTokens = await GmailIntegration.refreshAccessToken(
          account.refreshToken,
          clientId,
          clientSecret
        );
      } else if (account.provider === "outlook") {
        const clientId = process.env.OUTLOOK_CLIENT_ID;
        const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
        const tenantId = process.env.OUTLOOK_TENANT_ID || "common";
        
        if (!clientId || !clientSecret) {
          throw new Error("Outlook OAuth credentials not configured");
        }
        
        const { OutlookIntegration } = await import("../src/utils/providers/OutlookIntegration");
        newTokens = await OutlookIntegration.refreshAccessToken(
          account.refreshToken,
          clientId,
          clientSecret,
          tenantId
        );
      } else {
        throw new Error(`Unsupported provider: ${account.provider}`);
      }
      
      // Update the account with new tokens
      await ctx.runMutation(internal.emailAccounts.updateEmailAccount, {
        emailAccountId: args.emailAccountId,
        accessToken: newTokens.access_token,
        tokenExpiresAt: Date.now() + (newTokens.expires_in * 1000),
        refreshToken: newTokens.refresh_token || account.refreshToken,
        isValid: true,
      });
      
      console.log(`Successfully refreshed token for ${account.email}`);
      
      return {
        success: true,
        expiresAt: Date.now() + (newTokens.expires_in * 1000),
      };
      
    } catch (error) {
      console.error(`Failed to refresh token for ${account.email}:`, error);
      
      // Mark account as invalid
      await ctx.runMutation(internal.emailAccounts.updateEmailAccount, {
        emailAccountId: args.emailAccountId,
        isValid: false,
      });
      
      throw error;
    }
  },
});