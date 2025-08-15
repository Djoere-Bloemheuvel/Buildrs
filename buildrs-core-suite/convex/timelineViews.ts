import { query } from "./_generated/server";
import { v } from "convex/values";

// ===============================
// FULL TIMELINE VIEW
// Complex view showing complete activity timeline for contacts/companies
// ===============================

export const fullTimeline = query({
  args: {
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    clientId: v.optional(v.id("clients")),
    fromDate: v.optional(v.number()),
    toDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    activityId: v.string(),
    activityType: v.string(),
    timestamp: v.number(),
    description: v.string(),
    channel: v.optional(v.string()),
    direction: v.optional(v.string()),
    status: v.optional(v.string()),
    // Contact info
    contactId: v.optional(v.id("contacts")),
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactJobTitle: v.optional(v.string()),
    // Company info
    companyId: v.optional(v.id("companies")),
    companyName: v.optional(v.string()),
    companyDomain: v.optional(v.string()),
    // Campaign info
    campaignId: v.optional(v.id("campaigns")),
    campaignName: v.optional(v.string()),
    campaignType: v.optional(v.string()),
    // Deal info
    dealId: v.optional(v.id("deals")),
    dealTitle: v.optional(v.string()),
    dealValue: v.optional(v.number()),
    // User info
    userId: v.optional(v.id("profiles")),
    userName: v.optional(v.string()),
    // Additional context
    metadata: v.optional(v.any()),
  })),
  handler: async (ctx, args) => {
    const timelineItems: any[] = [];
    const now = Date.now();
    const fromDate = args.fromDate || (now - 90 * 24 * 60 * 60 * 1000); // 90 days ago
    const toDate = args.toDate || now;

    // Get base contacts to query
    let targetContacts: any[] = [];
    if (args.contactId) {
      const contact = await ctx.db.get(args.contactId);
      if (contact) targetContacts = [contact];
    } else if (args.companyId) {
      targetContacts = await ctx.db
        .query("contacts")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();
    } else if (args.clientId) {
      targetContacts = await ctx.db
        .query("contacts")
        .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
        .take(50); // Limit for performance
    }

    // 1. COMMUNICATIONS
    for (const contact of targetContacts) {
      const communications = await ctx.db
        .query("communications")
        .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
        .filter((q) => q.and(
          q.gte(q.field("timestamp"), fromDate),
          q.lte(q.field("timestamp"), toDate)
        ))
        .collect();

      for (const comm of communications) {
        const company = contact.companyId ? await ctx.db.get(contact.companyId) : null;
        const campaign = comm.campaignId ? await ctx.db.get(comm.campaignId) : null;

        timelineItems.push({
          activityId: `comm_${comm._id}`,
          activityType: "communication",
          timestamp: comm.timestamp,
          description: `${comm.direction === 'outbound' ? 'Sent' : 'Received'} ${comm.channel} ${comm.type || 'message'}`,
          channel: comm.channel,
          direction: comm.direction,
          status: comm.status,
          contactId: contact._id,
          contactName: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
          contactEmail: contact.email,
          contactJobTitle: contact.jobTitle,
          companyId: company?._id,
          companyName: company?.name,
          companyDomain: company?.domain,
          campaignId: campaign?._id,
          campaignName: campaign?.name,
          campaignType: campaign?.type,
          userId: comm.userId,
          metadata: {
            subject: comm.subject,
            content: comm.content,
            opens: comm.opens,
            clicks: comm.clicks,
          },
        });
      }
    }

    // 2. CAMPAIGN ACTIVITIES
    for (const contact of targetContacts) {
      const campaignContacts = await ctx.db
        .query("campaignContacts")
        .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
        .collect();

      for (const cc of campaignContacts) {
        const campaign = await ctx.db.get(cc.campaignId);
        const company = contact.companyId ? await ctx.db.get(contact.companyId) : null;

        if (campaign && cc._creationTime >= fromDate && cc._creationTime <= toDate) {
          timelineItems.push({
            activityId: `campaign_${cc._id}`,
            activityType: "campaign_enrollment",
            timestamp: cc._creationTime,
            description: `Added to ${campaign.type} campaign: ${campaign.name}`,
            status: cc.status,
            contactId: contact._id,
            contactName: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
            contactEmail: contact.email,
            contactJobTitle: contact.jobTitle,
            companyId: company?._id,
            companyName: company?.name,
            companyDomain: company?.domain,
            campaignId: campaign._id,
            campaignName: campaign.name,
            campaignType: campaign.type,
            metadata: {
              sequence: cc.sequence,
              step: cc.step,
            },
          });
        }
      }
    }

    // 3. DEAL ACTIVITIES
    if (args.companyId) {
      const deals = await ctx.db
        .query("deals")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      for (const deal of deals) {
        if (deal._creationTime >= fromDate && deal._creationTime <= toDate) {
          const contact = deal.contactId ? await ctx.db.get(deal.contactId) : null;
          const company = await ctx.db.get(args.companyId);

          timelineItems.push({
            activityId: `deal_created_${deal._id}`,
            activityType: "deal_created",
            timestamp: deal._creationTime,
            description: `Deal created: ${deal.title}`,
            contactId: contact?._id,
            contactName: contact ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim() : undefined,
            contactEmail: contact?.email,
            contactJobTitle: contact?.jobTitle,
            companyId: company?._id,
            companyName: company?.name,
            companyDomain: company?.domain,
            dealId: deal._id,
            dealTitle: deal.title,
            dealValue: deal.value,
            userId: deal.ownerId,
            metadata: {
              status: deal.status,
              stage: deal.stageId,
            },
          });
        }
      }
    }

    // 4. ACTIVITY LOG ENTRIES
    let activityQuery = ctx.db.query("activityLog");
    
    if (args.contactId) {
      activityQuery = activityQuery.withIndex("by_contact", (q) => q.eq("contactId", args.contactId));
    } else if (args.companyId) {
      activityQuery = activityQuery.withIndex("by_company", (q) => q.eq("companyId", args.companyId));
    }

    const activities = await activityQuery
      .filter((q) => q.and(
        q.gte(q.field("_creationTime"), fromDate),
        q.lte(q.field("_creationTime"), toDate)
      ))
      .collect();

    for (const activity of activities) {
      const contact = activity.contactId ? await ctx.db.get(activity.contactId) : null;
      const company = activity.companyId ? await ctx.db.get(activity.companyId) : null;
      const deal = activity.dealId ? await ctx.db.get(activity.dealId) : null;

      timelineItems.push({
        activityId: `activity_${activity._id}`,
        activityType: activity.type,
        timestamp: activity._creationTime,
        description: activity.description,
        contactId: contact?._id,
        contactName: contact ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim() : undefined,
        contactEmail: contact?.email,
        contactJobTitle: contact?.jobTitle,
        companyId: company?._id,
        companyName: company?.name,
        companyDomain: company?.domain,
        dealId: deal?._id,
        dealTitle: deal?.title,
        dealValue: deal?.value,
        userId: activity.userId,
        metadata: activity.metadata,
      });
    }

    // Sort by timestamp (newest first) and limit
    timelineItems.sort((a, b) => b.timestamp - a.timestamp);
    
    return timelineItems.slice(0, args.limit || 100);
  },
});

