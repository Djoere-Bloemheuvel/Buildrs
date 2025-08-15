import { query } from "./_generated/server";
import { v } from "convex/values";

// ===============================
// ANALYTICS AND REPORTING VIEWS
// Complex analytical views for dashboards and reports
// ===============================

// Client performance overview
export const clientPerformanceOverview = query({
  args: {
    clientId: v.id("clients"),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
  },
  returns: v.object({
    // Core metrics
    totalContacts: v.number(),
    totalCompanies: v.number(),
    totalDeals: v.number(),
    totalCampaigns: v.number(),
    
    // Performance metrics
    responseRate: v.number(),
    meetingBookingRate: v.number(),
    dealConversionRate: v.number(),
    averageDealValue: v.number(),
    totalRevenue: v.number(),
    
    // Activity metrics
    totalCommunications: v.number(),
    outboundCommunications: v.number(),
    inboundCommunications: v.number(),
    activeCampaigns: v.number(),
    
    // Growth metrics
    newContactsThisPeriod: v.number(),
    newCompaniesThisPeriod: v.number(),
    newDealsThisPeriod: v.number(),
    
    // Pipeline health
    openDeals: v.number(),
    closedWonDeals: v.number(),
    closedLostDeals: v.number(),
    pipelineValue: v.number(),
    weightedPipelineValue: v.number(),
    
    // Top performers
    topCampaigns: v.array(v.object({
      _id: v.id("campaigns"),
      name: v.string(),
      type: v.string(),
      responseRate: v.number(),
      contactCount: v.number(),
    })),
    
    topCompanies: v.array(v.object({
      _id: v.id("companies"),
      name: v.string(),
      contactCount: v.number(),
      dealCount: v.number(),
      totalValue: v.number(),
    })),
    
    // Time series data (last 12 months)
    monthlyMetrics: v.array(v.object({
      month: v.string(),
      newContacts: v.number(),
      newDeals: v.number(),
      revenue: v.number(),
      communications: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const dateFrom = args.dateFrom || (now - 365 * 24 * 60 * 60 * 1000); // 1 year ago
    const dateTo = args.dateTo || now;

    // Get all client data
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const companies = await ctx.db
      .query("companies")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const deals = await ctx.db
      .query("deals")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    // Get all communications for client contacts
    const allCommunications = [];
    for (const contact of contacts.slice(0, 100)) { // Limit for performance
      const comms = await ctx.db
        .query("communications")
        .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
        .collect();
      allCommunications.push(...comms);
    }

    // Filter communications by date range
    const filteredCommunications = allCommunications.filter(c => 
      c.timestamp >= dateFrom && c.timestamp <= dateTo
    );

    // Calculate core metrics
    const totalContacts = contacts.length;
    const totalCompanies = companies.length;
    const totalDeals = deals.length;
    const totalCampaigns = campaigns.length;

    // Performance metrics
    const outboundComms = filteredCommunications.filter(c => c.direction === "outbound");
    const inboundComms = filteredCommunications.filter(c => c.direction === "inbound");
    const responseRate = outboundComms.length > 0 ? 
      (inboundComms.length / outboundComms.length) * 100 : 0;

    // Deal metrics
    const openDeals = deals.filter(d => d.status === "open");
    const closedWonDeals = deals.filter(d => d.status === "won");
    const closedLostDeals = deals.filter(d => d.status === "lost");
    
    const totalRevenue = closedWonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const averageDealValue = closedWonDeals.length > 0 ? 
      totalRevenue / closedWonDeals.length : 0;
    
    const pipelineValue = openDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const weightedPipelineValue = openDeals.reduce((sum, deal) => 
      sum + ((deal.value || 0) * ((deal.confidence || 50) / 100)), 0);

    const dealConversionRate = totalContacts > 0 ? 
      (closedWonDeals.length / totalContacts) * 100 : 0;

    // Growth metrics (new items in period)
    const newContactsThisPeriod = contacts.filter(c => 
      c._creationTime >= dateFrom && c._creationTime <= dateTo
    ).length;

    const newCompaniesThisPeriod = companies.filter(c => 
      c._creationTime >= dateFrom && c._creationTime <= dateTo
    ).length;

    const newDealsThisPeriod = deals.filter(d => 
      d._creationTime >= dateFrom && d._creationTime <= dateTo
    ).length;

    // Active campaigns
    const activeCampaigns = campaigns.filter(c => 
      c.status === "active" || c.status === "planned"
    ).length;

    // Top performing campaigns
    const campaignPerformance = await Promise.all(
      campaigns.map(async (campaign) => {
        const campaignContacts = await ctx.db
          .query("campaignContacts")
          .withIndex("by_campaign", (q) => q.eq("campaignId", campaign._id))
          .collect();

        const campaignComms = allCommunications.filter(c => c.campaignId === campaign._id);
        const campaignOutbound = campaignComms.filter(c => c.direction === "outbound");
        const campaignInbound = campaignComms.filter(c => c.direction === "inbound");
        
        const campaignResponseRate = campaignOutbound.length > 0 ? 
          (campaignInbound.length / campaignOutbound.length) * 100 : 0;

        return {
          _id: campaign._id,
          name: campaign.name,
          type: campaign.type,
          responseRate: campaignResponseRate,
          contactCount: campaignContacts.length,
        };
      })
    );

    const topCampaigns = campaignPerformance
      .sort((a, b) => b.responseRate - a.responseRate)
      .slice(0, 5);

    // Top performing companies
    const companyPerformance = await Promise.all(
      companies.map(async (company) => {
        const companyContacts = contacts.filter(c => c.companyId === company._id);
        const companyDeals = deals.filter(d => d.companyId === company._id);
        const totalValue = companyDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);

        return {
          _id: company._id,
          name: company.name,
          contactCount: companyContacts.length,
          dealCount: companyDeals.length,
          totalValue,
        };
      })
    );

    const topCompanies = companyPerformance
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);

    // Monthly metrics (last 12 months)
    const monthlyMetrics = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      const monthStartMs = monthStart.getTime();
      const monthEndMs = monthEnd.getTime();

      const monthContacts = contacts.filter(c => 
        c._creationTime >= monthStartMs && c._creationTime < monthEndMs
      ).length;

      const monthDeals = deals.filter(d => 
        d._creationTime >= monthStartMs && d._creationTime < monthEndMs
      ).length;

      const monthRevenue = deals
        .filter(d => d.status === "won" && d._creationTime >= monthStartMs && d._creationTime < monthEndMs)
        .reduce((sum, deal) => sum + (deal.value || 0), 0);

      const monthCommunications = filteredCommunications.filter(c => 
        c.timestamp >= monthStartMs && c.timestamp < monthEndMs
      ).length;

      monthlyMetrics.push({
        month: monthStart.toISOString().substring(0, 7), // YYYY-MM format
        newContacts: monthContacts,
        newDeals: monthDeals,
        revenue: monthRevenue,
        communications: monthCommunications,
      });
    }

    return {
      totalContacts,
      totalCompanies,
      totalDeals,
      totalCampaigns,
      responseRate,
      meetingBookingRate: 0, // Would need meeting data
      dealConversionRate,
      averageDealValue,
      totalRevenue,
      totalCommunications: filteredCommunications.length,
      outboundCommunications: outboundComms.length,
      inboundCommunications: inboundComms.length,
      activeCampaigns,
      newContactsThisPeriod,
      newCompaniesThisPeriod,
      newDealsThisPeriod,
      openDeals: openDeals.length,
      closedWonDeals: closedWonDeals.length,
      closedLostDeals: closedLostDeals.length,
      pipelineValue,
      weightedPipelineValue,
      topCampaigns,
      topCompanies,
      monthlyMetrics,
    };
  },
});

// Campaign effectiveness analysis
export const campaignEffectivenessAnalysis = query({
  args: {
    campaignId: v.optional(v.id("campaigns")),
    clientId: v.optional(v.id("clients")),
    campaignType: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
  },
  returns: v.array(v.object({
    campaignId: v.id("campaigns"),
    campaignName: v.string(),
    campaignType: v.string(),
    status: v.optional(v.string()),
    
    // Core metrics
    totalContacts: v.number(),
    contacted: v.number(),
    responded: v.number(),
    meetings: v.number(),
    opportunities: v.number(),
    
    // Rates
    contactRate: v.number(),
    responseRate: v.number(),
    meetingRate: v.number(),
    opportunityRate: v.number(),
    
    // Engagement metrics
    opens: v.number(),
    clicks: v.number(),
    openRate: v.number(),
    clickRate: v.number(),
    
    // Performance by channel
    channelBreakdown: v.array(v.object({
      channel: v.string(),
      sent: v.number(),
      delivered: v.number(),
      opened: v.number(),
      clicked: v.number(),
      replied: v.number(),
    })),
    
    // Time-based analysis
    dailyMetrics: v.array(v.object({
      date: v.string(),
      sent: v.number(),
      opened: v.number(),
      clicked: v.number(),
      replied: v.number(),
    })),
    
    // Cohort analysis
    cohortMetrics: v.object({
      week1Response: v.number(),
      week2Response: v.number(),
      week3Response: v.number(),
      week4Response: v.number(),
    }),
  })),
  handler: async (ctx, args) => {
    let campaigns = [];
    
    if (args.campaignId) {
      const campaign = await ctx.db.get(args.campaignId);
      if (campaign) campaigns = [campaign];
    } else {
      let query = ctx.db.query("campaigns");
      
      if (args.clientId) {
        query = query.withIndex("by_client", (q) => q.eq("clientId", args.clientId));
      }
      
      campaigns = await query.collect();
      
      if (args.campaignType) {
        campaigns = campaigns.filter(c => c.type === args.campaignType);
      }
    }

    const results = await Promise.all(
      campaigns.map(async (campaign) => {
        // Get campaign contacts
        const campaignContacts = await ctx.db
          .query("campaignContacts")
          .withIndex("by_campaign", (q) => q.eq("campaignId", campaign._id))
          .collect();

        // Get campaign communications
        const campaignComms = await ctx.db
          .query("communications")
          .withIndex("by_campaign", (q) => q.eq("campaignId", campaign._id))
          .collect();

        // Filter by date if specified
        let filteredComms = campaignComms;
        if (args.dateFrom || args.dateTo) {
          filteredComms = campaignComms.filter(c => {
            if (args.dateFrom && c.timestamp < args.dateFrom) return false;
            if (args.dateTo && c.timestamp > args.dateTo) return false;
            return true;
          });
        }

        // Calculate basic metrics
        const totalContacts = campaignContacts.length;
        const contacted = filteredComms.filter(c => c.direction === "outbound").length;
        const responded = filteredComms.filter(c => c.direction === "inbound").length;
        
        // Get opportunities created from this campaign
        const opportunities = await ctx.db
          .query("deals")
          .withIndex("by_client", (q) => q.eq("clientId", campaign.clientId!))
          .filter((q) => q.eq(q.field("campaignId"), campaign._id))
          .collect();

        // Calculate rates
        const contactRate = totalContacts > 0 ? (contacted / totalContacts) * 100 : 0;
        const responseRate = contacted > 0 ? (responded / contacted) * 100 : 0;
        const meetingRate = 0; // Would need meeting data
        const opportunityRate = totalContacts > 0 ? (opportunities.length / totalContacts) * 100 : 0;

        // Engagement metrics
        const opens = filteredComms.reduce((sum, c) => sum + (c.opens || 0), 0);
        const clicks = filteredComms.reduce((sum, c) => sum + (c.clicks || 0), 0);
        const openRate = contacted > 0 ? (opens / contacted) * 100 : 0;
        const clickRate = opens > 0 ? (clicks / opens) * 100 : 0;

        // Channel breakdown
        const channelMap = new Map();
        for (const comm of filteredComms) {
          const channel = comm.channel;
          if (!channelMap.has(channel)) {
            channelMap.set(channel, {
              channel,
              sent: 0,
              delivered: 0,
              opened: 0,
              clicked: 0,
              replied: 0,
            });
          }
          
          const channelData = channelMap.get(channel);
          if (comm.direction === "outbound") {
            channelData.sent++;
            if (comm.status === "delivered") channelData.delivered++;
            if (comm.opens && comm.opens > 0) channelData.opened++;
            if (comm.clicks && comm.clicks > 0) channelData.clicked++;
          } else {
            channelData.replied++;
          }
        }

        const channelBreakdown = Array.from(channelMap.values());

        // Daily metrics (last 30 days)
        const dailyMetrics = [];
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        for (let i = 29; i >= 0; i--) {
          const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
          const dateStr = date.toISOString().split('T')[0];
          const dayStart = new Date(date.toDateString()).getTime();
          const dayEnd = dayStart + (24 * 60 * 60 * 1000);

          const dayComms = filteredComms.filter(c => 
            c.timestamp >= dayStart && c.timestamp < dayEnd
          );

          dailyMetrics.push({
            date: dateStr,
            sent: dayComms.filter(c => c.direction === "outbound").length,
            opened: dayComms.reduce((sum, c) => sum + (c.opens || 0), 0),
            clicked: dayComms.reduce((sum, c) => sum + (c.clicks || 0), 0),
            replied: dayComms.filter(c => c.direction === "inbound").length,
          });
        }

        // Cohort analysis (response rates by week)
        const campaignStart = campaign._creationTime;
        const week1End = campaignStart + (7 * 24 * 60 * 60 * 1000);
        const week2End = campaignStart + (14 * 24 * 60 * 60 * 1000);
        const week3End = campaignStart + (21 * 24 * 60 * 60 * 1000);
        const week4End = campaignStart + (28 * 24 * 60 * 60 * 1000);

        const week1Responses = filteredComms.filter(c => 
          c.direction === "inbound" && c.timestamp >= campaignStart && c.timestamp < week1End
        ).length;

        const week2Responses = filteredComms.filter(c => 
          c.direction === "inbound" && c.timestamp >= week1End && c.timestamp < week2End
        ).length;

        const week3Responses = filteredComms.filter(c => 
          c.direction === "inbound" && c.timestamp >= week2End && c.timestamp < week3End
        ).length;

        const week4Responses = filteredComms.filter(c => 
          c.direction === "inbound" && c.timestamp >= week3End && c.timestamp < week4End
        ).length;

        const cohortMetrics = {
          week1Response: contacted > 0 ? (week1Responses / contacted) * 100 : 0,
          week2Response: contacted > 0 ? (week2Responses / contacted) * 100 : 0,
          week3Response: contacted > 0 ? (week3Responses / contacted) * 100 : 0,
          week4Response: contacted > 0 ? (week4Responses / contacted) * 100 : 0,
        };

        return {
          campaignId: campaign._id,
          campaignName: campaign.name,
          campaignType: campaign.type,
          status: campaign.status,
          totalContacts,
          contacted,
          responded,
          meetings: 0, // Would need meeting data
          opportunities: opportunities.length,
          contactRate,
          responseRate,
          meetingRate,
          opportunityRate,
          opens,
          clicks,
          openRate,
          clickRate,
          channelBreakdown,
          dailyMetrics,
          cohortMetrics,
        };
      })
    );

    return results;
  },
});