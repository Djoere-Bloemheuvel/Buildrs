import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * DENORMALIZED CANDIDATE VIEWS - ULTRA HIGH PERFORMANCE
 * 
 * No joins needed! All data is already in the contacts table.
 * Perfect for processing 5k+ contacts per day with minimal latency.
 */

// ===============================
// ABM CANDIDATES (ULTRA FAST) 
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
    website: v.optional(v.string()),
    industry: v.optional(v.string()),
    subindustry: v.optional(v.string()),
    companySummary: v.optional(v.string()),
    shortCompanySummary: v.optional(v.string()),
    companyLinkedinUrl: v.optional(v.string()),
    decisionMakerCount: v.number(),
    totalContactCount: v.number(),
    eligibleContactCount: v.number(),
    lastCommunicationAt: v.optional(v.number()),
    sampleContacts: v.array(v.object({
      contactId: v.id("contacts"),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      jobTitle: v.optional(v.string()),
      functionGroup: v.optional(v.string()),
      linkedinUrl: v.optional(v.string()),
      status: v.optional(v.string()),
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

    // Get all contacts for this client (NO JOINS!)
    const clientContacts = await ctx.db
      .query("contacts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    // Group contacts by company (using denormalized data)
    const companyGroups = new Map<string, {
      companyData: {
        companyId: string;
        companyName: string;
        website?: string;
        industry?: string;
        subindustry?: string;
        companySummary?: string;
        shortCompanySummary?: string;
        companyLinkedinUrl?: string;
      };
      contacts: Array<any>;
      decisionMakers: Array<any>;
      eligibleContacts: Array<any>;
      lastCommunicationAt?: number;
    }>();

    // Process contacts (all data already available!)
    clientContacts.forEach(contact => {
      // Skip contacts without company data
      if (!contact.name) return; // Company name is required
      
      const companyId = contact.companyId;
      if (!companyGroups.has(companyId)) {
        companyGroups.set(companyId, {
          companyData: {
            companyId: contact.companyId,
            companyName: contact.name, // Denormalized company name
            website: contact.website,
            industry: contact.industryLabel,
            subindustry: contact.subindustryLabel,
            companySummary: contact.companySummary,
            shortCompanySummary: contact.shortCompanySummary,
            companyLinkedinUrl: contact.companyLinkedinUrl,
          },
          contacts: [],
          decisionMakers: [],
          eligibleContacts: [],
          lastCommunicationAt: undefined,
        });
      }

      const group = companyGroups.get(companyId)!;
      group.contacts.push(contact);

      // Check if this is a decision maker (using denormalized data)
      if (contact.functionGroup && decisionMakerGroups.includes(contact.functionGroup)) {
        group.decisionMakers.push(contact);
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
        group.eligibleContacts.push(contact);
      }

      // Update last communication time for the company
      if (contact.lastCommunicationAt) {
        if (!group.lastCommunicationAt || contact.lastCommunicationAt > group.lastCommunicationAt) {
          group.lastCommunicationAt = contact.lastCommunicationAt;
        }
      }
    });

    // Filter companies that qualify for ABM
    const abmCandidates = [];
    
    for (const [companyId, group] of companyGroups) {
      // ABM criteria: At least X decision makers with at least 1 eligible
      const eligibleDecisionMakers = group.decisionMakers.filter(dm => 
        group.eligibleContacts.some(ec => ec._id === dm._id)
      );
      
      if (group.decisionMakers.length >= minDecisionMakers && eligibleDecisionMakers.length >= 1) {
        // Create sample contacts (all data already available!)
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
            firstName: contact.firstName,
            lastName: contact.lastName,
            jobTitle: contact.jobTitle,
            functionGroup: contact.functionGroup,
            linkedinUrl: contact.linkedinUrl,
            status: contact.status,
            isEligible,
            eligibilityReason,
          };
        });

        abmCandidates.push({
          companyId: group.companyData.companyId,
          companyName: group.companyData.companyName,
          website: group.companyData.website,
          industry: group.companyData.industry,
          subindustry: group.companyData.subindustry,
          companySummary: group.companyData.companySummary,
          shortCompanySummary: group.companyData.shortCompanySummary,
          companyLinkedinUrl: group.companyData.companyLinkedinUrl,
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
// COLD EMAIL CANDIDATES (ULTRA FAST)
// ===============================

export const coldEmailCandidates = query({
  args: {
    clientId: v.id("clients"),
    functionGroups: v.optional(v.array(v.string())),
    industries: v.optional(v.array(v.string())),
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
    
    // Denormalized lead data (no joins!)
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    functionGroup: v.optional(v.string()),
    
    // Denormalized company data (no joins!)
    companyName: v.optional(v.string()),
    website: v.optional(v.string()),
    industry: v.optional(v.string()),
    subindustry: v.optional(v.string()),
    companySummary: v.optional(v.string()),
    shortCompanySummary: v.optional(v.string()),
    
    // Campaign eligibility
    isEligible: v.boolean(),
    eligibilityReason: v.optional(v.string()),
    daysSinceLastCommunication: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    // Get contacts for this client (with filtering using indexes!)
    let contactsQuery = ctx.db.query("contacts").withIndex("by_client", (q) => q.eq("clientId", args.clientId));
    
    let contacts = await contactsQuery.collect();
    
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

    // Apply filters using denormalized data (no joins!)
    if (args.functionGroups && args.functionGroups.length > 0) {
      contacts = contacts.filter(contact => 
        contact.functionGroup && args.functionGroups!.includes(contact.functionGroup)
      );
    }

    if (args.industries && args.industries.length > 0) {
      contacts = contacts.filter(contact => 
        contact.industryLabel && args.industries!.includes(contact.industryLabel)
      );
    }

    // Process contacts for eligibility (all data already available!)
    const processedContacts = contacts.map(contact => {
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
        
        // Denormalized lead data (already available!)
        firstName: contact.firstName,
        lastName: contact.lastName,
        linkedinUrl: contact.linkedinUrl,
        jobTitle: contact.jobTitle,
        functionGroup: contact.functionGroup,
        
        // Denormalized company data (already available!)
        companyName: contact.name,
        website: contact.website,
        industry: contact.industryLabel,
        subindustry: contact.subindustryLabel,
        companySummary: contact.companySummary,
        shortCompanySummary: contact.shortCompanySummary,
        
        // Campaign eligibility
        isEligible,
        eligibilityReason,
        daysSinceLastCommunication,
      };
    });

    // Sort by eligibility and enrichment
    const sortedContacts = processedContacts.sort((a, b) => {
      if (a.isEligible && !b.isEligible) return -1;
      if (!a.isEligible && b.isEligible) return 1;
      
      // Among eligible, prioritize fully enriched
      if (a.fullEnrichment && !b.fullEnrichment) return -1;
      if (!a.fullEnrichment && b.fullEnrichment) return 1;
      
      return (b.daysSinceLastCommunication || 365) - (a.daysSinceLastCommunication || 365);
    });

    return sortedContacts.slice(0, limit);
  },
});

// ===============================
// LINKEDIN CANDIDATES (ULTRA FAST)
// ===============================

export const linkedinCandidates = query({
  args: {
    clientId: v.id("clients"),
    functionGroups: v.optional(v.array(v.string())),
    industries: v.optional(v.array(v.string())),
    contactStatuses: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    contactId: v.id("contacts"),
    
    // Contact relationship data
    status: v.optional(v.string()),
    lastCommunicationAt: v.optional(v.number()),
    optedIn: v.optional(v.boolean()),
    
    // Denormalized lead data (no joins!)
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    functionGroup: v.optional(v.string()),
    
    // Denormalized company data (no joins!)
    companyName: v.optional(v.string()),
    website: v.optional(v.string()),
    industry: v.optional(v.string()),
    companySummary: v.optional(v.string()),
    shortCompanySummary: v.optional(v.string()),
    
    // LinkedIn eligibility
    hasLinkedinUrl: v.boolean(),
    isEligibleForLinkedin: v.boolean(),
    eligibilityReason: v.optional(v.string()),
    daysSinceLastCommunication: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    // Get contacts for this client
    let contacts = await ctx.db
      .query("contacts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    // Apply filters using denormalized data (no joins!)
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

    if (args.functionGroups && args.functionGroups.length > 0) {
      contacts = contacts.filter(contact => 
        contact.functionGroup && args.functionGroups.includes(contact.functionGroup)
      );
    }

    if (args.industries && args.industries.length > 0) {
      contacts = contacts.filter(contact => 
        contact.industryLabel && args.industries.includes(contact.industryLabel)
      );
    }

    // Process for LinkedIn eligibility (all data already available!)
    const processedContacts = contacts.map(contact => {
      const hasLinkedinUrl = !!contact.linkedinUrl;
      
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
        
        // Denormalized lead data (already available!)
        firstName: contact.firstName,
        lastName: contact.lastName,
        linkedinUrl: contact.linkedinUrl,
        jobTitle: contact.jobTitle,
        functionGroup: contact.functionGroup,
        
        // Denormalized company data (already available!)
        companyName: contact.name,
        website: contact.website,
        industry: contact.industryLabel,
        companySummary: contact.companySummary,
        shortCompanySummary: contact.shortCompanySummary,
        
        // LinkedIn eligibility
        hasLinkedinUrl,
        isEligibleForLinkedin,
        eligibilityReason,
        daysSinceLastCommunication,
      };
    });

    // Filter and sort
    const filteredContacts = processedContacts
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

// ===============================
// INSTANT EXPORT FOR CAMPAIGNS (ULTRA FAST)
// ===============================

export const getContactsForInstantlyExport = query({
  args: {
    clientId: v.id("clients"),
    contactIds: v.array(v.id("contacts")),
  },
  returns: v.array(v.object({
    // Ready for Instantly API with all data from contacts table
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.string(), // Only field that needs a join
    jobTitle: v.optional(v.string()),
    functionGroup: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    companyName: v.optional(v.string()),
    website: v.optional(v.string()),
    companyLinkedinUrl: v.optional(v.string()),
    industry: v.optional(v.string()),
    subindustry: v.optional(v.string()),
    companySummary: v.optional(v.string()),
    shortCompanySummary: v.optional(v.string()),
  })),
  handler: async (ctx, { clientId, contactIds }) => {
    // Get contacts by IDs (very fast lookup)
    const contacts = await Promise.all(
      contactIds.map(id => ctx.db.get(id))
    );
    
    // Filter out nulls and verify client ownership
    const validContacts = contacts.filter(c => c && c.clientId === clientId);
    
    // Minimal join - only for email (all other data is denormalized!)
    const exportData = await Promise.all(
      validContacts.map(async contact => {
        const lead = await ctx.db.get(contact.leadId);
        
        return {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: lead?.email || "", // Only join needed!
          jobTitle: contact.jobTitle,
          functionGroup: contact.functionGroup,
          linkedinUrl: contact.linkedinUrl,
          companyName: contact.name,
          website: contact.website,
          companyLinkedinUrl: contact.companyLinkedinUrl,
          industry: contact.industryLabel,
          subindustry: contact.subindustryLabel,
          companySummary: contact.companySummary,
          shortCompanySummary: contact.shortCompanySummary,
        };
      })
    );
    
    return exportData;
  },
});