import { v } from "convex/values";
import { action, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Simple company enrichment without external APIs
export const enrichCompany = action({
  args: {
    companyId: v.id("companies"),
    domain: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, { companyId, domain }) => {
    console.log(`🔍 Company enrichment disabled - no processing for ${companyId}`);
    
    // Company enrichment completely disabled - no classification
    return {
      success: true,
      message: "Company enrichment disabled - no processing done",
    };
  },
});

// Industry classification disabled - no automatic processing

// Database update mutation
export const updateCompanyEnrichment = mutation({
  args: {
    companyId: v.id("companies"),
    enrichmentData: v.object({
      companySummary: v.optional(v.string()),
      companyCommonProblems: v.optional(v.string()),
      companyTargetCustomers: v.optional(v.string()),
      companyUniqueQualities: v.optional(v.string()),
      industrySlug: v.optional(v.string()),
      industryLabel: v.optional(v.string()),
      subindustryLabel: v.optional(v.string()),
      companyKeywords: v.optional(v.array(v.string())),
    }),
  },
  returns: v.id("companies"),
  handler: async (ctx, { companyId, enrichmentData }) => {
    // Company enrichment disabled - no automatic classification
    console.log(`🚫 Company enrichment disabled for ${companyId} - no updates performed`);
    return companyId;
  },
});