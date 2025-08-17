import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Get deals with optional filters
export const list = query({
  args: { 
    clientId: v.optional(v.id("clients")),
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    pipelineId: v.optional(v.id("pipelines")),
    stageId: v.optional(v.id("stages")),
    status: v.optional(v.string()),
    ownerId: v.optional(v.id("profiles")),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("deals"),
    _creationTime: v.number(),
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    campaignId: v.optional(v.id("campaigns")),
    clientId: v.id("clients"),
    pipelineId: v.id("pipelines"),
    stageId: v.id("stages"),
    propositionId: v.optional(v.id("propositions")),
    ownerId: v.optional(v.id("profiles")),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    value: v.optional(v.number()),
    currency: v.optional(v.string()),
    confidence: v.optional(v.number()),
    priority: v.optional(v.number()),
    source: v.optional(v.string()),
    closedAt: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    isAutoCreated: v.optional(v.boolean()),
  })),
  handler: async (ctx, args) => {
    let deals = ctx.db.query("deals");
    
    if (args.clientId) {
      deals = deals.withIndex("by_client", (q) => q.eq("clientId", args.clientId));
    } else if (args.contactId) {
      deals = deals.withIndex("by_contact", (q) => q.eq("contactId", args.contactId));
    } else if (args.companyId) {
      deals = deals.withIndex("by_company", (q) => q.eq("companyId", args.companyId));
    } else if (args.pipelineId) {
      deals = deals.withIndex("by_pipeline", (q) => q.eq("pipelineId", args.pipelineId));
    } else if (args.stageId) {
      deals = deals.withIndex("by_stage", (q) => q.eq("stageId", args.stageId));
    } else if (args.status) {
      deals = deals.withIndex("by_status", (q) => q.eq("status", args.status));
    } else if (args.ownerId) {
      deals = deals.withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId));
    }
    
    deals = deals.order("desc");
    
    if (args.limit) {
      return await deals.take(args.limit);
    }
    
    return await deals.collect();
  },
});

