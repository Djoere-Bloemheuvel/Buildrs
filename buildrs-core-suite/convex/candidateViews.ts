import { query } from "./_generated/server";
import { v } from "convex/values";

// ===============================
// ABM CANDIDATES
// Complex view with time-based filtering and decision maker logic
// ===============================

export const abmCandidates = query({
  args: {
    clientId: v.optional(v.id("clients")),
    minCompanySize: v.optional(v.number()),
    excludeDoNotContact: v.optional(v.boolean()),
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
    lastCommunicationAt: v.optional(v.number()),
    industryLabel: v.optional(v.string()),
    subindustryLabel: v.optional(v.string()),
    companyCountry: v.optional(v.string()),
    companyState: v.optional(v.string()),
    companyCity: v.optional(v.string()),
    companyUniqueQualities: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
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

    // Get all enriched contacts that are decision makers
    let contacts = await ctx.db.query("contacts").collect();
    
    // Filter for decision makers and company size >= 25
    const filteredContacts = await Promise.all(
      contacts.map(async (contact) => {
        if (!contact.companyId || !contact.functionGroup) return null;
        if (!decisionMakerGroups.includes(contact.functionGroup)) return null;
        if (args.excludeDoNotContact && contact.status === 'do_not_contact') return null;

        const company = await ctx.db.get(contact.companyId);
        if (!company || !company.companySize || company.companySize < (args.minCompanySize || 25)) return null;

        // Get campaign and communication counts for this contact
        const campaignContacts = await ctx.db
          .query("campaignContacts")
          .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
          .collect();

        const communications = await ctx.db
          .query("communications")
          .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
          .collect();

        const campaignCount = campaignContacts.length;
        const lastCommunication = communications.length > 0 ? 
          Math.max(...communications.map(c => c.timestamp)) : null;

        // Apply time-based eligibility rules
        const now = Date.now();
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
        const fortyFiveDaysAgo = now - (45 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = now - (60 * 24 * 60 * 60 * 1000);
        const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);

        let isEligible = false;
        if (!lastCommunication) {
          isEligible = true;
        } else if (campaignCount <= 2 && lastCommunication < thirtyDaysAgo) {
          isEligible = true;
        } else if (campaignCount >= 3 && campaignCount <= 4 && lastCommunication < fortyFiveDaysAgo) {
          isEligible = true;
        } else if (campaignCount >= 5 && campaignCount <= 6 && lastCommunication < sixtyDaysAgo) {
          isEligible = true;
        } else if (campaignCount >= 7 && lastCommunication < ninetyDaysAgo) {
          isEligible = true;
        }

        if (!isEligible) return null;

        return {
          contactId: contact._id,
          companyId: contact.companyId,
          campaignCount,
          lastCommunication,
          company
        };
      })
    );

    // Filter out nulls and group by company
    const validContacts = filteredContacts.filter(Boolean) as any[];
    
    // Group by company
    const companyGroups = new Map();
    for (const contact of validContacts) {
      const companyId = contact.companyId;
      if (!companyGroups.has(companyId)) {
        companyGroups.set(companyId, {
          companyId,
          company: contact.company,
          contacts: [],
          earliestCommunication: contact.lastCommunication
        });
      }
      companyGroups.get(companyId).contacts.push(contact);
      
      // Track earliest communication
      if (contact.lastCommunication && 
          (!companyGroups.get(companyId).earliestCommunication || 
           contact.lastCommunication < companyGroups.get(companyId).earliestCommunication)) {
        companyGroups.get(companyId).earliestCommunication = contact.lastCommunication;
      }
    }

    // Filter companies with >= 2 decision makers
    const results = [];
    for (const [companyId, group] of companyGroups) {
      if (group.contacts.length >= 2) {
        const company = group.company;
        results.push({
          companyId,
          companyName: company.name,
          domain: company.domain,
          website: company.website,
          industry: company.industrySlug,
          companySize: company.companySize,
          location: `${company.city}, ${company.state}, ${company.country}`.replace(/^,|,$|, ,/g, ''),
          decisionMakerCount: group.contacts.length,
          lastCommunicationAt: group.earliestCommunication,
          industryLabel: company.industryLabel,
          subindustryLabel: company.subindustryLabel,
          companyCountry: company.country,
          companyState: company.state,
          companyCity: company.city,
          companyUniqueQualities: company.companyUniqueQualities,
        });
      }
    }

    // Sort by last communication (earliest first, nulls first)
    results.sort((a, b) => {
      if (!a.lastCommunicationAt && !b.lastCommunicationAt) return 0;
      if (!a.lastCommunicationAt) return -1;
      if (!b.lastCommunicationAt) return 1;
      return a.lastCommunicationAt - b.lastCommunicationAt;
    });

    return results;
  },
});

