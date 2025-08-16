import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * NEW CANDIDATE VIEWS - CAMPAIGN CONTACT SELECTION
 * 
 * Key Changes from Old Model:
 * - Candidate selection now works with CONTACTS (client's owned relationships)
 * - Contacts reference leads for personal data via leadId
 * - ABM candidates look for companies where client has 2+ decision maker contacts
 * - Cold email candidates are client's contacts that haven't been emailed recently
 * - LinkedIn candidates are client's contacts not yet LinkedIn connected
 * 
 * This is NOT about lead marketplace - this is about campaign targeting!
 */

// ===============================
// ABM CANDIDATES (CLIENT'S CONTACTS)
// ===============================

export const abmCandidates = query({
  args: {
    clientId: v.id("clients"),
    minCompanySize: v.optional(v.number()),
    excludeDoNotContact: v.optional(v.boolean()),
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
    eligibleContactCount: v.number(), // Contacts eligible for ABM campaign
    lastCommunicationAt: v.optional(v.number()),
    industryLabel: v.optional(v.string()),
    subindustryLabel: v.optional(v.string()),
    companyCountry: v.optional(v.string()),
    companyState: v.optional(v.string()),
    companyCity: v.optional(v.string()),
    companyUniqueQualities: v.optional(v.string()),
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

    // Get all active contacts for this client
    const clientContacts = await ctx.db
      .query("contacts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .filter((q) => q.eq(q.field("isActive"), true))
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
        if (!lead || !lead.companyId) return;

        // Get company data
        const company = await ctx.db.get(lead.companyId);
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

        // Exclude opted out contacts
        if (contact.optedOut) {
          isEligible = false;
          eligibilityReason = "Opted out";
        }
        
        // Exclude do not contact if specified
        if (args.excludeDoNotContact && contact.status === "do_not_contact") {
          isEligible = false;
          eligibilityReason = "Do not contact";
        }

        // Check recent communication limits based on campaign history
        if (contact.lastContactedAt) {
          const daysSinceContact = (Date.now() - contact.lastContactedAt) / (24 * 60 * 60 * 1000);
          const timesContacted = contact.timesContacted || 0;
          
          let cooldownDays = 30; // Default cooldown
          if (timesContacted >= 7) cooldownDays = 90;
          else if (timesContacted >= 5) cooldownDays = 60;
          else if (timesContacted >= 3) cooldownDays = 45;
          
          if (daysSinceContact < cooldownDays) {
            isEligible = false;
            eligibilityReason = `Cooldown period (${Math.ceil(cooldownDays - daysSinceContact)} days remaining)`;
          }
        }

        if (isEligible) {
          group.eligibleContacts.push(enrichedContact);
        }

        // Update last communication time for the company
        if (contact.lastContactedAt) {
          if (!group.lastCommunicationAt || contact.lastContactedAt > group.lastCommunicationAt) {
            group.lastCommunicationAt = contact.lastContactedAt;
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
            if (contact.optedOut) eligibilityReason = "Opted out";
            else if (contact.status === "do_not_contact") eligibilityReason = "Do not contact";
            else if (contact.lastContactedAt) {
              const daysSinceContact = (Date.now() - contact.lastContactedAt) / (24 * 60 * 60 * 1000);
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
          industryLabel: group.company.industryLabel,
          subindustryLabel: group.company.subindustryLabel,
          companyCountry: group.company.country,
          companyState: group.company.state,
          companyCity: group.company.city,
          companyUniqueQualities: group.company.companyUniqueQualities,
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
// COLD EMAIL CANDIDATES (CLIENT'S CONTACTS)
// ===============================

export const coldEmailCandidates = query({
  args: {
    clientId: v.id("clients"),
    functionGroups: v.optional(v.array(v.string())),
    industries: v.optional(v.array(v.string())),
    countries: v.optional(v.array(v.string())),
    contactStatuses: v.optional(v.array(v.string())),
    includeAssignable: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    contactId: v.id("contacts"),
    
    // Contact relationship data
    status: v.optional(v.string()),
    relationshipStage: v.optional(v.string()),
    lastContactedAt: v.optional(v.number()),
    timesContacted: v.optional(v.number()),
    responsesReceived: v.optional(v.number()),
    clientResponseRate: v.optional(v.number()),
    assignedTo: v.optional(v.id("profiles")),
    
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
    companyId: v.optional(v.id("companies")),
    companyName: v.optional(v.string()),
    companyIndustry: v.optional(v.string()),
    companySize: v.optional(v.number()),
    
    // Campaign eligibility
    isEligible: v.boolean(),
    eligibilityReason: v.optional(v.string()),
    suggestedCampaignId: v.optional(v.id("campaigns")),
    daysSinceLastContact: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    // Get all active contacts for this client with status filtering
    let contactsQuery = ctx.db
      .query("contacts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .filter((q) => q.eq(q.field("isActive"), true));

    let contacts = await contactsQuery.collect();
    
    // Apply contact status filter
    if (args.contactStatuses && args.contactStatuses.length > 0) {
      contacts = contacts.filter(contact => 
        contact.status && args.contactStatuses!.includes(contact.status)
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
        let companyData = {
          companyId: undefined as any,
          companyName: undefined,
          companyIndustry: undefined,
          companySize: undefined,
        };
        
        if (lead.companyId) {
          const company = await ctx.db.get(lead.companyId);
          if (company) {
            companyData = {
              companyId: company._id,
              companyName: company.name,
              companyIndustry: company.industryLabel,
              companySize: company.companySize,
            };
          }
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
          if (!companyData.companyIndustry || !args.industries.includes(companyData.companyIndustry)) {
            return null;
          }
        }

        // Check campaign eligibility
        let isEligible = true;
        let eligibilityReason: string | undefined;
        let daysSinceLastContact: number | undefined;

        // Check if opted out
        if (contact.optedOut) {
          isEligible = false;
          eligibilityReason = "Opted out";
        }

        // Check if in active campaigns
        if (isEligible) {
          const activeCampaignContacts = await ctx.db
            .query("campaignContacts")
            .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
            .filter((q) => 
              q.or(
                q.eq(q.field("status"), "active"),
                q.eq(q.field("status"), "planned")
              )
            )
            .collect();

          if (activeCampaignContacts.length > 0) {
            isEligible = false;
            eligibilityReason = "Already in active campaign";
          }
        }

        // Check time-based eligibility
        if (isEligible && contact.lastContactedAt) {
          daysSinceLastContact = (Date.now() - contact.lastContactedAt) / (24 * 60 * 60 * 1000);
          const timesContacted = contact.timesContacted || 0;
          
          let requiredCooldown = 30; // Default cooldown
          if (timesContacted >= 7) requiredCooldown = 90;
          else if (timesContacted >= 5) requiredCooldown = 60;
          else if (timesContacted >= 3) requiredCooldown = 45;
          
          if (daysSinceLastContact < requiredCooldown) {
            isEligible = false;
            eligibilityReason = `Cooldown period (${Math.ceil(requiredCooldown - daysSinceLastContact)} days remaining)`;
          }
        }

        // Find suggested campaign (future feature)
        let suggestedCampaignId: string | undefined;
        // This would match contact criteria to campaign audience filters

        return {
          contactId: contact._id,
          
          // Contact relationship data
          status: contact.status,
          relationshipStage: contact.relationshipStage,
          lastContactedAt: contact.lastContactedAt,
          timesContracted: contact.timesContacted,
          responsesReceived: contact.responsesReceived,
          clientResponseRate: contact.clientResponseRate,
          assignedTo: contact.assignedTo,
          
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
          ...companyData,
          
          // Campaign eligibility
          isEligible,
          eligibilityReason,
          suggestedCampaignId,
          daysSinceLastContact,
        };
      })
    );

    // Filter out nulls and apply final filters
    let filteredContacts = enrichedContacts.filter(contact => contact !== null);

    // If includeAssignable is true, only return assignable contacts
    if (args.includeAssignable) {
      filteredContacts = filteredContacts.filter(contact => 
        contact.isEligible && contact.suggestedCampaignId
      );
    }

    // Sort by eligibility and response rate
    filteredContacts.sort((a, b) => {
      if (a.isEligible && !b.isEligible) return -1;
      if (!a.isEligible && b.isEligible) return 1;
      
      // Among eligible, sort by response rate and recency
      const scoreA = (a.clientResponseRate || 0) + (a.daysSinceLastContact || 365) / 10;
      const scoreB = (b.clientResponseRate || 0) + (b.daysSinceLastContact || 365) / 10;
      return scoreB - scoreA;
    });

    return filteredContacts.slice(0, limit);
  },
});

// ===============================
// LINKEDIN CANDIDATES (CLIENT'S CONTACTS)
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
    relationshipStage: v.optional(v.string()),
    isLinkedinConnected: v.optional(v.boolean()),
    linkedinConnectionDate: v.optional(v.number()),
    lastContactedAt: v.optional(v.number()),
    timesContracted: v.optional(v.number()),
    assignedTo: v.optional(v.id("profiles")),
    
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
    companyId: v.optional(v.id("companies")),
    companyName: v.optional(v.string()),
    companyIndustry: v.optional(v.string()),
    companySize: v.optional(v.number()),
    
    // LinkedIn eligibility
    hasLinkedinUrl: v.boolean(),
    isEligibleForLinkedin: v.boolean(),
    eligibilityReason: v.optional(v.string()),
    daysSinceLastContact: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const minCompanySize = args.minCompanySize || 5;
    
    // Get contacts for this client
    let contacts = await ctx.db
      .query("contacts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .filter((q) => q.eq(q.field("isActive"), true))
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
        let companyData = {
          companyId: undefined as any,
          companyName: undefined,
          companyIndustry: undefined,
          companySize: undefined,
        };
        
        if (lead.companyId) {
          const company = await ctx.db.get(lead.companyId);
          if (company) {
            companyData = {
              companyId: company._id,
              companyName: company.name,
              companyIndustry: company.industryLabel,
              companySize: company.companySize,
            };
          }
        }

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
        if (companyData.companySize && companyData.companySize < minCompanySize) {
          return null;
        }

        const hasLinkedinUrl = !!lead.linkedinUrl;
        const isLinkedinConnected = contact.isLinkedinConnected || false;
        
        // Determine LinkedIn eligibility
        let isEligibleForLinkedin = true;
        let eligibilityReason: string | undefined;
        let daysSinceLastContact: number | undefined;

        if (!hasLinkedinUrl) {
          isEligibleForLinkedin = false;
          eligibilityReason = "No LinkedIn URL";
        } else if (isLinkedinConnected) {
          isEligibleForLinkedin = false;
          eligibilityReason = "Already LinkedIn connected";
        } else if (contact.optedOut) {
          isEligibleForLinkedin = false;
          eligibilityReason = "Opted out";
        } else {
          // Check if in active LinkedIn campaigns
          const activeLinkedinCampaigns = await ctx.db
            .query("campaignContacts")
            .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
            .filter((q) => 
              q.and(
                q.or(
                  q.eq(q.field("status"), "active"),
                  q.eq(q.field("status"), "planned")
                ),
                // Additional filter for LinkedIn campaigns would go here
                // For now, we assume all campaigns could include LinkedIn
              )
            )
            .collect();

          if (activeLinkedinCampaigns.length > 0) {
            isEligibleForLinkedin = false;
            eligibilityReason = "Already in active campaign";
          }

          // Check recent communication (LinkedIn has shorter cooldown)
          if (contact.lastContactedAt) {
            daysSinceLastContact = (Date.now() - contact.lastContactedAt) / (24 * 60 * 60 * 1000);
            if (daysSinceLastContact < 14) { // 14-day cooldown for LinkedIn
              isEligibleForLinkedin = false;
              eligibilityReason = `Recent communication (${Math.ceil(14 - daysSinceLastContact)} days cooldown)`;
            }
          }
        }

        return {
          contactId: contact._id,
          
          // Contact relationship data
          status: contact.status,
          relationshipStage: contact.relationshipStage,
          isLinkedinConnected: contact.isLinkedinConnected,
          linkedinConnectionDate: contact.linkedinConnectionDate,
          lastContactedAt: contact.lastContactedAt,
          timesContacted: contact.timesContacted,
          assignedTo: contact.assignedTo,
          
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
          ...companyData,
          
          // LinkedIn eligibility
          hasLinkedinUrl,
          isEligibleForLinkedin,
          eligibilityReason,
          daysSinceLastContact,
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
        
        // Then by days since last contact (older first)
        return (b.daysSinceLastContact || 0) - (a.daysSinceLastContact || 0);
      })
      .slice(0, limit);

    return filteredContacts;
  },
});

// ===============================
// LINKEDIN REACTIVATION CANDIDATES
// ===============================

export const linkedinReactivationCandidates = query({
  args: {
    clientId: v.id("clients"),
    daysSinceConnection: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    contactId: v.id("contacts"),
    
    // Contact relationship data
    status: v.optional(v.string()),
    relationshipStage: v.optional(v.string()),
    isLinkedinConnected: v.optional(v.boolean()),
    linkedinConnectionDate: v.optional(v.number()),
    lastContactedAt: v.optional(v.number()),
    timesContracted: v.optional(v.number()),
    responsesReceived: v.optional(v.number()),
    
    // Lead data (from join)
    leadFirstName: v.optional(v.string()),
    leadLastName: v.optional(v.string()),
    leadEmail: v.string(),
    leadJobTitle: v.optional(v.string()),
    leadFunctionGroup: v.optional(v.string()),
    leadLinkedinUrl: v.optional(v.string()),
    
    // Company data (from join)
    companyName: v.optional(v.string()),
    companyIndustry: v.optional(v.string()),
    
    // Reactivation eligibility
    daysSinceConnection: v.optional(v.number()),
    daysSinceLastContact: v.optional(v.number()),
    isEligibleForReactivation: v.boolean(),
    reactivationReason: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 30;
    const minDaysSinceConnection = args.daysSinceConnection || 30;
    
    // Get LinkedIn connected contacts for this client
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.eq(q.field("isLinkedinConnected"), true)
        )
      )
      .collect();

    // Enrich and evaluate reactivation eligibility
    const enrichedContacts = await Promise.all(
      contacts.map(async (contact) => {
        // Get lead data
        const lead = await ctx.db.get(contact.leadId);
        if (!lead) return null;

        // Get company data
        let companyData = {
          companyName: undefined,
          companyIndustry: undefined,
        };
        
        if (lead.companyId) {
          const company = await ctx.db.get(lead.companyId);
          if (company) {
            companyData = {
              companyName: company.name,
              companyIndustry: company.industryLabel,
            };
          }
        }

        // Calculate time metrics
        const daysSinceConnection = contact.linkedinConnectionDate 
          ? (Date.now() - contact.linkedinConnectionDate) / (24 * 60 * 60 * 1000)
          : undefined;
        
        const daysSinceLastContact = contact.lastContactedAt
          ? (Date.now() - contact.lastContactedAt) / (24 * 60 * 60 * 1000)
          : undefined;

        // Determine reactivation eligibility
        let isEligibleForReactivation = true;
        let reactivationReason: string | undefined;

        if (!daysSinceConnection || daysSinceConnection < minDaysSinceConnection) {
          isEligibleForReactivation = false;
          reactivationReason = "Too recently connected";
        } else if (contact.optedOut) {
          isEligibleForReactivation = false;
          reactivationReason = "Opted out";
        } else if (daysSinceLastContact && daysSinceLastContact < 14) {
          isEligibleForReactivation = false;
          reactivationReason = "Recently contacted";
        } else if ((contact.responsesReceived || 0) > 0) {
          // Prioritize but still eligible
          reactivationReason = "Previous responder - high priority";
        } else if (!daysSinceLastContact) {
          reactivationReason = "Never contacted - opportunity";
        }

        return {
          contactId: contact._id,
          
          // Contact relationship data
          status: contact.status,
          relationshipStage: contact.relationshipStage,
          isLinkedinConnected: contact.isLinkedinConnected,
          linkedinConnectionDate: contact.linkedinConnectionDate,
          lastContactedAt: contact.lastContactedAt,
          timesContracted: contact.timesContacted,
          responsesReceived: contact.responsesReceived,
          
          // Lead data
          leadFirstName: lead.firstName,
          leadLastName: lead.lastName,
          leadEmail: lead.email,
          leadJobTitle: lead.jobTitle,
          leadFunctionGroup: lead.functionGroup,
          leadLinkedinUrl: lead.linkedinUrl,
          
          // Company data
          ...companyData,
          
          // Reactivation metrics
          daysSinceConnection,
          daysSinceLastContact,
          isEligibleForReactivation,
          reactivationReason,
        };
      })
    );

    // Filter and sort for reactivation
    return enrichedContacts
      .filter(contact => contact !== null && contact.isEligibleForReactivation)
      .sort((a, b) => {
        // Prioritize previous responders
        if ((a.responsesReceived || 0) > 0 && (b.responsesReceived || 0) === 0) return -1;
        if ((a.responsesReceived || 0) === 0 && (b.responsesReceived || 0) > 0) return 1;
        
        // Then by time since last contact (older first)
        return (b.daysSinceLastContact || 999) - (a.daysSinceLastContact || 999);
      })
      .slice(0, limit);
  },
});