import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * SIMPLIFIED CANDIDATE VIEWS - CAMPAIGN CONTACT SELECTION
 * 
 * Key Changes from Complex Model:
 * - Works with simplified contacts table (only essential fields)
 * - All personal/company data retrieved via joins
 * - Candidate selection based on client's owned contact relationships
 * - Campaign targeting, not lead marketplace
 */

// ===============================
// ABM CANDIDATES (CLIENT'S CONTACTS) - SIMPLIFIED
// ===============================

export const abmCandidates = query({
  args: {
    clientId: v.id("clients"),
    minCompanySize: v.optional(v.number()),
    excludeOptedOut: v.optional(v.boolean()),
    minDecisionMakers: v.optional(v.number()),
  },
  returns: v.array(v.object({
    companyId: v.id("companies"),
    companyName: v.string(),
    domain: v.optional(v.string()),
    website: v.optional(v.string()),
    industry: v.optional(v.string()),
    companySize: v.optional(v.number()),
    location: v.optional(v.string()),
    decisionMakerCount: v.number(),
    totalContactCount: v.number(),
    eligibleContactCount: v.number(),
    lastCommunicationAt: v.optional(v.number()),
    sampleContacts: v.array(v.object({
      contactId: v.id("contacts"),
      leadFirstName: v.optional(v.string()),
      leadLastName: v.optional(v.string()),
      leadJobTitle: v.optional(v.string()),
      leadFunctionGroup: v.optional(v.string()),
      leadEmail: v.string(),
      contactStatus: v.optional(v.string()),
      isEligible: v.boolean(),
      eligibilityReason: v.optional(v.string()),
    })),
  })),
  handler: async (ctx, args) => {
    const minCompanySize = args.minCompanySize || 25;
    const minDecisionMakers = args.minDecisionMakers || 2;
    
    // Decision maker function groups
    const decisionMakerGroups = [
      'Owner/Founder',
      'Marketing Decision Makers', 
      'Sales Decision Makers',
      'Business Development Decision Makers',
      'Operational Decision Makers',
      'Technical Decision Makers', 
      'Financial Decision Makers',
      'HR Decision Makers'
    ];

    // Get all contacts for this client
    const clientContacts = await ctx.db
      .query("contacts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    // Group contacts by company
    const companyGroups = new Map<string, {
      company: any;
      contacts: Array<any>;
      decisionMakers: Array<any>;
      eligibleContacts: Array<any>;
      lastCommunicationAt?: number;
    }>();

    // Process contacts and enrich with lead/company data
    await Promise.all(
      clientContacts.map(async (contact) => {
        // Get lead data
        const lead = await ctx.db.get(contact.leadId);
        if (!lead) return;

        // Get company data
        const company = await ctx.db.get(contact.companyId);
        if (!company || (company.companySize || 0) < minCompanySize) return;

        const companyId = company._id;
        if (!companyGroups.has(companyId)) {
          companyGroups.set(companyId, {
            company,
            contacts: [],
            decisionMakers: [],
            eligibleContacts: [],
            lastCommunicationAt: undefined,
          });
        }

        const group = companyGroups.get(companyId)!;
        
        // Add contact with lead data
        const enrichedContact = {
          ...contact,
          lead,
        };
        
        group.contacts.push(enrichedContact);

        // Check if this is a decision maker
        if (lead.functionGroup && decisionMakerGroups.includes(lead.functionGroup)) {
          group.decisionMakers.push(enrichedContact);
        }

        // Check eligibility for ABM campaigns
        let isEligible = true;
        let eligibilityReason: string | undefined;

        // Exclude opted out contacts if specified
        if (args.excludeOptedOut && !contact.optedIn) {
          isEligible = false;
          eligibilityReason = "Not opted in";
        }
        
        // Check recent communication limits
        if (contact.lastCommunicationAt) {
          const daysSinceContact = (Date.now() - contact.lastCommunicationAt) / (24 * 60 * 60 * 1000);
          
          // Simple cooldown: 30 days default
          if (daysSinceContact < 30) {
            isEligible = false;
            eligibilityReason = `Recently contacted (${Math.ceil(30 - daysSinceContact)} days remaining)`;
          }
        }

        if (isEligible) {
          group.eligibleContacts.push(enrichedContact);
        }

        // Update last communication time for the company
        if (contact.lastCommunicationAt) {
          if (!group.lastCommunicationAt || contact.lastCommunicationAt > group.lastCommunicationAt) {
            group.lastCommunicationAt = contact.lastCommunicationAt;
          }
        }
      })
    );

    // Filter companies that qualify for ABM
    const abmCandidates = [];
    
    for (const [companyId, group] of companyGroups) {
      // ABM criteria: At least X decision makers with at least 1 eligible
      const eligibleDecisionMakers = group.decisionMakers.filter(dm => 
        group.eligibleContacts.some(ec => ec._id === dm._id)
      );
      
      if (group.decisionMakers.length >= minDecisionMakers && eligibleDecisionMakers.length >= 1) {
        // Create sample contacts (mix of eligible and ineligible for transparency)
        const sampleContacts = group.decisionMakers.slice(0, 5).map(contact => {
          const isEligible = group.eligibleContacts.some(ec => ec._id === contact._id);
          let eligibilityReason: string | undefined;
          
          if (!isEligible) {
            if (!contact.optedIn) eligibilityReason = "Not opted in";
            else if (contact.lastCommunicationAt) {
              const daysSinceContact = (Date.now() - contact.lastCommunicationAt) / (24 * 60 * 60 * 1000);
              eligibilityReason = `Recently contacted (${Math.ceil(daysSinceContact)} days ago)`;
            }
          }
          
          return {
            contactId: contact._id,
            leadFirstName: contact.lead.firstName,
            leadLastName: contact.lead.lastName,
            leadJobTitle: contact.lead.jobTitle,
            leadFunctionGroup: contact.lead.functionGroup,
            leadEmail: contact.lead.email,
            contactStatus: contact.status,
            isEligible,
            eligibilityReason,
          };
        });

        abmCandidates.push({
          companyId: group.company._id,
          companyName: group.company.name,
          domain: group.company.domain,
          website: group.company.website,
          industry: group.company.industrySlug,
          companySize: group.company.companySize,
          location: group.company.city && group.company.country 
            ? `${group.company.city}, ${group.company.country}` 
            : (group.company.city || group.company.country),
          decisionMakerCount: group.decisionMakers.length,
          totalContactCount: group.contacts.length,
          eligibleContactCount: group.eligibleContacts.length,
          lastCommunicationAt: group.lastCommunicationAt,
          sampleContacts,
        });
      }
    }

    // Sort by eligible contact count and decision maker count
    return abmCandidates.sort((a, b) => {
      const scoreA = a.eligibleContactCount * 3 + a.decisionMakerCount;
      const scoreB = b.eligibleContactCount * 3 + b.decisionMakerCount;
      return scoreB - scoreA;
    });
  },
});

// ===============================
// COLD EMAIL CANDIDATES (CLIENT'S CONTACTS) - SIMPLIFIED
// ===============================

export const coldEmailCandidates = query({
  args: {
    clientId: v.id("clients"),
    functionGroups: v.optional(v.array(v.string())),
    industries: v.optional(v.array(v.string())),
    countries: v.optional(v.array(v.string())),
    contactStatuses: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    contactId: v.id("contacts"),
    
    // Contact relationship data
    status: v.optional(v.string()),
    lastCommunicationAt: v.optional(v.number()),
    optedIn: v.optional(v.boolean()),
    fullEnrichment: v.optional(v.boolean()),
    
    // Lead data (from join)
    leadId: v.id("leads"),
    leadFirstName: v.optional(v.string()),
    leadLastName: v.optional(v.string()),
    leadEmail: v.string(),
    leadJobTitle: v.optional(v.string()),
    leadFunctionGroup: v.optional(v.string()),
    leadSeniority: v.optional(v.string()),
    leadCountry: v.optional(v.string()),
    leadLinkedinUrl: v.optional(v.string()),
    
    // Company data (from join)
    companyId: v.id("companies"),
    companyName: v.optional(v.string()),
    companyIndustry: v.optional(v.string()),
    companySize: v.optional(v.number()),
    
    // Campaign eligibility
    isEligible: v.boolean(),
    eligibilityReason: v.optional(v.string()),
    daysSinceLastCommunication: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    // Get contacts for this client
    let contacts = await ctx.db
      .query("contacts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
    
    // Apply contact status filter
    if (args.contactStatuses && args.contactStatuses.length > 0) {
      contacts = contacts.filter(contact => 
        contact.status && args.contactStatuses.includes(contact.status)
      );
    } else {
      // Default to cold contacts if no status specified
      contacts = contacts.filter(contact => 
        contact.status === "cold" || !contact.status
      );
    }

    // Enrich contacts with lead and company data
    const enrichedContacts = await Promise.all(
      contacts.map(async (contact) => {
        // Get lead data
        const lead = await ctx.db.get(contact.leadId);
        if (!lead) {
          console.error(`Lead ${contact.leadId} not found for contact ${contact._id}`);
          return null;
        }

        // Get company data
        const company = await ctx.db.get(contact.companyId);
        if (!company) {
          console.error(`Company ${contact.companyId} not found for contact ${contact._id}`);
          return null;
        }

        // Apply lead-based filters
        if (args.functionGroups && args.functionGroups.length > 0) {
          if (!lead.functionGroup || !args.functionGroups.includes(lead.functionGroup)) {
            return null;
          }
        }

        if (args.countries && args.countries.length > 0) {
          if (!lead.country || !args.countries.includes(lead.country)) {
            return null;
          }
        }

        if (args.industries && args.industries.length > 0) {
          if (!company.industryLabel || !args.industries.includes(company.industryLabel)) {
            return null;
          }
        }

        // Check campaign eligibility
        let isEligible = true;
        let eligibilityReason: string | undefined;
        let daysSinceLastCommunication: number | undefined;

        // Check if opted in
        if (!contact.optedIn) {
          isEligible = false;
          eligibilityReason = "Not opted in";
        }

        // Check time-based eligibility
        if (isEligible && contact.lastCommunicationAt) {
          daysSinceLastCommunication = (Date.now() - contact.lastCommunicationAt) / (24 * 60 * 60 * 1000);
          
          // Simple 30-day cooldown
          if (daysSinceLastCommunication < 30) {
            isEligible = false;
            eligibilityReason = `Cooldown period (${Math.ceil(30 - daysSinceLastCommunication)} days remaining)`;
          }
        }

        return {
          contactId: contact._id,
          
          // Contact relationship data
          status: contact.status,
          lastCommunicationAt: contact.lastCommunicationAt,
          optedIn: contact.optedIn,
          fullEnrichment: contact.fullEnrichment,
          
          // Lead data
          leadId: lead._id,
          leadFirstName: lead.firstName,
          leadLastName: lead.lastName,
          leadEmail: lead.email,
          leadJobTitle: lead.jobTitle,
          leadFunctionGroup: lead.functionGroup,
          leadSeniority: lead.seniority,
          leadCountry: lead.country,
          leadLinkedinUrl: lead.linkedinUrl,
          
          // Company data
          companyId: company._id,
          companyName: company.name,
          companyIndustry: company.industryLabel,
          companySize: company.companySize,
          
          // Campaign eligibility
          isEligible,
          eligibilityReason,
          daysSinceLastCommunication,
        };
      })
    );

    // Filter out nulls
    let filteredContacts = enrichedContacts.filter(contact => contact !== null);

    // Sort by eligibility and enrichment
    filteredContacts.sort((a, b) => {
      if (a.isEligible && !b.isEligible) return -1;
      if (!a.isEligible && b.isEligible) return 1;
      
      // Among eligible, prioritize fully enriched
      if (a.fullEnrichment && !b.fullEnrichment) return -1;
      if (!a.fullEnrichment && b.fullEnrichment) return 1;
      
      return (b.daysSinceLastCommunication || 365) - (a.daysSinceLastCommunication || 365);
    });

    return filteredContacts.slice(0, limit);
  },
});

// ===============================
// LINKEDIN CANDIDATES (CLIENT'S CONTACTS) - SIMPLIFIED
// ===============================

export const linkedinCandidates = query({
  args: {
    clientId: v.id("clients"),
    functionGroups: v.optional(v.array(v.string())),
    countries: v.optional(v.array(v.string())),
    minCompanySize: v.optional(v.number()),
    contactStatuses: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    contactId: v.id("contacts"),
    
    // Contact relationship data
    status: v.optional(v.string()),
    lastCommunicationAt: v.optional(v.number()),
    optedIn: v.optional(v.boolean()),
    
    // Lead data (from join)
    leadId: v.id("leads"),
    leadFirstName: v.optional(v.string()),
    leadLastName: v.optional(v.string()),
    leadEmail: v.string(),
    leadJobTitle: v.optional(v.string()),
    leadFunctionGroup: v.optional(v.string()),
    leadSeniority: v.optional(v.string()),
    leadCountry: v.optional(v.string()),
    leadLinkedinUrl: v.optional(v.string()),
    
    // Company data (from join)
    companyId: v.id("companies"),
    companyName: v.optional(v.string()),
    companyIndustry: v.optional(v.string()),
    companySize: v.optional(v.number()),
    
    // LinkedIn eligibility
    hasLinkedinUrl: v.boolean(),
    isEligibleForLinkedin: v.boolean(),
    eligibilityReason: v.optional(v.string()),
    daysSinceLastCommunication: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const minCompanySize = args.minCompanySize || 5;
    
    // Get contacts for this client
    let contacts = await ctx.db
      .query("contacts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    // Apply contact status filter
    if (args.contactStatuses && args.contactStatuses.length > 0) {
      contacts = contacts.filter(contact => 
        contact.status && args.contactStatuses.includes(contact.status)
      );
    } else {
      // Default to warm/cold contacts
      contacts = contacts.filter(contact => 
        ["warm", "cold", "prospect"].includes(contact.status || "cold")
      );
    }

    // Enrich with lead and company data
    const enrichedContacts = await Promise.all(
      contacts.map(async (contact) => {
        // Get lead data
        const lead = await ctx.db.get(contact.leadId);
        if (!lead) return null;

        // Get company data
        const company = await ctx.db.get(contact.companyId);
        if (!company) return null;

        // Apply filters
        if (args.functionGroups && args.functionGroups.length > 0) {
          if (!lead.functionGroup || !args.functionGroups.includes(lead.functionGroup)) {
            return null;
          }
        }

        if (args.countries && args.countries.length > 0) {
          if (!lead.country || !args.countries.includes(lead.country)) {
            return null;
          }
        }

        // Company size filter
        if (company.companySize && company.companySize < minCompanySize) {
          return null;
        }

        const hasLinkedinUrl = !!lead.linkedinUrl;
        
        // Determine LinkedIn eligibility
        let isEligibleForLinkedin = true;
        let eligibilityReason: string | undefined;
        let daysSinceLastCommunication: number | undefined;

        if (!hasLinkedinUrl) {
          isEligibleForLinkedin = false;
          eligibilityReason = "No LinkedIn URL";
        } else if (!contact.optedIn) {
          isEligibleForLinkedin = false;
          eligibilityReason = "Not opted in";
        } else {
          // Check recent communication (LinkedIn has shorter cooldown)
          if (contact.lastCommunicationAt) {
            daysSinceLastCommunication = (Date.now() - contact.lastCommunicationAt) / (24 * 60 * 60 * 1000);
            if (daysSinceLastCommunication < 14) { // 14-day cooldown for LinkedIn
              isEligibleForLinkedin = false;
              eligibilityReason = `Recent communication (${Math.ceil(14 - daysSinceLastCommunication)} days cooldown)`;
            }
          }
        }

        return {
          contactId: contact._id,
          
          // Contact relationship data
          status: contact.status,
          lastCommunicationAt: contact.lastCommunicationAt,
          optedIn: contact.optedIn,
          
          // Lead data
          leadId: lead._id,
          leadFirstName: lead.firstName,
          leadLastName: lead.lastName,
          leadEmail: lead.email,
          leadJobTitle: lead.jobTitle,
          leadFunctionGroup: lead.functionGroup,
          leadSeniority: lead.seniority,
          leadCountry: lead.country,
          leadLinkedinUrl: lead.linkedinUrl,
          
          // Company data
          companyId: company._id,
          companyName: company.name,
          companyIndustry: company.industryLabel,
          companySize: company.companySize,
          
          // LinkedIn eligibility
          hasLinkedinUrl,
          isEligibleForLinkedin,
          eligibilityReason,
          daysSinceLastCommunication,
        };
      })
    );

    // Filter out nulls and sort
    const filteredContacts = enrichedContacts
      .filter(contact => contact !== null)
      .sort((a, b) => {
        // Eligible contacts first
        if (a.isEligibleForLinkedin && !b.isEligibleForLinkedin) return -1;
        if (!a.isEligibleForLinkedin && b.isEligibleForLinkedin) return 1;
        
        // Then by days since last communication (older first)
        return (b.daysSinceLastCommunication || 0) - (a.daysSinceLastCommunication || 0);
      })
      .slice(0, limit);

    return filteredContacts;
  },
});