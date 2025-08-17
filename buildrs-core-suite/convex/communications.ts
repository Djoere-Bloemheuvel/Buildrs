import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ===============================
// CORE COMMUNICATION LOGGING
// ===============================

export const logCommunication = mutation({
  args: {
    clientId: v.id("clients"),
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    campaignId: v.optional(v.id("campaigns")),
    type: v.union(
      v.literal("email"), 
      v.literal("linkedin"), 
      v.literal("phone"), 
      v.literal("meeting"),
      v.literal("note")
    ),
    direction: v.union(v.literal("inbound"), v.literal("outbound")),
    status: v.string(),
    subject: v.optional(v.string()),
    content: v.string(),
    provider: v.union(
      v.literal("instantly"), 
      v.literal("phantombuster"), 
      v.literal("aircall"),
      v.literal("gmail"),
      v.literal("outlook"),
      v.literal("manual")
    ),
    fromEmail: v.optional(v.string()),
    toEmail: v.optional(v.string()),
    ccEmails: v.optional(v.array(v.string())),
    bccEmails: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
    userId: v.optional(v.string()),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      // Validate required fields
      if (!args.clientId) {
        throw new Error("Client ID is required");
      }
      
      if (!args.content || args.content.trim().length === 0) {
        throw new Error("Content cannot be empty");
      }
      
      if (args.content.length > 50000) {
        throw new Error("Content too long (max 50,000 characters)");
      }
      
      if (args.subject && args.subject.length > 1000) {
        throw new Error("Subject too long (max 1,000 characters)");
      }
      
      // Validate email format if provided
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (args.fromEmail && !emailRegex.test(args.fromEmail)) {
        throw new Error("Invalid from email format");
      }
      
      if (args.toEmail && !emailRegex.test(args.toEmail)) {
        throw new Error("Invalid to email format");
      }
      
      // Validate CC/BCC emails
      if (args.ccEmails) {
        for (const email of args.ccEmails) {
          if (!emailRegex.test(email)) {
            throw new Error(`Invalid CC email format: ${email}`);
          }
        }
      }
      
      if (args.bccEmails) {
        for (const email of args.bccEmails) {
          if (!emailRegex.test(email)) {
            throw new Error(`Invalid BCC email format: ${email}`);
          }
        }
      }
      
      // Validate timestamp is reasonable
      const now = Date.now();
      const timestamp = args.timestamp || now;
      
      if (timestamp > now + (5 * 60 * 1000)) { // Max 5 minutes in future
        throw new Error("Timestamp cannot be more than 5 minutes in the future");
      }
      
      if (timestamp < now - (365 * 24 * 60 * 60 * 1000)) { // Max 1 year in past
        throw new Error("Timestamp cannot be more than 1 year in the past");
      }
      
      // Validate that client exists
      const client = await ctx.db.get(args.clientId);
      if (!client) {
        throw new Error("Client not found");
      }
      
      // Validate contact exists if provided
      if (args.contactId) {
        const contact = await ctx.db.get(args.contactId);
        if (!contact) {
          throw new Error("Contact not found");
        }
        
        // Ensure contact belongs to client
        if (contact.clientId !== args.clientId) {
          throw new Error("Contact does not belong to client");
        }
      }
      
      // Validate company exists if provided
      if (args.companyId) {
        const company = await ctx.db.get(args.companyId);
        if (!company) {
          throw new Error("Company not found");
        }
      }
      
      // Validate campaign exists if provided
      if (args.campaignId) {
        const campaign = await ctx.db.get(args.campaignId);
        if (!campaign) {
          throw new Error("Campaign not found");
        }
        
        // Ensure campaign belongs to client
        if (campaign.clientId !== args.clientId) {
          throw new Error("Campaign does not belong to client");
        }
      }
      
      // Type-specific validations
      if (args.type === "email") {
        if (!args.fromEmail && !args.toEmail) {
          throw new Error("Email communications must have fromEmail or toEmail");
        }
      }
      
      if (args.type === "phone" && args.metadata) {
        const metadata = args.metadata as any;
        if (metadata.duration && (typeof metadata.duration !== "number" || metadata.duration < 0)) {
          throw new Error("Phone call duration must be a positive number");
        }
      }
      
      const communicationId = await ctx.db.insert("communications", {
        clientId: args.clientId,
        contactId: args.contactId,
        companyId: args.companyId,
        campaignId: args.campaignId,
        type: args.type,
        direction: args.direction,
        status: args.status as any,
        subject: args.subject?.trim(),
        content: args.content.trim(),
        provider: args.provider,
        fromEmail: args.fromEmail?.toLowerCase(),
        toEmail: args.toEmail?.toLowerCase(),
        ccEmails: args.ccEmails?.map(email => email.toLowerCase()),
        bccEmails: args.bccEmails?.map(email => email.toLowerCase()),
        metadata: args.metadata,
        userId: args.userId,
        timestamp,
        createdAt: now,
        updatedAt: now,
      });
      
      // Log activity voor belangrijke communicatie events
      if (args.direction === "outbound" && (args.status === "sent" || args.status === "delivered")) {
        const activityAction = args.type === "email" ? "email_sent" :
                              args.type === "linkedin" ? "linkedin_message_sent" :
                              args.type === "phone" ? "phone_call_made" :
                              "communication_sent";
        
        const description = args.type === "email" ? 
          `Sent email: ${args.subject || 'No subject'}` :
          args.type === "linkedin" ?
          `Sent LinkedIn message` :
          args.type === "phone" ?
          `Made phone call` :
          `Sent ${args.type} communication`;
        
        await ctx.runMutation(internal.activityLogger.logActivityInternal, {
          clientId: args.clientId,
          userId: args.userId,
          action: activityAction,
          description: description,
          contactId: args.contactId,
          companyId: args.companyId,
          campaignId: args.campaignId,
          category: "communication",
          priority: "low",
          isSystemGenerated: !args.userId, // System generated if no userId
          metadata: {
            communicationType: args.type,
            provider: args.provider,
            direction: args.direction,
            status: args.status,
            subject: args.subject,
            fromEmail: args.fromEmail,
            toEmail: args.toEmail,
          },
        });
      } else if (args.direction === "inbound") {
        const activityAction = args.type === "email" ? "email_received" :
                              args.type === "phone" ? "phone_call_received" :
                              "communication_received";
        
        const description = args.type === "email" ? 
          `Received email: ${args.subject || 'No subject'}` :
          args.type === "phone" ?
          `Received phone call` :
          `Received ${args.type} communication`;
        
        await ctx.runMutation(internal.activityLogger.logActivityInternal, {
          clientId: args.clientId,
          userId: args.userId,
          action: activityAction,
          description: description,
          contactId: args.contactId,
          companyId: args.companyId,
          campaignId: args.campaignId,
          category: "communication",
          priority: "medium", // Inbound is higher priority
          isSystemGenerated: true, // Usually system detected
          metadata: {
            communicationType: args.type,
            provider: args.provider,
            direction: args.direction,
            status: args.status,
            subject: args.subject,
            fromEmail: args.fromEmail,
            toEmail: args.toEmail,
          },
        });
      }
      
      return communicationId;
    } catch (error) {
      console.error("Failed to log communication:", error);
      throw error;
    }
  },
});

