import { v } from "convex/values";
import { query } from "./_generated/server";

export const getEnrichedContacts = query({
  args: {
    search: v.optional(v.string()),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
    clientId: v.optional(v.string()),
    sortBy: v.optional(v.string()),
    sortOrder: v.optional(v.string()),
    functionGroups: v.optional(v.array(v.string())),
    industries: v.optional(v.array(v.string())),
    subindustries: v.optional(v.array(v.string())),
    locations: v.optional(v.array(v.string())),
    maxEmployeeCount: v.optional(v.number()),
  },
  returns: v.object({
    data: v.array(v.object({
      id: v.string(),
      contact_id: v.optional(v.string()),
      first_name: v.optional(v.string()),
      last_name: v.optional(v.string()),
      email: v.optional(v.string()),
      mobile_phone: v.optional(v.string()),
      status: v.optional(v.string()),
      company_name: v.optional(v.string()),
      domain: v.optional(v.string()),
      website: v.optional(v.string()),
      linkedin_url: v.optional(v.string()),
      job_title: v.optional(v.string()),
      function_group: v.optional(v.string()),
      industry: v.optional(v.string()),
      industry_label: v.optional(v.string()),
      subindustry_label: v.optional(v.string()),
      employee_count: v.optional(v.number()),
      company_size: v.optional(v.number()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      country: v.optional(v.string()),
      company_city: v.optional(v.string()),
      company_state: v.optional(v.string()),
      company_country: v.optional(v.string()),
      contact_city: v.optional(v.string()),
      contact_state: v.optional(v.string()),
      contact_country: v.optional(v.string()),
    })),
    count: v.number(),
    page: v.number(),
    pageSize: v.number(),
    totalPages: v.number(),
  }),
  handler: async (ctx, args) => {
    const {
      search = "",
      page = 1,
      pageSize = 25,
      functionGroups,
      industries,
      subindustries,
      locations,
      maxEmployeeCount,
    } = args;

    // Get leads from the database with company data
    const limit = 1000; // Get more leads for filtering
    
    let leadsQuery = ctx.db.query("leads");
    
    // Filter by active status
    leadsQuery = leadsQuery.filter((q) => q.eq(q.field("isActive"), true));
    
    // Get leads
    let leads = await leadsQuery
      .order("desc")
      .take(limit);

    // Apply search filter
    if (search) {
      const term = search.toLowerCase();
      leads = leads.filter(lead => 
        (lead.firstName?.toLowerCase().includes(term)) ||
        (lead.lastName?.toLowerCase().includes(term)) ||
        (lead.email?.toLowerCase().includes(term)) ||
        (lead.jobTitle?.toLowerCase().includes(term))
      );
    }

    // Apply function group filter
    if (functionGroups && functionGroups.length > 0) {
      leads = leads.filter(lead => 
        lead.functionGroup && functionGroups.includes(lead.functionGroup)
      );
    }

    // Apply location filter (country-based for now)
    if (locations && locations.length > 0) {
      leads = leads.filter(lead => {
        if (!lead.country) return false;
        return locations.some(location => 
          location.includes(lead.country!) || lead.country!.includes(location)
        );
      });
    }

    // Enrich with company data and apply company-based filters
    const enrichedLeads = await Promise.all(
      leads.map(async (lead) => {
        let companyData = {
          companyName: undefined,
          companyDomain: undefined,
          companyWebsite: undefined,
          companyIndustry: undefined,
          companySubindustry: undefined,
          companySize: undefined,
          companyCountry: undefined,
          companyCity: undefined,
          companyState: undefined,
        };
        
        if (lead.companyId) {
          const company = await ctx.db.get(lead.companyId);
          if (company) {
            companyData = {
              companyName: company.name,
              companyDomain: company.domain,
              companyWebsite: company.website,
              companyIndustry: company.industryLabel,
              companySubindustry: company.subindustryLabel,
              companySize: company.companySize,
              companyCountry: company.country,
              companyCity: company.city,
              companyState: company.state,
            };
          }
        }
        
        // Transform to match expected interface
        return {
          id: lead._id,
          contact_id: lead._id, // Use lead ID as contact_id
          first_name: lead.firstName,
          last_name: lead.lastName,
          email: lead.email,
          mobile_phone: lead.mobilePhone,
          status: "cold", // Default status for leads
          company_name: companyData.companyName,
          domain: companyData.companyDomain,
          website: companyData.companyWebsite,
          linkedin_url: lead.linkedinUrl,
          job_title: lead.jobTitle,
          function_group: lead.functionGroup,
          industry: companyData.companyIndustry,
          industry_label: companyData.companyIndustry,
          subindustry_label: companyData.companySubindustry,
          employee_count: companyData.companySize,
          company_size: companyData.companySize,
          city: lead.city,
          state: lead.state,
          country: lead.country,
          company_city: companyData.companyCity,
          company_state: companyData.companyState,
          company_country: companyData.companyCountry,
          contact_city: lead.city,
          contact_state: lead.state,
          contact_country: lead.country,
        };
      })
    );

    // Apply industry filters (after company join)
    let filteredLeads = enrichedLeads;
    
    if (industries && industries.length > 0) {
      filteredLeads = filteredLeads.filter(lead => 
        lead.industry_label && industries.includes(lead.industry_label)
      );
    }

    if (subindustries && subindustries.length > 0) {
      filteredLeads = filteredLeads.filter(lead => 
        lead.subindustry_label && subindustries.includes(lead.subindustry_label)
      );
    }

    // Apply employee count filter
    if (maxEmployeeCount && maxEmployeeCount > 0) {
      filteredLeads = filteredLeads.filter(lead => {
        const size = lead.company_size || lead.employee_count || 0;
        return size <= maxEmployeeCount;
      });
    }

    // Apply pagination
    const total = filteredLeads.length;
    const offset = (page - 1) * pageSize;
    const paginatedLeads = filteredLeads.slice(offset, offset + pageSize);

    return {
      data: paginatedLeads,
      count: total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  },
});

export const getFilterOptions = query({
  args: {},
  returns: v.object({
    functionGroups: v.array(v.string()),
    industryLabels: v.array(v.string()),
    subindustryLabels: v.array(v.string()),
    locations: v.array(v.string()),
  }),
  handler: async (ctx) => {
    // Get real data from leads and companies
    const leads = await ctx.db
      .query("leads")
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(1000);

    const companies = await ctx.db.query("companies").take(1000);

    // Extract unique values
    const functionGroups = new Set<string>();
    const industryLabels = new Set<string>();
    const subindustryLabels = new Set<string>();
    const locations = new Set<string>();

    // Process leads
    leads.forEach(lead => {
      if (lead.functionGroup) functionGroups.add(lead.functionGroup);
      if (lead.country) {
        locations.add(lead.country);
        if (lead.city) {
          locations.add(`${lead.city}, ${lead.country}`);
        }
      }
    });

    // Process companies
    companies.forEach(company => {
      if (company.industryLabel) industryLabels.add(company.industryLabel);
      if (company.subindustryLabel) subindustryLabels.add(company.subindustryLabel);
      if (company.country) {
        locations.add(company.country);
        if (company.city) {
          locations.add(`${company.city}, ${company.country}`);
        }
      }
    });

    // Convert sets to sorted arrays
    return {
      functionGroups: Array.from(functionGroups).sort(),
      industryLabels: Array.from(industryLabels).sort(),
      subindustryLabels: Array.from(subindustryLabels).sort(),
      locations: Array.from(locations).sort(),
    };
  },
});