// Get deal by ID with related data
export const getById = query({
  args: { id: v.id("deals") },
  returns: v.union(v.object({
    _id: v.id("deals"),
    _creationTime: v.number(),
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    campaignId: v.optional(v.id("campaigns")),
    clientId: v.id("clients"),
    pipelineId: v.id("pipelines"),
    stageId: v.id("stages"),
    propositionId: v.optional(v.id("propositions")),
    ownerId: v.optional(v.id("profiles")),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    value: v.optional(v.number()),
    currency: v.optional(v.string()),
    confidence: v.optional(v.number()),
    priority: v.optional(v.number()),
    source: v.optional(v.string()),
    closedAt: v.optional(v.number()),
    isAutoCreated: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    meetingPrepSummary: v.optional(v.string()),
    extra: v.optional(v.object({})),
  }), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create new deal
export const create = mutation({
  args: {
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    campaignId: v.optional(v.id("campaigns")),
    clientId: v.id("clients"),
    pipelineId: v.id("pipelines"),
    stageId: v.id("stages"),
    propositionId: v.optional(v.id("propositions")),
    ownerId: v.optional(v.id("profiles")),
    title: v.string(),
    description: v.optional(v.string()),
    value: v.optional(v.number()),
    currency: v.optional(v.string()),
    confidence: v.optional(v.number()),
    priority: v.optional(v.number()),
    source: v.optional(v.string()),
    userId: v.optional(v.string()), // Voor activity logging
  },
  returns: v.id("deals"),
  handler: async (ctx, args) => {
    const { userId, ...dealData } = args;
    
    const dealId = await ctx.db.insert("deals", {
      ...dealData,
      status: "open",
      currency: dealData.currency || "EUR",
      confidence: dealData.confidence || 50,
      priority: dealData.priority || 3,
      isAutoCreated: false,
      isActive: true,
    });
    
    // Log activity
    const value = dealData.value ? ` (€${dealData.value.toLocaleString()})` : '';
    
    await ctx.runMutation(internal.activityLogger.logActivityInternal, {
      clientId: dealData.clientId,
      userId: userId,
      action: "deal_created",
      description: `Created deal: ${dealData.title}${value}`,
      dealId: dealId,
      contactId: dealData.contactId,
      companyId: dealData.companyId,
      campaignId: dealData.campaignId,
      category: "deal",
      priority: "high",
      metadata: {
        value: dealData.value,
        currency: dealData.currency || "EUR",
        confidence: dealData.confidence || 50,
        source: dealData.source,
        stageId: dealData.stageId,
        pipelineId: dealData.pipelineId,
      },
    });
    
    return dealId;
  },
});

// Update deal
export const update = mutation({
  args: {
    id: v.id("deals"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    stageId: v.optional(v.id("stages")),
    value: v.optional(v.number()),
    currency: v.optional(v.string()),
    confidence: v.optional(v.number()),
    priority: v.optional(v.number()),
    status: v.optional(v.string()),
    ownerId: v.optional(v.id("profiles")),
    meetingPrepSummary: v.optional(v.string()),
    closedAt: v.optional(v.number()),
    userId: v.optional(v.string()), // Voor activity logging
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, userId, ...updateData } = args;
    
    // Get existing deal for comparison
    const existingDeal = await ctx.db.get(id);
    if (!existingDeal) {
      throw new Error("Deal not found");
    }
    
    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(cleanData).length > 0) {
      await ctx.db.patch(id, cleanData);
      
      // Log activity for significant changes
      const changes = [];
      let activityAction = "deal_updated";
      let priority = "medium";
      
      // Track significant changes
      if (cleanData.status && cleanData.status !== existingDeal.status) {
        changes.push(`status: ${existingDeal.status} → ${cleanData.status}`);
        activityAction = cleanData.status === "won" ? "deal_won" : 
                        cleanData.status === "lost" ? "deal_lost" : 
                        cleanData.status === "open" ? "deal_reopened" : "deal_updated";
        priority = cleanData.status === "won" || cleanData.status === "lost" ? "high" : "medium";
      }
      
      if (cleanData.stageId && cleanData.stageId !== existingDeal.stageId) {
        changes.push("stage changed");
        if (activityAction === "deal_updated") activityAction = "deal_stage_changed";
      }
      
      if (cleanData.value !== undefined && cleanData.value !== existingDeal.value) {
        const oldValue = existingDeal.value ? `€${existingDeal.value.toLocaleString()}` : '€0';
        const newValue = cleanData.value ? `€${cleanData.value.toLocaleString()}` : '€0';
        changes.push(`value: ${oldValue} → ${newValue}`);
        if (activityAction === "deal_updated") activityAction = "deal_value_changed";
      }
      
      if (cleanData.confidence !== undefined && cleanData.confidence !== existingDeal.confidence) {
        changes.push(`confidence: ${existingDeal.confidence || 0}% → ${cleanData.confidence}%`);
      }
      
      if (cleanData.title && cleanData.title !== existingDeal.title) {
        changes.push(`title: ${existingDeal.title} → ${cleanData.title}`);
      }
      
      // Create activity description
      let description = `Updated deal: ${existingDeal.title}`;
      if (changes.length > 0) {
        description += ` (${changes.join(', ')})`;
      }
      
      // Special descriptions for specific actions
      if (activityAction === "deal_won") {
        const value = cleanData.value || existingDeal.value;
        description = `Won deal: ${existingDeal.title}${value ? ` for €${value.toLocaleString()}` : ''}`;
      } else if (activityAction === "deal_lost") {
        description = `Lost deal: ${existingDeal.title}`;
      } else if (activityAction === "deal_reopened") {
        description = `Reopened deal: ${existingDeal.title}`;
      }
      
      await ctx.runMutation(internal.activityLogger.logActivityInternal, {
        clientId: existingDeal.clientId,
        userId: userId,
        action: activityAction,
        description: description,
        dealId: id,
        contactId: existingDeal.contactId,
        companyId: existingDeal.companyId,
        campaignId: existingDeal.campaignId,
        category: "deal",
        priority: priority,
        metadata: {
          changes: changes,
          fieldsUpdated: Object.keys(cleanData),
          oldStatus: existingDeal.status,
          newStatus: cleanData.status,
          oldValue: existingDeal.value,
          newValue: cleanData.value,
          oldStageId: existingDeal.stageId,
          newStageId: cleanData.stageId,
        },
      });
    }
    
    return null;
  },
});

// Delete deal
export const remove = mutation({
  args: { id: v.id("deals") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});

// Get deals by pipeline with enriched data
export const getByPipeline = query({
  args: { pipelineId: v.id("pipelines") },
  returns: v.array(v.object({
    _id: v.id("deals"),
    _creationTime: v.number(),
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    campaignId: v.optional(v.id("campaigns")),
    clientId: v.id("clients"),
    pipelineId: v.id("pipelines"),
    stageId: v.id("stages"),
    ownerId: v.optional(v.id("profiles")),
    propositionId: v.optional(v.id("propositions")),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    value: v.optional(v.number()),
    currency: v.optional(v.string()),
    confidence: v.optional(v.number()),
    closedAt: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    isAutoCreated: v.optional(v.boolean()),
    priority: v.optional(v.number()),
    companies: v.optional(v.object({
      name: v.string(),
    })),
  })),
  handler: async (ctx, args) => {
    const deals = await ctx.db
      .query("deals")
      .withIndex("by_pipeline", (q) => q.eq("pipelineId", args.pipelineId))
      .collect();
    
    // Enrich with company data
    const enrichedDeals = [];
    for (const deal of deals) {
      let companies = undefined;
      if (deal.companyId) {
        const company = await ctx.db.get(deal.companyId);
        if (company) {
          companies = { name: company.name };
        }
      }
      
      enrichedDeals.push({
        ...deal,
        companies,
      });
    }
    
    return enrichedDeals;
  },
});

// Get deal line items
export const getLineItems = query({
  args: { dealId: v.id("deals") },
  returns: v.array(v.object({
    _id: v.id("dealLineItems"),
    _creationTime: v.number(),
    dealId: v.id("deals"),
    clientId: v.id("clients"),
    propositionId: v.optional(v.id("propositions")),
    name: v.string(),
    quantity: v.number(),
    unitPrice: v.number(),
    discountPct: v.number(),
    currency: v.string(),
    amount: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dealLineItems")
      .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
      .collect();
  },
});

// Add line item to deal
export const addLineItem = mutation({
  args: {
    dealId: v.id("deals"),
    clientId: v.id("clients"),
    propositionId: v.optional(v.id("propositions")),
    name: v.string(),
    quantity: v.number(),
    unitPrice: v.number(),
    discountPct: v.optional(v.number()),
    currency: v.optional(v.string()),
  },
  returns: v.id("dealLineItems"),
  handler: async (ctx, args) => {
    const quantity = args.quantity;
    const unitPrice = args.unitPrice;
    const discountPct = args.discountPct || 0;
    const amount = quantity * unitPrice * (1 - discountPct / 100);
    
    return await ctx.db.insert("dealLineItems", {
      ...args,
      discountPct: discountPct,
      currency: args.currency || "EUR",
      amount,
    });
  },
});