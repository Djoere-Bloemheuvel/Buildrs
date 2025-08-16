import { mutation } from "./_generated/server";

export const resetAndSeedTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete existing templates
    const existingTemplates = await ctx.db.query("automationTemplates").collect();
    for (const template of existingTemplates) {
      await ctx.db.delete(template._id);
    }

    console.log(`Deleted ${existingTemplates.length} existing templates`);

    // Now seed new templates
    const result = await ctx.runMutation("automationSeeds:seedAutomationTemplates");
    
    return {
      deletedCount: existingTemplates.length,
      ...result,
    };
  },
});