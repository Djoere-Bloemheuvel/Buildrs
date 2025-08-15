import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Public leads database queries - NO client_id restrictions
export const listLeads = query({
  args: {
    limit: v.optional(v.number()),
    functionGroups: v.optional(v.array(v.string())),
    countries: v.optional(v.array(v.string())),
    industries: v.optional(v.array(v.string())),
    searchTerm: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.array(v.object({
    _id: v.id("leads"),
    _creationTime: v.number(),
    companyId: v.optional(v.id("companies")),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.string(), // Required field with unique constraint
    mobilePhone: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    seniority: v.optional(v.string()),
    functionGroup: v.optional(v.string()),
    country: v.optional(v.string()),
    state: v.optional(v.string()),
    city: v.optional(v.string()),
    addedAt: v.optional(v.number()),
    lastUpdatedAt: v.optional(v.number()),
    sourceType: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    originalContactId: v.optional(v.id("contacts")),
    // Company data (joined)
    companyName: v.optional(v.string()),
    companyDomain: v.optional(v.string()),
    companyWebsite: v.optional(v.string()),
    companyIndustry: v.optional(v.string()),
    companySize: v.optional(v.number()),
  })),
  handler: async (ctx, { limit = 50, functionGroups, countries, industries, searchTerm, isActive = true }) => {
    let leadsQuery = ctx.db.query("leads");
    
    // Filter by active status
    if (isActive !== undefined) {
      leadsQuery = leadsQuery.filter((q) => q.eq(q.field("isActive"), isActive));
    }
    
    // Get base leads
    let leads = await leadsQuery
      .order("desc")
      .take(limit);
    
    // Apply additional filters
    if (functionGroups && functionGroups.length > 0) {
      leads = leads.filter(lead => 
        lead.functionGroup && functionGroups.includes(lead.functionGroup)
      );
    }
    
    if (countries && countries.length > 0) {
      leads = leads.filter(lead => 
        lead.country && countries.includes(lead.country)
      );
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      leads = leads.filter(lead => 
        (lead.firstName?.toLowerCase().includes(term)) ||
        (lead.lastName?.toLowerCase().includes(term)) ||
        (lead.email?.toLowerCase().includes(term)) ||
        (lead.jobTitle?.toLowerCase().includes(term))
      );
    }
    
    // Enrich with company data
    const enrichedLeads = await Promise.all(
      leads.map(async (lead) => {
        let companyData = {};
        
        if (lead.companyId) {
          const company = await ctx.db.get(lead.companyId);
          if (company) {
            companyData = {
              companyName: company.name,
              companyDomain: company.domain,
              companyWebsite: company.website,
              companyIndustry: company.industryLabel,
              companySize: company.companySize,
            };
          }
        }
        
        return {
          ...lead,
          ...companyData,
        };
      })
    );
    
    // Filter by industries if specified (after company join)
    if (industries && industries.length > 0) {
      return enrichedLeads.filter(lead => 
        lead.companyIndustry && industries.includes(lead.companyIndustry)
      );
    }
    
    return enrichedLeads;
  },
});

// Get lead statistics
export const getLeadsStats = query({
  args: {},
  returns: v.object({
    totalLeads: v.number(),
    activeLeads: v.number(),
    byFunctionGroup: v.object({}),
    byCountry: v.object({}),
    bySource: v.object({}),
    recentCount: v.number(), // Added in last 7 days
  }),
  handler: async (ctx) => {
    const allLeads = await ctx.db.query("leads").collect();
    const activeLeads = allLeads.filter(lead => lead.isActive !== false);
    
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentLeads = activeLeads.filter(lead => 
      (lead.addedAt || lead._creationTime) > sevenDaysAgo
    );
    
    // Group by function group
    const byFunctionGroup: Record<string, number> = {};
    activeLeads.forEach(lead => {
      if (lead.functionGroup) {
        byFunctionGroup[lead.functionGroup] = (byFunctionGroup[lead.functionGroup] || 0) + 1;
      }
    });
    
    // Group by country
    const byCountry: Record<string, number> = {};
    activeLeads.forEach(lead => {
      if (lead.country) {
        byCountry[lead.country] = (byCountry[lead.country] || 0) + 1;
      }
    });
    
    // Group by source
    const bySource: Record<string, number> = {};
    activeLeads.forEach(lead => {
      const source = lead.sourceType || 'unknown';
      bySource[source] = (bySource[source] || 0) + 1;
    });
    
    return {
      totalLeads: allLeads.length,
      activeLeads: activeLeads.length,
      byFunctionGroup,
      byCountry,
      bySource,
      recentCount: recentLeads.length,
    };
  },
});

// Search leads (more advanced search capabilities)
export const searchLeads = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
    filters: v.optional(v.object({
      functionGroups: v.optional(v.array(v.string())),
      countries: v.optional(v.array(v.string())),
      seniorityLevels: v.optional(v.array(v.string())),
      companySizeMin: v.optional(v.number()),
      companySizeMax: v.optional(v.number()),
    })),
  },
  returns: v.array(v.object({
    _id: v.id("leads"),
    _creationTime: v.number(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.string(), // Required field with unique constraint
    jobTitle: v.optional(v.string()),
    functionGroup: v.optional(v.string()),
    seniority: v.optional(v.string()),
    country: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    companyName: v.optional(v.string()),
    companyDomain: v.optional(v.string()),
    companyIndustry: v.optional(v.string()),
    companySize: v.optional(v.number()),
    relevanceScore: v.number(),
  })),
  handler: async (ctx, { searchTerm, limit = 100, filters }) => {
    const term = searchTerm.toLowerCase();
    
    // Get all active leads
    const leads = await ctx.db
      .query("leads")
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(1000); // Get more for better search results
    
    // Calculate relevance and filter
    const scoredLeads = await Promise.all(
      leads.map(async (lead) => {
        let relevanceScore = 0;
        
        // Score based on different fields
        if (lead.firstName?.toLowerCase().includes(term)) relevanceScore += 10;
        if (lead.lastName?.toLowerCase().includes(term)) relevanceScore += 10;
        if (lead.email?.toLowerCase().includes(term)) relevanceScore += 15;
        if (lead.jobTitle?.toLowerCase().includes(term)) relevanceScore += 20;
        if (lead.functionGroup?.toLowerCase().includes(term)) relevanceScore += 5;
        
        // Get company data for additional scoring
        let companyData = {};
        if (lead.companyId) {
          const company = await ctx.db.get(lead.companyId);
          if (company) {
            if (company.name?.toLowerCase().includes(term)) relevanceScore += 25;
            if (company.domain?.toLowerCase().includes(term)) relevanceScore += 15;
            if (company.industryLabel?.toLowerCase().includes(term)) relevanceScore += 8;
            
            companyData = {
              companyName: company.name,
              companyDomain: company.domain,
              companyIndustry: company.industryLabel,
              companySize: company.companySize,
            };
          }
        }
        
        return {
          _id: lead._id,
          _creationTime: lead._creationTime,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          jobTitle: lead.jobTitle,
          functionGroup: lead.functionGroup,
          seniority: lead.seniority,
          country: lead.country,
          linkedinUrl: lead.linkedinUrl,
          ...companyData,
          relevanceScore,
        };
      })
    );
    
    // Filter out non-matching leads
    let filteredLeads = scoredLeads.filter(lead => lead.relevanceScore > 0);
    
    // Apply additional filters
    if (filters) {
      if (filters.functionGroups && filters.functionGroups.length > 0) {
        filteredLeads = filteredLeads.filter(lead => 
          lead.functionGroup && filters.functionGroups!.includes(lead.functionGroup)
        );
      }
      
      if (filters.countries && filters.countries.length > 0) {
        filteredLeads = filteredLeads.filter(lead => 
          lead.country && filters.countries!.includes(lead.country)
        );
      }
      
      if (filters.seniorityLevels && filters.seniorityLevels.length > 0) {
        filteredLeads = filteredLeads.filter(lead => 
          lead.seniority && filters.seniorityLevels!.includes(lead.seniority)
        );
      }
      
      if (filters.companySizeMin !== undefined) {
        filteredLeads = filteredLeads.filter(lead => 
          lead.companySize && lead.companySize >= filters.companySizeMin!
        );
      }
      
      if (filters.companySizeMax !== undefined) {
        filteredLeads = filteredLeads.filter(lead => 
          lead.companySize && lead.companySize <= filters.companySizeMax!
        );
      }
    }
    
    // Sort by relevance score and limit
    return filteredLeads
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  },
});

