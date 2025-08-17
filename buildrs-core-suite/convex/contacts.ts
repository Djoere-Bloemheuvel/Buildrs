import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Get contacts with optional filters
export const list = query({
  args: { 
    companyId: v.optional(v.id("companies")),
    clientId: v.optional(v.union(v.id("clients"), v.string())), // Accept both Convex ID and string
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
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
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    mobilePhone: v.optional(v.string()),
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
  })),
  handler: async (ctx, args) => {
    let contacts = ctx.db.query("contacts");
    
    if (args.companyId) {
      contacts = contacts.withIndex("by_company", (q) => q.eq("companyId", args.companyId));
    } else if (args.clientId) {
      // Try to use clientId directly first (if it's a Convex ID)
      try {
        contacts = contacts.withIndex("by_client", (q) => q.eq("clientId", args.clientId as any));
        console.log(`✅ Using clientId directly: ${args.clientId}`);
      } catch (error) {
        // Fallback: Find the actual client by string identifier (domain)
        let actualClient = await ctx.db
          .query("clients")
          .filter((q) => q.eq(q.field("domain"), args.clientId))
          .first();
        
        if (!actualClient) {
          // NO FALLBACK - Return empty result if client not found
          console.error(`❌ Client with ID ${args.clientId} not found - returning empty contacts list`);
          return [];
        }
        
        if (actualClient) {
          contacts = contacts.withIndex("by_client", (q) => q.eq("clientId", actualClient._id));
        }
      }
    } else if (args.status) {
      contacts = contacts.withIndex("by_status", (q) => q.eq("status", args.status));
    }
    
    contacts = contacts.order("desc");
    
    let contactsList;
    if (args.limit) {
      contactsList = await contacts.take(args.limit);
    } else {
      contactsList = await contacts.collect();
    }
    
    // Enrich contacts with lead and company data
    const enrichedContacts = await Promise.all(contactsList.map(async (contact) => {
      try {
        // Get lead data
        const lead = await ctx.db.get(contact.leadId);
        
        // Get company data
        const company = await ctx.db.get(contact.companyId);
        
        return {
          ...contact,
          // Add lead data
          firstName: lead?.firstName || '',
          lastName: lead?.lastName || '',
          email: lead?.email || '',
          mobilePhone: lead?.mobilePhone || '',
          linkedinUrl: lead?.linkedinUrl || '',
          jobTitle: lead?.jobTitle || '',
          functionGroup: lead?.functionGroup || '',
          // Add company data
          name: company?.name || 'Unknown Company',
          website: company?.website || '',
          companyLinkedinUrl: company?.companyLinkedinUrl || '',
          industryLabel: company?.industryLabel || '',
          subindustryLabel: company?.subindustryLabel || '',
          companySummary: company?.companySummary || '',
          shortCompanySummary: company?.shortCompanySummary || '',
        };
      } catch (error) {
        console.error(`Error enriching contact ${contact._id}:`, error);
        return {
          ...contact,
          // Fallback data
          firstName: '',
          lastName: '',
          email: '',
          mobilePhone: '',
          linkedinUrl: '',
          jobTitle: '',
          functionGroup: '',
          name: 'Unknown Company',
          website: '',
          companyLinkedinUrl: '',
          industryLabel: '',
          subindustryLabel: '',
          companySummary: '',
          shortCompanySummary: '',
        };
      }
    }));
    
    // Apply search filter if provided (after enrichment to search in lead/company data)
    let filteredContacts = enrichedContacts;
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      filteredContacts = enrichedContacts.filter(contact => {
        return (
          contact.firstName?.toLowerCase().includes(searchLower) ||
          contact.lastName?.toLowerCase().includes(searchLower) ||
          contact.email?.toLowerCase().includes(searchLower) ||
          contact.jobTitle?.toLowerCase().includes(searchLower) ||
          contact.name?.toLowerCase().includes(searchLower)
        );
      });
    }
    
    return filteredContacts;
  },
});

