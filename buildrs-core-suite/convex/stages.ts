import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get stages with optional filters
export const list = query({
  args: { 
    pipelineId: v.optional(v.id("pipelines")),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("stages"),
    _creationTime: v.number(),
    pipelineId: v.id("pipelines"),
    name: v.string(),
    description: v.optional(v.string()),
    position: v.number(),
    isWon: v.optional(v.boolean()),
    isLost: v.optional(v.boolean()),
    defaultProbability: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    let stages = ctx.db.query("stages");
    
    if (args.pipelineId) {
      stages = stages.withIndex("by_pipeline", (q) => q.eq("pipelineId", args.pipelineId));
    }
    
    let stagesList = await stages.collect();
    
    // Sort by position
    stagesList = stagesList.sort((a, b) => a.position - b.position);
    
    if (args.limit) {
      stagesList = stagesList.slice(0, args.limit);
    }
    
    return stagesList;
  },
});

// Get stage by ID
export const getById = query({
  args: { id: v.id("stages") },
  returns: v.union(v.object({
    _id: v.id("stages"),
    _creationTime: v.number(),
    pipelineId: v.id("pipelines"),
    name: v.string(),
    description: v.optional(v.string()),
    position: v.number(),
    isWon: v.optional(v.boolean()),
    isLost: v.optional(v.boolean()),
    defaultProbability: v.optional(v.number()),
  }), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create new stage
export const create = mutation({
  args: {
    pipelineId: v.id("pipelines"),
    name: v.string(),
    description: v.optional(v.string()),
    position: v.optional(v.number()),
    isWon: v.optional(v.boolean()),
    isLost: v.optional(v.boolean()),
    defaultProbability: v.optional(v.number()),
  },
  returns: v.id("stages"),
  handler: async (ctx, args) => {
    // If position not provided, put at end
    let position = args.position;
    if (position === undefined) {
      const existingStages = await ctx.db
        .query("stages")
        .withIndex("by_pipeline", (q) => q.eq("pipelineId", args.pipelineId))
        .collect();
      
      position = Math.max(0, ...existingStages.map(s => s.position)) + 1;
    }

    return await ctx.db.insert("stages", {
      ...args,
      position,
    });
  },
});

// Update stage
export const update = mutation({
  args: {
    id: v.id("stages"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    position: v.optional(v.number()),
    isWon: v.optional(v.boolean()),
    isLost: v.optional(v.boolean()),
    defaultProbability: v.optional(v.number()),
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

// Delete stage
export const remove = mutation({
  args: { id: v.id("stages") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check if there are deals in this stage
    const dealsInStage = await ctx.db
      .query("deals")
      .withIndex("by_stage", (q) => q.eq("stageId", args.id))
      .first();
    
    if (dealsInStage) {
      throw new Error("Cannot delete stage with existing deals. Move deals to another stage first.");
    }
    
    await ctx.db.delete(args.id);
    return null;
  },
});

// Get stages by pipeline
export const getByPipeline = query({
  args: { pipelineId: v.id("pipelines") },
  returns: v.array(v.object({
    _id: v.id("stages"),
    _creationTime: v.number(),
    pipelineId: v.id("pipelines"),
    name: v.string(),
    description: v.optional(v.string()),
    position: v.number(),
    isWon: v.optional(v.boolean()),
    isLost: v.optional(v.boolean()),
    defaultProbability: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    const stages = await ctx.db
      .query("stages")
      .withIndex("by_pipeline", (q) => q.eq("pipelineId", args.pipelineId))
      .collect();
    
    // Sort by position
    return stages.sort((a, b) => a.position - b.position);
  },
});

// Create multiple stages at once
export const createBulk = mutation({
  args: {
    stages: v.array(v.object({
      pipelineId: v.id("pipelines"),
      name: v.string(),
      description: v.optional(v.string()),
      position: v.number(),
      isWon: v.optional(v.boolean()),
      isLost: v.optional(v.boolean()),
      defaultProbability: v.optional(v.number()),
    }))
  },
  returns: v.array(v.id("stages")),
  handler: async (ctx, args) => {
    const createdStages = [];
    
    for (const stage of args.stages) {
      const stageId = await ctx.db.insert("stages", stage);
      createdStages.push(stageId);
    }
    
    return createdStages;
  },
});

// Reorder stages
export const reorder = mutation({
  args: {
    stageIds: v.array(v.id("stages")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Update position for each stage
    for (let i = 0; i < args.stageIds.length; i++) {
      await ctx.db.patch(args.stageIds[i], { position: i + 1 });
    }
    
    return null;
  },
});