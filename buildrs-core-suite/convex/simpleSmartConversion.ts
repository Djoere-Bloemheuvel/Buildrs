import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

// ===============================
// SIMPLE SMART CONVERSION AUTOMATION
// ===============================

/**
 * Ultra-simple Smart Conversion system:
 * - Uses existing clientAutomations table
 * - No scheduled time complexity - fixed cron intervals
 * - Just on/off switch per client
 * - System decides when to run (every 6 hours)
 */

// ===============================
// SIMPLE AUTOMATION EXECUTION
// ===============================

export const runAllSmartConversions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const currentHour = new Date().getHours();
    
    console.log(`🤖 Simple Smart Conversion running at hour ${currentHour}`);

    try {
      // Get ALL active Smart Conversion automations (no time filtering)
      const smartConversions = await ctx.db
        .query("clientAutomations")
        .filter((q) => q.and(
          q.eq(q.field("isActive"), true),
          q.or(
            q.eq(q.field("isPaused"), undefined),
            q.eq(q.field("isPaused"), false)
          ),
          // Look for Smart Conversion type automations
          q.or(
            q.eq(q.field("customName"), "Smart Conversion"),
            q.eq(q.field("targetingCriteria"), q.neq(undefined)) // Has targeting criteria
          )
        ))
        .collect();

      console.log(`🎯 Found ${smartConversions.length} active Smart Conversion automations`);

      if (smartConversions.length === 0) {
        return {
          timestamp: now,
          currentHour,
          automationsFound: 0,
          automationsExecuted: 0,
          results: []
        };
      }

      const results = [];

      // Process each Smart Conversion automation
      for (const automation of smartConversions) {
        try {
          console.log(`⚡ Processing Smart Conversion for client ${automation.clientId}`);

          const result = await ctx.runMutation("simpleSmartConversion:executeSmartConversionForClient", {
            clientAutomationId: automation._id
          });

          results.push({
            automationId: automation._id,
            clientId: automation.clientId,
            customName: automation.customName || 'Smart Conversion',
            ...result
          });

          console.log(`✅ Smart Conversion for ${automation.customName || 'client'}: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.convertedCount || 0} leads converted`);

        } catch (error) {
          console.error(`❌ Error processing Smart Conversion ${automation._id}:`, error);
          
          results.push({
            automationId: automation._id,
            clientId: automation.clientId,
            customName: automation.customName || 'Smart Conversion',
            success: false,
            error: error.message,
            convertedCount: 0
          });
        }
      }

      return {
        timestamp: now,
        currentHour,
        automationsFound: smartConversions.length,
        automationsExecuted: results.filter(r => r.success).length,
        results
      };

    } catch (error) {
      console.error(`💥 Critical error in Simple Smart Conversion scheduler:`, error);
      
      return {
        timestamp: now,
        currentHour,
        automationsFound: 0,
        automationsExecuted: 0,
        error: error.message,
        results: []
      };
    }
  }
});

// ===============================
// EXECUTE FOR SINGLE CLIENT
// ===============================

