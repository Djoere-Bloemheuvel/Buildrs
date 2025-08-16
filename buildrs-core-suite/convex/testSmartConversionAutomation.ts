import { v } from "convex/values";
import { mutation } from "./_generated/server";

// ===============================
// SMART CONVERSION AUTOMATION TESTING
// ===============================

export const createTestAutomation = mutation({
  args: {
    clientIdentifier: v.string(),
    scheduledTime: v.optional(v.string()) // If not provided, schedule for next minute
  },
  handler: async (ctx, args) => {
    // Calculate scheduled time (next minute if not provided)
    let scheduledTime = args.scheduledTime;
    if (!scheduledTime) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 1);
      scheduledTime = now.toTimeString().slice(0, 5);
    }

    console.log(`🧪 Creating test Smart Conversion automation for ${args.clientIdentifier} at ${scheduledTime}`);

    // Create a test automation
    const automationId = await ctx.runMutation("smartConversionAutomation:createSmartConversionAutomation", {
      name: `Test Smart Conversion - ${new Date().toISOString()}`,
      clientIdentifier: args.clientIdentifier,
      scheduledTime: scheduledTime,
      targetingCriteria: {
        functionGroups: ["Marketing Decision Makers"], // Test with common function group
        industries: ["Technology"],
        countries: ["Netherlands"]
      },
      dailyLimit: 10
    });

    return {
      success: true,
      automationId: automationId.automationId,
      scheduledTime: scheduledTime,
      message: `Test automation created and will run at ${scheduledTime}`
    };
  }
});

export const runAutomationNow = mutation({
  args: {
    automationId: v.id("smartConversionAutomations")
  },
  handler: async (ctx, args) => {
    console.log(`🚀 Running automation ${args.automationId} immediately for testing`);

    try {
      const result = await ctx.runMutation("smartConversionAutomation:executeSmartConversion", {
        automationId: args.automationId
      });

      return {
        success: true,
        result: result,
        message: `Automation executed successfully: ${result.convertedCount} leads converted`
      };

    } catch (error) {
      console.error(`❌ Test automation failed:`, error);
      
      return {
        success: false,
        error: error.message,
        message: `Automation execution failed: ${error.message}`
      };
    }
  }
});

export const checkAutomationStatus = mutation({
  args: {
    clientIdentifier: v.string()
  },
  handler: async (ctx, args) => {
    // Get all automations for this client
    const automations = await ctx.runQuery("smartConversionAutomation:getSmartConversionAutomations", {
      clientIdentifier: args.clientIdentifier
    });

    // Get recent executions
    const recentExecutions = await ctx.db
      .query("smartConversionExecutions")
      .filter((q) => q.eq(q.field("clientIdentifier"), args.clientIdentifier))
      .order("desc")
      .take(10);

    return {
      totalAutomations: automations.length,
      activeAutomations: automations.filter(a => a.isActive).length,
      automations: automations.map(automation => ({
        id: automation._id,
        name: automation.name,
        scheduledTime: automation.scheduledTime,
        isActive: automation.isActive,
        lastExecuted: automation.lastExecutedAt,
        lastStatus: automation.lastExecutionStatus,
        totalExecutions: automation.totalExecutions,
        totalConverted: automation.totalLeadsConverted
      })),
      recentExecutions: recentExecutions.map(execution => ({
        automationId: execution.automationId,
        executedAt: execution.executedAt,
        leadsFound: execution.leadsFound,
        leadsConverted: execution.leadsConverted,
        success: execution.success,
        duration: execution.executionDuration
      }))
    };
  }
});

export const cleanupTestAutomations = mutation({
  args: {
    clientIdentifier: v.string()
  },
  handler: async (ctx, args) => {
    // Find test automations (those with "Test" in the name)
    const automations = await ctx.runQuery("smartConversionAutomation:getSmartConversionAutomations", {
      clientIdentifier: args.clientIdentifier
    });

    const testAutomations = automations.filter(a => a.name.includes("Test"));
    
    console.log(`🧹 Cleaning up ${testAutomations.length} test automations`);

    let deletedCount = 0;
    for (const automation of testAutomations) {
      await ctx.db.delete(automation._id);
      deletedCount++;
    }

    return {
      success: true,
      deletedCount: deletedCount,
      message: `Cleaned up ${deletedCount} test automations`
    };
  }
});