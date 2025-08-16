import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * NEW CONTACTS API - CLIENT-SPECIFIC LEAD RELATIONSHIPS
 * 
 * In the new model:
 * - contacts = client-specific relationships with leads
 * - leadId + clientId = unique combination
 * - Only client-specific data stored here
 * - Personal data lives in leads table
 */

// ===============================
// CORE CONTACT RELATIONSHIP OPERATIONS
// ===============================

// Get contacts for a client (with lead data joined)
export const list = query({
  args: { 
    clientId: v.id("clients"),
    status: v.optional(v.string()),
    relationshipStage: v.optional(v.string()),
    assignedTo: v.optional(v.id("profiles")),
    priority: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    // Contact relationship data
    _id: v.id("contacts"),
    _creationTime: v.number(),
    leadId: v.id("leads"),
    clientId: v.id("clients"),
    status: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    isLinkedinConnected: v.optional(v.boolean()),
    optedIn: v.optional(v.boolean()),
    purchasedAt: v.number(),
    lastContactedAt: v.optional(v.number()),
    timesContacted: v.optional(v.number()),
    responsesReceived: v.optional(v.number()),
    clientResponseRate: v.optional(v.number()),
    engagementScore: v.optional(v.number()),
    priority: v.optional(v.string()),
    relationshipStage: v.optional(v.string()),
    assignedTo: v.optional(v.id("profiles")),
    
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
    companyId: v.optional(v.id("companies")),
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
    
    if (args.relationshipStage) {
      contacts = contacts.filter((q) => q.eq(q.field("relationshipStage"), args.relationshipStage));
    }
    
    if (args.assignedTo) {
      contacts = contacts.filter((q) => q.eq(q.field("assignedTo"), args.assignedTo));
    }
    
    if (args.priority) {
      contacts = contacts.filter((q) => q.eq(q.field("priority"), args.priority));
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
        
        // Get company data if available
        let companyData = {
          companyId: undefined as any,
          companyName: undefined,
          companyDomain: undefined,
          companyIndustry: undefined,
          companySize: undefined,
          companyCountry: undefined,
        };
        
        if (lead.companyId) {
          const company = await ctx.db.get(lead.companyId);
          if (company) {
            companyData = {
              companyId: company._id,
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
          status: contact.status,
          tags: contact.tags,
          notes: contact.notes,
          isLinkedinConnected: contact.isLinkedinConnected,
          optedIn: contact.optedIn,
          purchasedAt: contact.purchasedAt,
          lastContactedAt: contact.lastContactedAt,
          timesContacted: contact.timesContacted,
          responsesReceived: contact.responsesReceived,
          clientResponseRate: contact.clientResponseRate,
          engagementScore: contact.engagementScore,
          priority: contact.priority,
          relationshipStage: contact.relationshipStage,
          assignedTo: contact.assignedTo,
          
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
        contact.companyName?.toLowerCase().includes(searchTerm) ||
        contact.notes?.toLowerCase().includes(searchTerm)
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
    status: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    isLinkedinConnected: v.optional(v.boolean()),
    lastLinkedinConnectionCheck: v.optional(v.number()),
    linkedinConnectionDate: v.optional(v.number()),
    optedIn: v.optional(v.boolean()),
    optedOut: v.optional(v.boolean()),
    optedOutAt: v.optional(v.number()),
    unsubscribeReason: v.optional(v.string()),
    purchasedAt: v.number(),
    lastContactedAt: v.optional(v.number()),
    timesContacted: v.optional(v.number()),
    responsesReceived: v.optional(v.number()),
    clientResponseRate: v.optional(v.number()),
    engagementScore: v.optional(v.number()),
    priority: v.optional(v.string()),
    relationshipStage: v.optional(v.string()),
    assignedTo: v.optional(v.id("profiles")),
    customFields: v.optional(v.object({})),
    lastUpdatedAt: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    
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
    
    // Get company data if available
    let company = null;
    if (lead.companyId) {
      company = await ctx.db.get(lead.companyId);
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
    initialTags: v.optional(v.array(v.string())),
    initialNotes: v.optional(v.string()),
    assignedTo: v.optional(v.id("profiles")),
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
    
    // Create contact relationship
    const contactId = await ctx.db.insert("contacts", {
      leadId: args.leadId,
      clientId: args.clientId,
      
      // Initial client-specific data
      status: args.initialStatus || "cold",
      tags: args.initialTags || [],
      notes: args.initialNotes,
      
      // Campaign and outreach status
      isLinkedinConnected: false,
      
      // Email preferences
      optedIn: true,
      optedOut: false,
      
      // Tracking
      purchasedAt: Date.now(),
      timesContacted: 0,
      responsesReceived: 0,
      
      // Assignment
      assignedTo: args.assignedTo,
      
      // Initial scoring
      priority: "medium",
      relationshipStage: "prospect",
      
      // Metadata
      lastUpdatedAt: Date.now(),
      isActive: true,
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
    
    // Update lead's global metrics
    const currentContacts = await ctx.db
      .query("contacts")
      .withIndex("by_lead", (q) => q.eq("leadId", args.leadId))
      .collect();
    
    await ctx.db.patch(args.leadId, {
      totalTimesContacted: (lead.totalTimesContacted || 0), // Will be updated by communications
      lastUpdatedAt: Date.now(),
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

// Update contact relationship data
export const update = mutation({
  args: {
    id: v.id("contacts"),
    status: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    isLinkedinConnected: v.optional(v.boolean()),
    linkedinConnectionDate: v.optional(v.number()),
    optedIn: v.optional(v.boolean()),
    optedOut: v.optional(v.boolean()),
    unsubscribeReason: v.optional(v.string()),
    priority: v.optional(v.string()),
    relationshipStage: v.optional(v.string()),
    assignedTo: v.optional(v.id("profiles")),
    customFields: v.optional(v.object({})),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updateData } = args;
    
    // Handle opt-out logic
    if (updateData.optedOut === true && !updateData.unsubscribeReason) {
      updateData.optedOutAt = Date.now();
    }
    
    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(cleanData).length > 0) {
      cleanData.lastUpdatedAt = Date.now();
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
    wasResponse: v.optional(v.boolean()), // true if this was a response to our outreach
  },
  returns: v.null(),
  handler: async (ctx, { contactId, direction, channel, wasResponse = false }) => {
    const contact = await ctx.db.get(contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }
    
    const updates: Record<string, any> = {
      lastUpdatedAt: Date.now(),
    };
    
    if (direction === "outbound") {
      // Update times contacted
      updates.timesContacted = (contact.timesContacted || 0) + 1;
      updates.lastContactedAt = Date.now();
    }
    
    if (direction === "inbound" || wasResponse) {
      // Update responses received
      updates.responsesReceived = (contact.responsesReceived || 0) + 1;
      
      // Calculate new response rate
      const totalContacted = contact.timesContacted || 0;
      if (totalContacted > 0) {
        updates.clientResponseRate = (updates.responsesReceived / totalContacted) * 100;
      }
      
      // Auto-update relationship stage if first response
      if ((contact.responsesReceived || 0) === 0) {
        updates.relationshipStage = "engaged";
      }
    }
    
    await ctx.db.patch(contactId, updates);
    
    // Also update global lead metrics
    const lead = await ctx.db.get(contact.leadId);
    if (lead && direction === "outbound") {
      await ctx.db.patch(contact.leadId, {
        totalTimesContacted: (lead.totalTimesContacted || 0) + 1,
        lastGlobalContactAt: Date.now(),
        lastUpdatedAt: Date.now(),
      });
    }
    
    return null;
  },
});

// ===============================
// CONTACT ANALYTICS & INSIGHTS
// ===============================

// Get client contact statistics
export const getClientStats = query({
  args: { clientId: v.id("clients") },
  returns: v.object({
    totalContacts: v.number(),
    contactsByStatus: v.object({}),
    contactsByStage: v.object({}),
    contactsByPriority: v.object({}),
    averageResponseRate: v.number(),
    totalCommunications: v.number(),
    recentlyAdded: v.number(), // Last 7 days
    topPerformingContacts: v.array(v.object({
      contactId: v.id("contacts"),
      leadEmail: v.string(),
      leadName: v.optional(v.string()),
      responseRate: v.number(),
      timesContacted: v.number(),
    })),
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
    
    // Group by relationship stage
    const contactsByStage: Record<string, number> = {};
    contacts.forEach(c => {
      const stage = c.relationshipStage || "unknown";
      contactsByStage[stage] = (contactsByStage[stage] || 0) + 1;
    });
    
    // Group by priority
    const contactsByPriority: Record<string, number> = {};
    contacts.forEach(c => {
      const priority = c.priority || "unknown";
      contactsByPriority[priority] = (contactsByPriority[priority] || 0) + 1;
    });
    
    // Calculate average response rate
    const contactsWithResponses = contacts.filter(c => (c.timesContacted || 0) > 0);
    const totalResponseRate = contactsWithResponses.reduce((sum, c) => 
      sum + (c.clientResponseRate || 0), 0
    );
    const averageResponseRate = contactsWithResponses.length > 0 
      ? totalResponseRate / contactsWithResponses.length 
      : 0;
    
    // Count total communications
    const totalCommunications = contacts.reduce((sum, c) => 
      sum + (c.timesContacted || 0) + (c.responsesReceived || 0), 0
    );
    
    // Count recently added (last 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentlyAdded = contacts.filter(c => c.purchasedAt > sevenDaysAgo).length;
    
    // Get top performing contacts
    const topPerformingContacts = await Promise.all(
      contacts
        .filter(c => (c.timesContacted || 0) > 0)
        .sort((a, b) => (b.clientResponseRate || 0) - (a.clientResponseRate || 0))
        .slice(0, 5)
        .map(async (contact) => {
          const lead = await ctx.db.get(contact.leadId);
          return {
            contactId: contact._id,
            leadEmail: lead?.email || "",
            leadName: lead ? `${lead.firstName || ""} ${lead.lastName || ""}`.trim() : undefined,
            responseRate: contact.clientResponseRate || 0,
            timesContacted: contact.timesContacted || 0,
          };
        })
    );
    
    return {
      totalContacts: contacts.length,
      contactsByStatus,
      contactsByStage,
      contactsByPriority,
      averageResponseRate,
      totalCommunications,
      recentlyAdded,
      topPerformingContacts,
    };
  },
});

// Remove contact relationship (soft delete)
export const remove = mutation({
  args: { 
    id: v.id("contacts"),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { id, reason }) => {
    await ctx.db.patch(id, {
      isActive: false,
      lastUpdatedAt: Date.now(),
      // Store reason in custom fields if provided
      ...(reason && {
        customFields: { removalReason: reason }
      }),
    });
    
    return null;
  },
});

// ===============================
// BATCH OPERATIONS
// ===============================

// Bulk update contacts
export const bulkUpdate = mutation({
  args: {
    contactIds: v.array(v.id("contacts")),
    updates: v.object({
      status: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      priority: v.optional(v.string()),
      relationshipStage: v.optional(v.string()),
      assignedTo: v.optional(v.id("profiles")),
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
        await ctx.db.patch(contactId, {
          ...updates,
          lastUpdatedAt: Date.now(),
        });
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

// Bulk convert leads to contacts
export const bulkPurchaseLeads = mutation({
  args: {
    leadIds: v.array(v.id("leads")),
    clientId: v.id("clients"),
    purchasedBy: v.optional(v.id("profiles")),
    initialStatus: v.optional(v.string()),
    assignedTo: v.optional(v.id("profiles")),
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
        const result = await ctx.runMutation("api.newContacts.purchaseLead", {
          leadId,
          clientId: args.clientId,
          purchasedBy: args.purchasedBy,
          initialStatus: args.initialStatus,
          assignedTo: args.assignedTo,
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