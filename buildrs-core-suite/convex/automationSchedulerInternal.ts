import { internalMutation } from "./_generated/server";

export const checkAndExecuteAutomations = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM" format
    const currentTimestamp = Date.now();

    console.log(`🤖 Automation scheduler running at ${currentTime}`);

    try {
      // Step 1: Process any pending retries first
      const retryResults = await ctx.runMutation("automationEngine:processRetries");
      console.log(`📋 Processed ${retryResults.processed} retries`);

      // Step 2: Get active automations for current time
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

      console.log(`🎯 Found ${activeAutomations.length} automations scheduled for ${currentTime}`);

      if (activeAutomations.length === 0) {
        return {
          timestamp: currentTimestamp,
          currentTime,
          totalAutomations: 0,
          executedCount: 0,
          retriesProcessed: retryResults.processed,
          results: [],
        };
      }

      // Step 3: Sort by priority (templates with higher priority execute first)
      const automationsWithPriority = await Promise.all(
        activeAutomations.map(async (automation) => {
          const template = await ctx.db.get(automation.templateId);
          return {
            automation,
            priority: template?.priority || 0,
          };
        })
      );

      automationsWithPriority.sort((a, b) => b.priority - a.priority);

      // Step 4: Execute automations using robust engine
      let executedCount = 0;
      const results = [];

      for (const { automation } of automationsWithPriority) {
        try {
          console.log(`⚡ Executing automation ${automation.customName || automation._id} (${automation.executionTime})`);
          
          // Use the robust execution engine
          const result = await ctx.runMutation("automationEngine:executeAutomationSafely", {
            clientAutomationId: automation._id,
            executionType: "scheduled",
            triggerSource: "cron",
          });

          results.push({
            automationId: automation._id,
            clientId: automation.clientId,
            customName: automation.customName,
            ...result,
          });

          if (result.success) {
            executedCount++;
            console.log(`✅ Automation ${automation.customName || automation._id}: ${result.leadsConverted || 0} leads converted`);
          } else {
            console.log(`❌ Automation ${automation.customName || automation._id} failed: ${result.errorMessage}`);
          }

        } catch (error) {
          console.error(`💥 Critical error executing automation ${automation._id}:`, error);
          
          results.push({
            automationId: automation._id,
            clientId: automation.clientId,
            customName: automation.customName,
            success: false,
            status: "failed",
            errorMessage: error.message,
            errorCode: "SCHEDULER_ERROR",
          });
        }

        // Small delay between executions to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Step 5: Generate health metrics for completed executions
      try {
        await ctx.runMutation("automationEngine:generateHealthMetrics", {
          periodType: "hourly",
        });
      } catch (healthError) {
        console.warn("⚠️ Failed to generate health metrics:", healthError);
      }

      console.log(`🏁 Automation scheduler completed: ${executedCount}/${activeAutomations.length} automations executed successfully`);

      return {
        timestamp: currentTimestamp,
        currentTime,
        totalAutomations: activeAutomations.length,
        executedCount,
        retriesProcessed: retryResults.processed,
        results,
        healthMetricsGenerated: true,
      };

    } catch (error) {
      console.error("🔥 Critical scheduler error:", error);
      
      return {
        timestamp: currentTimestamp,
        currentTime,
        totalAutomations: 0,
        executedCount: 0,
        retriesProcessed: 0,
        results: [],
        error: error.message,
        healthMetricsGenerated: false,
      };
    }
  },
});