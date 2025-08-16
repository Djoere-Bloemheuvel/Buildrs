import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * DENORMALIZED CONTACTS API - PERFORMANCE OPTIMIZED
 * 
 * This API works with the denormalized contacts table that includes:
 * - All essential fields from leads and companies
 * - No joins needed for common operations
 * - Perfect for high-volume processing (5k+ contacts/day)
 */

// ===============================
// CORE CONTACT RELATIONSHIP OPERATIONS
// ===============================

// Get contacts for a client (no joins needed!)
export const list = query({
  args: { 
    clientId: v.id("clients"),
    status: v.optional(v.string()),
    functionGroup: v.optional(v.string()),
    industryLabel: v.optional(v.string()),
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
    
    // Denormalized lead data (no join needed!)
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    functionGroup: v.optional(v.string()),
    
    // Denormalized company data (no join needed!)
    name: v.optional(v.string()),                // Company name
    website: v.optional(v.string()),
    companyLinkedinUrl: v.optional(v.string()),
    industryLabel: v.optional(v.string()),       // Industry
    subindustryLabel: v.optional(v.string()),    // Subindustry
    companySummary: v.optional(v.string()),      // Company summary
    shortCompanySummary: v.optional(v.string()), // Short company summary
  })),
  handler: async (ctx, args) => {
    let contacts = ctx.db.query("contacts");
    
    // Filter by client (required)
    contacts = contacts.withIndex("by_client", (q) => q.eq("clientId", args.clientId));
    
    // Apply optional filters (all without joins!)
    if (args.status) {
      contacts = contacts.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    if (args.functionGroup) {
      contacts = contacts.filter((q) => q.eq(q.field("functionGroup"), args.functionGroup));
    }
    
    if (args.industryLabel) {
      contacts = contacts.filter((q) => q.eq(q.field("industryLabel"), args.industryLabel));
    }
    
    // Get contacts
    let contactsList = await contacts
      .order("desc")
      .take(args.limit || 100);
    
    // Apply search filter if provided
    if (args.search) {
      const searchTerm = args.search.toLowerCase();
      contactsList = contactsList.filter(contact => 
        contact.firstName?.toLowerCase().includes(searchTerm) ||
        contact.lastName?.toLowerCase().includes(searchTerm) ||
        contact.jobTitle?.toLowerCase().includes(searchTerm) ||
        contact.name?.toLowerCase().includes(searchTerm) || // Company name
        contact.functionGroup?.toLowerCase().includes(searchTerm) ||
        contact.industryLabel?.toLowerCase().includes(searchTerm)
      );
    }
    
    return contactsList;
  },
});

// Get single contact by ID (no joins needed!)
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
    
    // Denormalized lead data
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    functionGroup: v.optional(v.string()),
    
    // Denormalized company data
    name: v.optional(v.string()),
    website: v.optional(v.string()),
    companyLinkedinUrl: v.optional(v.string()),
    industryLabel: v.optional(v.string()),
    subindustryLabel: v.optional(v.string()),
    companySummary: v.optional(v.string()),
    shortCompanySummary: v.optional(v.string()),
  }), v.null()),
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.id);
    return contact || null;
  },
});

// ===============================
// LEAD TO CONTACT CONVERSION
// ===============================

// Convert a lead to a contact (with denormalized data)
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
    
    // Get company data for denormalization
    const company = await ctx.db.get(lead.companyId);
    if (!company) {
      throw new Error("Company not found");
    }
    
    // Create contact relationship with denormalized data
    const contactId = await ctx.db.insert("contacts", {
      // Core relationship
      leadId: args.leadId,
      clientId: args.clientId,
      companyId: lead.companyId,
      purchasedAt: Date.now(),
      
      // Client-specific essentials
      status: args.initialStatus || "cold",
      optedIn: false, // Default to false
      fullEnrichment: false, // Default to false
      
      // Denormalized lead data
      firstName: lead.firstName,
      lastName: lead.lastName,
      linkedinUrl: lead.linkedinUrl,
      jobTitle: lead.jobTitle,
      functionGroup: lead.functionGroup,
      
      // Denormalized company data
      name: company.name,
      website: company.website,
      companyLinkedinUrl: company.companyLinkedinUrl,
      industryLabel: company.industryLabel,
      subindustryLabel: company.subindustryLabel,
      companySummary: company.companySummary,
      shortCompanySummary: company.shortCompanySummary,
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
      message: "Lead successfully converted to contact with denormalized data",
    };
  },
});

// ===============================
// CONTACT RELATIONSHIP MANAGEMENT
// ===============================

