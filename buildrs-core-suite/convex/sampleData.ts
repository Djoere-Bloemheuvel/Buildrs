import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Create sample data for testing deals functionality
export const createSampleDealsData = mutation({
  args: { 
    clientId: v.id("clients"),
    propositionId: v.optional(v.id("propositions"))
  },
  returns: v.object({
    pipelineId: v.id("pipelines"),
    stages: v.array(v.id("stages")),
    companies: v.array(v.id("companies")),
    contacts: v.array(v.id("contacts"))
  }),
  handler: async (ctx, args) => {
    console.log("Creating sample deals data for client:", args.clientId);
    
    // Create a default proposition if none provided
    let propositionId = args.propositionId;
    if (!propositionId) {
      propositionId = await ctx.db.insert("propositions", {
        clientId: args.clientId,
        name: "Website Development Service",
        description: "Complete website development with modern design and functionality",
        offerType: "service"
      });
    }
    
    // Create sample pipeline
    const pipelineId = await ctx.db.insert("pipelines", {
      clientId: args.clientId,
      propositionId: propositionId,
      name: "Sales Pipeline NL",
      description: "Main sales pipeline for Dutch market",
      isActive: true,
      isDefault: true,
      color: "#3B82F6",
      archived: false,
      sortOrder: 1
    });
    
    // Create sample stages
    const stages = [];
    const stageData = [
      { name: "Prospect", position: 1, defaultProbability: 10 },
      { name: "Qualified", position: 2, defaultProbability: 30 },
      { name: "Proposal", position: 3, defaultProbability: 60 },
      { name: "Negotiation", position: 4, defaultProbability: 80 },
      { name: "Won", position: 5, defaultProbability: 95, isWon: true }
    ];
    
    for (const stage of stageData) {
      const stageId = await ctx.db.insert("stages", {
        pipelineId: pipelineId,
        name: stage.name,
        position: stage.position,
        defaultProbability: stage.defaultProbability,
        isWon: stage.isWon,
        isLost: false
      });
      stages.push(stageId);
    }
    
    // Create sample companies
    const companies = [];
    const companyData = [
      { 
        name: "Acme Corporation", 
        domain: "acme.com",
        website: "https://acme.com",
        industryLabel: "Technology",
        companySize: 250,
        city: "Amsterdam",
        country: "Netherlands"
      },
      { 
        name: "Tech Solutions BV", 
        domain: "techsolutions.nl",
        website: "https://techsolutions.nl",
        industryLabel: "Software",
        companySize: 150,
        city: "Rotterdam",
        country: "Netherlands"
      },
      { 
        name: "Digital Commerce Ltd", 
        domain: "digitalcommerce.com",
        website: "https://digitalcommerce.com",
        industryLabel: "E-commerce",
        companySize: 75,
        city: "Utrecht",
        country: "Netherlands"
      }
    ];
    
    for (const company of companyData) {
      const companyId = await ctx.db.insert("companies", company);
      companies.push(companyId);
    }
    
    // Create sample leads first
    const leads = [];
    const leadData = [
      {
        companyId: companies[0],
        firstName: "John",
        lastName: "Doe", 
        email: "john.doe@acme.com",
        jobTitle: "CEO",
        functionGroup: "Executive"
      },
      {
        companyId: companies[1],
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@techsolutions.nl", 
        jobTitle: "CTO",
        functionGroup: "Technology Decision Makers"
      },
      {
        companyId: companies[2],
        firstName: "Bob",
        lastName: "Johnson",
        email: "bob.johnson@digitalcommerce.com",
        jobTitle: "Head of Marketing", 
        functionGroup: "Marketing Decision Makers"
      }
    ];
    
    for (const lead of leadData) {
      const leadId = await ctx.db.insert("leads", {
        ...lead,
        isActive: true,
        addedAt: Date.now(),
        sourceType: "sample"
      });
      leads.push(leadId);
    }
    
    // Create sample contacts from leads
    const contacts = [];
    for (let i = 0; i < leads.length; i++) {
      const lead = leadData[i];
      const contactId = await ctx.db.insert("contacts", {
        leadId: leads[i],
        clientId: args.clientId,
        companyId: companies[i],
        purchasedAt: Date.now(),
        status: "cold",
        fullEnrichment: true,
        // Denormalized data for performance
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        jobTitle: lead.jobTitle,
        functionGroup: lead.functionGroup,
        name: companyData[i].name,
        website: companyData[i].website,
        industryLabel: companyData[i].industryLabel
      });
      contacts.push(contactId);
    }
    
    // Create sample deals
    const dealData = [
      {
        contactId: contacts[0],
        companyId: companies[0],
        title: "Website redesign voor Acme Corp",
        description: "Complete website overhaul with modern design",
        value: 25000,
        currency: "EUR",
        confidence: 25,
        stageId: stages[0] // Prospect
      },
      {
        contactId: contacts[1],
        companyId: companies[1],
        title: "CRM implementatie Tech Solutions", 
        description: "Custom CRM system development and integration",
        value: 50000,
        currency: "EUR",
        confidence: 40,
        stageId: stages[1] // Qualified
      },
      {
        contactId: contacts[2],
        companyId: companies[2],
        title: "E-commerce platform upgrade",
        description: "Modernize existing e-commerce platform",
        value: 75000,
        currency: "EUR", 
        confidence: 65,
        stageId: stages[2] // Proposal
      }
    ];
    
    for (const deal of dealData) {
      await ctx.db.insert("deals", {
        ...deal,
        clientId: args.clientId,
        pipelineId: pipelineId,
        propositionId: propositionId,
        status: "open",
        priority: 3,
        isAutoCreated: false,
        isActive: true
      });
    }
    
    console.log("Sample deals data created successfully");
    
    return {
      pipelineId,
      stages,
      companies,
      contacts
    };
  },
});