// Get lead by ID (public access)
export const getLead = query({
  args: { leadId: v.id("leads") },
  returns: v.union(
    v.object({
      _id: v.id("leads"),
      _creationTime: v.number(),
      companyId: v.optional(v.id("companies")),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.string(), // Required field with unique constraint
      mobilePhone: v.optional(v.string()),
      linkedinUrl: v.optional(v.string()),
      jobTitle: v.optional(v.string()),
      seniority: v.optional(v.string()),
      functionGroup: v.optional(v.string()),
      country: v.optional(v.string()),
      state: v.optional(v.string()),
      city: v.optional(v.string()),
      addedAt: v.optional(v.number()),
      lastUpdatedAt: v.optional(v.number()),
      sourceType: v.optional(v.string()),
      isActive: v.optional(v.boolean()),
      // Company data (joined)
      company: v.optional(v.object({
        _id: v.id("companies"),
        name: v.string(),
        domain: v.optional(v.string()),
        website: v.optional(v.string()),
        industryLabel: v.optional(v.string()),
        subindustryLabel: v.optional(v.string()),
        companySize: v.optional(v.number()),
        country: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        companySummary: v.optional(v.string()),
      })),
    }),
    v.null()
  ),
  handler: async (ctx, { leadId }) => {
    const lead = await ctx.db.get(leadId);
    if (!lead || lead.isActive === false) {
      return null;
    }
    
    // Get company data if available
    let company = null;
    if (lead.companyId) {
      company = await ctx.db.get(lead.companyId);
    }
    
    return {
      ...lead,
      company,
    };
  },
});