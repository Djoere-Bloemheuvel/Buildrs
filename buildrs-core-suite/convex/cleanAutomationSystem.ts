import { mutation, query } from "./_generated/server";

/**
 * CLEAN AUTOMATION SYSTEM
 * Remove all existing automations and start fresh
 */

export const removeAllAutomations = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("🧹 Cleaning all automations...");
    
    // Get all client automations
    const automations = await ctx.db.query("clientAutomations").collect();
    console.log(`📋 Found ${automations.length} automations to remove`);
    
    // Remove all automations
    for (const automation of automations) {
      console.log(`🗑️ Removing automation: ${automation.customName || automation._id}`);
      await ctx.db.delete(automation._id);
    }
    
    // Get all execution records
    const executions = await ctx.db.query("automationExecutions").collect();
    console.log(`📋 Found ${executions.length} execution records to remove`);
    
    // Remove all execution records
    for (const execution of executions) {
      await ctx.db.delete(execution._id);
    }
    
    console.log("✅ All automations and executions removed");
    
    return {
      message: "All automations cleaned",
      automationsRemoved: automations.length,
      executionsRemoved: executions.length,
    };
  },
});

export const listAllAutomationsDetailed = query({
  args: {},
  handler: async (ctx) => {
    const automations = await ctx.db.query("clientAutomations").collect();
    
    const detailed = await Promise.all(
      automations.map(async (automation) => {
        const client = await ctx.db.get(automation.clientId as any);
        const template = await ctx.db.get(automation.templateId);
        
        return {
          id: automation._id,
          name: automation.customName || template?.name || "Unnamed",
          clientId: automation.clientId,
          clientName: client?.name || "Unknown",
          clientDomain: client?.domain || "Unknown",
          executionTime: automation.executionTime,
          isActive: automation.isActive,
          dailyLimit: automation.dailyLimit,
          totalConverted: automation.totalConverted || 0,
          lastExecuted: automation.lastExecuted,
        };
      })
    );
    
    return {
      totalAutomations: automations.length,
      automations: detailed,
    };
  },
});