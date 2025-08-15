import { query } from "./_generated/server";
import { v } from "convex/values";

// ===============================
// GLOBAL SEARCH VIEWS
// Advanced search across all entities with relevance scoring
// ===============================

export const globalSearch = query({
  args: {
    searchTerm: v.string(),
    entityTypes: v.optional(v.array(v.string())),
    clientId: v.optional(v.id("clients")),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    entityId: v.string(),
    entityType: v.string(),
    title: v.string(),
    subtitle: v.optional(v.string()),
    description: v.optional(v.string()),
    relevanceScore: v.number(),
    matchedFields: v.array(v.string()),
    // Entity-specific data
    companyData: v.optional(v.object({
      name: v.string(),
      domain: v.optional(v.string()),
      industryLabel: v.optional(v.string()),
      companySize: v.optional(v.number()),
    })),
    contactData: v.optional(v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.optional(v.string()),
      jobTitle: v.optional(v.string()),
      companyName: v.optional(v.string()),
    })),
    dealData: v.optional(v.object({
      title: v.string(),
      value: v.optional(v.number()),
      status: v.string(),
      companyName: v.optional(v.string()),
    })),
    campaignData: v.optional(v.object({
      name: v.string(),
      type: v.string(),
      status: v.optional(v.string()),
      contactCount: v.number(),
    })),
  })),
  handler: async (ctx, args) => {
    const searchTerm = args.searchTerm.toLowerCase();
    const results: any[] = [];
    const entityTypes = args.entityTypes || ["companies", "contacts", "deals", "campaigns"];

    // Helper function to calculate relevance score
    const calculateRelevance = (text: string, fieldWeight: number = 1): number => {
      if (!text) return 0;
      const lowerText = text.toLowerCase();
      
      // Exact match gets highest score
      if (lowerText === searchTerm) return 100 * fieldWeight;
      
      // Starts with gets high score
      if (lowerText.startsWith(searchTerm)) return 80 * fieldWeight;
      
      // Contains gets medium score
      if (lowerText.includes(searchTerm)) return 50 * fieldWeight;
      
      // Word boundary match
      const words = lowerText.split(/\s+/);
      if (words.some(word => word.startsWith(searchTerm))) return 60 * fieldWeight;
      
      return 0;
    };

    // SEARCH COMPANIES
    if (entityTypes.includes("companies")) {
      const companies = await ctx.db.query("companies").take(200);
      
      for (const company of companies) {
        const matchedFields: string[] = [];
        let relevanceScore = 0;

        // Check various fields with different weights
        const nameScore = calculateRelevance(company.name, 3);
        if (nameScore > 0) {
          matchedFields.push("name");
          relevanceScore += nameScore;
        }

        const domainScore = calculateRelevance(company.domain, 2);
        if (domainScore > 0) {
          matchedFields.push("domain");
          relevanceScore += domainScore;
        }

        const industryScore = calculateRelevance(company.industryLabel, 1.5);
        if (industryScore > 0) {
          matchedFields.push("industry");
          relevanceScore += industryScore;
        }

        const summaryScore = calculateRelevance(company.companySummary, 1);
        if (summaryScore > 0) {
          matchedFields.push("summary");
          relevanceScore += summaryScore;
        }

        if (relevanceScore > 0) {
          results.push({
            entityId: company._id,
            entityType: "company",
            title: company.name,
            subtitle: company.domain,
            description: company.industryLabel,
            relevanceScore,
            matchedFields,
            companyData: {
              name: company.name,
              domain: company.domain,
              industryLabel: company.industryLabel,
              companySize: company.companySize,
            },
          });
        }
      }
    }

    // SEARCH CONTACTS
    if (entityTypes.includes("contacts")) {
      const contacts = await ctx.db.query("contacts").take(200);
      
      for (const contact of contacts) {
        const matchedFields: string[] = [];
        let relevanceScore = 0;

        const firstNameScore = calculateRelevance(contact.firstName, 2.5);
        if (firstNameScore > 0) {
          matchedFields.push("firstName");
          relevanceScore += firstNameScore;
        }

        const lastNameScore = calculateRelevance(contact.lastName, 2.5);
        if (lastNameScore > 0) {
          matchedFields.push("lastName");
          relevanceScore += lastNameScore;
        }

        const emailScore = calculateRelevance(contact.email, 2);
        if (emailScore > 0) {
          matchedFields.push("email");
          relevanceScore += emailScore;
        }

        const jobTitleScore = calculateRelevance(contact.jobTitle, 1.5);
        if (jobTitleScore > 0) {
          matchedFields.push("jobTitle");
          relevanceScore += jobTitleScore;
        }

        if (relevanceScore > 0) {
          // Get company name
          const company = contact.companyId ? await ctx.db.get(contact.companyId) : null;
          
          results.push({
            entityId: contact._id,
            entityType: "contact",
            title: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
            subtitle: contact.email,
            description: `${contact.jobTitle || ''} at ${company?.name || 'Unknown Company'}`.trim(),
            relevanceScore,
            matchedFields,
            contactData: {
              firstName: contact.firstName,
              lastName: contact.lastName,
              email: contact.email,
              jobTitle: contact.jobTitle,
              companyName: company?.name,
            },
          });
        }
      }
    }

    // SEARCH DEALS
    if (entityTypes.includes("deals")) {
      const deals = await ctx.db.query("deals").take(200);
      
      for (const deal of deals) {
        const matchedFields: string[] = [];
        let relevanceScore = 0;

        const titleScore = calculateRelevance(deal.title, 3);
        if (titleScore > 0) {
          matchedFields.push("title");
          relevanceScore += titleScore;
        }

        const descriptionScore = calculateRelevance(deal.description, 1);
        if (descriptionScore > 0) {
          matchedFields.push("description");
          relevanceScore += descriptionScore;
        }

        if (relevanceScore > 0) {
          // Get company name
          const company = deal.companyId ? await ctx.db.get(deal.companyId) : null;
          
          results.push({
            entityId: deal._id,
            entityType: "deal",
            title: deal.title,
            subtitle: company?.name,
            description: `${deal.status} - $${deal.value?.toLocaleString() || '0'}`,
            relevanceScore,
            matchedFields,
            dealData: {
              title: deal.title,
              value: deal.value,
              status: deal.status,
              companyName: company?.name,
            },
          });
        }
      }
    }

    // SEARCH CAMPAIGNS
    if (entityTypes.includes("campaigns")) {
      const campaigns = await ctx.db.query("campaigns").take(200);
      
      for (const campaign of campaigns) {
        const matchedFields: string[] = [];
        let relevanceScore = 0;

        const nameScore = calculateRelevance(campaign.name, 3);
        if (nameScore > 0) {
          matchedFields.push("name");
          relevanceScore += nameScore;
        }

        const descriptionScore = calculateRelevance(campaign.description, 1);
        if (descriptionScore > 0) {
          matchedFields.push("description");
          relevanceScore += descriptionScore;
        }

        if (relevanceScore > 0) {
          // Get contact count
          const campaignContacts = await ctx.db
            .query("campaignContacts")
            .withIndex("by_campaign", (q) => q.eq("campaignId", campaign._id))
            .collect();

          results.push({
            entityId: campaign._id,
            entityType: "campaign",
            title: campaign.name,
            subtitle: `${campaign.type} Campaign`,
            description: `${campaign.status} - ${campaignContacts.length} contacts`,
            relevanceScore,
            matchedFields,
            campaignData: {
              name: campaign.name,
              type: campaign.type,
              status: campaign.status,
              contactCount: campaignContacts.length,
            },
          });
        }
      }
    }

    // Sort by relevance score (highest first) and limit
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    return results.slice(0, args.limit || 20);
  },
});

