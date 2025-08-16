import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Convert selected leads to contacts for a specific client
 * This creates a client-specific relationship without modifying the global lead data
 */
export const convertLeadsToContacts = mutation({
  args: {
    leadIds: v.array(v.id("leads")),
    clientIdentifier: v.string(), // Changed to string identifier
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

    // Find client by identifier (could be _id, domain, email, or name)
    let client = null;
    
    // First try as direct Convex ID
    try {
      client = await ctx.db.get(clientIdentifier as any);
      console.log(`✅ Found client by ID: ${client?.name} (${clientIdentifier})`);
    } catch (error) {
      console.log(`🔍 Client identifier ${clientIdentifier} is not a valid Convex ID, trying other fields...`);
    }
    
    // If not found by ID, try by domain
    if (!client) {
      client = await ctx.db
        .query("clients")
        .filter((q) => q.eq(q.field("domain"), clientIdentifier))
        .first();
      if (client) console.log(`✅ Found client by domain: ${client.name}`);
    }
    
    // If not found by domain, try by email
    if (!client) {
      client = await ctx.db
        .query("clients")
        .filter((q) => q.eq(q.field("email"), clientIdentifier))
        .first();
      if (client) console.log(`✅ Found client by email: ${client.name}`);
    }
    
    // If not found by email, try by name
    if (!client) {
      client = await ctx.db
        .query("clients")
        .filter((q) => q.eq(q.field("name"), clientIdentifier))
        .first();
      if (client) console.log(`✅ Found client by name: ${client.name}`);
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

        // Check if this lead is already a contact for this client
        const existingContact = await ctx.db
          .query("contacts")
          .withIndex("by_lead_client", (q) => q.eq("leadId", leadId).eq("clientId", clientId))
          .first();

        if (existingContact) {
          results.errors.push(`Lead ${lead.email || leadId} is already a contact for this client`);
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
          status: "cold", // Default status for converted leads
          lastCommunicationAt: undefined,
          optedIn: false,
          fullEnrichment: false,
          
          // Denormalized lead data
          firstName: lead.firstName,
          lastName: lead.lastName,
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

        // Track successful conversion
        results.convertedCount++;
        results.convertedContacts.push({
          contactId: contactId,
          leadId: leadId,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          companyName: companyData?.name,
        });

      } catch (error) {
        results.errors.push(`Error converting lead ${leadId}: ${error.message}`);
        results.skippedCount++;
        results.success = false;
      }
    }

    return results;
  },
});

/**
 * Get conversion preview - shows what will happen when leads are converted
 */
export const getConversionPreview = mutation({
  args: {
    leadIds: v.array(v.id("leads")),
    clientIdentifier: v.string(),
  },
  returns: v.object({
    totalLeads: v.number(),
    alreadyContacts: v.number(),
    canConvert: v.number(),
    leads: v.array(v.object({
      leadId: v.id("leads"),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.string(),
      companyName: v.optional(v.string()),
      jobTitle: v.optional(v.string()),
      isAlreadyContact: v.boolean(),
    })),
  }),
  handler: async (ctx, args) => {
    const { leadIds, clientIdentifier } = args;

    // Find client by identifier (could be _id, domain, email, or name)
    let client = null;
    
    // First try as direct Convex ID
    try {
      client = await ctx.db.get(clientIdentifier as any);
      console.log(`✅ Found client by ID for preview: ${client?.name} (${clientIdentifier})`);
    } catch (error) {
      console.log(`🔍 Client identifier ${clientIdentifier} is not a valid Convex ID, trying other fields...`);
    }
    
    // If not found by ID, try by domain
    if (!client) {
      client = await ctx.db
        .query("clients")
        .filter((q) => q.eq(q.field("domain"), clientIdentifier))
        .first();
      if (client) console.log(`✅ Found client by domain for preview: ${client.name}`);
    }
    
    // If not found by domain, try by email
    if (!client) {
      client = await ctx.db
        .query("clients")
        .filter((q) => q.eq(q.field("email"), clientIdentifier))
        .first();
      if (client) console.log(`✅ Found client by email for preview: ${client.name}`);
    }
    
    // If not found by email, try by name
    if (!client) {
      client = await ctx.db
        .query("clients")
        .filter((q) => q.eq(q.field("name"), clientIdentifier))
        .first();
      if (client) console.log(`✅ Found client by name for preview: ${client.name}`);
    }

    if (!client) {
      throw new Error(`Client with identifier ${clientIdentifier} does not exist`);
    }

    const clientId = client._id;

    const preview = {
      totalLeads: leadIds.length,
      alreadyContacts: 0,
      canConvert: 0,
      leads: [] as any[],
    };

    for (const leadId of leadIds) {
      const lead = await ctx.db.get(leadId);
      if (!lead) continue;

      // Check if already a contact
      const existingContact = await ctx.db
        .query("contacts")
        .withIndex("by_lead_client", (q) => q.eq("leadId", leadId).eq("clientId", clientId))
        .first();

      const isAlreadyContact = !!existingContact;
      if (isAlreadyContact) {
        preview.alreadyContacts++;
      } else {
        preview.canConvert++;
      }

      // Get company name if available
      let companyName = undefined;
      if (lead.companyId) {
        const company = await ctx.db.get(lead.companyId);
        companyName = company?.name;
      }

      preview.leads.push({
        leadId: leadId,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        companyName: companyName,
        jobTitle: lead.jobTitle,
        isAlreadyContact: isAlreadyContact,
      });
    }

    return preview;
  },
});