// ===============================
// COLD EMAIL CANDIDATES  
// Complex eligibility logic with campaign history
// ===============================

export const coldEmailCandidates = query({
  args: {
    clientId: v.optional(v.id("clients")),
    includeAssignable: v.optional(v.boolean()),
  },
  returns: v.array(v.object({
    contactId: v.id("contacts"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    functionGroup: v.optional(v.string()),
    status: v.optional(v.string()),
    clientId: v.optional(v.id("clients")),
    companyId: v.optional(v.id("companies")),
    companyName: v.optional(v.string()),
    domain: v.optional(v.string()),
    industry: v.optional(v.string()),
    companySize: v.optional(v.number()),
    location: v.optional(v.string()),
    suggestedCampaignId: v.optional(v.id("campaigns")),
    lastCommunicationAt: v.optional(v.number()),
    totalCampaigns: v.number(),
    industryLabel: v.optional(v.string()),
    subindustryLabel: v.optional(v.string()),
    companyCountry: v.optional(v.string()),
    companyState: v.optional(v.string()),
    companyCity: v.optional(v.string()),
    companyUniqueQualities: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    // Get all contacts with status = 'cold'
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_status", (q) => q.eq("status", "cold"))
      .collect();

    // Get ABM companies to exclude
    const abmCompanies = await ctx.runQuery("candidateViews:abmCandidates", {});
    const abmCompanyIds = new Set(abmCompanies.map(c => c.companyId));

    const results = await Promise.all(
      contacts.map(async (contact) => {
        if (!contact.companyId) return null;
        
        // Exclude ABM candidates
        if (abmCompanyIds.has(contact.companyId)) return null;

        // Get company info
        const company = await ctx.db.get(contact.companyId);
        if (!company) return null;

        // Check for active campaigns (planned or active)
        const activeCampaignContacts = await ctx.db
          .query("campaignContacts")
          .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
          .filter((q) => q.or(
            q.eq(q.field("status"), "planned"),
            q.eq(q.field("status"), "active"),
            q.eq(q.field("status"), "gepland"),
            q.eq(q.field("status"), "actief")
          ))
          .collect();

        if (activeCampaignContacts.length > 0) return null;

        // Get all communications for this contact
        const communications = await ctx.db
          .query("communications")
          .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
          .collect();

        const lastCommunication = communications.length > 0 ?
          Math.max(...communications.map(c => c.timestamp)) : null;

        // Get total campaign count
        const allCampaignContacts = await ctx.db
          .query("campaignContacts")
          .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
          .collect();

        const totalCampaigns = allCampaignContacts.length;

        // Apply time-based eligibility rules (same as ABM)
        const now = Date.now();
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
        const fortyFiveDaysAgo = now - (45 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = now - (60 * 24 * 60 * 60 * 1000);
        const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);

        let isEligible = false;
        if (!lastCommunication) {
          isEligible = true;
        } else if (totalCampaigns <= 2 && lastCommunication < thirtyDaysAgo) {
          isEligible = true;
        } else if ((totalCampaigns === 3 || totalCampaigns === 4) && lastCommunication < fortyFiveDaysAgo) {
          isEligible = true;
        } else if ((totalCampaigns === 5 || totalCampaigns === 6) && lastCommunication < sixtyDaysAgo) {
          isEligible = true;
        } else if (totalCampaigns >= 7 && lastCommunication < ninetyDaysAgo) {
          isEligible = true;
        }

        if (!isEligible) return null;

        // TODO: Implement get_next_campaign_for_contact logic
        // This would be a separate function that determines the best campaign
        const suggestedCampaignId = null;

        return {
          contactId: contact._id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          linkedinUrl: contact.linkedinUrl,
          jobTitle: contact.jobTitle,
          functionGroup: contact.functionGroup,
          status: contact.status,
          clientId: contact.clientId,
          companyId: contact.companyId,
          companyName: company.name,
          domain: company.domain,
          industry: company.industrySlug,
          companySize: company.companySize,
          location: `${company.city}, ${company.state}, ${company.country}`.replace(/^,|,$|, ,/g, ''),
          suggestedCampaignId,
          lastCommunicationAt: lastCommunication,
          totalCampaigns,
          industryLabel: company.industryLabel,
          subindustryLabel: company.subindustryLabel,
          companyCountry: company.country,
          companyState: company.state,
          companyCity: company.city,
          companyUniqueQualities: company.companyUniqueQualities,
        };
      })
    );

    let filteredResults = results.filter(Boolean) as any[];

    // If includeAssignable is true, only return contacts with suggestedCampaignId
    if (args.includeAssignable) {
      filteredResults = filteredResults.filter(r => r.suggestedCampaignId);
    }

    // Sort by campaign count, then by last communication
    filteredResults.sort((a, b) => {
      if (a.totalCampaigns !== b.totalCampaigns) {
        return a.totalCampaigns - b.totalCampaigns;
      }
      if (!a.lastCommunicationAt && !b.lastCommunicationAt) return 0;
      if (!a.lastCommunicationAt) return -1;
      if (!b.lastCommunicationAt) return 1;
      return a.lastCommunicationAt - b.lastCommunicationAt;
    });

    return filteredResults;
  },
});

// ===============================
// LINKEDIN CANDIDATES
// Contacts eligible for LinkedIn outreach
// ===============================

export const linkedinCandidates = query({
  args: {
    minCompanySize: v.optional(v.number()),
    clientId: v.optional(v.id("clients")),
  },
  returns: v.array(v.object({
    contactId: v.id("contacts"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    functionGroup: v.optional(v.string()),
    seniority: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    status: v.optional(v.string()),
    isLinkedinConnected: v.optional(v.boolean()),
    companyId: v.optional(v.id("companies")),
    companyName: v.optional(v.string()),
    domain: v.optional(v.string()),
    website: v.optional(v.string()),
    industry: v.optional(v.string()),
    companySize: v.optional(v.number()),
    location: v.optional(v.string()),
    companySummary: v.optional(v.string()),
    companyKeywords: v.optional(v.array(v.string())),
    companyCommonProblems: v.optional(v.string()),
    companyUniqueCharacteristics: v.optional(v.array(v.string())),
    companyTargetCustomers: v.optional(v.string()),
    totalCampaigns: v.number(),
    industryLabel: v.optional(v.string()),
    subindustryLabel: v.optional(v.string()),
    companyCountry: v.optional(v.string()),
    companyState: v.optional(v.string()),
    companyCity: v.optional(v.string()),
    companyUniqueQualities: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    // Get contacts that are warm or cold, not LinkedIn connected
    let contacts = await ctx.db
      .query("contacts")
      .filter((q) => q.or(
        q.eq(q.field("status"), "warm"),
        q.eq(q.field("status"), "cold")
      ))
      .collect();

    // Filter out LinkedIn connected contacts
    contacts = contacts.filter(c => c.isLinkedinConnected !== true);

    const results = await Promise.all(
      contacts.map(async (contact) => {
        if (!contact.companyId) return null;

        const company = await ctx.db.get(contact.companyId);
        if (!company) return null;

        // Company size filter
        const minSize = args.minCompanySize || 5;
        if (!company.companySize || company.companySize < minSize) return null;

        // Check if in LinkedIn campaign
        const linkedinCampaigns = await ctx.db
          .query("campaignContacts")
          .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
          .collect();

        // Get the actual campaigns to check channel
        const linkedinCampaignIds = [];
        for (const cc of linkedinCampaigns) {
          const campaign = await ctx.db.get(cc.campaignId);
          if (campaign && campaign.channel === 'linkedin') {
            linkedinCampaignIds.push(cc.campaignId);
          }
        }

        if (linkedinCampaignIds.length > 0) return null;

        // Check if in active email campaign
        const activeCampaigns = linkedinCampaigns.filter(cc => 
          cc.status === 'Gepland' || cc.status === 'Actief'
        );

        for (const cc of activeCampaigns) {
          const campaign = await ctx.db.get(cc.campaignId);
          if (campaign && campaign.channel === 'email') {
            return null;
          }
        }

        // Check for recent communications (within 14 days)
        const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
        const recentComms = await ctx.db
          .query("communications")
          .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
          .filter((q) => q.and(
            q.or(
              q.eq(q.field("channel"), "email"),
              q.eq(q.field("channel"), "linkedin")
            ),
            q.gte(q.field("timestamp"), fourteenDaysAgo)
          ))
          .collect();

        if (recentComms.length > 0) return null;

        // Get campaign count
        const totalCampaigns = linkedinCampaigns.length;

        return {
          contactId: contact._id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          jobTitle: contact.jobTitle,
          functionGroup: contact.functionGroup,
          seniority: contact.seniority,
          linkedinUrl: contact.linkedinUrl,
          status: contact.status,
          isLinkedinConnected: contact.isLinkedinConnected,
          companyId: contact.companyId,
          companyName: company.name,
          domain: company.domain,
          website: company.website,
          industry: company.industrySlug,
          companySize: company.companySize,
          location: `${company.city}, ${company.state}, ${company.country}`.replace(/^,|,$|, ,/g, ''),
          companySummary: company.companySummary,
          companyKeywords: company.companyKeywords,
          companyCommonProblems: company.companyCommonProblems,
          companyUniqueCharacteristics: company.companyUniqueCharacteristics,
          companyTargetCustomers: company.companyTargetCustomers,
          totalCampaigns,
          industryLabel: company.industryLabel,
          subindustryLabel: company.subindustryLabel,
          companyCountry: company.country,
          companyState: company.state,
          companyCity: company.city,
          companyUniqueQualities: company.companyUniqueQualities,
        };
      })
    );

    let filteredResults = results.filter(Boolean) as any[];

    // Sort by campaign count, then by status (warm first), then by creation date
    filteredResults.sort((a, b) => {
      if (a.totalCampaigns !== b.totalCampaigns) {
        return a.totalCampaigns - b.totalCampaigns;
      }
      if (a.status !== b.status) {
        return a.status === 'warm' ? -1 : 1;
      }
      return a.contactId.localeCompare(b.contactId); // Proxy for created_at
    });

    return filteredResults;
  },
});

// ===============================
// LINKEDIN REACTIVATION CANDIDATES
// LinkedIn connected contacts eligible for reactivation
// ===============================

export const linkedinReactivationCandidates = query({
  args: {
    clientId: v.optional(v.id("clients")),
  },
  returns: v.array(v.object({
    contactId: v.id("contacts"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    functionGroup: v.optional(v.string()),
    status: v.optional(v.string()),
    seniority: v.optional(v.string()),
    isLinkedinConnected: v.optional(v.boolean()),
    companyId: v.optional(v.id("companies")),
    companyName: v.optional(v.string()),
    domain: v.optional(v.string()),
    website: v.optional(v.string()),
    industry: v.optional(v.string()),
    companySize: v.optional(v.number()),
    location: v.optional(v.string()),
    companySummary: v.optional(v.string()),
    companyKeywords: v.optional(v.array(v.string())),
    lastLinkedinCommAt: v.optional(v.number()),
    campaignCount: v.number(),
    industryLabel: v.optional(v.string()),
    subindustryLabel: v.optional(v.string()),
    companyCountry: v.optional(v.string()),
    companyState: v.optional(v.string()),
    companyCity: v.optional(v.string()),
    companyUniqueQualities: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    // Get LinkedIn connected contacts with eligible statuses
    const contacts = await ctx.db
      .query("contacts")
      .filter((q) => q.and(
        q.eq(q.field("isLinkedinConnected"), true),
        q.or(
          q.eq(q.field("status"), "cold"),
          q.eq(q.field("status"), "warm"),
          q.eq(q.field("status"), "nurture")
        )
      ))
      .collect();

    const results = await Promise.all(
      contacts.map(async (contact) => {
        if (!contact.companyId) return null;

        const company = await ctx.db.get(contact.companyId);
        if (!company) return null;

        // Get last LinkedIn communication
        const linkedinComms = await ctx.db
          .query("communications")
          .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
          .filter((q) => q.eq(q.field("channel"), "linkedin"))
          .collect();

        const lastLinkedinCommAt = linkedinComms.length > 0 ?
          Math.max(...linkedinComms.map(c => c.timestamp)) : null;

        // Check if eligible for reactivation (no LinkedIn comm or > 90 days ago)
        const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
        if (lastLinkedinCommAt && lastLinkedinCommAt >= ninetyDaysAgo) {
          return null;
        }

        // Get LinkedIn campaign count
        const campaignContacts = await ctx.db
          .query("campaignContacts")
          .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
          .collect();

        let linkedinCampaignCount = 0;
        for (const cc of campaignContacts) {
          const campaign = await ctx.db.get(cc.campaignId);
          if (campaign && campaign.channel === 'linkedin') {
            linkedinCampaignCount++;
          }
        }

        return {
          contactId: contact._id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          linkedinUrl: contact.linkedinUrl,
          jobTitle: contact.jobTitle,
          functionGroup: contact.functionGroup,
          status: contact.status,
          seniority: contact.seniority,
          isLinkedinConnected: contact.isLinkedinConnected,
          companyId: contact.companyId,
          companyName: company.name,
          domain: company.domain,
          website: company.website,
          industry: company.industrySlug,
          companySize: company.companySize,
          location: `${company.city}, ${company.state}, ${company.country}`.replace(/^,|,$|, ,/g, ''),
          companySummary: company.companySummary,
          companyKeywords: company.companyKeywords,
          lastLinkedinCommAt,
          campaignCount: linkedinCampaignCount,
          industryLabel: company.industryLabel,
          subindustryLabel: company.subindustryLabel,
          companyCountry: company.country,
          companyState: company.state,
          companyCity: company.city,
          companyUniqueQualities: company.companyUniqueQualities,
        };
      })
    );

    const filteredResults = results.filter(Boolean) as any[];

    // Sort by campaign count, then by last communication (nulls first)
    filteredResults.sort((a, b) => {
      if (a.campaignCount !== b.campaignCount) {
        return a.campaignCount - b.campaignCount;
      }
      if (!a.lastLinkedinCommAt && !b.lastLinkedinCommAt) return 0;
      if (!a.lastLinkedinCommAt) return -1;
      if (!b.lastLinkedinCommAt) return 1;
      return a.lastLinkedinCommAt - b.lastLinkedinCommAt;
    });

    return filteredResults;
  },
});