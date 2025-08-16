import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";

// ===============================
// ULTRA SIMPLE BULK CONVERT
// ===============================

// Just store: client + daily limit. That's it.
export const setBulkConvertSettings = mutation({
  args: {
    clientIdentifier: v.string(),
    dailyLimit: v.number(),
    isEnabled: v.boolean(),
    targetingCriteria: v.optional(v.object({
      functionGroups: v.optional(v.array(v.string())),
      industries: v.optional(v.array(v.string())),
      countries: v.optional(v.array(v.string())),
      minEmployeeCount: v.optional(v.number()),
      maxEmployeeCount: v.optional(v.number())
    }))
  },
  handler: async (ctx, args) => {
    // Find or create setting for this client
    const existing = await ctx.db
      .query("clientAutomations")
      .filter((q) => q.and(
        q.eq(q.field("clientId"), args.clientIdentifier),
        q.eq(q.field("customName"), "Bulk Convert")
      ))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        dailyLimit: args.dailyLimit,
        isActive: args.isEnabled,
        targetingCriteria: args.targetingCriteria,
        updatedAt: Date.now()
      });
    } else {
      // Create new
      await ctx.db.insert("clientAutomations", {
        clientId: args.clientIdentifier,
        customName: "Bulk Convert",
        dailyLimit: args.dailyLimit,
        isActive: args.isEnabled,
        targetingCriteria: args.targetingCriteria,
        totalConverted: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }

    return { success: true };
  }
});

// Cron job function - super simple
export const runBulkConvert = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("🤖 Running bulk convert...");

    // Get all enabled bulk convert settings
    const settings = await ctx.db
      .query("clientAutomations")
      .filter((q) => q.and(
        q.eq(q.field("customName"), "Bulk Convert"),
        q.eq(q.field("isActive"), true)
      ))
      .collect();

    console.log(`Found ${settings.length} bulk convert settings`);

    for (const setting of settings) {
      try {
        // First get matching leads with targeting criteria
        const leadMatches = await ctx.runMutation("exactLeadConversion:getExactMatchLeads", {
          functionGroups: setting.targetingCriteria?.functionGroups,
          industries: setting.targetingCriteria?.industries,
          countries: setting.targetingCriteria?.countries,
          minEmployeeCount: setting.targetingCriteria?.minEmployeeCount,
          maxEmployeeCount: setting.targetingCriteria?.maxEmployeeCount,
          maxResults: setting.dailyLimit,
          clientIdentifier: setting.clientId
        });

        if (leadMatches.totalMatches === 0) {
          console.log(`📭 No matching leads found for client ${setting.clientId}`);
          continue;
        }

        // Convert the matched leads
        const result = await ctx.runMutation("exactLeadConversion:convertExactMatchLeads", {
          leadIds: leadMatches.leads.map(lead => lead.leadId),
          clientIdentifier: setting.clientId
        });

        console.log(`✅ Converted ${result.convertedCount} leads for client ${setting.clientId}`);

        // Update stats
        await ctx.db.patch(setting._id, {
          totalConverted: (setting.totalConverted || 0) + result.convertedCount,
          updatedAt: Date.now()
        });

      } catch (error) {
        console.error(`❌ Bulk convert failed for ${setting.clientId}:`, error);
      }
    }

    return { success: true };
  }
});