export const updateCommunicationStatus = mutation({
  args: {
    communicationId: v.id("communications"),
    status: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    try {
      // Validate required fields
      if (!args.communicationId) {
        throw new Error("Communication ID is required");
      }
      
      if (!args.status || args.status.trim().length === 0) {
        throw new Error("Status cannot be empty");
      }
      
      // Validate status values
      const validStatuses = [
        "sent", "delivered", "opened", "clicked", "replied", "bounced", "failed",
        "connected", "answered", "voicemail", "missed"
      ];
      
      if (!validStatuses.includes(args.status)) {
        throw new Error(`Invalid status: ${args.status}. Must be one of: ${validStatuses.join(", ")}`);
      }
      
      const existing = await ctx.db.get(args.communicationId);
      if (!existing) {
        throw new Error("Communication not found");
      }
      
      // Validate metadata if provided
      if (args.metadata) {
        if (typeof args.metadata !== "object") {
          throw new Error("Metadata must be an object");
        }
        
        // Validate timestamp fields if present
        const timestampFields = ["openedAt", "clickedAt", "repliedAt"];
        for (const field of timestampFields) {
          if (args.metadata[field] && typeof args.metadata[field] !== "number") {
            throw new Error(`Metadata ${field} must be a timestamp number`);
          }
        }
      }

      await ctx.db.patch(args.communicationId, {
        status: args.status as any,
        metadata: args.metadata ? { ...existing.metadata, ...args.metadata } : existing.metadata,
        updatedAt: Date.now(),
      });
      
      // Log activity voor belangrijke status changes
      if (args.status === "opened") {
        await ctx.runMutation(internal.activityLogger.logActivityInternal, {
          clientId: existing.clientId,
          userId: undefined, // System generated
          action: "email_opened",
          description: `Email opened: ${existing.subject || 'No subject'}`,
          contactId: existing.contactId,
          companyId: existing.companyId,
          campaignId: existing.campaignId,
          category: "communication",
          priority: "low",
          isSystemGenerated: true,
          metadata: {
            communicationType: existing.type,
            provider: existing.provider,
            communicationId: args.communicationId,
            originalStatus: existing.status,
            newStatus: args.status,
          },
        });
      } else if (args.status === "clicked") {
        await ctx.runMutation(internal.activityLogger.logActivityInternal, {
          clientId: existing.clientId,
          userId: undefined,
          action: "email_clicked",
          description: `Email link clicked: ${existing.subject || 'No subject'}`,
          contactId: existing.contactId,
          companyId: existing.companyId,
          campaignId: existing.campaignId,
          category: "communication",
          priority: "medium",
          isSystemGenerated: true,
          metadata: {
            communicationType: existing.type,
            provider: existing.provider,
            communicationId: args.communicationId,
            clickData: args.metadata,
          },
        });
      } else if (args.status === "replied") {
        await ctx.runMutation(internal.activityLogger.logActivityInternal, {
          clientId: existing.clientId,
          userId: undefined,
          action: "email_replied",
          description: `Email replied: ${existing.subject || 'No subject'}`,
          contactId: existing.contactId,
          companyId: existing.companyId,
          campaignId: existing.campaignId,
          category: "communication",
          priority: "high",
          isSystemGenerated: true,
          metadata: {
            communicationType: existing.type,
            provider: existing.provider,
            communicationId: args.communicationId,
            replyData: args.metadata,
          },
        });
      } else if (args.status === "connected" && existing.type === "linkedin") {
        await ctx.runMutation(internal.activityLogger.logActivityInternal, {
          clientId: existing.clientId,
          userId: undefined,
          action: "linkedin_connection_accepted",
          description: `LinkedIn connection accepted`,
          contactId: existing.contactId,
          companyId: existing.companyId,
          campaignId: existing.campaignId,
          category: "communication",
          priority: "high",
          isSystemGenerated: true,
          metadata: {
            communicationType: existing.type,
            provider: existing.provider,
            communicationId: args.communicationId,
            connectionData: args.metadata,
          },
        });
      }
      
      return null;
    } catch (error) {
      console.error("Failed to update communication status:", error);
      throw error;
    }
  },
});

