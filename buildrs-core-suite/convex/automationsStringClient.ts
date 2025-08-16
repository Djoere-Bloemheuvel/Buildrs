import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ===============================
// CLIENT AUTOMATIONS WITH STRING CLIENT IDS
// ===============================

export const createClientAutomationWithStringId = mutation({
  args: {
    clientIdentifier: v.string(),
    templateId: v.id("automationTemplates"),
    customName: v.optional(v.string()),
    targetFunctionGroups: v.optional(v.array(v.string())),
    targetIndustries: v.optional(v.array(v.string())),
    targetCountries: v.optional(v.array(v.string())),
    targetEmployeeMin: v.optional(v.number()),
    targetEmployeeMax: v.optional(v.number()),
    dailyLimit: v.number(),
    executionTime: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Find client by identifier (could be _id, domain, email, or name) - NO FALLBACK!
    let actualClient = null;
    
    // First try as direct Convex ID
    try {
      actualClient = await ctx.db.get(args.clientIdentifier as any);
      console.log(`✅ Found client by ID: ${actualClient?.name} (${args.clientIdentifier})`);
    } catch (error) {
      console.log(`🔍 Client identifier ${args.clientIdentifier} is not a valid Convex ID, trying other fields...`);
    }
    
    // If not found by ID, try by domain
    if (!actualClient) {
      actualClient = await ctx.db
        .query("clients")
        .filter((q) => q.eq(q.field("domain"), args.clientIdentifier))
        .first();
      if (actualClient) console.log(`✅ Found client by domain: ${actualClient.name}`);
    }
    
    // If not found by domain, try by email
    if (!actualClient) {
      actualClient = await ctx.db
        .query("clients")
        .filter((q) => q.eq(q.field("email"), args.clientIdentifier))
        .first();
      if (actualClient) console.log(`✅ Found client by email: ${actualClient.name}`);
    }

    if (!actualClient) {
      throw new Error(`Client with identifier ${args.clientIdentifier} does not exist - NO FALLBACK ALLOWED`);
    }

    console.log(`Creating automation for client: ${actualClient._id} (${actualClient.domain})`);
    
    // Create automation with the actual client ID
    return await ctx.db.insert("clientAutomations", {
      clientId: actualClient._id, // Use actual client ID
      templateId: args.templateId,
      customName: args.customName,
      isActive: true,
      targetFunctionGroups: args.targetFunctionGroups,
      targetIndustries: args.targetIndustries,
      targetCountries: args.targetCountries,
      targetEmployeeMin: args.targetEmployeeMin,
      targetEmployeeMax: args.targetEmployeeMax,
      dailyLimit: args.dailyLimit,
      executionTime: args.executionTime,
      totalConverted: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getClientAutomationsWithStringId = query({
  args: {
    clientIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    // Find client by identifier (could be _id, domain, email, or name) - NO FALLBACK!
    let actualClient = null;
    
    // First try as direct Convex ID
    try {
      actualClient = await ctx.db.get(args.clientIdentifier as any);
      console.log(`✅ Found client by ID for query: ${actualClient?.name} (${args.clientIdentifier})`);
    } catch (error) {
      console.log(`🔍 Client identifier ${args.clientIdentifier} is not a valid Convex ID, trying other fields...`);
    }
    
    // If not found by ID, try by domain
    if (!actualClient) {
      actualClient = await ctx.db
        .query("clients")
        .filter((q) => q.eq(q.field("domain"), args.clientIdentifier))
        .first();
      if (actualClient) console.log(`✅ Found client by domain for query: ${actualClient.name}`);
    }
    
    // If not found by domain, try by email
    if (!actualClient) {
      actualClient = await ctx.db
        .query("clients")
        .filter((q) => q.eq(q.field("email"), args.clientIdentifier))
        .first();
      if (actualClient) console.log(`✅ Found client by email for query: ${actualClient.name}`);
    }

    if (!actualClient) {
      console.error(`❌ Client with identifier ${args.clientIdentifier} does not exist - returning empty array`);
      return [];
    }

    const clientAutomations = await ctx.db
      .query("clientAutomations")
      .withIndex("by_client", (q) => q.eq("clientId", actualClient._id))
      .collect();

    // Enrich with template data
    const enrichedAutomations = await Promise.all(
      clientAutomations.map(async (automation) => {
        const template = await ctx.db.get(automation.templateId);
        return {
          ...automation,
          template,
          displayName: automation.customName || template?.name || "Unnamed Automation",
        };
      })
    );

    return enrichedAutomations;
  },
});