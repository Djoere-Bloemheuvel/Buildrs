import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// ===============================
// BULLETPROOF SMART CONVERSION AUTOMATION
// ===============================

/**
 * Simple, robust automation system for Smart Conversion
 * 
 * Features:
 * - Simple scheduling with exact time matching
 * - Bulletproof error handling
 * - Clear logging and monitoring
 * - Direct integration with exactLeadConversion
 * - Easy to debug and maintain
 */

// ===============================
// AUTOMATION SCHEDULING
// ===============================

export const processScheduledConversions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM" format
    const currentTimestamp = Date.now();

    console.log(`🤖 Smart Conversion Automation running at ${currentTime}`);

    try {
      // Get all active Smart Conversion automations scheduled for current time
      const scheduledAutomations = await ctx.db
        .query("smartConversionAutomations")
        .filter((q) => q.and(
          q.eq(q.field("scheduledTime"), currentTime),
          q.eq(q.field("isActive"), true),
          q.or(
            q.eq(q.field("isPaused"), undefined),
            q.eq(q.field("isPaused"), false)
          )
        ))
        .collect();

      console.log(`🎯 Found ${scheduledAutomations.length} Smart Conversion automations for ${currentTime}`);

      if (scheduledAutomations.length === 0) {
        return {
          timestamp: currentTimestamp,
          currentTime,
          automationsFound: 0,
          automationsExecuted: 0,
          results: []
        };
      }

      const results = [];

      // Process each automation
      for (const automation of scheduledAutomations) {
        try {
          console.log(`⚡ Processing Smart Conversion: ${automation.name} for client ${automation.clientIdentifier}`);

          const result = await ctx.runMutation("smartConversionAutomation:executeSmartConversion", {
            automationId: automation._id
          });

          results.push({
            automationId: automation._id,
            automationName: automation.name,
            clientIdentifier: automation.clientIdentifier,
            ...result
          });

          console.log(`✅ Smart Conversion ${automation.name}: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.convertedCount || 0} leads converted`);

        } catch (error) {
          console.error(`❌ Error processing Smart Conversion ${automation._id}:`, error);
          
          results.push({
            automationId: automation._id,
            automationName: automation.name || 'Unknown',
            clientIdentifier: automation.clientIdentifier || 'Unknown',
            success: false,
            error: error.message,
            convertedCount: 0
          });
        }
      }

      return {
        timestamp: currentTimestamp,
        currentTime,
        automationsFound: scheduledAutomations.length,
        automationsExecuted: results.filter(r => r.success).length,
        results
      };

    } catch (error) {
      console.error(`💥 Critical error in Smart Conversion automation scheduler:`, error);
      
      return {
        timestamp: currentTimestamp,
        currentTime,
        automationsFound: 0,
        automationsExecuted: 0,
        error: error.message,
        results: []
      };
    }
  }
});

// ===============================
// SMART CONVERSION EXECUTION
// ===============================