// ===============================
// QUERIES FOR COMMUNICATIONS
// ===============================

export const getContactTimeline = query({
  args: {
    clientId: v.id("clients"),
    contactId: v.id("contacts"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      // Validate required fields
      if (!args.clientId) {
        throw new Error("Client ID is required");
      }
      
      if (!args.contactId) {
        throw new Error("Contact ID is required");
      }
      
      // Validate limit
      const limit = args.limit ?? 50;
      if (limit < 1 || limit > 1000) {
        throw new Error("Limit must be between 1 and 1000");
      }
      
      // Validate that contact exists and belongs to client
      const contact = await ctx.db.get(args.contactId);
      if (!contact) {
        throw new Error("Contact not found");
      }
      
      if (contact.clientId !== args.clientId) {
        throw new Error("Contact does not belong to client");
      }

      const communications = await ctx.db
        .query("communications")
        .withIndex("by_client_contact", q => 
          q.eq("clientId", args.clientId).eq("contactId", args.contactId)
        )
        .order("desc")
        .take(limit);
        
      return communications;
    } catch (error) {
      console.error("Failed to get contact timeline:", error);
      throw error;
    }
  },
});

export const getCompanyTimeline = query({
  args: {
    clientId: v.id("clients"),
    companyId: v.id("companies"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get all communications for this company directly
    const companyCommunications = await ctx.db
      .query("communications")
      .withIndex("by_client", q => q.eq("clientId", args.clientId))
      .filter(q => q.eq(q.field("companyId"), args.companyId))
      .order("desc")
      .take(args.limit ?? 100);
    
    // Also get communications for all contacts of this company
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_company", q => q.eq("companyId", args.companyId))
      .collect();
    
    const contactCommunications = [];
    for (const contact of contacts) {
      const comms = await ctx.db
        .query("communications")
        .withIndex("by_client_contact", q => 
          q.eq("clientId", args.clientId).eq("contactId", contact._id)
        )
        .take(50);
      contactCommunications.push(...comms);
    }
    
    // Combine and sort by timestamp
    const allCommunications = [...companyCommunications, ...contactCommunications];
    return allCommunications
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, args.limit ?? 100);
  },
});