export const executeSmartConversionForClient = mutation({
  args: {
    clientAutomationId: v.id("clientAutomations")
  },
  handler: async (ctx, args) => {
    const executionStart = Date.now();
    
    try {
      // Get automation configuration
      const automation = await ctx.db.get(args.clientAutomationId);
      if (!automation) {
        throw new Error("Smart Conversion automation not found");
      }

      if (!automation.isActive) {
        throw new Error("Smart Conversion automation is not active");
      }

      if (automation.isPaused) {
        throw new Error("Smart Conversion automation is paused");
      }

      console.log(`🚀 Executing Simple Smart Conversion for client ${automation.clientId}`);

      // Extract targeting criteria (use defaults if not set)
      const criteria = automation.targetingCriteria || {};
      const dailyLimit = automation.dailyLimit || 10;

      // Get client identifier - try different approaches
      let clientIdentifier = automation.clientId;
      
      // If clientId is not a string, get the actual client
      if (clientIdentifier && typeof clientIdentifier === 'string' && clientIdentifier.startsWith('j')) {
        // It's already a Convex ID, use it directly
      } else {
        // Try to get client by ID
        try {
          const client = await ctx.db.get(automation.clientId as any);
          if (client) {
            clientIdentifier = client.domain || automation.clientId;
          }
        } catch (error) {
          console.log(`Using clientId directly: ${automation.clientId}`);
        }
      }

      // Get matching leads using exact lead conversion system
      const leadMatches = await ctx.runMutation("exactLeadConversion:getExactMatchLeads", {
        functionGroups: criteria.functionGroups,
        industries: criteria.industries, 
        countries: criteria.countries,
        minEmployeeCount: criteria.minEmployeeCount,
        maxEmployeeCount: criteria.maxEmployeeCount,
        maxResults: dailyLimit,
        clientIdentifier: clientIdentifier
      });

      if (leadMatches.totalMatches === 0) {
        console.log(`📭 No matching leads found for Smart Conversion`);
        
        // Update last execution
        await ctx.db.patch(args.clientAutomationId, {
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
        clientIdentifier: clientIdentifier
      });

      // Update automation record
      await ctx.db.patch(args.clientAutomationId, {
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

      console.log(`🎉 Simple Smart Conversion completed: ${conversionResult.convertedCount} leads converted`);

      return {
        success: conversionResult.success,
        status: "completed",
        leadsFound: leadMatches.totalMatches,
        convertedCount: conversionResult.convertedCount,
        skippedCount: conversionResult.skippedCount || 0,
        errors: conversionResult.errors || []
      };

    } catch (error) {
      console.error(`❌ Simple Smart Conversion execution failed:`, error);

      // Update automation with error
      try {
        await ctx.db.patch(args.clientAutomationId, {
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
// SIMPLE AUTOMATION MANAGEMENT
// ===============================

export const createSimpleSmartConversion = mutation({
  args: {
    name: v.string(),
    clientIdentifier: v.string(),
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
    console.log(`🚀 Creating Smart Conversion for identifier: "${args.clientIdentifier}"`);
    
    // Validate input
    if (!args.clientIdentifier || args.clientIdentifier.trim() === '') {
      throw new Error(`Client identifier is empty or invalid. Received: "${args.clientIdentifier}"`);
    }
    
    // Find client by identifier  
    let client = null;
    try {
      client = await ctx.db.get(args.clientIdentifier as any);
      console.log(`✅ Found client by ID: ${client?.name} (${args.clientIdentifier})`);
    } catch (error) {
      console.log(`🔍 Client identifier "${args.clientIdentifier}" is not a valid Convex ID, trying other fields...`);
    }
    
    if (!client) {
      client = await ctx.db
        .query("clients")
        .filter((q) => q.eq(q.field("domain"), args.clientIdentifier))
        .first();
      if (client) console.log(`✅ Found client by domain: ${client.name}`);
    }
    
    if (!client) {
      // Try by email as fallback
      client = await ctx.db
        .query("clients")
        .filter((q) => q.eq(q.field("email"), args.clientIdentifier))
        .first();
      if (client) console.log(`✅ Found client by email: ${client.name}`);
    }
    
    if (!client) {
      throw new Error(`Client with identifier "${args.clientIdentifier}" does not exist. Please check if you're logged in correctly.`);
    }

    const clientId = client._id;

    // Check if Smart Conversion automation already exists for this client
    const existingAutomation = await ctx.db
      .query("clientAutomations")
      .filter((q) => q.and(
        q.eq(q.field("clientId"), clientId),
        q.eq(q.field("customName"), "Smart Conversion")
      ))
      .first();

    if (existingAutomation) {
      // Update existing automation
      await ctx.db.patch(existingAutomation._id, {
        targetingCriteria: args.targetingCriteria,
        dailyLimit: args.dailyLimit || 10,
        isActive: true,
        isPaused: false,
        customName: args.name
      });

      console.log(`✅ Updated existing Smart Conversion automation for client: ${client.name}`);

      return {
        automationId: existingAutomation._id,
        message: `Smart Conversion automation "${args.name}" updated successfully`
      };
    } else {
      // Create new automation using existing schema with ONLY required fields
      const now = Date.now();
      const automationId = await ctx.db.insert("clientAutomations", {
        clientId: clientId,
        // templateId is now optional for simplified system
        customName: args.name,
        isActive: true,
        isPaused: false,
        targetingCriteria: args.targetingCriteria,
        dailyLimit: args.dailyLimit || 10,
        totalConverted: 0, // Required field
        createdAt: now, // Required field
        updatedAt: now, // Required field
        // Remove totalLeadsConverted - not in schema!
      });

      console.log(`✅ Created new Smart Conversion automation: ${args.name}`);

      return {
        automationId,
        message: `Smart Conversion automation "${args.name}" created successfully`
      };
    }
  }
});

export const getSmartConversions = query({
  args: {
    clientIdentifier: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    if (!args.clientIdentifier) {
      // Get all Smart Conversion automations
      return await ctx.db
        .query("clientAutomations")
        .filter((q) => q.eq(q.field("customName"), "Smart Conversion"))
        .collect();
    }

    // Find client first
    let client = null;
    try {
      client = await ctx.db.get(args.clientIdentifier as any);
    } catch (error) {
      // Try by domain
      client = await ctx.db
        .query("clients")
        .filter((q) => q.eq(q.field("domain"), args.clientIdentifier))
        .first();
    }

    if (!client) {
      return [];
    }

    // Get Smart Conversion automations for this client
    return await ctx.db
      .query("clientAutomations")
      .filter((q) => q.and(
        q.eq(q.field("clientId"), client._id),
        q.eq(q.field("customName"), "Smart Conversion")
      ))
      .collect();
  }
});

export const toggleSmartConversion = mutation({
  args: {
    automationId: v.id("clientAutomations"),
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
      message: `Smart Conversion ${args.isActive ? 'activated' : 'deactivated'} successfully`
    };
  }
});