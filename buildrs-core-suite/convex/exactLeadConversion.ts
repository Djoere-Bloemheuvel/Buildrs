import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * EXACT LEAD CONVERSION SYSTEM
 * 
 * New prioritization rules:
 * 1. EXACT MATCH on all filters (required)
 * 2. NEVER show leads that are already contacts anywhere
 * 3. Prioritize: Least converted > Newest leads > Lead score
 */

export const getExactMatchLeads = mutation({
  args: {
    functionGroups: v.optional(v.array(v.string())),
    industries: v.optional(v.array(v.string())),
    countries: v.optional(v.array(v.string())),
    minEmployeeCount: v.optional(v.number()),
    maxEmployeeCount: v.optional(v.number()),
    maxResults: v.optional(v.number()),
    clientIdentifier: v.string(),
  },
  returns: v.object({
    totalMatches: v.number(),
    leads: v.array(v.object({
      leadId: v.id("leads"),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.string(),
      jobTitle: v.optional(v.string()),
      functionGroup: v.optional(v.string()),
      companyName: v.optional(v.string()),
      industry: v.optional(v.string()),
      employeeCount: v.optional(v.number()),
      country: v.optional(v.string()),
      city: v.optional(v.string()),
      timesConverted: v.number(),
      addedAt: v.optional(v.number()),
      leadScore: v.optional(v.number()),
    })),
  }),
  handler: async (ctx, args) => {
    const { 
      functionGroups, 
      industries, 
      countries, 
      minEmployeeCount, 
      maxEmployeeCount, 
      maxResults = 100,
      clientIdentifier 
    } = args;

    // Find client by identifier
    let client = null;
    try {
      client = await ctx.db.get(clientIdentifier as any);
      console.log(`✅ Found client by ID for exact matching: ${client?.name} (${clientIdentifier})`);
    } catch (error) {
      console.log(`🔍 Client identifier ${clientIdentifier} is not a valid Convex ID, trying other fields...`);
    }
    
    if (!client) {
      client = await ctx.db
        .query("clients")
        .filter((q) => q.eq(q.field("domain"), clientIdentifier))
        .first();
      if (client) console.log(`✅ Found client by domain for exact matching: ${client.name}`);
    }
    
    if (!client) {
      client = await ctx.db
        .query("clients")
        .filter((q) => q.eq(q.field("email"), clientIdentifier))
        .first();
      if (client) console.log(`✅ Found client by email for exact matching: ${client.name}`);
    }
    
    if (!client) {
      throw new Error(`Client with identifier ${clientIdentifier} does not exist`);
    }

    console.log(`🎯 Starting exact match search with filters:`, {
      functionGroups,
      industries, 
      countries,
      minEmployeeCount,
      maxEmployeeCount,
    });

    // STEP 1: Get ALL leads that are already contacts (from any client)
    const allContacts = await ctx.db
      .query("contacts")
      .collect();
    
    const contactLeadIds = new Set(allContacts.map(c => c.leadId).filter(Boolean));
    console.log(`❌ Excluding ${contactLeadIds.size} leads that are already contacts anywhere`);

    // STEP 2: Get all active leads 
    const allLeads = await ctx.db
      .query("leads")
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(5000); // Increased limit for thorough filtering
    
    console.log(`📋 Processing ${allLeads.length} active leads for exact matching`);

    // STEP 3: Apply EXACT filters and collect matches
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
        const employeeCount = companyData?.employeeCount;
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

      // EXACT Full Enrichment requirement - only process leads with fully enriched companies
      if (isExactMatch) {
        if (!companyData?.fullEnrichment) {
          isExactMatch = false;
        }
      }

      // Only include leads with EXACT match on ALL criteria
      if (isExactMatch) {
        exactMatches.push({
          leadId: lead._id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          jobTitle: lead.jobTitle,
          functionGroup: lead.functionGroup,
          companyName: companyData?.name,
          industry: companyData?.industryLabel,
          employeeCount: companyData?.employeeCount,
          country: lead.country,
          city: lead.city,
          timesConverted: lead.totalTimesContacted || 0,
          addedAt: lead.addedAt || 0,
          leadScore: lead.leadScore || 0,
        });
      }
    }

    console.log(`✅ Found ${exactMatches.length} leads with EXACT match on all criteria`);

    // STEP 4: Sort by priority
    // 1. Least converted first (timesConverted ASC)
    // 2. Newest leads first (addedAt DESC) 
    // 3. Highest lead score (leadScore DESC)
    const sortedMatches = exactMatches.sort((a, b) => {
      // Primary: Least converted
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

    console.log(`📊 Prioritized leads - showing top ${Math.min(maxResults, sortedMatches.length)}`);

    // STEP 5: Apply limit for returned results
    const finalLeads = sortedMatches.slice(0, maxResults);

    return {
      totalMatches: sortedMatches.length,
      leads: finalLeads,
    };
  },
});

export const convertExactMatchLeads = mutation({
  args: {
    leadIds: v.array(v.id("leads")),
    clientIdentifier: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    convertedCount: v.number(),
    skippedCount: v.number(),
    errors: v.array(v.string()),
    convertedContacts: v.array(v.object({
      contactId: v.id("contacts"),
      leadId: v.id("leads"),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.optional(v.string()),
      companyName: v.optional(v.string()),
    })),
  }),
  handler: async (ctx, args) => {
    const { leadIds, clientIdentifier } = args;

    // Find client (same logic as above)
    let client = null;
    try {
      client = await ctx.db.get(clientIdentifier as any);
      console.log(`✅ Found client by ID for conversion: ${client?.name} (${clientIdentifier})`);
    } catch (error) {
      console.log(`🔍 Client identifier ${clientIdentifier} is not a valid Convex ID, trying other fields...`);
    }
    
    if (!client) {
      client = await ctx.db
        .query("clients")
        .filter((q) => q.eq(q.field("domain"), clientIdentifier))
        .first();
      if (client) console.log(`✅ Found client by domain for conversion: ${client.name}`);
    }
    
    if (!client) {
      client = await ctx.db
        .query("clients")
        .filter((q) => q.eq(q.field("email"), clientIdentifier))
        .first();
      if (client) console.log(`✅ Found client by email for conversion: ${client.name}`);
    }

    if (!client) {
      throw new Error(`Client with identifier ${clientIdentifier} does not exist`);
    }

    const clientId = client._id;

    const results = {
      success: true,
      convertedCount: 0,
      skippedCount: 0,
      errors: [] as string[],
      convertedContacts: [] as any[],
    };

    // Process each lead
    for (const leadId of leadIds) {
      try {
        // Get the lead data
        const lead = await ctx.db.get(leadId);
        if (!lead) {
          results.errors.push(`Lead ${leadId} not found`);
          results.skippedCount++;
          continue;
        }

        // Check if this lead is already a contact for ANY client (not just this one)
        const existingContact = await ctx.db
          .query("contacts")
          .filter((q) => q.eq(q.field("leadId"), leadId))
          .first();

        if (existingContact) {
          results.errors.push(`Lead ${lead.email || leadId} is already a contact`);
          results.skippedCount++;
          continue;
        }

        // Get company data if available
        let companyData = null;
        if (lead.companyId) {
          companyData = await ctx.db.get(lead.companyId);
        }

        // Skip if company doesn't have full enrichment
        if (!companyData?.fullEnrichment) {
          results.errors.push(`Lead ${lead.email || leadId} skipped - company not fully enriched`);
          results.skippedCount++;
          continue;
        }

        // Create the contact relationship
        const contactId = await ctx.db.insert("contacts", {
          leadId: leadId,
          clientId: clientId,
          companyId: lead.companyId || (companyData?._id),
          purchasedAt: Date.now(),
          status: "cold",

          // Denormalized lead data
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          mobilePhone: lead.mobilePhone,
          linkedinUrl: lead.linkedinUrl,
          jobTitle: lead.jobTitle,
          functionGroup: lead.functionGroup,

          // Denormalized company data
          name: companyData?.name,
          website: companyData?.website,
          companyLinkedinUrl: companyData?.companyLinkedinUrl,
          industryLabel: companyData?.industryLabel,
          subindustryLabel: companyData?.subindustryLabel,
          companySummary: companyData?.companySummary,
          shortCompanySummary: companyData?.shortCompanySummary,
        });

        // Increment lead conversion counter
        await ctx.db.patch(leadId, {
          totalTimesContacted: (lead.totalTimesContacted || 0) + 1,
          lastGlobalContactAt: Date.now(),
        });

        results.convertedContacts.push({
          contactId,
          leadId,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          companyName: companyData?.name,
        });

        results.convertedCount++;
        console.log(`✅ Converted lead: ${lead.email} to contact for ${client.name}`);

      } catch (error) {
        results.errors.push(`Failed to convert lead ${leadId}: ${error.message}`);
        results.skippedCount++;
        console.error(`❌ Failed to convert lead ${leadId}:`, error);
      }
    }

    if (results.errors.length > 0) {
      results.success = false;
    }

    console.log(`🏁 Conversion complete: ${results.convertedCount} converted, ${results.skippedCount} skipped`);
    
    return results;
  },
});