export const getCampaignCommunications = query({
  args: {
    clientId: v.id("clients"),
    campaignId: v.id("campaigns"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("communications")
      .withIndex("by_campaign", q => q.eq("campaignId", args.campaignId))
      .filter(q => q.eq(q.field("clientId"), args.clientId))
      .order("desc")
      .take(args.limit ?? 100);
  },
});

export const getClientCommunications = query({
  args: {
    clientId: v.id("clients"),
    type: v.optional(v.union(
      v.literal("email"), 
      v.literal("linkedin"), 
      v.literal("phone"), 
      v.literal("meeting"),
      v.literal("note")
    )),
    direction: v.optional(v.union(v.literal("inbound"), v.literal("outbound"))),
    provider: v.optional(v.union(
      v.literal("instantly"), 
      v.literal("phantombuster"), 
      v.literal("aircall"),
      v.literal("gmail"),
      v.literal("outlook"),
      v.literal("manual")
    )),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("communications")
      .withIndex("by_client", q => q.eq("clientId", args.clientId));
    
    if (args.type) {
      query = query.filter(q => q.eq(q.field("type"), args.type));
    }
    
    if (args.direction) {
      query = query.filter(q => q.eq(q.field("direction"), args.direction));
    }
    
    if (args.provider) {
      query = query.filter(q => q.eq(q.field("provider"), args.provider));
    }
    
    return await query
      .order("desc")
      .take(args.limit ?? 50);
  },
});

// ===============================
// SEARCH & MATCHING
// ===============================

export const findCommunicationByMessageId = query({
  args: {
    messageId: v.string(),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Search in metadata for various message ID fields
    const communications = await ctx.db
      .query("communications")
      .collect();
    
    for (const comm of communications) {
      if (!comm.metadata) continue;
      
      const metadata = comm.metadata as any;
      if (
        metadata.messageId === args.messageId ||
        metadata.gmailMessageId === args.messageId ||
        metadata.outlookMessageId === args.messageId ||
        metadata.instantlyMessageId === args.messageId ||
        metadata.phantomBusterSessionId === args.messageId ||
        metadata.aircallCallId === args.messageId
      ) {
        return comm;
      }
    }
    
    return null;
  },
});

export const findContactByEmail = query({
  args: { 
    email: v.string(), 
    clientId: v.id("clients") 
  },
  handler: async (ctx, args) => {
    try {
      // Validate required fields
      if (!args.email || args.email.trim().length === 0) {
        throw new Error("Email is required");
      }
      
      if (!args.clientId) {
        throw new Error("Client ID is required");
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(args.email)) {
        throw new Error("Invalid email format");
      }
      
      const normalizedEmail = args.email.toLowerCase().trim();
      
      // Direct email match
      let contact = await ctx.db
        .query("contacts")
        .withIndex("by_email", q => q.eq("email", normalizedEmail))
        .filter(q => q.eq(q.field("clientId"), args.clientId))
        .first();
      
      if (contact) return contact;
      
      // Domain-based company match
      const domain = normalizedEmail.split('@')[1];
      if (!domain || domain.length < 3) {
        return null; // Invalid or too short domain
      }
      
      const company = await ctx.db
        .query("companies")
        .withIndex("by_domain", q => q.eq("domain", domain))
        .first();
      
      if (company) {
        // Find any contact from this company for this client
        contact = await ctx.db
          .query("contacts")
          .withIndex("by_company", q => q.eq("companyId", company._id))
          .filter(q => q.eq(q.field("clientId"), args.clientId))
          .first();
      }
      
      return contact;
    } catch (error) {
      console.error("Failed to find contact by email:", error);
      // For this function, we don't want to throw errors as it's used in automated processes
      // Instead, return null and log the error
      return null;
    }
  },
});

// ===============================
// ANALYTICS & STATS
// ===============================

export const getContactEngagementScore = query({
  args: { 
    contactId: v.id("contacts"), 
    clientId: v.id("clients"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysAgo = args.days || 30;
    const cutoffTimestamp = Date.now() - (daysAgo * 24 * 60 * 60 * 1000);
    
    const communications = await ctx.db
      .query("communications")
      .withIndex("by_client_contact", q => 
        q.eq("clientId", args.clientId).eq("contactId", args.contactId)
      )
      .filter(q => q.gte(q.field("timestamp"), cutoffTimestamp))
      .collect();
    
    let score = 0;
    const stats = {
      totalCommunications: communications.length,
      emails: 0,
      linkedin: 0,
      phone: 0,
      meetings: 0,
      opens: 0,
      clicks: 0,
      replies: 0,
      connections: 0,
    };
    
    for (const comm of communications) {
      // Count by type
      stats[comm.type as keyof typeof stats] = (stats[comm.type as keyof typeof stats] as number) + 1;
      
      // Calculate engagement score
      switch (comm.status) {
        case "sent": score += 1; break;
        case "delivered": score += 1; break;
        case "opened": 
          score += 3; 
          stats.opens++;
          break;
        case "clicked": 
          score += 5; 
          stats.clicks++;
          break;
        case "replied": 
          score += 15; 
          stats.replies++;
          break;
        case "connected": 
          score += 10; 
          stats.connections++;
          break;
        case "answered": score += 12; break;
        case "voicemail": score += 3; break;
      }
      
      // Bonus for inbound communications
      if (comm.direction === "inbound") {
        score += 5;
      }
    }
    
    return { 
      score, 
      stats,
      averageScore: communications.length > 0 ? Math.round(score / communications.length) : 0 
    };
  },
});

export const getCampaignPerformance = query({
  args: { 
    campaignId: v.id("campaigns"), 
    clientId: v.id("clients") 
  },
  handler: async (ctx, args) => {
    const communications = await ctx.db
      .query("communications")
      .withIndex("by_campaign", q => q.eq("campaignId", args.campaignId))
      .filter(q => q.eq(q.field("clientId"), args.clientId))
      .collect();
    
    const stats = {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      replied: 0,
      bounced: 0,
      failed: 0,
      connected: 0, // LinkedIn
      answered: 0, // Phone
      byProvider: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
    };
    
    for (const comm of communications) {
      stats.sent++;
      
      // Count by status
      switch (comm.status) {
        case "delivered": stats.delivered++; break;
        case "opened": stats.opened++; break;
        case "clicked": stats.clicked++; break;
        case "replied": stats.replied++; break;
        case "bounced": stats.bounced++; break;
        case "failed": stats.failed++; break;
        case "connected": stats.connected++; break;
        case "answered": stats.answered++; break;
      }
      
      // Count by provider
      stats.byProvider[comm.provider] = (stats.byProvider[comm.provider] || 0) + 1;
      
      // Count by type
      stats.byType[comm.type] = (stats.byType[comm.type] || 0) + 1;
      
      // Count by status
      stats.byStatus[comm.status] = (stats.byStatus[comm.status] || 0) + 1;
    }
    
    // Calculate rates
    const deliveryRate = stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0;
    const openRate = stats.delivered > 0 ? (stats.opened / stats.delivered) * 100 : 0;
    const clickRate = stats.opened > 0 ? (stats.clicked / stats.opened) * 100 : 0;
    const replyRate = stats.delivered > 0 ? (stats.replied / stats.delivered) * 100 : 0;
    
    return {
      ...stats,
      rates: {
        delivery: Math.round(deliveryRate * 100) / 100,
        open: Math.round(openRate * 100) / 100,
        click: Math.round(clickRate * 100) / 100,
        reply: Math.round(replyRate * 100) / 100,
      },
    };
  },
});

// ===============================
// CLIENT COMMUNICATION STATISTICS  
// ===============================

export const getClientCommunicationStats = query({
  args: {
    clientId: v.id("clients"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysAgo = args.days || 30;
    const cutoffTimestamp = Date.now() - (daysAgo * 24 * 60 * 60 * 1000);

    const communications = await ctx.db
      .query("communications")
      .withIndex("by_client", q => q.eq("clientId", args.clientId))
      .filter(q => q.gte(q.field("timestamp"), cutoffTimestamp))
      .collect();

    const stats = {
      totalCommunications: communications.length,
      emailCount: communications.filter(c => c.type === "email").length,
      linkedinCount: communications.filter(c => c.type === "linkedin").length,
      phoneCount: communications.filter(c => c.type === "phone").length,
      meetingCount: communications.filter(c => c.type === "meeting").length,
      inboundCount: communications.filter(c => c.direction === "inbound").length,
      outboundCount: communications.filter(c => c.direction === "outbound").length,
      avgPerDay: Math.round(communications.length / daysAgo),
      uniqueContactsReached: new Set(communications.map(c => c.contactId).filter(Boolean)).size,
      avgPerContact: 0,
      emailResponseRate: 0,
      linkedinResponseRate: 0,
      phoneSuccessRate: 0,
      mostActiveChannel: "email",
    };

    // Calculate averages
    if (stats.uniqueContactsReached > 0) {
      stats.avgPerContact = Math.round(stats.totalCommunications / stats.uniqueContactsReached * 10) / 10;
    }

    // Calculate response rates
    const emailComms = communications.filter(c => c.type === "email");
    const emailReplies = emailComms.filter(c => c.metadata?.repliedAt || c.status === "replied");
    if (emailComms.length > 0) {
      stats.emailResponseRate = Math.round((emailReplies.length / emailComms.length) * 100);
    }

    const linkedinComms = communications.filter(c => c.type === "linkedin");
    const linkedinReplies = linkedinComms.filter(c => c.metadata?.repliedAt || c.status === "replied");
    if (linkedinComms.length > 0) {
      stats.linkedinResponseRate = Math.round((linkedinReplies.length / linkedinComms.length) * 100);
    }

    const phoneComms = communications.filter(c => c.type === "phone");
    const phoneAnswered = phoneComms.filter(c => c.status === "answered");
    if (phoneComms.length > 0) {
      stats.phoneSuccessRate = Math.round((phoneAnswered.length / phoneComms.length) * 100);
    }

    // Determine most active channel
    const channelCounts = [
      { channel: "email", count: stats.emailCount },
      { channel: "linkedin", count: stats.linkedinCount },
      { channel: "phone", count: stats.phoneCount },
      { channel: "meeting", count: stats.meetingCount },
    ];
    const mostActive = channelCounts.reduce((max, current) => 
      current.count > max.count ? current : max
    );
    stats.mostActiveChannel = mostActive.channel;

    return stats;
  },
});

// ===============================
// INTERNAL FUNCTIONS FOR EMAIL SYNC
// ===============================

export const findContactByEmailInternal = internalQuery({
  args: {
    email: v.string(),
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    // Direct email match
    let contact = await ctx.db
      .query("contacts")
      .withIndex("by_email", q => q.eq("email", args.email))
      .filter(q => q.eq(q.field("clientId"), args.clientId))
      .first();
    
    if (contact) return contact;
    
    // Domain-based company match
    const domain = args.email.split('@')[1];
    if (!domain) return null;
    
    const company = await ctx.db
      .query("companies")
      .withIndex("by_domain", q => q.eq("domain", domain))
      .filter(q => q.eq(q.field("clientId"), args.clientId))
      .first();
    
    if (company) {
      // Find any contact from this company
      contact = await ctx.db
        .query("contacts")
        .withIndex("by_company", q => q.eq("companyId", company._id))
        .first();
    }
    
    return contact;
  },
});

export const findCommunicationByMessageIdInternal = internalQuery({
  args: {
    messageId: v.string(),
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    // Search in metadata for various message ID fields
    const communications = await ctx.db
      .query("communications")
      .filter(q => q.eq(q.field("provider"), args.provider))
      .collect();
    
    for (const comm of communications) {
      if (!comm.metadata) continue;
      
      const metadata = comm.metadata as any;
      if (
        metadata.messageId === args.messageId ||
        metadata.gmailMessageId === args.messageId ||
        metadata.outlookMessageId === args.messageId ||
        metadata.instantlyMessageId === args.messageId ||
        metadata.phantomBusterSessionId === args.messageId ||
        metadata.phantomBusterContainerId === args.messageId ||
        metadata.aircallCallId === args.messageId
      ) {
        return comm;
      }
    }
    
    return null;
  },
});

export const updateCommunicationStatusInternal = internalMutation({
  args: {
    communicationId: v.id("communications"),
    status: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.communicationId);
    if (!existing) {
      throw new Error("Communication not found");
    }

    return await ctx.db.patch(args.communicationId, {
      status: args.status as any,
      metadata: args.metadata ? { ...existing.metadata, ...args.metadata } : existing.metadata,
      updatedAt: Date.now(),
    });
  },
});