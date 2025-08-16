import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get pipelines with optional filters
export const list = query({
  args: { 
    clientId: v.optional(v.id("clients")),
    propositionId: v.optional(v.id("propositions")),
    isActive: v.optional(v.boolean()),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("pipelines"),
    _creationTime: v.number(),
    clientId: v.id("clients"),
    propositionId: v.id("propositions"),
    createdBy: v.optional(v.id("profiles")),
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    isDefault: v.optional(v.boolean()),
    color: v.optional(v.string()),
    archived: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    let pipelines = ctx.db.query("pipelines");
    
    if (args.clientId) {
      pipelines = pipelines.withIndex("by_client", (q) => q.eq("clientId", args.clientId));
    } else if (args.propositionId) {
      pipelines = pipelines.withIndex("by_proposition", (q) => q.eq("propositionId", args.propositionId));
    } else if (args.isActive !== undefined) {
      pipelines = pipelines.withIndex("by_active", (q) => q.eq("isActive", args.isActive));
    }
    
    pipelines = pipelines.order("desc");
    
    if (args.limit) {
      return await pipelines.take(args.limit);
    }
    
    return await pipelines.collect();
  },
});

// Get pipeline by ID
export const getById = query({
  args: { id: v.id("pipelines") },
  returns: v.union(v.object({
    _id: v.id("pipelines"),
    _creationTime: v.number(),
    clientId: v.id("clients"),
    propositionId: v.id("propositions"),
    createdBy: v.optional(v.id("profiles")),
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    isDefault: v.optional(v.boolean()),
    color: v.optional(v.string()),
    archived: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  }), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create new pipeline
export const create = mutation({
  args: {
    clientId: v.id("clients"),
    propositionId: v.id("propositions"),
    createdBy: v.optional(v.id("profiles")),
    name: v.string(),
    description: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    color: v.optional(v.string()),
  },
  returns: v.id("pipelines"),
  handler: async (ctx, args) => {
    // If this is set as default, make sure no other pipeline is default for this client
    if (args.isDefault) {
      const existingDefault = await ctx.db
        .query("pipelines")
        .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
        .filter((q) => q.eq(q.field("isDefault"), true))
        .first();
      
      if (existingDefault) {
        await ctx.db.patch(existingDefault._id, { isDefault: false });
      }
    }

    return await ctx.db.insert("pipelines", {
      ...args,
      isActive: true,
      archived: false,
      sortOrder: 0,
    });
  },
});

// Update pipeline
export const update = mutation({
  args: {
    id: v.id("pipelines"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    isDefault: v.optional(v.boolean()),
    color: v.optional(v.string()),
    archived: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updateData } = args;
    
    // If setting as default, remove default from others in same client
    if (args.isDefault) {
      const pipeline = await ctx.db.get(id);
      if (pipeline) {
        const existingDefault = await ctx.db
          .query("pipelines")
          .withIndex("by_client", (q) => q.eq("clientId", pipeline.clientId))
          .filter((q) => q.eq(q.field("isDefault"), true))
          .filter((q) => q.neq(q.field("_id"), id))
          .first();
        
        if (existingDefault) {
          await ctx.db.patch(existingDefault._id, { isDefault: false });
        }
      }
    }
    
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

// Delete pipeline (archive instead)
export const remove = mutation({
  args: { id: v.id("pipelines") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Archive instead of delete to preserve data integrity
    await ctx.db.patch(args.id, { 
      archived: true, 
      isActive: false 
    });
    return null;
  },
});

// Get pipelines by client
export const getByClient = query({
  args: { 
    clientId: v.id("clients"),
    includeArchived: v.optional(v.boolean())
  },
  returns: v.array(v.object({
    _id: v.id("pipelines"),
    _creationTime: v.number(),
    clientId: v.id("clients"),
    propositionId: v.id("propositions"),
    createdBy: v.optional(v.id("profiles")),
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    isDefault: v.optional(v.boolean()),
    color: v.optional(v.string()),
    archived: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("pipelines")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId));

    const pipelines = await query.collect();
    
    // Filter archived unless explicitly requested
    let filtered = pipelines;
    if (!args.includeArchived) {
      filtered = pipelines.filter(p => !p.archived);
    }
    
    // Sort by sortOrder, then by creation time
    return filtered.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      }
      return b._creationTime - a._creationTime;
    });
  },
});