import { query, mutation } from "./_generated/server";
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
  },
  returns: v.id("deals"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("deals", {
      ...args,
      status: "open",
      currency: args.currency || "EUR",
      confidence: args.confidence || 50,
      priority: args.priority || 3,
      isAutoCreated: false,
      isActive: true,
    });
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
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updateData } = args;
    
    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(cleanData).length > 0) {
      await ctx.db.patch(id, cleanData);
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