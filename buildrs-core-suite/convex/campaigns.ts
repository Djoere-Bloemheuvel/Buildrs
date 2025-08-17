import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Get campaigns with optional filters
export const list = query({
  args: { 
    clientId: v.optional(v.union(v.id("clients"), v.string())),
    type: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("campaigns"),
    _creationTime: v.number(),
    clientId: v.optional(v.id("clients")),
    propositionId: v.optional(v.id("propositions")),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(),
    status: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    autoAssignEnabled: v.optional(v.boolean()),
    audienceFilter: v.optional(v.object({})),
    priority: v.optional(v.number()),
    sendingWindow: v.optional(v.object({})),
    stats: v.optional(v.object({})),
    campaignPurpose: v.optional(v.string()),
    channel: v.optional(v.string()),
    dailyLimit: v.optional(v.number()),
    instantlyId: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    // Resolve clientId first if it's a string
    let actualClientId = args.clientId;
    if (args.clientId && typeof args.clientId === "string") {
      const client = await ctx.db
        .query("clients")
        .filter((q) => q.eq(q.field("domain"), args.clientId))
        .first();
      
      if (!client) {
        console.error(`❌ Client with domain ${args.clientId} not found - returning empty campaigns list`);
        return [];
      }
      actualClientId = client._id;
    }

    // Start with the most specific index
    let campaigns;
    
    if (actualClientId) {
      campaigns = ctx.db.query("campaigns").withIndex("by_client", (q) => q.eq("clientId", actualClientId));
    } else if (args.type) {
      campaigns = ctx.db.query("campaigns").withIndex("by_type", (q) => q.eq("type", args.type));
    } else if (args.status) {
      campaigns = ctx.db.query("campaigns").withIndex("by_status", (q) => q.eq("status", args.status));
    } else {
      campaigns = ctx.db.query("campaigns");
    }
    
    campaigns = campaigns.order("desc");
    
    // Collect all results first, then apply additional filters
    let campaignsList = await campaigns.collect();
    
    // Apply additional filters if needed
    if (args.type && actualClientId) {
      campaignsList = campaignsList.filter(campaign => campaign.type === args.type);
    }
    
    if (args.status && (actualClientId || args.type)) {
      campaignsList = campaignsList.filter(campaign => campaign.status === args.status);
    }
    
    // Apply limit if specified
    if (args.limit) {
      campaignsList = campaignsList.slice(0, args.limit);
    }
    
    return campaignsList;
  },
});

// Get campaign by ID
export const getById = query({
  args: { id: v.id("campaigns") },
  returns: v.union(v.object({
    _id: v.id("campaigns"),
    _creationTime: v.number(),
    clientId: v.optional(v.id("clients")),
    propositionId: v.optional(v.id("propositions")),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(),
    status: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    autoAssignEnabled: v.optional(v.boolean()),
    audienceFilter: v.optional(v.object({})),
    priority: v.optional(v.number()),
    sendingWindow: v.optional(v.object({})),
    stats: v.optional(v.object({})),
    campaignPurpose: v.optional(v.string()),
    channel: v.optional(v.string()),
    dailyLimit: v.optional(v.number()),
    instantlyId: v.optional(v.string()),
  }), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create new campaign
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(),
    status: v.optional(v.string()),
    clientId: v.id("clients"),
    propositionId: v.optional(v.id("propositions")),
    targetingCriteria: v.optional(v.object({
      functionGroups: v.optional(v.array(v.string())),
      industries: v.optional(v.array(v.string())),
      subindustries: v.optional(v.array(v.string())),
      countries: v.optional(v.array(v.string())),
      states: v.optional(v.array(v.string())),
      companySizeMin: v.optional(v.number()),
      companySizeMax: v.optional(v.number()),
    })),
    settings: v.optional(v.object({
      dailyConnectLimit: v.optional(v.number()),
      dailyMessageLimit: v.optional(v.number()),
    })),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    priority: v.optional(v.number()),
    dailyLimit: v.optional(v.number()),
    userId: v.optional(v.string()), // Voor activity logging
  },
  returns: v.id("campaigns"),
  handler: async (ctx, args) => {
    const { userId, ...campaignArgs } = args;
    
    const campaignData: any = {
      name: campaignArgs.name,
      description: campaignArgs.description,
      type: campaignArgs.type,
      status: campaignArgs.status || "draft",
      clientId: campaignArgs.clientId,
      propositionId: campaignArgs.propositionId,
      startDate: campaignArgs.startDate,
      endDate: campaignArgs.endDate,
      priority: campaignArgs.priority || 0,
      dailyLimit: campaignArgs.dailyLimit || campaignArgs.settings?.dailyMessageLimit || campaignArgs.settings?.dailyConnectLimit || 50,
      autoAssignEnabled: false,
      audienceFilter: campaignArgs.targetingCriteria || {},
      sendingWindow: campaignArgs.settings || {},
      stats: {
        sent_count: 0,
        accepted_count: 0,
        replied_count: 0,
        booked_count: 0,
      },
    };

    const campaignId = await ctx.db.insert("campaigns", campaignData);
    
    // Log activity
    const typeDisplay = campaignArgs.type === "linkedin" ? "LinkedIn" : 
                       campaignArgs.type === "email" ? "Email" : 
                       campaignArgs.type;
    
    await ctx.runMutation(internal.activityLogger.logActivityInternal, {
      clientId: campaignArgs.clientId,
      userId: userId,
      action: "campaign_created",
      description: `Created ${typeDisplay} campaign: ${campaignArgs.name}`,
      campaignId: campaignId,
      category: "campaign",
      priority: "high",
      metadata: {
        type: campaignArgs.type,
        status: campaignData.status,
        dailyLimit: campaignData.dailyLimit,
        targetingCriteria: campaignArgs.targetingCriteria,
        startDate: campaignArgs.startDate,
        endDate: campaignArgs.endDate,
      },
    });
    
    return campaignId;
  },
});

