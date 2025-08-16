import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ===============================
// AUTOMATION ENGINE CORE
// ===============================

/**
 * Robust automation execution with retry logic, error handling, and monitoring
 */
export const executeAutomationSafely = internalMutation({
  args: {
    clientAutomationId: v.id("clientAutomations"),
    executionType: v.optional(v.string()), // "scheduled", "manual", "retry"
    triggerSource: v.optional(v.string()), // "cron", "api", "user"
    retryAttempt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    try {
      // Get automation configuration
      const automation = await ctx.db.get(args.clientAutomationId);
      if (!automation) {
        throw new Error("AUTOMATION_NOT_FOUND");
      }

      if (!automation.isActive || automation.isPaused) {
        throw new Error("AUTOMATION_INACTIVE");
      }

      const template = await ctx.db.get(automation.templateId);
      if (!template || !template.isActive) {
        throw new Error("TEMPLATE_INACTIVE");
      }

      // Create execution record (pending)
      const executionRecord = await ctx.db.insert("automationExecutions", {
        clientAutomationId: args.clientAutomationId,
        clientId: automation.clientId,
        templateId: automation.templateId,
        executionId,
        executedAt: startTime,
        executionType: args.executionType || "scheduled",
        triggerSource: args.triggerSource || "cron",
        status: "running",
        leadsProcessed: 0,
        leadsConverted: 0,
        success: false,
        retryAttempt: args.retryAttempt || 0,
        startTime,
      });

      // Check if automation should run based on last execution
      const oneDayAgo = startTime - (24 * 60 * 60 * 1000);
      if (automation.lastExecuted && automation.lastExecuted > oneDayAgo && !args.retryAttempt) {
        // Already executed today, skip
        await ctx.db.patch(executionRecord, {
          status: "skipped",
          success: true,
          endTime: Date.now(),
          executionDurationMs: Date.now() - startTime,
          errorMessage: "Already executed today",
        });
        return { success: true, status: "skipped", executionId };
      }

      // Execute based on template type
      let result;
      switch (template.key) {
        case "lead-conversion-basic":
        case "lead-conversion-advanced":
        case "lead-conversion-enterprise":
          result = await executeLeadConversion(ctx, automation, template, executionId);
          break;
        default:
          throw new Error(`UNSUPPORTED_TEMPLATE: ${template.key}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Update execution record with results
      await ctx.db.patch(executionRecord, {
        status: result.success ? "success" : "failed",
        success: result.success,
        leadsProcessed: result.leadsProcessed || 0,
        leadsConverted: result.leadsConverted || 0,
        creditsUsed: result.creditsUsed || 0,
        endTime,
        executionDurationMs: duration,
        errorMessage: result.errorMessage,
        errorCode: result.errorCode,
        executionDetails: result.executionDetails,
      });

      // Update automation tracking
      await ctx.db.patch(args.clientAutomationId, {
        lastExecuted: startTime,
        lastExecutionStatus: result.success ? "success" : "failed",
        totalExecutions: (automation.totalExecutions || 0) + 1,
        totalConverted: automation.totalConverted + (result.leadsConverted || 0),
        totalCreditsUsed: (automation.totalCreditsUsed || 0) + (result.creditsUsed || 0),
        consecutiveFailures: result.success ? 0 : (automation.consecutiveFailures || 0) + 1,
        lastError: result.success ? undefined : result.errorMessage,
        nextRetryAt: undefined, // Clear retry flag on successful execution
        updatedAt: endTime,
      });

      // Handle failure scenarios
      if (!result.success) {
        await handleExecutionFailure(ctx, automation, result, args.retryAttempt || 0);
      }

      console.log(`Automation ${executionId} completed: ${result.success ? 'success' : 'failed'} - ${result.leadsConverted || 0} leads converted`);
      
      return {
        success: result.success,
        status: result.success ? "success" : "failed",
        executionId,
        leadsConverted: result.leadsConverted || 0,
        duration,
      };

    } catch (error) {
      const endTime = Date.now();
      const errorMessage = error.message || "Unknown error";
      const errorCode = extractErrorCode(errorMessage);

      console.error(`Automation execution failed: ${executionId}`, error);

      // Try to update execution record if it exists
      try {
        const executions = await ctx.db
          .query("automationExecutions")
          .withIndex("by_execution_id", (q) => q.eq("executionId", executionId))
          .first();
        
        if (executions) {
          await ctx.db.patch(executions._id, {
            status: "failed",
            success: false,
            endTime,
            executionDurationMs: endTime - startTime,
            errorMessage,
            errorCode,
          });
        }
      } catch (updateError) {
        console.error("Failed to update execution record:", updateError);
      }

      // Handle critical failure
      const automation = await ctx.db.get(args.clientAutomationId);
      if (automation) {
        await handleExecutionFailure(ctx, automation, { 
          success: false, 
          errorMessage, 
          errorCode 
        }, args.retryAttempt || 0);
      }

      return {
        success: false,
        status: "failed",
        executionId,
        errorMessage,
        errorCode,
      };
    }
  },
});

/**
 * Execute lead conversion automation
 */
async function executeLeadConversion(
  ctx: any,
  automation: any,
  template: any,
  executionId: string
) {
  try {
    // Get targeting criteria (support both new and legacy formats)
    const criteria = automation.targetingCriteria || {
      functionGroups: automation.targetFunctionGroups,
      industries: automation.targetIndustries,
      countries: automation.targetCountries,
      employeeMin: automation.targetEmployeeMin,
      employeeMax: automation.targetEmployeeMax,
    };

    // Get leads using NEW EXACT MATCHING function
    const targetResult = await ctx.runMutation("exactLeadConversion:getExactMatchLeads", {
      functionGroups: criteria.functionGroups,
      industries: criteria.industries,
      countries: criteria.countries,
      minEmployeeCount: criteria.employeeMin,
      maxEmployeeCount: criteria.employeeMax,
      maxResults: automation.dailyLimit,
      clientIdentifier: automation.clientId,
    });

    const leadsToConvert = targetResult.leads.slice(0, automation.dailyLimit);
    
    if (leadsToConvert.length === 0) {
      return {
        success: true,
        leadsProcessed: 0,
        leadsConverted: 0,
        creditsUsed: 0,
        executionDetails: {
          criteria: {
            targetFunctionGroups: criteria.functionGroups,
            targetIndustries: criteria.industries,
            targetCountries: criteria.countries,
            targetEmployeeMin: criteria.employeeMin,
            targetEmployeeMax: criteria.employeeMax,
          },
          searchResults: {
            totalMatched: targetResult.totalMatches || 0,
            filtered: 0,
            processed: 0,
          },
          convertedLeadIds: [],
        },
      };
    }

    // Convert the leads using NEW EXACT CONVERSION function
    const leadIds = leadsToConvert.map(lead => lead.leadId);
    const conversionResult = await ctx.runMutation("exactLeadConversion:convertExactMatchLeads", {
      leadIds: leadIds as any[],
      clientIdentifier: automation.clientId,
    });

    return {
      success: conversionResult.success,
      leadsProcessed: leadsToConvert.length,
      leadsConverted: conversionResult.convertedCount || 0,
      creditsUsed: leadsToConvert.length, // Assuming 1 credit per lead
      errorMessage: conversionResult.success ? undefined : conversionResult.errors?.join(", "),
      errorCode: conversionResult.success ? undefined : "CONVERSION_FAILED",
      executionDetails: {
        criteria: {
          targetFunctionGroups: criteria.functionGroups,
          targetIndustries: criteria.industries,
          targetCountries: criteria.countries,
          targetEmployeeMin: criteria.employeeMin,
          targetEmployeeMax: criteria.employeeMax,
        },
        searchResults: {
          totalMatched: targetResult.totalMatches || 0,
          filtered: leadsToConvert.length,
          processed: leadsToConvert.length,
        },
        convertedLeadIds: conversionResult.convertedLeadIds || [],
        skippedLeadIds: conversionResult.skippedLeadIds || [],
        failedLeadIds: conversionResult.failedLeadIds || [],
      },
    };

  } catch (error) {
    return {
      success: false,
      leadsProcessed: 0,
      leadsConverted: 0,
      creditsUsed: 0,
      errorMessage: error.message,
      errorCode: extractErrorCode(error.message),
    };
  }
}

/**
 * Handle execution failures with retry logic
 */
async function handleExecutionFailure(
  ctx: any,
  automation: any,
  result: any,
  currentRetryAttempt: number
) {
  const template = await ctx.db.get(automation.templateId);
  const maxRetries = automation.settings?.maxRetries || template?.defaultSettings?.maxRetries || 3;
  const retryDelayMinutes = automation.settings?.retryDelayMinutes || template?.defaultSettings?.retryDelayMinutes || 60;

  const consecutiveFailures = (automation.consecutiveFailures || 0) + 1;

  // Determine if we should retry
  const shouldRetry = currentRetryAttempt < maxRetries && 
                     result.errorCode !== "AUTOMATION_INACTIVE" &&
                     result.errorCode !== "TEMPLATE_INACTIVE";

  if (shouldRetry) {
    const nextRetryAt = Date.now() + (retryDelayMinutes * 60 * 1000);
    
    await ctx.db.patch(automation._id, {
      nextRetryAt,
      consecutiveFailures,
      lastError: result.errorMessage,
      updatedAt: Date.now(),
    });

    console.log(`Automation ${automation._id} scheduled for retry ${currentRetryAttempt + 1}/${maxRetries} at ${new Date(nextRetryAt)}`);
  } else {
    // Max retries reached, disable automation if too many consecutive failures
    if (consecutiveFailures >= 5) {
      await ctx.db.patch(automation._id, {
        isActive: false,
        consecutiveFailures,
        lastError: `Disabled after ${consecutiveFailures} consecutive failures: ${result.errorMessage}`,
        updatedAt: Date.now(),
      });
      
      console.error(`Automation ${automation._id} disabled after ${consecutiveFailures} consecutive failures`);
    }
  }
}

/**
 * Extract structured error codes from error messages
 */
function extractErrorCode(errorMessage: string): string {
  if (!errorMessage) return "UNKNOWN_ERROR";
  
  // Check for predefined error codes
  const knownErrors = [
    "AUTOMATION_NOT_FOUND",
    "AUTOMATION_INACTIVE", 
    "TEMPLATE_INACTIVE",
    "CONVERSION_FAILED",
    "INSUFFICIENT_CREDITS",
    "RATE_LIMITED",
    "NETWORK_ERROR",
    "DATABASE_ERROR",
  ];

  for (const errorCode of knownErrors) {
    if (errorMessage.includes(errorCode)) {
      return errorCode;
    }
  }

  // Extract from common error patterns
  if (errorMessage.includes("timeout")) return "TIMEOUT_ERROR";
  if (errorMessage.includes("network")) return "NETWORK_ERROR";
  if (errorMessage.includes("permission")) return "PERMISSION_ERROR";
  if (errorMessage.includes("quota")) return "QUOTA_EXCEEDED";

  return "UNKNOWN_ERROR";
}

// ===============================
// RETRY HANDLER
// ===============================

export const processRetries = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Find automations that need retry
    const automationsToRetry = await ctx.db
      .query("clientAutomations")
      .withIndex("by_next_retry")
      .filter((q) => q.and(
        q.neq(q.field("nextRetryAt"), undefined),
        q.lte(q.field("nextRetryAt"), now)
      ))
      .collect();

    const results = [];
    
    for (const automation of automationsToRetry) {
      try {
        // Clear the retry flag first to prevent double execution
        await ctx.db.patch(automation._id, {
          nextRetryAt: undefined,
          updatedAt: now,
        });

        // Find the last failed execution to get retry count
        const lastExecution = await ctx.db
          .query("automationExecutions")
          .withIndex("by_client_automation", (q) => q.eq("clientAutomationId", automation._id))
          .order("desc")
          .first();

        const retryAttempt = (lastExecution?.retryAttempt || 0) + 1;

        // Execute with retry flag
        const result = await ctx.runMutation("automationEngine:executeAutomationSafely", {
          clientAutomationId: automation._id,
          executionType: "retry",
          triggerSource: "retry_processor",
          retryAttempt,
        });

        results.push({
          automationId: automation._id,
          retryAttempt,
          ...result,
        });

      } catch (error) {
        console.error(`Failed to retry automation ${automation._id}:`, error);
        results.push({
          automationId: automation._id,
          success: false,
          errorMessage: error.message,
        });
      }
    }

    return {
      processed: automationsToRetry.length,
      results,
    };
  },
});

// ===============================
// HEALTH MONITORING
// ===============================

export const generateHealthMetrics = internalMutation({
  args: {
    periodType: v.string(), // "hourly", "daily", "weekly"
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let periodStart: number;
    
    switch (args.periodType) {
      case "hourly":
        periodStart = now - (60 * 60 * 1000);
        break;
      case "daily":
        periodStart = now - (24 * 60 * 60 * 1000);
        break;
      case "weekly":
        periodStart = now - (7 * 24 * 60 * 60 * 1000);
        break;
      default:
        throw new Error("Invalid period type");
    }

    // Get all active automations
    const activeAutomations = await ctx.db
      .query("clientAutomations")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    for (const automation of activeAutomations) {
      // Get executions in this period
      const executions = await ctx.db
        .query("automationExecutions")
        .withIndex("by_client_automation", (q) => q.eq("clientAutomationId", automation._id))
        .filter((q) => q.gte(q.field("executedAt"), periodStart))
        .collect();

      if (executions.length === 0) continue;

      // Calculate metrics
      const totalExecutions = executions.length;
      const successfulExecutions = executions.filter(e => e.success).length;
      const failedExecutions = totalExecutions - successfulExecutions;
      const totalLeadsProcessed = executions.reduce((sum, e) => sum + e.leadsProcessed, 0);
      const totalLeadsConverted = executions.reduce((sum, e) => sum + e.leadsConverted, 0);
      const totalCreditsUsed = executions.reduce((sum, e) => sum + (e.creditsUsed || 0), 0);
      
      const conversionRate = totalLeadsProcessed > 0 ? (totalLeadsConverted / totalLeadsProcessed) : 0;
      const avgExecutionTime = executions.length > 0 ? 
        executions.reduce((sum, e) => sum + (e.executionDurationMs || 0), 0) / executions.length : 0;
      
      // Determine health status
      const failureRate = totalExecutions > 0 ? (failedExecutions / totalExecutions) : 0;
      let healthStatus = "healthy";
      if (failureRate > 0.5) healthStatus = "critical";
      else if (failureRate > 0.2) healthStatus = "warning";

      // Error analysis
      const errorCounts: Record<string, number> = {};
      executions.forEach(e => {
        if (e.errorCode) {
          errorCounts[e.errorCode] = (errorCounts[e.errorCode] || 0) + 1;
        }
      });

      // Store metrics
      await ctx.db.insert("automationHealthMetrics", {
        clientAutomationId: automation._id,
        clientId: automation.clientId,
        periodStart,
        periodEnd: now,
        periodType: args.periodType,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        avgExecutionTime,
        totalLeadsProcessed,
        totalLeadsConverted,
        conversionRate,
        totalCreditsUsed,
        avgCreditsPerExecution: totalExecutions > 0 ? (totalCreditsUsed / totalExecutions) : 0,
        errorCounts,
        lastHealthCheck: now,
        healthStatus,
        createdAt: now,
      });
    }

    return {
      processed: activeAutomations.length,
      periodType: args.periodType,
      periodStart,
      periodEnd: now,
    };
  },
});