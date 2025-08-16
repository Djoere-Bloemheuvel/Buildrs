import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get propositions with optional client filter
export const list = query({
  args: { 
    clientId: v.optional(v.id("clients"))
  },
  returns: v.array(v.object({
    _id: v.id("propositions"),
    _creationTime: v.number(),
    clientId: v.optional(v.id("clients")),
    name: v.string(),
    description: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    uniqueValue: v.optional(v.string()),
    problemsSolved: v.optional(v.string()),
    painTriggers: v.optional(v.string()),
    offerType: v.optional(v.string()),
    aiSummary: v.optional(v.string()),
    aiPersonalizationPrompt: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    let propositions;
    
    if (args.clientId) {
      propositions = ctx.db.query("propositions").withIndex("by_client", (q) => q.eq("clientId", args.clientId));
    } else {
      propositions = ctx.db.query("propositions");
    }
    
    return await propositions.order("desc").collect();
  },
});

// Get proposition by ID
export const getById = query({
  args: { id: v.id("propositions") },
  returns: v.union(v.object({
    _id: v.id("propositions"),
    _creationTime: v.number(),
    clientId: v.optional(v.id("clients")),
    name: v.string(),
    description: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    uniqueValue: v.optional(v.string()),
    problemsSolved: v.optional(v.string()),
    painTriggers: v.optional(v.string()),
    offerType: v.optional(v.string()),
    aiSummary: v.optional(v.string()),
    aiPersonalizationPrompt: v.optional(v.string()),
  }), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create new proposition
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    offerType: v.optional(v.string()),
    clientId: v.id("clients"),
    targetAudience: v.optional(v.string()),
    uniqueValue: v.optional(v.string()),
  },
  returns: v.id("propositions"),
  handler: async (ctx, args) => {
    const propositionData: any = {
      name: args.name,
      description: args.description,
      offerType: args.offerType || "service",
      clientId: args.clientId,
      targetAudience: args.targetAudience,
      uniqueValue: args.uniqueValue,
    };

    return await ctx.db.insert("propositions", propositionData);
  },
});

// Update proposition
export const update = mutation({
  args: {
    id: v.id("propositions"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    offerType: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    uniqueValue: v.optional(v.string()),
    problemsSolved: v.optional(v.string()),
    painTriggers: v.optional(v.string()),
    aiSummary: v.optional(v.string()),
    aiPersonalizationPrompt: v.optional(v.string()),
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

// Delete proposition
export const remove = mutation({
  args: { id: v.id("propositions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});

// Get propositions by client
export const getByClient = query({
  args: { 
    clientId: v.id("clients")
  },
  returns: v.array(v.object({
    _id: v.id("propositions"),
    _creationTime: v.number(),
    clientId: v.optional(v.id("clients")),
    name: v.string(),
    description: v.optional(v.string()),
    offerType: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("propositions")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();
  },
});