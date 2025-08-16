import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * SIMPLIFIED CONTACTS API - CLIENT-SPECIFIC LEAD RELATIONSHIPS
 * 
 * New simplified model:
 * - contacts = client-specific relationships with leads
 * - leadId + clientId = unique combination
 * - Only essential client-specific data stored here
 * - All personal/company data retrieved via joins
 */

// ===============================
// CORE CONTACT RELATIONSHIP OPERATIONS
// ===============================

// Get contacts for a client (with lead data joined)
export const list = query({
  args: { 
    clientId: v.id("clients"),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    // Contact relationship data
    _id: v.id("contacts"),
    _creationTime: v.number(),
    leadId: v.id("leads"),
    clientId: v.id("clients"),
    companyId: v.id("companies"),
    purchasedAt: v.number(),
    status: v.optional(v.string()),
    lastCommunicationAt: v.optional(v.number()),
    optedIn: v.optional(v.boolean()),
    fullEnrichment: v.optional(v.boolean()),
    
    // Lead data (joined)
    leadEmail: v.string(),
    leadFirstName: v.optional(v.string()),
    leadLastName: v.optional(v.string()),
    leadJobTitle: v.optional(v.string()),
    leadFunctionGroup: v.optional(v.string()),
    leadSeniority: v.optional(v.string()),
    leadCountry: v.optional(v.string()),
    leadLinkedinUrl: v.optional(v.string()),
    leadMobilePhone: v.optional(v.string()),
    
    // Company data (joined)
    companyName: v.optional(v.string()),
    companyDomain: v.optional(v.string()),
    companyIndustry: v.optional(v.string()),
    companySize: v.optional(v.number()),
    companyCountry: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    let contacts = ctx.db.query("contacts");
    
    // Filter by client (required)
    contacts = contacts.withIndex("by_client", (q) => q.eq("clientId", args.clientId));
    
    // Apply optional filters
    if (args.status) {
      contacts = contacts.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    // Get contacts
    let contactsList = await contacts
      .order("desc")
      .take(args.limit || 100);
    
    // Join with lead and company data
    const enrichedContacts = await Promise.all(
      contactsList.map(async (contact) => {
        // Get lead data
        const lead = await ctx.db.get(contact.leadId);
        if (!lead) {
          console.error(`Lead ${contact.leadId} not found for contact ${contact._id}`);
          return null;
        }
        
        // Get company data
        let companyData = {
          companyName: undefined,
          companyDomain: undefined,
          companyIndustry: undefined,
          companySize: undefined,
          companyCountry: undefined,
        };
        
        if (contact.companyId) {
          const company = await ctx.db.get(contact.companyId);
          if (company) {
            companyData = {
              companyName: company.name,
              companyDomain: company.domain,
              companyIndustry: company.industryLabel,
              companySize: company.companySize,
              companyCountry: company.country,
            };
          }
        }
        
        const result = {
          // Contact relationship data
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
          
          // Lead data (joined)
          leadEmail: lead.email,
          leadFirstName: lead.firstName,
          leadLastName: lead.lastName,
          leadJobTitle: lead.jobTitle,
          leadFunctionGroup: lead.functionGroup,
          leadSeniority: lead.seniority,
          leadCountry: lead.country,
          leadLinkedinUrl: lead.linkedinUrl,
          leadMobilePhone: lead.mobilePhone,
          
          // Company data (joined)
          ...companyData,
        };
        
        return result;
      })
    );
    
    // Filter out null results and apply search
    let filteredContacts = enrichedContacts.filter(c => c !== null);
    
    if (args.search) {
      const searchTerm = args.search.toLowerCase();
      filteredContacts = filteredContacts.filter(contact => 
        contact.leadFirstName?.toLowerCase().includes(searchTerm) ||
        contact.leadLastName?.toLowerCase().includes(searchTerm) ||
        contact.leadEmail.toLowerCase().includes(searchTerm) ||
        contact.leadJobTitle?.toLowerCase().includes(searchTerm) ||
        contact.companyName?.toLowerCase().includes(searchTerm)
      );
    }
    
    return filteredContacts;
  },
});

// Get single contact by ID (with lead data)
export const getById = query({
  args: { id: v.id("contacts") },
  returns: v.union(v.object({
    // Contact relationship data
    _id: v.id("contacts"),
    _creationTime: v.number(),
    leadId: v.id("leads"),
    clientId: v.id("clients"),
    companyId: v.id("companies"),
    purchasedAt: v.number(),
    status: v.optional(v.string()),
    lastCommunicationAt: v.optional(v.number()),
    optedIn: v.optional(v.boolean()),
    fullEnrichment: v.optional(v.boolean()),
    
    // Lead data (joined)
    lead: v.object({
      _id: v.id("leads"),
      _creationTime: v.number(),
      companyId: v.optional(v.id("companies")),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.string(),
      mobilePhone: v.optional(v.string()),
      companyPhone: v.optional(v.string()),
      linkedinUrl: v.optional(v.string()),
      jobTitle: v.optional(v.string()),
      seniority: v.optional(v.string()),
      functionGroup: v.optional(v.string()),
      country: v.optional(v.string()),
      state: v.optional(v.string()),
      city: v.optional(v.string()),
      sourceType: v.optional(v.string()),
      leadScore: v.optional(v.number()),
      leadQuality: v.optional(v.string()),
    }),
    
    // Company data (joined)
    company: v.optional(v.object({
      _id: v.id("companies"),
      name: v.string(),
      domain: v.optional(v.string()),
      website: v.optional(v.string()),
      industryLabel: v.optional(v.string()),
      companySize: v.optional(v.number()),
      country: v.optional(v.string()),
      city: v.optional(v.string()),
      companySummary: v.optional(v.string()),
    })),
  }), v.null()),
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.id);
    if (!contact) {
      return null;
    }
    
    // Get lead data
    const lead = await ctx.db.get(contact.leadId);
    if (!lead) {
      console.error(`Lead ${contact.leadId} not found for contact ${contact._id}`);
      return null;
    }
    
    // Get company data
    let company = null;
    if (contact.companyId) {
      company = await ctx.db.get(contact.companyId);
    }
    
    return {
      ...contact,
      lead,
      company,
    };
  },
});

