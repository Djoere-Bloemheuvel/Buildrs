import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * EXACT LEAD DATABASE FOR FRONTEND
 * 
 * Returns leads that:
 * 1. EXACTLY match all provided filters  
 * 2. Are NEVER contacts anywhere
 * 3. Prioritized by: Least converted > Newest > Lead score
 */

export const getExactFilteredLeads = query({
  args: {
    functionGroups: v.optional(v.array(v.string())),
    industries: v.optional(v.array(v.string())),
    countries: v.optional(v.array(v.string())),
    minEmployeeCount: v.optional(v.number()),
    maxEmployeeCount: v.optional(v.number()),
    searchTerm: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    clientIdentifier: v.optional(v.string()), // For UI context
  },
  returns: v.object({
    data: v.array(v.object({
      _id: v.id("leads"),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.string(),
      mobilePhone: v.optional(v.string()),
      jobTitle: v.optional(v.string()),
      functionGroup: v.optional(v.string()),
      country: v.optional(v.string()),
      state: v.optional(v.string()),
      city: v.optional(v.string()),
      linkedinUrl: v.optional(v.string()),
      // Company data
      companyName: v.optional(v.string()),
      domain: v.optional(v.string()),
      website: v.optional(v.string()),
      companyLinkedinUrl: v.optional(v.string()),
      industry: v.optional(v.string()),
      subindustryLabel: v.optional(v.string()),
      employeeCount: v.optional(v.number()),
      companySize: v.optional(v.number()),
      
      // DEBUG: Employee count debugging
      debugEmployeeData: v.object({
        companyEmployeeCount: v.optional(v.number()),
        leadEmployeeCount: v.optional(v.number()),
        finalEmployeeCount: v.optional(v.number()),
        companyName: v.optional(v.string()),
        leadFirstName: v.optional(v.string()),
        hasCompanyData: v.boolean(),
        companyId: v.optional(v.id("companies")),
      }),
      
      // Company location
      companyCountry: v.optional(v.string()),
      companyState: v.optional(v.string()),
      companyCity: v.optional(v.string()),
      companySummary: v.optional(v.string()),
      shortCompanySummary: v.optional(v.string()),
      // Tracking data
      timesConverted: v.number(),
      addedAt: v.optional(v.number()),
      leadScore: v.optional(v.number()),
    })),
    total: v.number(),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const { 
      functionGroups, 
      industries, 
      countries, 
      minEmployeeCount, 
      maxEmployeeCount,
      searchTerm,
      limit = 50,
      offset = 0,
      clientIdentifier,
    } = args;

    console.log(`🎯 Lead Database: Exact filtering with:`, {
      functionGroups,
      industries, 
      countries,
      minEmployeeCount,
      maxEmployeeCount,
      searchTerm,
    });

    // Find client to get proper filtering
    let client = null;
    if (clientIdentifier) {
      try {
        client = await ctx.db.get(clientIdentifier as any);
        console.log(`✅ Found client for filtering: ${client?.name} (${clientIdentifier})`);
      } catch (error) {
        console.log(`🔍 Client identifier ${clientIdentifier} is not a valid Convex ID, trying other fields...`);
      }
      
      if (!client) {
        client = await ctx.db
          .query("clients")
          .filter((q) => q.eq(q.field("domain"), clientIdentifier))
          .first();
        if (client) console.log(`✅ Found client by domain: ${client.name}`);
      }
    }

    // STEP 1: Get ALL leads that are contacts (exclude completely)
    // Include both global contacts AND client-specific contacts
    const allContacts = await ctx.db
      .query("contacts")
      .collect();
    
    const contactLeadIds = new Set(allContacts.map(c => c.leadId).filter(Boolean));
    console.log(`❌ Excluding ${contactLeadIds.size} leads that are already contacts anywhere`);

    // STEP 2: Get all active leads
    const allLeads = await ctx.db
      .query("leads")
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(10000); // Large limit for comprehensive filtering
    
    console.log(`📋 Processing ${allLeads.length} active leads for exact filtering`);

    // STEP 3: Apply EXACT filters
    const exactMatches: any[] = [];

    for (const lead of allLeads) {
      // Skip if already a contact
      if (contactLeadIds.has(lead._id)) {
        continue;
      }

      let isExactMatch = true;

      // EXACT Function Group matching
      if (functionGroups && functionGroups.length > 0) {
        if (!lead.functionGroup || !functionGroups.includes(lead.functionGroup)) {
          isExactMatch = false;
        }
      }

      // Get company data for industry and employee count
      let companyData = null;
      if (lead.companyId) {
        companyData = await ctx.db.get(lead.companyId);
      }

      // EXACT Industry matching  
      if (industries && industries.length > 0 && isExactMatch) {
        if (!companyData?.industryLabel || !industries.includes(companyData.industryLabel)) {
          isExactMatch = false;
        }
      }

      // EXACT Country matching
      if (countries && countries.length > 0 && isExactMatch) {
        if (!lead.country || !countries.includes(lead.country)) {
          isExactMatch = false;
        }
      }

      // EXACT Employee count matching
      if ((minEmployeeCount || maxEmployeeCount) && isExactMatch) {
        const employeeCount = companyData?.companySize;
        if (!employeeCount) {
          isExactMatch = false;
        } else {
          const min = minEmployeeCount || 1;
          const max = maxEmployeeCount || 100000;
          if (employeeCount < min || employeeCount > max) {
            isExactMatch = false;
          }
        }
      }

      // EXACT Full Enrichment requirement - only show leads with fully enriched companies
      if (isExactMatch) {
        if (!companyData?.fullEnrichment) {
          isExactMatch = false;
        }
      }

      // Search term matching (if provided)
      if (searchTerm && isExactMatch) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
          lead.firstName?.toLowerCase().includes(searchLower) ||
          lead.lastName?.toLowerCase().includes(searchLower) ||
          lead.email?.toLowerCase().includes(searchLower) ||
          lead.jobTitle?.toLowerCase().includes(searchLower) ||
          companyData?.name?.toLowerCase().includes(searchLower)
        );
        
        if (!matchesSearch) {
          isExactMatch = false;
        }
      }

      // Only include leads with EXACT match on ALL criteria
      if (isExactMatch) {
        // DEBUG: Log employee count data for each match
        console.log(`👥 Backend Debug for ${lead.firstName} at ${companyData?.name}: companySize=${companyData?.companySize}, leadEmpCount=${lead.employeeCount}, final=${companyData?.companySize || lead.employeeCount}`);
        
        exactMatches.push({
          _id: lead._id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          mobilePhone: lead.mobilePhone,
          jobTitle: lead.jobTitle,
          functionGroup: lead.functionGroup,
          country: lead.country,
          state: lead.state,  // provincie
          city: lead.city,
          linkedinUrl: lead.linkedinUrl,
          // Company data
          companyName: companyData?.name,
          domain: companyData?.domain,
          website: companyData?.website,
          companyLinkedinUrl: companyData?.companyLinkedinUrl,
          industry: companyData?.industryLabel,
          subindustryLabel: companyData?.subindustryLabel,
          employeeCount: companyData?.companySize || lead.employeeCount,
          companySize: companyData?.companySize || lead.employeeCount, // duplicate for compatibility
          
          // DEBUG: Log employee count data
          debugEmployeeData: {
            companyEmployeeCount: companyData?.companySize,
            leadEmployeeCount: lead.employeeCount,
            finalEmployeeCount: companyData?.companySize || lead.employeeCount,
            companyName: companyData?.name,
            leadFirstName: lead.firstName,
            hasCompanyData: !!companyData,
            companyId: lead.companyId,
          },
          // Company location
          companyCountry: companyData?.country,
          companyState: companyData?.state,
          companyCity: companyData?.city,
          companySummary: companyData?.companySummary,
          shortCompanySummary: companyData?.shortCompanySummary,
          // Tracking data
          timesConverted: lead.totalTimesContacted || 0,
          addedAt: lead.addedAt || 0,
          leadScore: lead.leadScore || 0,
        });
      }
    }

    console.log(`✅ Found ${exactMatches.length} leads with EXACT match on all criteria`);

    // STEP 4: Sort by NEW priority rules
    // 1. Least converted first (timesConverted ASC)
    // 2. Newest leads first (addedAt DESC) 
    // 3. Highest lead score (leadScore DESC)
    const sortedMatches = exactMatches.sort((a, b) => {
      // Primary: Least converted (0 conversions first)
      if (a.timesConverted !== b.timesConverted) {
        return a.timesConverted - b.timesConverted;
      }
      
      // Secondary: Newest first
      if (a.addedAt !== b.addedAt) {
        return (b.addedAt || 0) - (a.addedAt || 0);
      }
      
      // Tertiary: Highest score
      return (b.leadScore || 0) - (a.leadScore || 0);
    });

    // STEP 5: Apply pagination
    const paginatedResults = sortedMatches.slice(offset, offset + limit);
    const hasMore = sortedMatches.length > (offset + limit);

    console.log(`📊 Returning ${paginatedResults.length} of ${sortedMatches.length} prioritized leads`);

    return {
      data: paginatedResults,
      total: sortedMatches.length,
      hasMore,
    };
  },
});

