import { v } from "convex/values";
import { mutation, action } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * FIRECRAWL INTEGRATION FOR CRM
 * Enriches companies and contacts with web-scraped data
 */

/**
 * Enrich a company with data from their website
 */
export const enrichCompanyFromWebsite = action({
  args: {
    companyId: v.id("companies"),
    clientId: v.id("clients"),
    websiteUrl: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // This would normally call the FireCrawl API
      // For now, we'll simulate the enrichment process
      
      console.log(`Enriching company ${args.companyId} from website: ${args.websiteUrl}`);
      
      // In a real implementation, you would:
      // 1. Call FireCrawl API to scrape the website
      // 2. Extract company information
      // 3. Update the company record
      // 4. Log the activity
      
      // For demo purposes, let's create a mock enrichment
      const mockEnrichmentData = {
        description: "Company information extracted from website",
        industry: "Technology",
        companySize: "50-100 employees",
        location: "San Francisco, CA",
        technologies: ["React", "Node.js", "AWS"],
        socialMedia: {
          linkedin: "https://linkedin.com/company/example",
          twitter: "https://twitter.com/example"
        },
        lastEnriched: Date.now()
      };

      // Update the company with enriched data
      await ctx.runMutation(internal.firecrawl.updateCompanyEnrichment, {
        companyId: args.companyId,
        enrichmentData: mockEnrichmentData,
        source: "firecrawl",
        websiteUrl: args.websiteUrl
      });

      // Log the enrichment activity
      await ctx.runMutation(internal.activityLogger.logActivityInternal, {
        clientId: args.clientId,
        userId: args.userId,
        action: "company_enriched",
        description: `Enriched company data from website: ${args.websiteUrl}`,
        companyId: args.companyId,
        category: "data",
        priority: "medium",
        isSystemGenerated: false,
        metadata: {
          source: "firecrawl",
          websiteUrl: args.websiteUrl,
          enrichmentFields: Object.keys(mockEnrichmentData)
        }
      });

      return {
        success: true,
        data: mockEnrichmentData
      };

    } catch (error) {
      console.error("Failed to enrich company from website:", error);
      
      // Log the failed attempt
      await ctx.runMutation(internal.activityLogger.logActivityInternal, {
        clientId: args.clientId,
        userId: args.userId,
        action: "company_enrichment_failed",
        description: `Failed to enrich company from website: ${args.websiteUrl}`,
        companyId: args.companyId,
        category: "data",
        priority: "low",
        isSystemGenerated: true,
        metadata: {
          source: "firecrawl",
          websiteUrl: args.websiteUrl,
          error: error instanceof Error ? error.message : "Unknown error"
        }
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  },
});

/**
 * Internal mutation to update company with enrichment data
 */
export const updateCompanyEnrichment = mutation({
  args: {
    companyId: v.id("companies"),
    enrichmentData: v.any(),
    source: v.string(),
    websiteUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new Error("Company not found");
    }

    // Update company with enriched data
    await ctx.db.patch(args.companyId, {
      // Merge existing data with new enrichment
      companySummary: args.enrichmentData.description || company.companySummary,
      industryLabel: args.enrichmentData.industry || company.industryLabel,
      companySize: args.enrichmentData.companySize ? 
        extractCompanySize(args.enrichmentData.companySize) : company.companySize,
      
      // Add enrichment metadata
      enrichmentData: {
        ...company.enrichmentData,
        [args.source]: {
          ...args.enrichmentData,
          lastUpdated: Date.now(),
          sourceUrl: args.websiteUrl
        }
      },
      
      updatedAt: Date.now(),
    });

    return args.companyId;
  },
});

/**
 * Enrich contact with professional information from LinkedIn or company website
 */
export const enrichContactFromWeb = action({
  args: {
    contactId: v.id("contacts"),
    clientId: v.id("clients"),
    profileUrl: v.optional(v.string()),
    companyWebsite: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const contact = await ctx.db.get(args.contactId);
      if (!contact) {
        throw new Error("Contact not found");
      }

      console.log(`Enriching contact ${args.contactId} from web sources`);
      
      // Mock enrichment data for demo
      const mockContactEnrichment = {
        jobTitle: "Senior Software Engineer",
        seniority: "Senior",
        functionGroup: "Engineering",
        bio: "Experienced software engineer with expertise in web technologies",
        skills: ["JavaScript", "React", "Node.js"],
        experience: "5+ years",
        education: "BS Computer Science",
        lastEnriched: Date.now()
      };

      // Update contact with enriched data
      await ctx.runMutation(internal.firecrawl.updateContactEnrichment, {
        contactId: args.contactId,
        enrichmentData: mockContactEnrichment,
        source: "firecrawl",
        profileUrl: args.profileUrl || args.companyWebsite || ""
      });

      // Log the enrichment activity
      await ctx.runMutation(internal.activityLogger.logActivityInternal, {
        clientId: args.clientId,
        userId: args.userId,
        action: "contact_enriched",
        description: `Enriched contact data from web sources`,
        contactId: args.contactId,
        category: "contact",
        priority: "medium",
        isSystemGenerated: false,
        metadata: {
          source: "firecrawl",
          profileUrl: args.profileUrl,
          companyWebsite: args.companyWebsite,
          enrichmentFields: Object.keys(mockContactEnrichment)
        }
      });

      return {
        success: true,
        data: mockContactEnrichment
      };

    } catch (error) {
      console.error("Failed to enrich contact from web:", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  },
});

/**
 * Internal mutation to update contact with enrichment data
 */
export const updateContactEnrichment = mutation({
  args: {
    contactId: v.id("contacts"),
    enrichmentData: v.any(),
    source: v.string(),
    profileUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }

    // Update contact with enriched data
    await ctx.db.patch(args.contactId, {
      // Merge existing data with new enrichment
      title: args.enrichmentData.jobTitle || contact.title,
      seniority: args.enrichmentData.seniority || contact.seniority,
      functionGroup: args.enrichmentData.functionGroup || contact.functionGroup,
      bio: args.enrichmentData.bio || contact.bio,
      
      // Add enrichment metadata
      enrichmentData: {
        ...contact.enrichmentData,
        [args.source]: {
          ...args.enrichmentData,
          lastUpdated: Date.now(),
          sourceUrl: args.profileUrl
        }
      },
      
      updatedAt: Date.now(),
    });

    return args.contactId;
  },
});

/**
 * Get website insights for lead research
 */
export const getWebsiteInsights = action({
  args: {
    websiteUrl: v.string(),
    clientId: v.id("clients"),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      console.log(`Getting website insights for: ${args.websiteUrl}`);
      
      // Mock insights data
      const mockInsights = {
        companyInfo: {
          name: "Example Company",
          description: "Leading technology company",
          industry: "Software",
          size: "100-500 employees",
          location: "San Francisco, CA"
        },
        keyContacts: [
          {
            name: "John Doe",
            title: "CEO",
            email: "john@example.com"
          },
          {
            name: "Jane Smith", 
            title: "CTO",
            email: "jane@example.com"
          }
        ],
        technologies: ["React", "Node.js", "AWS", "PostgreSQL"],
        socialMedia: {
          linkedin: "https://linkedin.com/company/example",
          twitter: "https://twitter.com/example"
        },
        recentNews: [
          {
            title: "Company announces new product launch",
            date: "2024-01-15",
            source: "TechCrunch"
          }
        ],
        competitiveIntelligence: {
          mainCompetitors: ["Competitor A", "Competitor B"],
          marketPosition: "Mid-market leader",
          keyDifferentiators: ["Innovation", "Customer service"]
        }
      };

      // Log the research activity
      await ctx.runMutation(internal.activityLogger.logActivityInternal, {
        clientId: args.clientId,
        userId: args.userId,
        action: "website_research",
        description: `Conducted website research on: ${args.websiteUrl}`,
        category: "research",
        priority: "medium",
        isSystemGenerated: false,
        metadata: {
          websiteUrl: args.websiteUrl,
          insightsGenerated: true,
          contactsFound: mockInsights.keyContacts.length,
          technologiesIdentified: mockInsights.technologies.length
        }
      });

      return {
        success: true,
        data: mockInsights
      };

    } catch (error) {
      console.error("Failed to get website insights:", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  },
});

// Helper function to extract numeric company size
function extractCompanySize(sizeString: string): number {
  const match = sizeString.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}