/**
 * Get best matching leads for target audience criteria
 */
export const getTargetAudienceLeads = mutation({
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
      score: v.number(), // Match score 0-100
      isAlreadyContact: v.boolean(),
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

    // Find client by identifier (could be _id, domain, email, or name)
    let client = null;
    
    // First try as direct Convex ID
    try {
      client = await ctx.db.get(clientIdentifier as any);
      console.log(`✅ Found client by ID for target audience: ${client?.name} (${clientIdentifier})`);
    } catch (error) {
      console.log(`🔍 Client identifier ${clientIdentifier} is not a valid Convex ID, trying other fields...`);
    }
    
    // If not found by ID, try by domain
    if (!client) {
      client = await ctx.db
        .query("clients")
        .filter((q) => q.eq(q.field("domain"), clientIdentifier))
        .first();
      if (client) console.log(`✅ Found client by domain for target audience: ${client.name}`);
    }
    
    // If not found by domain, try by email
    if (!client) {
      client = await ctx.db
        .query("clients")
        .filter((q) => q.eq(q.field("email"), clientIdentifier))
        .first();
      if (client) console.log(`✅ Found client by email for target audience: ${client.name}`);
    }
    
    if (!client) {
      throw new Error(`Client with identifier ${clientIdentifier} does not exist`);
    }

    const clientId = client._id;

    // Get active leads
    const allLeads = await ctx.db
      .query("leads")
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(2000);

    // Get existing contacts for this client
    const existingContacts = await ctx.db
      .query("contacts")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .collect();
    
    const existingLeadIds = new Set(existingContacts.map(c => c.leadId).filter(Boolean));

    // Score and filter leads
    const scoredLeads: any[] = [];

    for (const lead of allLeads) {
      let score = 0;
      let matches = 0;
      let totalCriteria = 0;

      // Function group matching (high weight)
      if (functionGroups && functionGroups.length > 0) {
        totalCriteria++;
        if (lead.functionGroup && functionGroups.includes(lead.functionGroup)) {
          score += 30;
          matches++;
        }
      }

      // Get company data for industry and employee count
      let companyData = null;
      if (lead.companyId) {
        companyData = await ctx.db.get(lead.companyId);
      }

      // Skip leads without fully enriched companies
      if (!companyData?.fullEnrichment) {
        continue;
      }

      // Industry matching (medium weight)
      if (industries && industries.length > 0) {
        totalCriteria++;
        if (companyData?.industryLabel && industries.includes(companyData.industryLabel)) {
          score += 25;
          matches++;
        }
      }

      // Country matching (medium weight)
      if (countries && countries.length > 0) {
        totalCriteria++;
        if (lead.country && countries.includes(lead.country)) {
          score += 20;
          matches++;
        }
      }

      // Employee count matching (lower weight)
      if (minEmployeeCount || maxEmployeeCount) {
        totalCriteria++;
        const employeeCount = companyData?.employeeCount || lead.employeeCount;
        if (employeeCount) {
          const min = minEmployeeCount || 1;
          const max = maxEmployeeCount || 10000;
          if (employeeCount >= min && employeeCount <= max) {
            score += 15;
            matches++;
          }
        }
      }

      // Bonus points for complete profiles
      if (lead.email) score += 5;
      if (lead.firstName && lead.lastName) score += 5;
      if (lead.jobTitle) score += 3;
      if (companyData?.name) score += 2;

      // Only include leads with at least one criteria match
      if (matches > 0) {
        const finalScore = totalCriteria > 0 ? Math.round((score / (totalCriteria * 25 + 15)) * 100) : score;
        
        scoredLeads.push({
          leadId: lead._id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          jobTitle: lead.jobTitle,
          functionGroup: lead.functionGroup,
          companyName: companyData?.name,
          industry: companyData?.industryLabel,
          employeeCount: companyData?.employeeCount || lead.employeeCount,
          country: lead.country,
          city: lead.city,
          score: Math.min(finalScore, 100),
          isAlreadyContact: existingLeadIds.has(lead._id),
        });
      }
    }

    // Sort by score (highest first) and filter out existing contacts
    const filteredAndSortedLeads = scoredLeads
      .filter(lead => !lead.isAlreadyContact)
      .sort((a, b) => b.score - a.score);
    
    // Get total count before limiting
    const totalMatches = filteredAndSortedLeads.length;
    
    // Apply limit for returned results
    const availableLeads = filteredAndSortedLeads.slice(0, maxResults);

    return {
      totalMatches: totalMatches,
      leads: availableLeads,
    };
  },
});