// ===============================
// LEAD TO CONTACT CONVERSION
// ===============================

// Convert a lead to a contact (purchase/claim a lead)
export const purchaseLead = mutation({
  args: {
    leadId: v.id("leads"),
    clientId: v.id("clients"),
    purchasedBy: v.optional(v.id("profiles")),
    initialStatus: v.optional(v.string()),
    purchaseMethod: v.optional(v.string()),
    purchasePrice: v.optional(v.number()),
  },
  returns: v.object({
    contactId: v.id("contacts"),
    leadId: v.id("leads"),
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Check if this lead is already a contact for this client
    const existingContact = await ctx.db
      .query("contacts")
      .withIndex("by_lead_client", (q) => 
        q.eq("leadId", args.leadId).eq("clientId", args.clientId)
      )
      .first();
    
    if (existingContact) {
      return {
        contactId: existingContact._id,
        leadId: args.leadId,
        success: false,
        message: "Lead is already a contact for this client",
      };
    }
    
    // Verify lead exists and is active
    const lead = await ctx.db.get(args.leadId);
    if (!lead || lead.isActive === false) {
      throw new Error("Lead not found or inactive");
    }
    
    // Verify client exists
    const client = await ctx.db.get(args.clientId);
    if (!client) {
      throw new Error("Client not found");
    }
    
    // Lead must have a company
    if (!lead.companyId) {
      throw new Error("Lead must have a company to be purchased");
    }
    
    // Create contact relationship (simplified)
    const contactId = await ctx.db.insert("contacts", {
      leadId: args.leadId,
      clientId: args.clientId,
      companyId: lead.companyId,
      purchasedAt: Date.now(),
      
      // Simplified essentials only
      status: args.initialStatus || "cold",
      optedIn: false, // Default to false as specified
      fullEnrichment: false, // Default to false
    });
    
    // Create purchase history record
    await ctx.db.insert("leadPurchases", {
      leadId: args.leadId,
      clientId: args.clientId,
      contactId: contactId,
      purchasePrice: args.purchasePrice,
      purchaseMethod: args.purchaseMethod || "manual",
      purchasedAt: Date.now(),
      purchasedBy: args.purchasedBy,
    });
    
    return {
      contactId,
      leadId: args.leadId,
      success: true,
      message: "Lead successfully converted to contact",
    };
  },
});

// ===============================
// CONTACT RELATIONSHIP MANAGEMENT
// ===============================

// Update contact relationship data (simplified)
export const update = mutation({
  args: {
    id: v.id("contacts"),
    status: v.optional(v.string()),
    lastCommunicationAt: v.optional(v.number()),
    optedIn: v.optional(v.boolean()),
    fullEnrichment: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updateData } = args;
    
    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(cleanData).length > 0) {
      await ctx.db.patch(id, cleanData);
    }
    
    return null;
  },
});