// Get contact by ID
export const getById = query({
  args: { id: v.id("contacts") },
  returns: v.union(v.object({
    _id: v.id("contacts"),
    _creationTime: v.number(),
    companyId: v.optional(v.id("companies")),
    clientId: v.optional(v.id("clients")),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    mobilePhone: v.optional(v.string()),
    companyPhone: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    seniority: v.optional(v.string()),
    functionGroup: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
    isLinkedinConnected: v.optional(v.boolean()),
    lastLinkedinConnectionCheck: v.optional(v.number()),
    optedIn: v.optional(v.boolean()),
    country: v.optional(v.string()),
    state: v.optional(v.string()),
    city: v.optional(v.string()),
  }), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create new contact
export const create = mutation({
  args: {
    companyId: v.optional(v.id("companies")),
    clientId: v.optional(v.id("clients")),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    mobilePhone: v.optional(v.string()),
    companyPhone: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    seniority: v.optional(v.string()),
    functionGroup: v.optional(v.string()),
    status: v.optional(v.string()),
    country: v.optional(v.string()),
    state: v.optional(v.string()),
    city: v.optional(v.string()),
    userId: v.optional(v.string()), // Voor activity logging
  },
  returns: v.id("contacts"),
  handler: async (ctx, args) => {
    const { userId, ...contactData } = args;
    
    const contactId = await ctx.db.insert("contacts", {
      ...contactData,
      status: contactData.status || "cold",
      tags: [],
      optedIn: false,
    });
    
    // Log activity
    if (contactData.clientId) {
      const contactName = `${contactData.firstName || ''} ${contactData.lastName || ''}`.trim() || 'New Contact';
      
      await ctx.runMutation(internal.activityLogger.logActivityInternal, {
        clientId: contactData.clientId,
        userId: userId,
        action: "contact_created",
        description: `Created contact: ${contactName}${contactData.jobTitle ? ` (${contactData.jobTitle})` : ''}`,
        contactId: contactId,
        companyId: contactData.companyId,
        category: "contact",
        priority: "high",
        metadata: {
          email: contactData.email,
          jobTitle: contactData.jobTitle,
          functionGroup: contactData.functionGroup,
          status: contactData.status || "cold",
        },
      });
    }
    
    return contactId;
  },
});

// Update contact
export const update = mutation({
  args: {
    id: v.id("contacts"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    mobilePhone: v.optional(v.string()),
    companyPhone: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    seniority: v.optional(v.string()),
    functionGroup: v.optional(v.string()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isLinkedinConnected: v.optional(v.boolean()),
    optedIn: v.optional(v.boolean()),
    userId: v.optional(v.string()), // Voor activity logging
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, userId, ...updateData } = args;
    
    // Get existing contact for comparison
    const existingContact = await ctx.db.get(id);
    if (!existingContact) {
      throw new Error("Contact not found");
    }
    
    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(cleanData).length > 0) {
      await ctx.db.patch(id, cleanData);
      
      // Log activity for significant changes
      const contactName = `${existingContact.firstName || ''} ${existingContact.lastName || ''}`.trim() || 'Contact';
      const changes = [];
      
      // Track significant changes
      if (cleanData.status && cleanData.status !== existingContact.status) {
        changes.push(`status: ${existingContact.status} → ${cleanData.status}`);
      }
      
      if (cleanData.jobTitle && cleanData.jobTitle !== existingContact.jobTitle) {
        changes.push(`job title: ${existingContact.jobTitle || 'none'} → ${cleanData.jobTitle}`);
      }
      
      if (cleanData.email && cleanData.email !== existingContact.email) {
        changes.push(`email: ${existingContact.email || 'none'} → ${cleanData.email}`);
      }
      
      if (cleanData.functionGroup && cleanData.functionGroup !== existingContact.functionGroup) {
        changes.push(`function group: ${existingContact.functionGroup || 'none'} → ${cleanData.functionGroup}`);
      }
      
      if (cleanData.isLinkedinConnected !== undefined && cleanData.isLinkedinConnected !== existingContact.isLinkedinConnected) {
        changes.push(`LinkedIn: ${existingContact.isLinkedinConnected ? 'connected' : 'not connected'} → ${cleanData.isLinkedinConnected ? 'connected' : 'not connected'}`);
      }
      
      // Log activity based on type of change
      if (cleanData.status && cleanData.status !== existingContact.status) {
        await ctx.runMutation(internal.activityLogger.logActivityInternal, {
          clientId: existingContact.clientId!,
          userId: userId,
          action: "contact_status_changed",
          description: `Changed ${contactName} status from ${existingContact.status} to ${cleanData.status}`,
          contactId: id,
          companyId: existingContact.companyId,
          category: "contact",
          priority: "medium",
          metadata: {
            oldStatus: existingContact.status,
            newStatus: cleanData.status,
            allChanges: changes,
          },
        });
      } else if (changes.length > 0) {
        await ctx.runMutation(internal.activityLogger.logActivityInternal, {
          clientId: existingContact.clientId!,
          userId: userId,
          action: "contact_updated",
          description: `Updated ${contactName}: ${changes.join(', ')}`,
          contactId: id,
          companyId: existingContact.companyId,
          category: "contact",
          priority: "low",
          metadata: {
            changes: changes,
            fieldsUpdated: Object.keys(cleanData),
          },
        });
      }
    }
    
    return null;
  },
});

// Delete contact
export const remove = mutation({
  args: { id: v.id("contacts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});

// Get contacts by company
export const getByCompany = query({
  args: { companyId: v.id("companies") },
  returns: v.array(v.object({
    _id: v.id("contacts"),
    _creationTime: v.number(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    status: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contacts")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .collect();
  },
});