// ===============================
// MEETING PREPARATION VIEW
// Comprehensive view for meeting preparation with context
// ===============================

export const meetingPrep = query({
  args: {
    contactIds: v.array(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    includePastDays: v.optional(v.number()),
  },
  returns: v.object({
    // Meeting context
    primaryContact: v.optional(v.object({
      _id: v.id("contacts"),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.optional(v.string()),
      jobTitle: v.optional(v.string()),
      linkedinUrl: v.optional(v.string()),
      functionGroup: v.optional(v.string()),
      seniority: v.optional(v.string()),
    })),
    
    // Company context
    company: v.optional(v.object({
      _id: v.id("companies"),
      name: v.string(),
      domain: v.optional(v.string()),
      website: v.optional(v.string()),
      industryLabel: v.optional(v.string()),
      companySize: v.optional(v.number()),
      companySummary: v.optional(v.string()),
      companyKeywords: v.optional(v.array(v.string())),
      companyCommonProblems: v.optional(v.string()),
    })),

    // All meeting attendees
    attendees: v.array(v.object({
      _id: v.id("contacts"),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.optional(v.string()),
      jobTitle: v.optional(v.string()),
      functionGroup: v.optional(v.string()),
      lastInteraction: v.optional(v.number()),
      relationshipScore: v.number(),
    })),

    // Recent communications (last 30 days)
    recentCommunications: v.array(v.object({
      _id: v.id("communications"),
      timestamp: v.number(),
      channel: v.string(),
      direction: v.string(),
      type: v.optional(v.string()),
      subject: v.optional(v.string()),
      contactName: v.string(),
      summary: v.optional(v.string()),
    })),

    // Active campaigns
    activeCampaigns: v.array(v.object({
      _id: v.id("campaigns"),
      name: v.string(),
      type: v.string(),
      status: v.optional(v.string()),
      contactCount: v.number(),
      lastActivity: v.optional(v.number()),
    })),

    // Open deals
    openDeals: v.array(v.object({
      _id: v.id("deals"),
      title: v.string(),
      value: v.optional(v.number()),
      stage: v.optional(v.string()),
      probability: v.optional(v.number()),
      daysInStage: v.number(),
      nextSteps: v.optional(v.string()),
    })),

    // Key talking points
    talkingPoints: v.array(v.object({
      category: v.string(),
      point: v.string(),
      context: v.optional(v.string()),
      priority: v.number(),
    })),

    // Company intelligence
    companyIntelligence: v.object({
      totalContacts: v.number(),
      decisionMakers: v.number(),
      engagementLevel: v.string(),
      lastEngagement: v.optional(v.number()),
      campaignHistory: v.number(),
      responseRate: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const pastDays = args.includePastDays || 30;
    const pastDate = Date.now() - (pastDays * 24 * 60 * 60 * 1000);

    // Get primary contact and company
    const primaryContact = args.contactIds.length > 0 ? 
      await ctx.db.get(args.contactIds[0]) : null;
    
    const companyId = args.companyId || primaryContact?.companyId;
    const company = companyId ? await ctx.db.get(companyId) : null;

    // Get all attendees
    const attendees = [];
    for (const contactId of args.contactIds) {
      const contact = await ctx.db.get(contactId);
      if (contact) {
        // Get last interaction
        const lastComm = await ctx.db
          .query("communications")
          .withIndex("by_contact", (q) => q.eq("contactId", contactId))
          .order("desc")
          .first();

        // Calculate relationship score (simplified)
        const allComms = await ctx.db
          .query("communications")
          .withIndex("by_contact", (q) => q.eq("contactId", contactId))
          .collect();
        
        const responseCount = allComms.filter(c => c.direction === "inbound").length;
        const totalComms = allComms.length;
        const relationshipScore = totalComms > 0 ? (responseCount / totalComms) * 100 : 0;

        attendees.push({
          _id: contact._id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          jobTitle: contact.jobTitle,
          functionGroup: contact.functionGroup,
          lastInteraction: lastComm?.timestamp,
          relationshipScore,
        });
      }
    }

    // Get recent communications for all attendees
    const recentCommunications = [];
    for (const contactId of args.contactIds) {
      const comms = await ctx.db
        .query("communications")
        .withIndex("by_contact", (q) => q.eq("contactId", contactId))
        .filter((q) => q.gte(q.field("timestamp"), pastDate))
        .order("desc")
        .take(10);

      for (const comm of comms) {
        const contact = await ctx.db.get(contactId);
        recentCommunications.push({
          _id: comm._id,
          timestamp: comm.timestamp,
          channel: comm.channel,
          direction: comm.direction,
          type: comm.type,
          subject: comm.subject,
          contactName: `${contact?.firstName || ''} ${contact?.lastName || ''}`.trim(),
          summary: comm.content?.substring(0, 200),
        });
      }
    }

    // Get active campaigns
    const activeCampaigns = [];
    const campaignMap = new Map();
    
    for (const contactId of args.contactIds) {
      const campaignContacts = await ctx.db
        .query("campaignContacts")
        .withIndex("by_contact", (q) => q.eq("contactId", contactId))
        .filter((q) => q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "planned")
        ))
        .collect();

      for (const cc of campaignContacts) {
        if (!campaignMap.has(cc.campaignId)) {
          const campaign = await ctx.db.get(cc.campaignId);
          if (campaign) {
            campaignMap.set(cc.campaignId, {
              campaign,
              contacts: 0,
              lastActivity: null,
            });
          }
        }
        if (campaignMap.has(cc.campaignId)) {
          campaignMap.get(cc.campaignId).contacts++;
        }
      }
    }

    for (const [campaignId, data] of campaignMap) {
      const lastComm = await ctx.db
        .query("communications")
        .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
        .order("desc")
        .first();

      activeCampaigns.push({
        _id: data.campaign._id,
        name: data.campaign.name,
        type: data.campaign.type,
        status: data.campaign.status,
        contactCount: data.contacts,
        lastActivity: lastComm?.timestamp,
      });
    }

    // Get open deals
    const openDeals = [];
    if (companyId) {
      const deals = await ctx.db
        .query("deals")
        .withIndex("by_company", (q) => q.eq("companyId", companyId))
        .filter((q) => q.eq(q.field("status"), "open"))
        .collect();

      for (const deal of deals) {
        const stage = deal.stageId ? await ctx.db.get(deal.stageId) : null;
        const daysInStage = Math.floor((Date.now() - deal._creationTime) / (1000 * 60 * 60 * 24));

        openDeals.push({
          _id: deal._id,
          title: deal.title,
          value: deal.value,
          stage: stage?.name,
          probability: deal.confidence,
          daysInStage,
          nextSteps: deal.nextSteps,
        });
      }
    }

    // Generate talking points
    const talkingPoints = [];
    
    // Recent activity points
    if (recentCommunications.length > 0) {
      talkingPoints.push({
        category: "Recent Activity",
        point: `Last communication was ${Math.floor((Date.now() - recentCommunications[0].timestamp) / (1000 * 60 * 60 * 24))} days ago`,
        context: `${recentCommunications[0].channel} ${recentCommunications[0].direction}`,
        priority: 1,
      });
    }

    // Company intelligence points
    if (company?.companySummary) {
      talkingPoints.push({
        category: "Company Intelligence",
        point: "Company overview available",
        context: company.companySummary.substring(0, 100),
        priority: 2,
      });
    }

    // Campaign context
    if (activeCampaigns.length > 0) {
      talkingPoints.push({
        category: "Campaign Context",
        point: `Currently in ${activeCampaigns.length} active campaign(s)`,
        context: activeCampaigns.map(c => c.name).join(", "),
        priority: 1,
      });
    }

    // Deal context
    if (openDeals.length > 0) {
      const totalValue = openDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      talkingPoints.push({
        category: "Deal Pipeline",
        point: `${openDeals.length} open deal(s) worth $${totalValue.toLocaleString()}`,
        context: openDeals.map(d => d.title).join(", "),
        priority: 1,
      });
    }

    // Company intelligence summary
    let companyIntelligence;
    if (companyId) {
      const allContacts = await ctx.db
        .query("contacts")
        .withIndex("by_company", (q) => q.eq("companyId", companyId))
        .collect();

      const decisionMakerGroups = [
        'Owner/Founder', 'Marketing Decision Makers', 'Sales Decision Makers',
        'Business Development Decision Makers', 'Operational Decision Makers',
        'Technical Decision Makers', 'Financial Decision Makers', 'HR Decision Makers'
      ];

      const decisionMakers = allContacts.filter(c => 
        c.functionGroup && decisionMakerGroups.includes(c.functionGroup)
      ).length;

      // Get all communications for company
      const allCompanyComms = [];
      for (const contact of allContacts) {
        const comms = await ctx.db
          .query("communications")
          .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
          .collect();
        allCompanyComms.push(...comms);
      }

      const totalOutbound = allCompanyComms.filter(c => c.direction === "outbound").length;
      const totalInbound = allCompanyComms.filter(c => c.direction === "inbound").length;
      const responseRate = totalOutbound > 0 ? (totalInbound / totalOutbound) * 100 : 0;

      const lastEngagement = allCompanyComms.length > 0 ?
        Math.max(...allCompanyComms.map(c => c.timestamp)) : undefined;

      // Get campaign history
      let campaignHistory = 0;
      for (const contact of allContacts) {
        const campaigns = await ctx.db
          .query("campaignContacts")
          .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
          .collect();
        campaignHistory += campaigns.length;
      }

      let engagementLevel = "Low";
      if (responseRate > 20) engagementLevel = "High";
      else if (responseRate > 10) engagementLevel = "Medium";

      companyIntelligence = {
        totalContacts: allContacts.length,
        decisionMakers,
        engagementLevel,
        lastEngagement,
        campaignHistory,
        responseRate,
      };
    } else {
      companyIntelligence = {
        totalContacts: 0,
        decisionMakers: 0,
        engagementLevel: "Unknown",
        lastEngagement: undefined,
        campaignHistory: 0,
        responseRate: 0,
      };
    }

    return {
      primaryContact: primaryContact ? {
        _id: primaryContact._id,
        firstName: primaryContact.firstName,
        lastName: primaryContact.lastName,
        email: primaryContact.email,
        jobTitle: primaryContact.jobTitle,
        linkedinUrl: primaryContact.linkedinUrl,
        functionGroup: primaryContact.functionGroup,
        seniority: primaryContact.seniority,
      } : undefined,
      company: company ? {
        _id: company._id,
        name: company.name,
        domain: company.domain,
        website: company.website,
        industryLabel: company.industryLabel,
        companySize: company.companySize,
        companySummary: company.companySummary,
        companyKeywords: company.companyKeywords,
        companyCommonProblems: company.companyCommonProblems,
      } : undefined,
      attendees,
      recentCommunications: recentCommunications.sort((a, b) => b.timestamp - a.timestamp),
      activeCampaigns,
      openDeals,
      talkingPoints: talkingPoints.sort((a, b) => a.priority - b.priority),
      companyIntelligence,
    };
  },
});

// ===============================
// PROJECT MANAGEMENT VIEWS
// Views for tracking project progress and tasks
// ===============================

export const projectTimeline = query({
  args: {
    projectId: v.id("projects"),
    includeCompleted: v.optional(v.boolean()),
  },
  returns: v.array(v.object({
    _id: v.string(),
    type: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    timestamp: v.number(),
    status: v.optional(v.string()),
    assigneeId: v.optional(v.id("profiles")),
    assigneeName: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()),
    relatedEntityType: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return [];

    const timelineItems = [];

    // Project creation
    timelineItems.push({
      _id: `project_created_${project._id}`,
      type: "project_created",
      title: "Project Created",
      description: `Project "${project.name}" was created`,
      timestamp: project._creationTime,
      status: "completed",
      assigneeId: project.ownerId,
      relatedEntityId: project._id,
      relatedEntityType: "project",
    });

    // Get project tasks
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const task of tasks) {
      // Task creation
      timelineItems.push({
        _id: `task_created_${task._id}`,
        type: "task_created", 
        title: `Task Created: ${task.title}`,
        description: task.description,
        timestamp: task._creationTime,
        status: task.status,
        assigneeId: task.assigneeId,
        relatedEntityId: task._id,
        relatedEntityType: "task",
        metadata: {
          priority: task.priority,
          dueDate: task.dueDate,
        },
      });

      // Task completion (if completed)
      if (task.status === "completed" && task.completedAt) {
        timelineItems.push({
          _id: `task_completed_${task._id}`,
          type: "task_completed",
          title: `Task Completed: ${task.title}`,
          description: task.description,
          timestamp: task.completedAt,
          status: "completed",
          assigneeId: task.assigneeId,
          relatedEntityId: task._id,
          relatedEntityType: "task",
        });
      }
    }

    // Get project activities
    const activities = await ctx.db
      .query("activityLog")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const activity of activities) {
      timelineItems.push({
        _id: `activity_${activity._id}`,
        type: activity.type,
        title: activity.description,
        timestamp: activity._creationTime,
        assigneeId: activity.userId,
        relatedEntityId: activity._id,
        relatedEntityType: "activity",
        metadata: activity.metadata,
      });
    }

    // Filter completed items if requested
    let filteredItems = timelineItems;
    if (!args.includeCompleted) {
      filteredItems = timelineItems.filter(item => 
        item.status !== "completed" || item.type === "project_created"
      );
    }

    // Enrich with assignee names
    const enrichedItems = await Promise.all(
      filteredItems.map(async (item) => {
        let assigneeName: string | undefined;
        if (item.assigneeId) {
          const assignee = await ctx.db.get(item.assigneeId);
          assigneeName = assignee?.fullName || assignee?.email;
        }
        return { ...item, assigneeName };
      })
    );

    // Sort by timestamp (newest first)
    return enrichedItems.sort((a, b) => b.timestamp - a.timestamp);
  },
});