// Record communication activity (updates contact metrics)
export const recordCommunication = mutation({
  args: {
    contactId: v.id("contacts"),
    direction: v.string(), // "outbound" or "inbound"
    channel: v.string(), // "email", "linkedin", "phone", etc.
    timestamp: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, { contactId, direction, channel, timestamp }) => {
    const contact = await ctx.db.get(contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }
    
    const communicationTime = timestamp || Date.now();
    
    // Update last communication time
    const updates: Record<string, any> = {
      lastCommunicationAt: communicationTime,
    };
    
    await ctx.db.patch(contactId, updates);
    
    // Also update global lead metrics if outbound
    if (direction === "outbound") {
      const lead = await ctx.db.get(contact.leadId);
      if (lead) {
        await ctx.db.patch(contact.leadId, {
          totalTimesContacted: (lead.totalTimesContacted || 0) + 1,
          lastGlobalContactAt: communicationTime,
          lastUpdatedAt: Date.now(),
        });
      }
    }
    
    return null;
  },
});

// ===============================
// CONTACT ANALYTICS & INSIGHTS
// ===============================

// Get client contact statistics (simplified)
export const getClientStats = query({
  args: { clientId: v.id("clients") },
  returns: v.object({
    totalContacts: v.number(),
    contactsByStatus: v.object({}),
    recentlyAdded: v.number(), // Last 7 days
    fullyEnriched: v.number(),
    optedInCount: v.number(),
  }),
  handler: async (ctx, { clientId }) => {
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .collect();
    
    // Group by status
    const contactsByStatus: Record<string, number> = {};
    contacts.forEach(c => {
      const status = c.status || "unknown";
      contactsByStatus[status] = (contactsByStatus[status] || 0) + 1;
    });
    
    // Count recently added (last 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentlyAdded = contacts.filter(c => c.purchasedAt > sevenDaysAgo).length;
    
    // Count fully enriched
    const fullyEnriched = contacts.filter(c => c.fullEnrichment === true).length;
    
    // Count opted in
    const optedInCount = contacts.filter(c => c.optedIn === true).length;
    
    return {
      totalContacts: contacts.length,
      contactsByStatus,
      recentlyAdded,
      fullyEnriched,
      optedInCount,
    };
  },
});

// Remove contact relationship (hard delete for simplified model)
export const remove = mutation({
  args: { 
    id: v.id("contacts"),
  },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
    return null;
  },
});

// ===============================
// BATCH OPERATIONS
// ===============================

// Bulk update contacts (simplified)
export const bulkUpdate = mutation({
  args: {
    contactIds: v.array(v.id("contacts")),
    updates: v.object({
      status: v.optional(v.string()),
      optedIn: v.optional(v.boolean()),
      fullEnrichment: v.optional(v.boolean()),
    }),
  },
  returns: v.object({
    updated: v.number(),
    errors: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, { contactIds, updates }) => {
    let updated = 0;
    let errors = 0;
    
    for (const contactId of contactIds) {
      try {
        await ctx.db.patch(contactId, updates);
        updated++;
      } catch (error) {
        errors++;
        console.error(`Error updating contact ${contactId}:`, error);
      }
    }
    
    return {
      updated,
      errors,
      message: `Bulk update completed: ${updated} updated, ${errors} errors`,
    };
  },
});

// Bulk convert leads to contacts (simplified)
export const bulkPurchaseLeads = mutation({
  args: {
    leadIds: v.array(v.id("leads")),
    clientId: v.id("clients"),
    purchasedBy: v.optional(v.id("profiles")),
    initialStatus: v.optional(v.string()),
  },
  returns: v.object({
    created: v.number(),
    skipped: v.number(),
    errors: v.number(),
    contactIds: v.array(v.id("contacts")),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    let created = 0;
    let skipped = 0;
    let errors = 0;
    const contactIds: string[] = [];
    
    for (const leadId of args.leadIds) {
      try {
        const result = await ctx.runMutation("api.newContactsSimplified.purchaseLead", {
          leadId,
          clientId: args.clientId,
          purchasedBy: args.purchasedBy,
          initialStatus: args.initialStatus,
        });
        
        if (result.success) {
          created++;
          contactIds.push(result.contactId);
        } else {
          skipped++;
        }
      } catch (error) {
        errors++;
        console.error(`Error purchasing lead ${leadId}:`, error);
      }
    }
    
    return {
      created,
      skipped,
      errors,
      contactIds,
      message: `Bulk purchase completed: ${created} created, ${skipped} skipped, ${errors} errors`,
    };
  },
});