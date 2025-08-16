import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * AUTO-SETUP CLIENT AUTOMATIONS
 * 
 * Automatically creates default automations for new clients
 * Prevents hardcoded client IDs and ensures consistent setup
 */

export const setupDefaultAutomationsForClient = mutation({
  args: {
    clientId: v.string(),
    setupType: v.optional(v.union(v.literal("basic"), v.literal("advanced"), v.literal("enterprise"))),
  },
  handler: async (ctx, args) => {
    console.log(`🔧 Setting up default automations for client: ${args.clientId}`);
    
    const setupType = args.setupType || "basic";
    
    // Get the appropriate template based on setup type
    const templateKey = setupType === "basic" ? "lead-conversion-basic" :
                       setupType === "advanced" ? "lead-conversion-advanced" :
                       "lead-conversion-enterprise";
    
    const template = await ctx.db
      .query("automationTemplates")
      .filter((q) => q.eq(q.field("key"), templateKey))
      .first();
    
    if (!template) {
      throw new Error(`Template ${templateKey} not found. Run seedAutomationTemplates first.`);
    }
    
    // Check if client already has this automation
    const existingAutomation = await ctx.db
      .query("clientAutomations")
      .filter((q) => q.and(
        q.eq(q.field("clientId"), args.clientId),
        q.eq(q.field("templateId"), template._id)
      ))
      .first();
    
    if (existingAutomation) {
      console.log(`⚠️ Client ${args.clientId} already has automation for template ${templateKey}`);
      return {
        message: "Automation already exists",
        automationId: existingAutomation._id,
        skipped: true,
      };
    }
    
    const now = Date.now();
    
    // Create the automation with template defaults
    const automationId = await ctx.db.insert("clientAutomations", {
      clientId: args.clientId,
      templateId: template._id,
      customName: "Smart Conversie Automatisering",
      isActive: true,
      
      // Default targeting (can be customized later)
      targetFunctionGroups: ["Marketing Decision Makers", "Sales Decision Makers"],
      targetIndustries: ["Technology", "Software", "Marketing & Advertising"],
      targetCountries: ["Netherlands", "Belgium"],
      targetEmployeeMin: 10,
      targetEmployeeMax: 500,
      
      // Template defaults
      dailyLimit: template.defaultSettings.dailyLimit,
      executionTime: template.defaultSettings.executionTime,
      
      // Stats
      totalConverted: 0,
      
      // Timestamps
      createdAt: now,
      updatedAt: now,
    });
    
    console.log(`✅ Created automation ${automationId} for client ${args.clientId}`);
    
    return {
      message: "Default automation created successfully",
      automationId,
      templateUsed: templateKey,
      skipped: false,
    };
  },
});

export const setupAllDefaultAutomations = mutation({
  args: {
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`🚀 Setting up ALL default automations for client: ${args.clientId}`);
    
    const results = [];
    
    // Setup basic automation
    const basicResult = await ctx.runMutation("setupClientAutomations:setupDefaultAutomationsForClient", {
      clientId: args.clientId,
      setupType: "basic",
    });
    results.push({ type: "basic", ...basicResult });
    
    return {
      message: "All default automations setup complete",
      results,
      clientId: args.clientId,
    };
  },
});

export const checkClientAutomations = query({
  args: {
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    const automations = await ctx.db
      .query("clientAutomations")
      .filter((q) => q.eq(q.field("clientId"), args.clientId))
      .collect();
    
    const enrichedAutomations = await Promise.all(
      automations.map(async (automation) => {
        const template = await ctx.db.get(automation.templateId);
        return {
          id: automation._id,
          name: automation.customName || template?.name || "Unnamed",
          templateKey: template?.key,
          isActive: automation.isActive,
          executionTime: automation.executionTime,
          dailyLimit: automation.dailyLimit,
          totalConverted: automation.totalConverted,
          lastExecuted: automation.lastExecuted,
        };
      })
    );
    
    return {
      clientId: args.clientId,
      automationCount: automations.length,
      automations: enrichedAutomations,
    };
  },
});

// Utility to fix existing automations with wrong client IDs
export const fixAutomationClientId = mutation({
  args: {
    automationId: v.id("clientAutomations"),
    newClientId: v.string(),
  },
  handler: async (ctx, args) => {
    const automation = await ctx.db.get(args.automationId);
    if (!automation) {
      throw new Error("Automation not found");
    }
    
    console.log(`🔧 Fixing automation ${args.automationId}: ${automation.clientId} → ${args.newClientId}`);
    
    await ctx.db.patch(args.automationId, {
      clientId: args.newClientId,
      updatedAt: Date.now(),
    });
    
    return {
      message: "Automation client ID updated",
      automationId: args.automationId,
      oldClientId: automation.clientId,
      newClientId: args.newClientId,
    };
  },
});