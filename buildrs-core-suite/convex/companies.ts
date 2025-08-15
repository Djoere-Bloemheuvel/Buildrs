import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all companies with optional search
export const list = query({
  args: { 
    search: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("companies"),
    _creationTime: v.number(),
    name: v.string(),
    domain: v.optional(v.string()),
    website: v.optional(v.string()),
    industryLabel: v.optional(v.string()),
    subindustryLabel: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    companySize: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    let companies = ctx.db.query("companies");
    
    if (args.search) {
      // In Convex, we'll need to use withSearchIndex for full-text search
      // For now, we'll filter by name
      companies = companies.filter((q) => 
        q.or(
          q.eq(q.field("name"), args.search),
          q.eq(q.field("domain"), args.search)
        )
      );
    }
    
    companies = companies.order("asc");
    
    if (args.limit) {
      return await companies.take(args.limit);
    }
    
    return await companies.collect();
  },
});

// Get company by ID
export const getById = query({
  args: { id: v.id("companies") },
  returns: v.union(v.object({
    _id: v.id("companies"),
    _creationTime: v.number(),
    name: v.string(),
    domain: v.optional(v.string()),
    website: v.optional(v.string()),
    industrySlug: v.optional(v.string()),
    industryLabel: v.optional(v.string()),
    subindustryLabel: v.optional(v.string()),
    companySize: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    companySummary: v.optional(v.string()),
    companyKeywords: v.optional(v.array(v.string())),
    companyCommonProblems: v.optional(v.string()),
    companyTargetCustomers: v.optional(v.string()),
    companyUniqueCharacteristics: v.optional(v.array(v.string())),
    companyUniqueQualities: v.optional(v.string()),
    companyLinkedinUrl: v.optional(v.string()),
    companyTechnologies: v.optional(v.object({})),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    fullEnrichment: v.optional(v.boolean()),
    lastUpdatedAt: v.optional(v.number()),
  }), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create new company
export const create = mutation({
  args: {
    name: v.string(),
    domain: v.optional(v.string()),
    website: v.optional(v.string()),
    industrySlug: v.optional(v.string()),
    industryLabel: v.optional(v.string()),
    subindustryLabel: v.optional(v.string()),
    companySize: v.optional(v.number()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  returns: v.id("companies"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("companies", {
      ...args,
      tags: [],
      fullEnrichment: false,
      lastUpdatedAt: Date.now(),
    });
  },
});

// Update company
export const update = mutation({
  args: {
    id: v.id("companies"),
    name: v.optional(v.string()),
    domain: v.optional(v.string()),
    website: v.optional(v.string()),
    industrySlug: v.optional(v.string()),
    industryLabel: v.optional(v.string()),
    subindustryLabel: v.optional(v.string()),
    companySize: v.optional(v.number()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    companySummary: v.optional(v.string()),
    companyKeywords: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updateData } = args;
    
    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(cleanData).length > 0) {
      await ctx.db.patch(id, {
        ...cleanData,
        lastUpdatedAt: Date.now(),
      });
    }
    
    return null;
  },
});

// Delete company
export const remove = mutation({
  args: { id: v.id("companies") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});