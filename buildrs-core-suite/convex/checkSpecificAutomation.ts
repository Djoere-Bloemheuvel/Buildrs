import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const checkAutomationById = query({
  args: {
    automationId: v.id("clientAutomations"),
  },
  handler: async (ctx, args) => {
    const automation = await ctx.db.get(args.automationId);
    
    if (!automation) {
      return { error: "Automation not found" };
    }

    const template = await ctx.db.get(automation.templateId);
    const client = await ctx.db.get(automation.clientId);

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM" format

    return {
      automation,
      template,
      client,
      currentTime,
      shouldRun: automation.executionTime === currentTime && automation.isActive && !automation.isPaused,
      debug: {
        executionTime: automation.executionTime,
        isActive: automation.isActive,
        isPaused: automation.isPaused,
        currentTime,
        timeMatch: automation.executionTime === currentTime,
      }
    };
  },
});

export const manuallyTriggerAutomation = mutation({
  args: {
    automationId: v.id("clientAutomations"),
  },
  handler: async (ctx, args) => {
    console.log(`🔧 Manually triggering automation: ${args.automationId}`);
    
    try {
      const result = await ctx.runMutation("automationEngine:executeAutomationSafely", {
        clientAutomationId: args.automationId,
        executionType: "manual",
        triggerSource: "debug",
      });

      console.log(`📋 Manual execution result:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Manual execution failed:`, error);
      return {
        success: false,
        errorMessage: error.message,
        errorCode: "MANUAL_EXECUTION_ERROR"
      };
    }
  },
});

export const checkSchedulerStatus = query({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Get all active automations for current time
    const activeAutomations = await ctx.db
      .query("clientAutomations")
      .withIndex("by_execution_time", (q) => q.eq("executionTime", currentTime))
      .filter((q) => q.and(
        q.eq(q.field("isActive"), true),
        q.or(
          q.eq(q.field("isPaused"), undefined),
          q.eq(q.field("isPaused"), false)
        )
      ))
      .collect();

    return {
      currentTime,
      currentTimestamp: Date.now(),
      activeAutomationsForCurrentTime: activeAutomations.length,
      automations: activeAutomations.map(a => ({
        id: a._id,
        customName: a.customName,
        executionTime: a.executionTime,
        isActive: a.isActive,
        isPaused: a.isPaused,
      }))
    };
  },
});