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
    
    // Find the actual client by domain or fallback to first client
    let actualClient = await ctx.db
      .query("clients")
      .filter((q) => q.eq(q.field("domain"), args.clientIdentifier))
      .first();

    if (!actualClient) {
      // Fallback to first client for testing
      actualClient = await ctx.db.query("clients").first();
    }

    if (!actualClient) {
      throw new Error(`No clients found in database`);
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
    // Find the actual client by domain or fallback to first client
    let actualClient = await ctx.db
      .query("clients")
      .filter((q) => q.eq(q.field("domain"), args.clientIdentifier))
      .first();

    if (!actualClient) {
      // Fallback to first client for testing
      actualClient = await ctx.db.query("clients").first();
    }

    if (!actualClient) {
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