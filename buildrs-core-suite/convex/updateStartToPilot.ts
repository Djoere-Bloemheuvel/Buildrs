import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * MIGRATION: Update Start package to Pilot Pack
 */

export const updateStartPackageToPilot = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    updatedPackage: v.optional(v.any()),
  }),
  handler: async (ctx) => {
    console.log("🔄 Updating Start package to Pilot Pack...");
    
    // Find the existing "start" package
    const startPackage = await ctx.db
      .query("creditPackages")
      .withIndex("by_slug", (q) => q.eq("slug", "start"))
      .first();
    
    if (!startPackage) {
      return {
        success: false,
        message: "Start package not found in database",
      };
    }
    
    // Update the package to Pilot Pack specifications
    await ctx.db.patch(startPackage._id, {
      slug: "pilot",
      name: "Pilot Pack",
      price: 14900, // €149.00
      leadCredits: 1000,
      emailCredits: 2000,
      linkedinCredits: 100, // Reduced from 200 to 100
      abmCredits: 0,
      firstMonthBonusLeadCredits: 0, // No bonus for pilot pack
      description: "Kickstart om 1–2 meetings te boeken - eenmalige betaling",
      billingPeriod: "one-time",
      updatedAt: Date.now(),
    });
    
    // Get the updated package
    const updatedPackage = await ctx.db.get(startPackage._id);
    
    console.log("✅ Successfully updated Start package to Pilot Pack");
    
    return {
      success: true,
      message: "Successfully updated Start package to Pilot Pack",
      updatedPackage,
    };
  },
});

// Helper to also update any existing domain tracking records
export const updateDomainTrackingForPilot = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    updatedRecords: v.number(),
  }),
  handler: async (ctx) => {
    console.log("🔄 Updating domain tracking references...");
    
    // Find all domain tracking records with hasUsedStartPackage: true
    const trackingRecords = await ctx.db
      .query("domainUsageTracking")
      .filter((q) => q.eq(q.field("hasUsedStartPackage"), true))
      .collect();
    
    let updatedCount = 0;
    
    for (const record of trackingRecords) {
      // Update the field name to be more generic or keep it for backward compatibility
      // For now, we'll keep the field name the same since it still represents
      // that the domain has used the one-time package (previously start, now pilot)
      await ctx.db.patch(record._id, {
        // We could add a new field here if needed
        pilotPackageUsedAt: record.startPackageUsedAt,
        updatedAt: Date.now(),
      });
      updatedCount++;
    }
    
    console.log(`✅ Updated ${updatedCount} domain tracking records`);
    
    return {
      success: true,
      updatedRecords: updatedCount,
    };
  },
});