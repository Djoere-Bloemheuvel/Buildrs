import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ===============================
// AUTOMATION TEMPLATES
// ===============================

export const getAutomationTemplates = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("automationTemplates")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

export const createAutomationTemplate = mutation({
  args: {
    key: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    defaultSettings: v.object({
      dailyLimit: v.number(),
      executionTime: v.string(),
      targetingOptions: v.array(v.string()),
    }),
    version: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert("automationTemplates", {
      ...args,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// ===============================
// CLIENT AUTOMATIONS
// ===============================

export const getClientAutomations = query({
  args: {
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    const clientAutomations = await ctx.db
      .query("clientAutomations")
      .filter((q) => q.eq(q.field("clientId"), args.clientId))
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

export const createClientAutomation = mutation({
  args: {
    clientId: v.string(),
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
    // VALIDATION: Ensure client exists
    const clientExists = await ctx.db
      .query("clients")
      .filter((q) => q.eq(q.field("_id"), args.clientId as any))
      .first();
    
    if (!clientExists) {
      throw new Error(`Client with ID ${args.clientId} does not exist. Use a valid client ID from the clients table.`);
    }
    
    console.log(`✅ Creating automation for verified client: ${clientExists.name} (${args.clientId})`);
    
    const now = Date.now();
    
    return await ctx.db.insert("clientAutomations", {
      clientId: args.clientId,
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

export const updateClientAutomation = mutation({
  args: {
    automationId: v.id("clientAutomations"),
    customName: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    targetFunctionGroups: v.optional(v.array(v.string())),
    targetIndustries: v.optional(v.array(v.string())),
    targetCountries: v.optional(v.array(v.string())),
    targetEmployeeMin: v.optional(v.number()),
    targetEmployeeMax: v.optional(v.number()),
    dailyLimit: v.optional(v.number()),
    executionTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { automationId, ...updates } = args;
    
    return await ctx.db.patch(automationId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const toggleClientAutomation = mutation({
  args: {
    automationId: v.id("clientAutomations"),
  },
  handler: async (ctx, args) => {
    const automation = await ctx.db.get(args.automationId);
    if (!automation) {
      throw new Error("Automation not found");
    }
    
    return await ctx.db.patch(args.automationId, {
      isActive: !automation.isActive,
      updatedAt: Date.now(),
    });
  },
});

export const deleteClientAutomation = mutation({
  args: {
    automationId: v.id("clientAutomations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.automationId);
  },
});

// ===============================
// AUTOMATION EXECUTION
// ===============================

export const executeClientAutomation = mutation({
  args: {
    clientAutomationId: v.id("clientAutomations"),
  },
  handler: async (ctx, args) => {
    const automation = await ctx.db.get(args.clientAutomationId);
    if (!automation || !automation.isActive) {
      throw new Error("Automation not found or inactive");
    }

    const template = await ctx.db.get(automation.templateId);
    if (!template) {
      throw new Error("Automation template not found");
    }

    const now = Date.now();
    
    try {
      // Get target audience leads using existing leadConversion logic
      const targetAudienceFunction = ctx.runMutation("leadConversion:getTargetAudienceLeads", {
        functionGroups: automation.targetFunctionGroups,
        industries: automation.targetIndustries,
        countries: automation.targetCountries,
        minEmployeeCount: automation.targetEmployeeMin,
        maxEmployeeCount: automation.targetEmployeeMax,
        maxResults: automation.dailyLimit,
        clientIdentifier: automation.clientId,
      });

      const targetResult = await targetAudienceFunction;
      const leadsToConvert = targetResult.leads.slice(0, automation.dailyLimit);
      
      if (leadsToConvert.length === 0) {
        // Log successful execution with 0 conversions
        await ctx.db.insert("automationExecutions", {
          clientAutomationId: args.clientAutomationId,
          clientId: automation.clientId,
          templateId: automation.templateId,
          executedAt: now,
          leadsProcessed: 0,
          leadsConverted: 0,
          success: true,
          executionDetails: {
            criteria: {
              targetFunctionGroups: automation.targetFunctionGroups,
              targetIndustries: automation.targetIndustries,
              targetCountries: automation.targetCountries,
              targetEmployeeMin: automation.targetEmployeeMin,
              targetEmployeeMax: automation.targetEmployeeMax,
            },
            matchedLeads: 0,
            convertedLeadIds: [],
          },
        });
        
        // Update last executed
        await ctx.db.patch(args.clientAutomationId, {
          lastExecuted: now,
          updatedAt: now,
        });
        
        return { success: true, convertedCount: 0, message: "No leads found matching criteria" };
      }

      // Convert the leads
      const leadIds = leadsToConvert.map(lead => lead.leadId);
      const conversionResult = await ctx.runMutation("leadConversion:convertLeadsToContacts", {
        leadIds: leadIds as any[],
        clientIdentifier: automation.clientId,
      });

      // Log execution
      await ctx.db.insert("automationExecutions", {
        clientAutomationId: args.clientAutomationId,
        clientId: automation.clientId,
        templateId: automation.templateId,
        executedAt: now,
        leadsProcessed: leadsToConvert.length,
        leadsConverted: conversionResult.convertedCount,
        success: conversionResult.success,
        errorMessage: conversionResult.success ? undefined : conversionResult.errors.join(", "),
        executionDetails: {
          criteria: {
            targetFunctionGroups: automation.targetFunctionGroups,
            targetIndustries: automation.targetIndustries,
            targetCountries: automation.targetCountries,
            targetEmployeeMin: automation.targetEmployeeMin,
            targetEmployeeMax: automation.targetEmployeeMax,
          },
          matchedLeads: targetResult.totalMatches,
          convertedLeadIds: leadIds,
        },
      });

      // Update automation stats
      await ctx.db.patch(args.clientAutomationId, {
        lastExecuted: now,
        totalConverted: automation.totalConverted + conversionResult.convertedCount,
        updatedAt: now,
      });

      return {
        success: conversionResult.success,
        convertedCount: conversionResult.convertedCount,
        totalMatches: targetResult.totalMatches,
        errors: conversionResult.errors,
      };

    } catch (error) {
      // Log failed execution
      await ctx.db.insert("automationExecutions", {
        clientAutomationId: args.clientAutomationId,
        clientId: automation.clientId,
        templateId: automation.templateId,
        executedAt: now,
        leadsProcessed: 0,
        leadsConverted: 0,
        success: false,
        errorMessage: error.message,
      });

      throw error;
    }
  },
});

export const getAutomationExecutions = query({
  args: {
    clientAutomationId: v.optional(v.id("clientAutomations")),
    clientId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("automationExecutions");
    
    if (args.clientAutomationId) {
      query = query.withIndex("by_client_automation", (q) => 
        q.eq("clientAutomationId", args.clientAutomationId)
      );
    } else if (args.clientId) {
      query = query.withIndex("by_client", (q) => 
        q.eq("clientId", args.clientId as Id<"clients">)
      );
    }
    
    const executions = await query
      .order("desc")
      .take(args.limit || 50);
    
    return executions;
  },
});