// Get filter options for the frontend dropdowns
export const getExactFilterOptions = query({
  args: {},
  returns: v.object({
    functionGroups: v.array(v.string()),
    industries: v.array(v.string()),
    countries: v.array(v.string()),
  }),
  handler: async (ctx) => {
    // Only get options from leads that are NOT contacts
    const allContacts = await ctx.db
      .query("contacts")
      .collect();
    
    const contactLeadIds = new Set(allContacts.map(c => c.leadId).filter(Boolean));

    const allLeads = await ctx.db
      .query("leads")
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(10000);
    
    // Filter out leads that are already contacts
    const availableLeads = allLeads.filter(lead => !contactLeadIds.has(lead._id));

    const functionGroups = new Set<string>();
    const industries = new Set<string>();
    const countries = new Set<string>();

    for (const lead of availableLeads) {
      if (lead.functionGroup) {
        functionGroups.add(lead.functionGroup);
      }
      
      if (lead.country) {
        countries.add(lead.country);
      }

      if (lead.companyId) {
        const company = await ctx.db.get(lead.companyId);
        if (company?.industryLabel && company?.fullEnrichment) {
          industries.add(company.industryLabel);
        }
      }
    }

    return {
      functionGroups: Array.from(functionGroups).sort(),
      industries: Array.from(industries).sort(),
      countries: Array.from(countries).sort(),
    };
  },
});