// Update contact relationship data
export const update = mutation({
  args: {
    id: v.id("contacts"),
    status: v.optional(v.string()),
    lastCommunicationAt: v.optional(v.number()),
    optedIn: v.optional(v.boolean()),
    fullEnrichment: v.optional(v.boolean()),
    
    // Allow updating denormalized fields (for sync operations)
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    functionGroup: v.optional(v.string()),
    name: v.optional(v.string()),
    website: v.optional(v.string()),
    companyLinkedinUrl: v.optional(v.string()),
    industryLabel: v.optional(v.string()),
    subindustryLabel: v.optional(v.string()),
    companySummary: v.optional(v.string()),
    shortCompanySummary: v.optional(v.string()),
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
    await ctx.db.patch(contactId, {
      lastCommunicationAt: communicationTime,
    });
    
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
// HIGH-PERFORMANCE ANALYTICS
// ===============================

// Get client contact statistics (super fast with denormalized data)
export const getClientStats = query({
  args: { clientId: v.id("clients") },
  returns: v.object({
    totalContacts: v.number(),
    contactsByStatus: v.object({}),
    contactsByFunctionGroup: v.object({}),
    contactsByIndustry: v.object({}),
    recentlyAdded: v.number(),
    fullyEnriched: v.number(),
    optedInCount: v.number(),
    topIndustries: v.array(v.object({
      industry: v.string(),
      count: v.number(),
    })),
  }),
  handler: async (ctx, { clientId }) => {
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .collect();
    
    // Group by status (no joins!)
    const contactsByStatus: Record<string, number> = {};
    contacts.forEach(c => {
      const status = c.status || "unknown";
      contactsByStatus[status] = (contactsByStatus[status] || 0) + 1;
    });
    
    // Group by function group (no joins!)
    const contactsByFunctionGroup: Record<string, number> = {};
    contacts.forEach(c => {
      const fg = c.functionGroup || "unknown";
      contactsByFunctionGroup[fg] = (contactsByFunctionGroup[fg] || 0) + 1;
    });
    
    // Group by industry (no joins!)
    const contactsByIndustry: Record<string, number> = {};
    contacts.forEach(c => {
      const industry = c.industryLabel || "unknown";
      contactsByIndustry[industry] = (contactsByIndustry[industry] || 0) + 1;
    });
    
    // Count recently added (last 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentlyAdded = contacts.filter(c => c.purchasedAt > sevenDaysAgo).length;
    
    // Count fully enriched
    const fullyEnriched = contacts.filter(c => c.fullEnrichment === true).length;
    
    // Count opted in
    const optedInCount = contacts.filter(c => c.optedIn === true).length;
    
    // Top industries
    const topIndustries = Object.entries(contactsByIndustry)
      .filter(([industry]) => industry !== "unknown")
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([industry, count]) => ({ industry, count }));
    
    return {
      totalContacts: contacts.length,
      contactsByStatus,
      contactsByFunctionGroup,
      contactsByIndustry,
      recentlyAdded,
      fullyEnriched,
      optedInCount,
      topIndustries,
    };
  },
});

// ===============================
// BULK OPERATIONS FOR HIGH VOLUME
// ===============================

// Bulk update contacts (optimized for performance)
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

// Get contacts ready for export to external systems (like Instantly)
export const getContactsForExport = query({
  args: {
    clientId: v.id("clients"),
    status: v.optional(v.array(v.string())),
    functionGroups: v.optional(v.array(v.string())),
    industries: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    // Ready-to-export format with all data inline
    contactId: v.id("contacts"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.string(), // Will need to get from lead still
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
    status: v.optional(v.string()),
    optedIn: v.optional(v.boolean()),
    lastCommunicationAt: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    let contacts = ctx.db.query("contacts");
    
    // Filter by client
    contacts = contacts.withIndex("by_client", (q) => q.eq("clientId", args.clientId));
    
    // Apply filters
    let contactsList = await contacts.take(args.limit || 1000);
    
    // Filter by status
    if (args.status && args.status.length > 0) {
      contactsList = contactsList.filter(c => 
        c.status && args.status!.includes(c.status)
      );
    }
    
    // Filter by function groups
    if (args.functionGroups && args.functionGroups.length > 0) {
      contactsList = contactsList.filter(c => 
        c.functionGroup && args.functionGroups!.includes(c.functionGroup)
      );
    }
    
    // Filter by industries
    if (args.industries && args.industries.length > 0) {
      contactsList = contactsList.filter(c => 
        c.industryLabel && args.industries!.includes(c.industryLabel)
      );
    }
    
    // Get email from leads (only field we still need to join)
    const exportData = await Promise.all(
      contactsList.map(async (contact) => {
        const lead = await ctx.db.get(contact.leadId);
        
        return {
          contactId: contact._id,
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
          status: contact.status,
          optedIn: contact.optedIn,
          lastCommunicationAt: contact.lastCommunicationAt,
        };
      })
    );
    
    return exportData;
  },
});