// Update campaign
export const update = mutation({
  args: {
    id: v.id("campaigns"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    targetingCriteria: v.optional(v.object({
      functionGroups: v.optional(v.array(v.string())),
      industries: v.optional(v.array(v.string())),
      subindustries: v.optional(v.array(v.string())),
      countries: v.optional(v.array(v.string())),
      states: v.optional(v.array(v.string())),
      companySizeMin: v.optional(v.number()),
      companySizeMax: v.optional(v.number()),
    })),
    settings: v.optional(v.object({
      dailyConnectLimit: v.optional(v.number()),
      dailyMessageLimit: v.optional(v.number()),
    })),
    stats: v.optional(v.object({})),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    priority: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updateData } = args;
    
    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    // Convert targeting criteria to audienceFilter format
    if (args.targetingCriteria) {
      cleanData.audienceFilter = args.targetingCriteria;
      delete cleanData.targetingCriteria;
    }

    // Convert settings to sendingWindow format
    if (args.settings) {
      cleanData.sendingWindow = args.settings;
      cleanData.dailyLimit = args.settings.dailyConnectLimit || cleanData.dailyLimit;
      delete cleanData.settings;
    }
    
    if (Object.keys(cleanData).length > 0) {
      await ctx.db.patch(id, cleanData);
    }
    
    return null;
  },
});

// Delete campaign
export const remove = mutation({
  args: { id: v.id("campaigns") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});

// Get campaigns by client
export const getByClient = query({
  args: { 
    clientId: v.union(v.id("clients"), v.string()),
    type: v.optional(v.string())
  },
  returns: v.array(v.object({
    _id: v.id("campaigns"),
    _creationTime: v.number(),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(),
    status: v.optional(v.string()),
    stats: v.optional(v.object({})),
  })),
  handler: async (ctx, args) => {
    // Convert clientId to proper ID if it's a string
    let actualClientId = args.clientId;
    if (typeof args.clientId === "string") {
      const client = await ctx.db
        .query("clients")
        .filter((q) => q.eq(q.field("domain"), args.clientId))
        .first();
      
      if (!client) {
        return [];
      }
      actualClientId = client._id;
    }

    let query = ctx.db
      .query("campaigns")
      .withIndex("by_client", (q) => q.eq("clientId", actualClientId));

    if (args.type) {
      // Additional filter by type if needed
      const allCampaigns = await query.collect();
      return allCampaigns.filter(campaign => campaign.type === args.type);
    }

    return await query.order("desc").collect();
  },
});