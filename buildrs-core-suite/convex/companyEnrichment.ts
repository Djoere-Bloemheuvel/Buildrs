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
    console.log(`🔍 Basic enrichment for company ${companyId} with domain ${domain}`);
    
    try {
      // Simple domain-based industry classification
      const basicIndustry = guessIndustryFromDomain(domain);
      
      // Update company with basic information
      await ctx.runMutation(internal.companyEnrichment.updateCompanyEnrichment, {
        companyId,
        enrichmentData: {
          industrySlug: basicIndustry.slug,
          industryLabel: basicIndustry.label,
          subindustryLabel: basicIndustry.sublabel,
          companyKeywords: basicIndustry.keywords,
          // Leave AI fields empty - no external API enrichment
          companySummary: undefined,
          companyCommonProblems: undefined,
          companyTargetCustomers: undefined,
          companyUniqueQualities: undefined,
        },
      });
      
      console.log(`✅ Basic enrichment completed for company ${companyId}`);
      
      return {
        success: true,
        message: "Basic company enrichment completed",
      };
      
    } catch (error) {
      console.error("💥 Basic enrichment failed:", error);
      
      return {
        success: false,
        message: `Basic enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});

// Simple domain-based industry guessing
function guessIndustryFromDomain(domain: string) {
  const domainLower = domain.toLowerCase();
  
  if (domainLower.includes('tech') || domainLower.includes('software') || domainLower.includes('ai') || domainLower.includes('digital')) {
    return { slug: 'software-saas', label: 'Software & SaaS', sublabel: 'Technology', keywords: ['technology', 'software'] };
  } else if (domainLower.includes('marketing') || domainLower.includes('agency') || domainLower.includes('creative')) {
    return { slug: 'marketing-creatief', label: 'Marketing & Creatief', sublabel: 'Marketing', keywords: ['marketing', 'agency'] };
  } else if (domainLower.includes('consulting') || domainLower.includes('advies')) {
    return { slug: 'consultancy', label: 'Consultancy', sublabel: 'Business Consulting', keywords: ['consulting', 'advisory'] };
  } else if (domainLower.includes('shop') || domainLower.includes('store') || domainLower.includes('retail')) {
    return { slug: 'ecommerce-d2c', label: 'E-commerce & D2C', sublabel: 'Retail', keywords: ['ecommerce', 'retail'] };
  } else if (domainLower.includes('finance') || domainLower.includes('bank') || domainLower.includes('invest')) {
    return { slug: 'financieel', label: 'Financieel', sublabel: 'Financial Services', keywords: ['finance', 'financial'] };
  } else if (domainLower.includes('health') || domainLower.includes('medical') || domainLower.includes('zorg')) {
    return { slug: 'zorg-ggz', label: 'Zorg & GGZ', sublabel: 'Healthcare', keywords: ['healthcare', 'medical'] };
  } else if (domainLower.includes('legal') || domainLower.includes('law') || domainLower.includes('advocat')) {
    return { slug: 'legal', label: 'Legal', sublabel: 'Legal Services', keywords: ['legal', 'law'] };
  } else if (domainLower.includes('hr') || domainLower.includes('recruitment') || domainLower.includes('talent')) {
    return { slug: 'hr-recruitment', label: 'HR & Recruitment', sublabel: 'Human Resources', keywords: ['hr', 'recruitment'] };
  } else if (domainLower.includes('logistics') || domainLower.includes('transport') || domainLower.includes('shipping')) {
    return { slug: 'logistiek-transport', label: 'Logistiek & Transport', sublabel: 'Logistics', keywords: ['logistics', 'transport'] };
  } else if (domainLower.includes('energy') || domainLower.includes('solar') || domainLower.includes('green')) {
    return { slug: 'energie-duurzaam', label: 'Energie & Duurzaam', sublabel: 'Energy', keywords: ['energy', 'sustainable'] };
  } else if (domainLower.includes('food') || domainLower.includes('restaurant') || domainLower.includes('hotel')) {
    return { slug: 'hospitality-events', label: 'Hospitality & Events', sublabel: 'Hospitality', keywords: ['hospitality', 'food'] };
  } else if (domainLower.includes('education') || domainLower.includes('school') || domainLower.includes('training')) {
    return { slug: 'onderwijs-opleidingen', label: 'Onderwijs & Opleidingen', sublabel: 'Education', keywords: ['education', 'training'] };
  } else if (domainLower.includes('real') || domainLower.includes('estate') || domainLower.includes('property')) {
    return { slug: 'vastgoed', label: 'Vastgoed', sublabel: 'Real Estate', keywords: ['real estate', 'property'] };
  } else if (domainLower.includes('manufacturing') || domainLower.includes('industry') || domainLower.includes('production')) {
    return { slug: 'industrie-productie', label: 'Industrie & Productie', sublabel: 'Manufacturing', keywords: ['manufacturing', 'industry'] };
  }
  
  // Default fallback
  return { slug: 'consultancy', label: 'Algemeen', sublabel: 'Business', keywords: ['business'] };
}

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
    // fullEnrichment only true if we have industry classification (basic requirement)
    const hasCompleteEnrichment = !!(enrichmentData.industryLabel);
    
    await ctx.db.patch(companyId, {
      companySummary: enrichmentData.companySummary,
      companyCommonProblems: enrichmentData.companyCommonProblems,
      companyTargetCustomers: enrichmentData.companyTargetCustomers,
      companyUniqueQualities: enrichmentData.companyUniqueQualities,
      industrySlug: enrichmentData.industrySlug,
      industryLabel: enrichmentData.industryLabel,
      subindustryLabel: enrichmentData.subindustryLabel,
      companyKeywords: enrichmentData.companyKeywords,
      fullEnrichment: hasCompleteEnrichment,
      lastUpdatedAt: Date.now(),
    });
    
    console.log(`✅ Updated company ${companyId} with basic enrichment data (fullEnrichment: ${hasCompleteEnrichment})`);
    return companyId;
  },
});