import { query } from "./_generated/server";
import { v } from "convex/values";

// Get enriched contacts with lead and company data
export const getEnrichedContacts = query({
  args: {
    clientId: v.optional(v.string()),
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Find the actual client by string identifier
    let actualClient = null;
    if (args.clientId) {
      actualClient = await ctx.db
        .query("clients")
        .filter((q) => q.eq(q.field("domain"), args.clientId))
        .first();
      
      if (!actualClient) {
        // NO FALLBACK - Return empty result if client not found
        console.error(`❌ Client with identifier ${clientIdentifier} not found - returning empty enriched contacts`);
        return { data: [], count: 0 };
      }
    }

    if (!actualClient) {
      return { data: [], count: 0 };
    }

    // Get contacts for this client
    let contactsQuery = ctx.db
      .query("contacts")
      .withIndex("by_client", (q) => q.eq("clientId", actualClient._id));

    if (args.status) {
      contactsQuery = contactsQuery.filter((q) => q.eq(q.field("status"), args.status));
    }

    const contacts = await contactsQuery.collect();

    // Enrich contacts with lead and company data
    const enrichedContacts = await Promise.all(
      contacts.map(async (contact) => {
        // Get lead data
        const lead = await ctx.db.get(contact.leadId);
        
        // Get company data
        const company = await ctx.db.get(contact.companyId);

        return {
          _id: contact._id,
          _creationTime: contact._creationTime,
          leadId: contact.leadId,
          clientId: contact.clientId,
          companyId: contact.companyId,
          purchasedAt: contact.purchasedAt,
          status: contact.status,
          lastCommunicationAt: contact.lastCommunicationAt,
          optedIn: contact.optedIn,
          fullEnrichment: contact.fullEnrichment,
          
          // Contact data (denormalized from lead)
          firstName: contact.firstName || lead?.firstName,
          lastName: contact.lastName || lead?.lastName,
          linkedinUrl: contact.linkedinUrl || lead?.linkedinUrl,
          jobTitle: contact.jobTitle || lead?.jobTitle,
          functionGroup: contact.functionGroup || lead?.functionGroup,
          email: lead?.email,
          mobilePhone: lead?.mobilePhone,
          
          // Company data (denormalized)
          name: contact.name || company?.name,
          website: contact.website || company?.website,
          companyLinkedinUrl: contact.companyLinkedinUrl || company?.companyLinkedinUrl,
          industryLabel: contact.industryLabel || company?.industryLabel,
          subindustryLabel: contact.subindustryLabel || company?.subindustryLabel,
          companySummary: contact.companySummary || company?.companySummary,
          shortCompanySummary: contact.shortCompanySummary || company?.shortCompanySummary,
          
          // Additional company data
          companySize: company?.companySize,
          city: company?.city,
          state: company?.state,
          country: company?.country,
          domain: company?.domain,
        };
      })
    );

    // Apply search filter
    let filteredContacts = enrichedContacts;
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      filteredContacts = enrichedContacts.filter(contact =>
        contact.firstName?.toLowerCase().includes(searchLower) ||
        contact.lastName?.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower) ||
        contact.name?.toLowerCase().includes(searchLower) ||
        contact.jobTitle?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const page = args.page || 1;
    const pageSize = args.pageSize || 25;
    const offset = (page - 1) * pageSize;
    const paginatedContacts = filteredContacts.slice(offset, offset + pageSize);

    return {
      data: paginatedContacts,
      count: filteredContacts.length,
    };
  },
});