// ===============================
// ADVANCED CONTACT SEARCH
// Sophisticated contact search with filters and facets
// ===============================

export const advancedContactSearch = query({
  args: {
    // Search terms
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    company: v.optional(v.string()),
    
    // Filters
    status: v.optional(v.array(v.string())),
    functionGroups: v.optional(v.array(v.string())),
    seniority: v.optional(v.array(v.string())),
    industries: v.optional(v.array(v.string())),
    
    // Company filters
    companySizeMin: v.optional(v.number()),
    companySizeMax: v.optional(v.number()),
    countries: v.optional(v.array(v.string())),
    
    // Engagement filters
    hasLinkedIn: v.optional(v.boolean()),
    hasEmail: v.optional(v.boolean()),
    lastContactedDays: v.optional(v.number()),
    responseRate: v.optional(v.number()),
    
    // Campaign filters
    inActiveCampaign: v.optional(v.boolean()),
    campaignTypes: v.optional(v.array(v.string())),
    
    // Sorting and pagination
    sortBy: v.optional(v.string()),
    sortOrder: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  returns: v.object({
    contacts: v.array(v.object({
      _id: v.id("contacts"),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.optional(v.string()),
      jobTitle: v.optional(v.string()),
      functionGroup: v.optional(v.string()),
      seniority: v.optional(v.string()),
      status: v.optional(v.string()),
      linkedinUrl: v.optional(v.string()),
      
      // Company info
      company: v.optional(v.object({
        name: v.string(),
        domain: v.optional(v.string()),
        industryLabel: v.optional(v.string()),
        companySize: v.optional(v.number()),
        country: v.optional(v.string()),
      })),
      
      // Engagement metrics
      communicationCount: v.number(),
      lastCommunication: v.optional(v.number()),
      responseRate: v.number(),
      isInActiveCampaign: v.boolean(),
      campaignCount: v.number(),
    })),
    
    // Facets for filtering UI
    facets: v.object({
      functionGroups: v.array(v.object({ value: v.string(), count: v.number() })),
      seniority: v.array(v.object({ value: v.string(), count: v.number() })),
      status: v.array(v.object({ value: v.string(), count: v.number() })),
      industries: v.array(v.object({ value: v.string(), count: v.number() })),
      countries: v.array(v.object({ value: v.string(), count: v.number() })),
    }),
    
    // Metadata
    totalCount: v.number(),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    let contacts = await ctx.db.query("contacts").collect();
    
    // Apply text filters
    if (args.name) {
      const nameTerm = args.name.toLowerCase();
      contacts = contacts.filter(c => 
        (c.firstName?.toLowerCase().includes(nameTerm)) ||
        (c.lastName?.toLowerCase().includes(nameTerm))
      );
    }
    
    if (args.email) {
      const emailTerm = args.email.toLowerCase();
      contacts = contacts.filter(c => 
        c.email?.toLowerCase().includes(emailTerm)
      );
    }

    // Apply status filter
    if (args.status && args.status.length > 0) {
      contacts = contacts.filter(c => 
        c.status && args.status!.includes(c.status)
      );
    }

    // Apply function group filter
    if (args.functionGroups && args.functionGroups.length > 0) {
      contacts = contacts.filter(c => 
        c.functionGroup && args.functionGroups!.includes(c.functionGroup)
      );
    }

    // Apply seniority filter
    if (args.seniority && args.seniority.length > 0) {
      contacts = contacts.filter(c => 
        c.seniority && args.seniority!.includes(c.seniority)
      );
    }

    // Apply LinkedIn filter
    if (args.hasLinkedIn !== undefined) {
      contacts = contacts.filter(c => 
        args.hasLinkedIn ? !!c.linkedinUrl : !c.linkedinUrl
      );
    }

    // Apply email filter
    if (args.hasEmail !== undefined) {
      contacts = contacts.filter(c => 
        args.hasEmail ? !!c.email : !c.email
      );
    }

    // Enrich with company and engagement data
    const enrichedContacts = await Promise.all(
      contacts.map(async (contact) => {
        // Get company
        const company = contact.companyId ? await ctx.db.get(contact.companyId) : null;
        
        // Apply company filters
        if (args.company) {
          const companyTerm = args.company.toLowerCase();
          if (!company?.name?.toLowerCase().includes(companyTerm)) {
            return null;
          }
        }

        if (args.companySizeMin && (!company?.companySize || company.companySize < args.companySizeMin)) {
          return null;
        }

        if (args.companySizeMax && (!company?.companySize || company.companySize > args.companySizeMax)) {
          return null;
        }

        if (args.industries && args.industries.length > 0) {
          if (!company?.industryLabel || !args.industries.includes(company.industryLabel)) {
            return null;
          }
        }

        if (args.countries && args.countries.length > 0) {
          if (!company?.country || !args.countries.includes(company.country)) {
            return null;
          }
        }

        // Get communications
        const communications = await ctx.db
          .query("communications")
          .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
          .collect();

        const lastCommunication = communications.length > 0 ?
          Math.max(...communications.map(c => c.timestamp)) : undefined;

        // Apply last contacted filter
        if (args.lastContactedDays && lastCommunication) {
          const daysSinceContact = (Date.now() - lastCommunication) / (1000 * 60 * 60 * 24);
          if (daysSinceContact > args.lastContactedDays) {
            return null;
          }
        }

        // Calculate response rate
        const outboundCount = communications.filter(c => c.direction === "outbound").length;
        const inboundCount = communications.filter(c => c.direction === "inbound").length;
        const responseRate = outboundCount > 0 ? (inboundCount / outboundCount) * 100 : 0;

        // Apply response rate filter
        if (args.responseRate !== undefined && responseRate < args.responseRate) {
          return null;
        }

        // Get campaign data
        const campaignContacts = await ctx.db
          .query("campaignContacts")
          .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
          .collect();

        const activeCampaigns = campaignContacts.filter(cc => 
          cc.status === "active" || cc.status === "planned"
        );

        // Apply campaign filters
        if (args.inActiveCampaign !== undefined) {
          const hasActiveCampaign = activeCampaigns.length > 0;
          if (args.inActiveCampaign !== hasActiveCampaign) {
            return null;
          }
        }

        return {
          ...contact,
          company: company ? {
            name: company.name,
            domain: company.domain,
            industryLabel: company.industryLabel,
            companySize: company.companySize,
            country: company.country,
          } : undefined,
          communicationCount: communications.length,
          lastCommunication,
          responseRate,
          isInActiveCampaign: activeCampaigns.length > 0,
          campaignCount: campaignContacts.length,
        };
      })
    );

    // Filter out nulls
    const validContacts = enrichedContacts.filter(Boolean) as any[];

    // Sort contacts
    const sortBy = args.sortBy || "lastName";
    const sortOrder = args.sortOrder || "asc";
    
    validContacts.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "firstName":
          aValue = a.firstName || "";
          bValue = b.firstName || "";
          break;
        case "lastName":
          aValue = a.lastName || "";
          bValue = b.lastName || "";
          break;
        case "company":
          aValue = a.company?.name || "";
          bValue = b.company?.name || "";
          break;
        case "lastCommunication":
          aValue = a.lastCommunication || 0;
          bValue = b.lastCommunication || 0;
          break;
        case "responseRate":
          aValue = a.responseRate;
          bValue = b.responseRate;
          break;
        default:
          aValue = a.lastName || "";
          bValue = b.lastName || "";
      }

      if (typeof aValue === "string") {
        return sortOrder === "asc" ? 
          aValue.localeCompare(bValue) : 
          bValue.localeCompare(aValue);
      } else {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }
    });

    // Pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;
    const totalCount = validContacts.length;
    const paginatedContacts = validContacts.slice(offset, offset + limit);
    const hasMore = offset + limit < totalCount;

    // Generate facets from all valid contacts
    const facets = {
      functionGroups: generateFacet(validContacts, "functionGroup"),
      seniority: generateFacet(validContacts, "seniority"),
      status: generateFacet(validContacts, "status"),
      industries: generateFacet(validContacts, c => c.company?.industryLabel),
      countries: generateFacet(validContacts, c => c.company?.country),
    };

    return {
      contacts: paginatedContacts,
      facets,
      totalCount,
      hasMore,
    };
  },
});

// Helper function to generate facets
function generateFacet(items: any[], fieldPath: string | ((item: any) => any)): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  
  for (const item of items) {
    const value = typeof fieldPath === "string" ? item[fieldPath] : fieldPath(item);
    if (value) {
      counts.set(value, (counts.get(value) || 0) + 1);
    }
  }
  
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20); // Limit facets
}