import { action, mutation } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

// Action for N8N to update lead function groups (call via Convex API)
export const updateLeadFunctionGroups = action({
  args: {
    leadUpdates: v.array(v.object({
      functionGroup: v.string(),
      lead_id: v.string(),
    })),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    summary: v.object({
      total: v.number(),
      successful: v.number(),
      failed: v.number(),
    }),
    results: v.array(v.any()),
  }),
  handler: async (ctx, { leadUpdates }) => {
    console.log("📨 N8N Request received:", leadUpdates);

    try {
      const results = [];
      let successCount = 0;
      let errorCount = 0;

      // Process each lead update
      for (const update of leadUpdates) {
        try {
          const { functionGroup, lead_id } = update;

          // Validate required fields
          if (!functionGroup || !lead_id) {
            console.error(`❌ Missing fields in update:`, update);
            results.push({
              lead_id: lead_id || "unknown",
              success: false,
              error: "Missing Function Group or lead_id"
            });
            errorCount++;
            continue;
          }

          console.log(`🔄 Updating lead ${lead_id} with function group: ${functionGroup}`);

          // Update the lead in the database
          const updateResult = await ctx.runMutation(api.leadUpdater.updateLeadFunctionGroup, {
            leadId: lead_id,
            functionGroup: functionGroup
          });

          if (updateResult.success) {
            console.log(`✅ Successfully updated lead ${lead_id}`);
            results.push({
              lead_id,
              success: true,
              functionGroup: functionGroup
            });
            successCount++;
          } else {
            console.error(`❌ Failed to update lead ${lead_id}:`, updateResult.error);
            results.push({
              lead_id,
              success: false,
              error: updateResult.error
            });
            errorCount++;
          }

        } catch (error) {
          console.error(`💥 Error processing update for lead:`, update, error);
          results.push({
            lead_id: update.lead_id || "unknown",
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
          });
          errorCount++;
        }
      }

      // Return summary response
      const response = {
        success: true,
        message: `Processed ${leadUpdates.length} lead updates`,
        summary: {
          total: leadUpdates.length,
          successful: successCount,
          failed: errorCount
        },
        results
      };

      console.log("📊 Update Summary:", response.summary);
      return response;

    } catch (error) {
      console.error("💥 Action Error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
        summary: {
          total: 0,
          successful: 0,
          failed: 0
        },
        results: []
      };
    }
  },
});

// Mutation to update a single lead's function group
export const updateLeadFunctionGroup = mutation({
  args: {
    leadId: v.string(),
    functionGroup: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    leadId: v.optional(v.string()),
  }),
  handler: async (ctx, { leadId, functionGroup }) => {
    try {
      console.log(`🔍 Looking for lead with ID: ${leadId}`);

      // Find the lead by ID
      const lead = await ctx.db.get(leadId as any);

      if (!lead) {
        console.error(`❌ Lead not found: ${leadId}`);
        return {
          success: false,
          error: `Lead with ID ${leadId} not found`
        };
      }

      console.log(`📝 Found lead: ${lead.firstName} ${lead.lastName} - ${lead.jobTitle}`);
      console.log(`📝 Current function group: ${lead.functionGroup || 'None'}`);
      console.log(`📝 New function group: ${functionGroup}`);

      // Update the lead with the new function group
      await ctx.db.patch(leadId as any, {
        functionGroup: functionGroup,
        functionGroupUpdatedAt: Date.now(),
      });

      console.log(`✅ Successfully updated lead ${leadId} with function group: ${functionGroup}`);

      return {
        success: true,
        leadId: leadId
      };

    } catch (error) {
      console.error(`💥 Error updating lead ${leadId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  },
});