export const executeSmartConversion = mutation({
  args: {
    automationId: v.id("smartConversionAutomations")
  },
  handler: async (ctx, args) => {
    const executionStart = Date.now();
    
    try {
      // Get automation configuration
      const automation = await ctx.db.get(args.automationId);
      if (!automation) {
        throw new Error("Automation not found");
      }

      if (!automation.isActive) {
        throw new Error("Automation is not active");
      }

      if (automation.isPaused) {
        throw new Error("Automation is paused");
      }

      console.log(`🚀 Executing Smart Conversion: ${automation.name}`);

      // Get matching leads using exact lead conversion system
      const leadMatches = await ctx.runMutation("exactLeadConversion:getExactMatchLeads", {
        functionGroups: automation.targetingCriteria?.functionGroups,
        industries: automation.targetingCriteria?.industries,
        countries: automation.targetingCriteria?.countries,
        minEmployeeCount: automation.targetingCriteria?.minEmployeeCount,
        maxEmployeeCount: automation.targetingCriteria?.maxEmployeeCount,
        maxResults: automation.dailyLimit || 50,
        clientIdentifier: automation.clientIdentifier
      });

      if (leadMatches.totalMatches === 0) {
        console.log(`📭 No matching leads found for automation ${automation.name}`);
        
        // Update last execution
        await ctx.db.patch(args.automationId, {
          lastExecutedAt: executionStart,
          lastExecutionStatus: "no_leads",
          lastExecutionResult: {
            success: true,
            leadsFound: 0,
            leadsConverted: 0,
            message: "No matching leads found"
          }
        });

        return {
          success: true,
          status: "no_leads",
          leadsFound: 0,
          convertedCount: 0,
          message: "No matching leads found"
        };
      }

      // Convert the leads
      const conversionResult = await ctx.runMutation("exactLeadConversion:convertExactMatchLeads", {
        leadIds: leadMatches.leads.map(lead => lead.leadId),
        clientIdentifier: automation.clientIdentifier
      });

      // Update automation record
      await ctx.db.patch(args.automationId, {
        lastExecutedAt: executionStart,
        lastExecutionStatus: conversionResult.success ? "success" : "failed",
        lastExecutionResult: {
          success: conversionResult.success,
          leadsFound: leadMatches.totalMatches,
          leadsConverted: conversionResult.convertedCount,
          errors: conversionResult.errors || []
        },
        totalExecutions: (automation.totalExecutions || 0) + 1,
        totalLeadsConverted: (automation.totalLeadsConverted || 0) + conversionResult.convertedCount
      });

      // Create execution log
      await ctx.db.insert("smartConversionExecutions", {
        automationId: args.automationId,
        clientIdentifier: automation.clientIdentifier,
        executedAt: executionStart,
        executionDuration: Date.now() - executionStart,
        leadsFound: leadMatches.totalMatches,
        leadsConverted: conversionResult.convertedCount,
        success: conversionResult.success,
        errors: conversionResult.errors || [],
        targetingCriteria: automation.targetingCriteria
      });

      console.log(`🎉 Smart Conversion ${automation.name} completed: ${conversionResult.convertedCount} leads converted`);

      return {
        success: conversionResult.success,
        status: "completed",
        leadsFound: leadMatches.totalMatches,
        convertedCount: conversionResult.convertedCount,
        skippedCount: conversionResult.skippedCount || 0,
        errors: conversionResult.errors || []
      };

    } catch (error) {
      console.error(`❌ Smart Conversion execution failed:`, error);

      // Update automation with error
      try {
        await ctx.db.patch(args.automationId, {
          lastExecutedAt: executionStart,
          lastExecutionStatus: "error",
          lastExecutionResult: {
            success: false,
            error: error.message,
            leadsFound: 0,
            leadsConverted: 0
          }
        });
      } catch (updateError) {
        console.error(`Failed to update automation record:`, updateError);
      }

      return {
        success: false,
        status: "error",
        error: error.message,
        leadsFound: 0,
        convertedCount: 0
      };
    }
  }
});

// ===============================
// AUTOMATION MANAGEMENT
// ===============================

export const createSmartConversionAutomation = mutation({
  args: {
    name: v.string(),
    clientIdentifier: v.string(),
    scheduledTime: v.string(), // "HH:MM" format
    targetingCriteria: v.object({
      functionGroups: v.optional(v.array(v.string())),
      industries: v.optional(v.array(v.string())),
      countries: v.optional(v.array(v.string())),
      minEmployeeCount: v.optional(v.number()),
      maxEmployeeCount: v.optional(v.number())
    }),
    dailyLimit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(args.scheduledTime)) {
      throw new Error("Invalid time format. Use HH:MM (24-hour format)");
    }

    const automationId = await ctx.db.insert("smartConversionAutomations", {
      name: args.name,
      clientIdentifier: args.clientIdentifier,
      scheduledTime: args.scheduledTime,
      targetingCriteria: args.targetingCriteria,
      dailyLimit: args.dailyLimit || 50,
      isActive: true,
      isPaused: false,
      createdAt: Date.now(),
      totalExecutions: 0,
      totalLeadsConverted: 0
    });

    console.log(`✅ Created Smart Conversion automation: ${args.name} (${args.scheduledTime})`);

    return {
      automationId,
      message: `Smart Conversion automation "${args.name}" created successfully`
    };
  }
});

export const getSmartConversionAutomations = query({
  args: {
    clientIdentifier: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    let automations;
    
    if (args.clientIdentifier) {
      automations = await ctx.db
        .query("smartConversionAutomations")
        .filter((q) => q.eq(q.field("clientIdentifier"), args.clientIdentifier))
        .collect();
    } else {
      automations = await ctx.db
        .query("smartConversionAutomations")
        .collect();
    }

    return automations;
  }
});

export const toggleSmartConversionAutomation = mutation({
  args: {
    automationId: v.id("smartConversionAutomations"),
    isActive: v.boolean()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.automationId, {
      isActive: args.isActive,
      isPaused: false // Clear pause when toggling
    });

    console.log(`🔄 Smart Conversion automation ${args.automationId} ${args.isActive ? 'activated' : 'deactivated'}`);

    return {
      success: true,
      message: `Automation ${args.isActive ? 'activated' : 'deactivated'} successfully`
    };
  }
});