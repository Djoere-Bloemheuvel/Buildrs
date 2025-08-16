import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ===============================
  // CORE ENTITIES
  // ===============================
  
  clients: defineTable({
    // Legacy fields (keeping for backward compatibility)
    company: v.optional(v.string()), // Will be migrated to name
    contact: v.optional(v.string()),
    phone: v.optional(v.string()),
    clientSummary: v.optional(v.string()),
    instantlyEmailListId: v.optional(v.string()),
    
    // New required fields for credit system
    name: v.optional(v.string()), // Will be required after migration
    domain: v.string(), // Required for domain-based duplicate checking
    email: v.string(), // Required for billing
    
    // Real-time computed credit balances (NEVER directly modified)
    currentLeadCredits: v.optional(v.number()),
    currentEmailCredits: v.optional(v.number()),
    currentLinkedinCredits: v.optional(v.number()),
    currentAbmCredits: v.optional(v.number()),
    
    // Credit limits & settings
    creditLimits: v.optional(v.object({
      maxLeadCredits: v.number(),
      maxEmailCredits: v.number(),
      maxLinkedinCredits: v.number(),
      maxAbmCredits: v.number(),
      allowOverdraft: v.boolean(),
      overdraftLimit: v.number(),
    })),
    
    // Auto-topup settings
    autoTopup: v.optional(v.object({
      enabled: v.boolean(),
      triggerThreshold: v.number(),
      packageId: v.optional(v.id("creditPackages")),
    })),

    // Business rules tracking
    hasUsedStartPackage: v.optional(v.boolean()), // Track if domain used Start package
    hasReceivedFirstMonthBonus: v.optional(v.boolean()), // Track if got double credits
    subscriptionStatus: v.optional(v.string()), // "active", "cancelled", "past_due"
    currentPackage: v.optional(v.id("creditPackages")), // Current active package
    
    // Stripe integration
    stripeCustomerId: v.optional(v.string()), // Stripe customer ID
    stripeSubscriptionId: v.optional(v.string()), // Current Stripe subscription ID
    
    // Security tracking
    registrationIp: v.optional(v.string()),
    registrationUserAgent: v.optional(v.string()),
    lastLoginIp: v.optional(v.string()),
    lastLoginUserAgent: v.optional(v.string()),
    securityFlags: v.optional(v.array(v.string())), // ["high_risk", "verified", "fraud_alert"]
    
    // Timestamps
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_domain", ["domain"])
    .index("by_email", ["email"])
    .index("by_subscription_status", ["subscriptionStatus"])
    .index("by_stripe_customer", ["stripeCustomerId"]),

  profiles: defineTable({
    fullName: v.optional(v.string()),
    email: v.string(),
    role: v.optional(v.string()),
    clientId: v.optional(v.id("clients")),
  }).index("by_client", ["clientId"])
    .index("by_email", ["email"]),

  // ===============================
  // CRM ENTITIES
  // ===============================

  companies: defineTable({
    name: v.string(),
    domain: v.optional(v.string()),
    website: v.optional(v.string()),
    industrySlug: v.optional(v.string()),
    industryLabel: v.optional(v.string()),
    subindustryLabel: v.optional(v.string()),
    companySize: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    companySummary: v.optional(v.string()),
    shortCompanySummary: v.optional(v.string()),
    companyKeywords: v.optional(v.array(v.string())),
    companyCommonProblems: v.optional(v.string()),
    companyTargetCustomers: v.optional(v.string()),
    companyUniqueCharacteristics: v.optional(v.array(v.string())),
    companyUniqueQualities: v.optional(v.string()),
    companyLinkedinUrl: v.optional(v.string()),
    companyPhone: v.optional(v.string()),
    scrapedIndustry: v.optional(v.string()), // Raw scraped industry data (will be processed by AI later)
    companyTechnologies: v.optional(v.union(v.array(v.string()), v.object({}))), // Support both array and object
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    fullEnrichment: v.optional(v.boolean()),
    lastUpdatedAt: v.optional(v.number()),
  }).index("by_domain", ["domain"])
    .index("by_industry", ["industrySlug"])
    .index("by_name", ["name"]),

  // OLD CONTACTS TABLE (TO BE MIGRATED)
  contacts_old: defineTable({
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
  }).index("by_company", ["companyId"])
    .index("by_client", ["clientId"])
    .index("by_email", ["email"])
    .index("by_status", ["status"]),

  // NEW CONTACTS TABLE (CLIENT-SPECIFIC LEAD RELATIONSHIPS) - PERFORMANCE OPTIMIZED
  contacts: defineTable({
    // Core relationship (unique combination)
    leadId: v.id("leads"),        // Reference to global lead
    clientId: v.id("clients"),    // Which client owns this contact relationship
    companyId: v.id("companies"), // Reference to company
    purchasedAt: v.number(),      // When this lead became a contact for this client
    
    // Essential client-specific data
    status: v.optional(v.string()),              // 'cold', 'warm', 'hot', 'contacted', 'responded', etc.
    lastCommunicationAt: v.optional(v.number()), // Last communication (email, LinkedIn, call, meeting)
    optedIn: v.optional(v.boolean()),            // Email opt-in status (default false)
    fullEnrichment: v.optional(v.boolean()),     // Whether this contact has been fully enriched
    
    // DENORMALIZED LEAD DATA (for performance)
    firstName: v.optional(v.string()),           // From leads.firstName
    lastName: v.optional(v.string()),            // From leads.lastName
    linkedinUrl: v.optional(v.string()),         // From leads.linkedinUrl
    jobTitle: v.optional(v.string()),            // From leads.jobTitle
    functionGroup: v.optional(v.string()),       // From leads.functionGroup
    
    // DENORMALIZED COMPANY DATA (for performance)
    name: v.optional(v.string()),                // From companies.name (company name)
    website: v.optional(v.string()),             // From companies.website
    companyLinkedinUrl: v.optional(v.string()),  // From companies.companyLinkedinUrl
    industryLabel: v.optional(v.string()),       // From companies.industryLabel (industry)
    subindustryLabel: v.optional(v.string()),    // From companies.subindustryLabel (subindustry)
    companySummary: v.optional(v.string()),      // From companies.companySummary
    shortCompanySummary: v.optional(v.string()), // From companies.shortCompanySummary
  }).index("by_lead_client", ["leadId", "clientId"], { unique: true })  // UNIQUE constraint
    .index("by_client", ["clientId"])
    .index("by_lead", ["leadId"])
    .index("by_company", ["companyId"])
    .index("by_status", ["clientId", "status"])
    .index("by_purchased_date", ["clientId", "purchasedAt"])
    .index("by_last_communication", ["clientId", "lastCommunicationAt"])
    .index("by_function_group", ["clientId", "functionGroup"])
    .index("by_industry", ["clientId", "industryLabel"])
    .index("by_company_name", ["name"]),

  // ===============================
  // PUBLIC LEADS DATABASE
  // ===============================
  
  leads: defineTable({
    // Company relationship
    companyId: v.optional(v.id("companies")),
    
    // Personal information (expanded from old contacts)
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.string(), // Required field for unique constraint
    mobilePhone: v.optional(v.string()),
    companyPhone: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    
    // Professional information
    jobTitle: v.optional(v.string()),
    seniority: v.optional(v.string()),
    functionGroup: v.optional(v.string()),
    functionGroupUpdatedAt: v.optional(v.number()),
    
    // Geographic information
    country: v.optional(v.string()),
    state: v.optional(v.string()),
    city: v.optional(v.string()),
    
    // Global lead metadata
    addedAt: v.optional(v.number()),
    lastUpdatedAt: v.optional(v.number()),
    sourceType: v.optional(v.string()), // 'apollo', 'manual', 'import', etc.
    isActive: v.optional(v.boolean()), // Voor soft deletes
    
    // Global engagement metrics (aggregated across all clients)
    totalTimesContacted: v.optional(v.number()),
    totalResponsesReceived: v.optional(v.number()),
    lastGlobalContactAt: v.optional(v.number()),
    globalResponseRate: v.optional(v.number()),
    
    // Lead quality scoring
    leadScore: v.optional(v.number()),
    leadQuality: v.optional(v.string()), // 'high', 'medium', 'low'
    
    // Migration support
    originalContactId: v.optional(v.string()), // Reference to old contact for migration
    
    // Fallback enrichment tracking
    lastFallbackProcessedAt: v.optional(v.number()), // When was this lead last processed by fallback cronjob
  }).index("by_company", ["companyId"])
    .index("by_email_unique", ["email"], { unique: true }) // UNIQUE constraint on email
    .index("by_function_group", ["functionGroup"])
    .index("by_country", ["country"])
    .index("by_source", ["sourceType"])
    .index("by_active", ["isActive"])
    .index("by_lead_score", ["leadScore"]),

  // ===============================
  // PROPOSITIONS & CAMPAIGNS
  // ===============================

  propositions: defineTable({
    clientId: v.optional(v.id("clients")),
    name: v.string(),
    description: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    uniqueValue: v.optional(v.string()),
    problemsSolved: v.optional(v.string()),
    painTriggers: v.optional(v.string()),
    offerType: v.optional(v.string()),
    aiSummary: v.optional(v.string()),
    aiPersonalizationPrompt: v.optional(v.string()),
  }).index("by_client", ["clientId"]),

  campaigns: defineTable({
    clientId: v.optional(v.id("clients")),
    propositionId: v.optional(v.id("propositions")),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(),
    status: v.optional(v.string()),
    startDate: v.optional(v.string()), // ISO date string
    endDate: v.optional(v.string()),
    autoAssignEnabled: v.optional(v.boolean()),
    audienceFilter: v.optional(v.object({})), // jsonb equivalent
    priority: v.optional(v.number()),
    sendingWindow: v.optional(v.object({})),
    stats: v.optional(v.object({})),
    campaignPurpose: v.optional(v.string()),
    channel: v.optional(v.string()),
    emailA: v.optional(v.string()),
    emailB: v.optional(v.string()),
    followupA: v.optional(v.string()),
    followupB: v.optional(v.string()),
    subjectA: v.optional(v.string()),
    subjectB: v.optional(v.string()),
    dailyLimit: v.optional(v.number()),
    instantlyId: v.optional(v.string()),
  }).index("by_client", ["clientId"])
    .index("by_proposition", ["propositionId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"]),

  campaignContacts: defineTable({
    campaignId: v.id("campaigns"),
    contactId: v.id("contacts"),
    clientId: v.optional(v.id("clients")),
    status: v.optional(v.string()),
    addedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    nextEligibleAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  }).index("by_campaign", ["campaignId"])
    .index("by_contact", ["contactId"])
    .index("by_status", ["status"]),

  // ===============================
  // LINKEDIN CAMPAIGNS
  // ===============================

  liCampaigns: defineTable({
    clientId: v.id("clients"),
    propositionId: v.id("propositions"),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    functionGroups: v.array(v.string()),
    industries: v.array(v.string()),
    subindustries: v.array(v.string()),
    countries: v.array(v.string()),
    states: v.array(v.string()),
    companySizeMin: v.optional(v.number()),
    companySizeMax: v.optional(v.number()),
    connectionNoteA: v.optional(v.string()),
    connectionNoteB: v.optional(v.string()),
    messageA: v.optional(v.string()),
    messageB: v.optional(v.string()),
    followupA: v.optional(v.string()),
    followupB: v.optional(v.string()),
    dailyConnectLimit: v.number(),
    dailyMessageLimit: v.number(),
    windowStart: v.optional(v.string()), // time string
    windowEnd: v.optional(v.string()),
    timezone: v.optional(v.string()),
    sentCount: v.number(),
    acceptedCount: v.number(),
    repliedCount: v.number(),
    bookedCount: v.number(),
    lastRunAt: v.optional(v.number()),
    phantombusterAgentId: v.optional(v.string()),
    phantombusterEnabled: v.boolean(),
  }).index("by_client", ["clientId"])
    .index("by_proposition", ["propositionId"])
    .index("by_status", ["status"]),

  // ===============================
  // DEALS & SALES PIPELINE
  // ===============================

  pipelines: defineTable({
    clientId: v.id("clients"),
    propositionId: v.id("propositions"),
    createdBy: v.optional(v.id("profiles")),
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    isDefault: v.optional(v.boolean()),
    color: v.optional(v.string()),
    archived: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  }).index("by_client", ["clientId"])
    .index("by_proposition", ["propositionId"])
    .index("by_active", ["isActive"]),

  stages: defineTable({
    pipelineId: v.id("pipelines"),
    name: v.string(),
    description: v.optional(v.string()),
    position: v.number(),
    isWon: v.optional(v.boolean()),
    isLost: v.optional(v.boolean()),
    defaultProbability: v.optional(v.number()),
  }).index("by_pipeline", ["pipelineId"])
    .index("by_position", ["pipelineId", "position"]),

  deals: defineTable({
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    campaignId: v.optional(v.id("campaigns")),
    clientId: v.id("clients"),
    pipelineId: v.id("pipelines"),
    stageId: v.id("stages"),
    propositionId: v.optional(v.id("propositions")),
    ownerId: v.optional(v.id("profiles")),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    value: v.optional(v.number()),
    currency: v.optional(v.string()),
    confidence: v.optional(v.number()),
    priority: v.optional(v.number()),
    source: v.optional(v.string()),
    closedAt: v.optional(v.number()),
    isAutoCreated: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    meetingPrepSummary: v.optional(v.string()),
    extra: v.optional(v.object({})), // jsonb equivalent
  }).index("by_client", ["clientId"])
    .index("by_contact", ["contactId"])
    .index("by_company", ["companyId"])
    .index("by_pipeline", ["pipelineId"])
    .index("by_stage", ["stageId"])
    .index("by_status", ["status"])
    .index("by_owner", ["ownerId"]),

  dealLineItems: defineTable({
    dealId: v.id("deals"),
    clientId: v.id("clients"),
    propositionId: v.optional(v.id("propositions")),
    name: v.string(),
    quantity: v.number(),
    unitPrice: v.number(),
    discountPct: v.number(),
    currency: v.string(),
    amount: v.optional(v.number()),
  }).index("by_deal", ["dealId"]),

  dealCustomFields: defineTable({
    dealId: v.id("deals"),
    clientId: v.id("clients"),
    key: v.string(),
    value: v.optional(v.string()),
  }).index("by_deal", ["dealId"])
    .index("by_key", ["key"]),

  dealAttachments: defineTable({
    dealId: v.id("deals"),
    clientId: v.id("clients"),
    fileUrl: v.string(),
    fileName: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    sizeBytes: v.optional(v.number()),
  }).index("by_deal", ["dealId"]),

  // ===============================
  // PROJECT MANAGEMENT
  // ===============================

  projects: defineTable({
    clientId: v.id("clients"),
    companyId: v.optional(v.id("companies")),
    createdBy: v.optional(v.id("profiles")),
    ownerId: v.optional(v.id("profiles")),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    type: v.optional(v.string()),
    startDate: v.optional(v.string()), // ISO date string
    dueDate: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    key: v.optional(v.string()),
    priority: v.optional(v.string()),
    pinned: v.boolean(),
    labels: v.array(v.string()),
    viewConfig: v.optional(v.object({})),
  }).index("by_client", ["clientId"])
    .index("by_company", ["companyId"])
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"]),

  projectMembers: defineTable({
    projectId: v.id("projects"),
    userId: v.id("profiles"),
    role: v.string(),
  }).index("by_project", ["projectId"])
    .index("by_user", ["userId"]),

  projectGroups: defineTable({
    clientId: v.id("clients"),
    projectId: v.id("projects"),
    key: v.string(),
    label: v.string(),
    color: v.string(),
    orderIndex: v.number(),
  }).index("by_project", ["projectId"]),

  projectFields: defineTable({
    clientId: v.id("clients"),
    projectId: v.id("projects"),
    createdBy: v.optional(v.id("profiles")),
    key: v.string(),
    label: v.string(),
    type: v.string(),
    options: v.optional(v.object({})),
    isRequired: v.boolean(),
    archived: v.boolean(),
    orderIndex: v.number(),
  }).index("by_project", ["projectId"]),

  projectFieldValues: defineTable({
    clientId: v.id("clients"),
    projectId: v.id("projects"),
    taskId: v.id("tasks"),
    fieldId: v.id("projectFields"),
    value: v.optional(v.object({})),
  }).index("by_project", ["projectId"])
    .index("by_task", ["taskId"])
    .index("by_field", ["fieldId"]),

  projectViews: defineTable({
    clientId: v.id("clients"),
    projectId: v.id("projects"),
    createdBy: v.optional(v.id("profiles")),
    name: v.string(),
    type: v.string(),
    config: v.object({}),
    isDefault: v.boolean(),
  }).index("by_project", ["projectId"]),

  tasks: defineTable({
    dealId: v.optional(v.id("deals")),
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    clientId: v.id("clients"),
    projectId: v.optional(v.id("projects")),
    groupId: v.optional(v.id("projectGroups")),
    assignedTo: v.optional(v.id("profiles")),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    priority: v.optional(v.number()),
    type: v.optional(v.string()),
    dueAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    position: v.number(),
  }).index("by_client", ["clientId"])
    .index("by_project", ["projectId"])
    .index("by_assignee", ["assignedTo"])
    .index("by_status", ["status"])
    .index("by_due_date", ["dueAt"]),

  projectTaskAssignees: defineTable({
    taskId: v.id("tasks"),
    projectId: v.id("projects"),
    clientId: v.id("clients"),
    userId: v.id("profiles"),
    addedAt: v.number(),
  }).index("by_task", ["taskId"])
    .index("by_user", ["userId"]),

  taskChecklistItems: defineTable({
    taskId: v.id("tasks"),
    projectId: v.id("projects"),
    clientId: v.id("clients"),
    title: v.string(),
    done: v.boolean(),
    position: v.number(),
  }).index("by_task", ["taskId"]),

  taskComments: defineTable({
    taskId: v.id("tasks"),
    projectId: v.id("projects"),
    clientId: v.id("clients"),
    userId: v.id("profiles"),
    body: v.string(),
  }).index("by_task", ["taskId"])
    .index("by_user", ["userId"]),

  taskAttachments: defineTable({
    taskId: v.id("tasks"),
    projectId: v.id("projects"),
    clientId: v.id("clients"),
    createdBy: v.optional(v.id("profiles")),
    fileName: v.string(),
    filePath: v.string(),
    sizeBytes: v.optional(v.number()),
  }).index("by_task", ["taskId"]),

  // ===============================
  // COMMUNICATIONS & NOTES
  // ===============================

  communications: defineTable({
    contactId: v.id("contacts"),
    campaignId: v.optional(v.id("campaigns")),
    clientId: v.id("clients"),
    direction: v.string(),
    channel: v.string(),
    type: v.optional(v.string()),
    timestamp: v.number(),
    content: v.optional(v.string()),
    metadata: v.optional(v.object({})),
    sentiment: v.optional(v.string()),
    isFirstMessage: v.optional(v.boolean()),
    isLastMessage: v.optional(v.boolean()),
    isAutomated: v.optional(v.boolean()),
    isRead: v.optional(v.boolean()),
  }).index("by_contact", ["contactId"])
    .index("by_campaign", ["campaignId"])
    .index("by_client", ["clientId"])
    .index("by_timestamp", ["timestamp"]),

  notes: defineTable({
    dealId: v.optional(v.id("deals")),
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    clientId: v.id("clients"),
    authorId: v.optional(v.id("profiles")),
    content: v.string(),
    type: v.optional(v.string()),
    isAiGenerated: v.optional(v.boolean()),
  }).index("by_deal", ["dealId"])
    .index("by_contact", ["contactId"])
    .index("by_company", ["companyId"])
    .index("by_client", ["clientId"])
    .index("by_author", ["authorId"]),

  // ===============================
  // PROPOSALS & BUSINESS
  // ===============================

  proposals: defineTable({
    dealId: v.id("deals"),
    clientId: v.id("clients"),
    createdBy: v.optional(v.id("profiles")),
    title: v.string(),
    status: v.optional(v.string()),
    proposalUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    isAiGenerated: v.optional(v.boolean()),
    amountTotal: v.number(),
    amountUpfront: v.number(),
    amountMonthly: v.number(),
    currency: v.optional(v.string()),
    sentAt: v.optional(v.number()),
    viewedAt: v.optional(v.number()),
    acceptedAt: v.optional(v.number()),
    rejectedAt: v.optional(v.number()),
  }).index("by_deal", ["dealId"])
    .index("by_client", ["clientId"]),

  // ===============================
  // ACTIVITY LOG & AUDIT
  // ===============================

  activityLog: defineTable({
    dealId: v.optional(v.id("deals")),
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    projectId: v.optional(v.id("projects")),
    taskId: v.optional(v.id("tasks")),
    noteId: v.optional(v.id("notes")),
    clientId: v.id("clients"),
    userId: v.optional(v.id("profiles")),
    action: v.string(),
    description: v.optional(v.string()),
    metadata: v.optional(v.object({})),
  }).index("by_client", ["clientId"])
    .index("by_user", ["userId"])
    .index("by_deal", ["dealId"])
    .index("by_contact", ["contactId"])
    .index("by_company", ["companyId"])
    .index("by_project", ["projectId"]),

  // ===============================
  // EMAIL DISPATCH & INDUSTRIES
  // ===============================

  emailDispatchLog: defineTable({
    clientId: v.id("clients"),
    contactId: v.id("contacts"),
    targetCampaignId: v.id("campaigns"),
    dispatchDate: v.string(), // ISO date string
    reservedAt: v.number(),
    deliveredAt: v.optional(v.number()),
    status: v.string(),
    httpStatus: v.optional(v.number()),
    error: v.optional(v.string()),
    response: v.optional(v.object({})),
  }).index("by_client", ["clientId"])
    .index("by_contact", ["contactId"])
    .index("by_campaign", ["targetCampaignId"])
    .index("by_status", ["status"]),

  industries: defineTable({
    slug: v.string(),
    label: v.string(),
    parentSlug: v.optional(v.string()),
    description: v.optional(v.string()),
    keywords: v.optional(v.array(v.string())),
  }).index("by_slug", ["slug"])
    .index("by_parent", ["parentSlug"]),

  locationAliases: defineTable({
    kind: v.string(),
    alias: v.string(),
    canonical: v.string(),
  }).index("by_kind_alias", ["kind", "alias"]),

  // ===============================
  // NEW LEAD-CONTACT BRIDGING TABLES
  // ===============================

  // Lead Purchase History - Track when leads become contacts
  leadPurchases: defineTable({
    leadId: v.id("leads"),
    clientId: v.id("clients"),
    contactId: v.id("contacts"),                 // Reference to the created contact
    purchasePrice: v.optional(v.number()),       // If applicable
    purchaseMethod: v.optional(v.string()),      // 'bulk', 'individual', 'campaign', etc.
    purchasedAt: v.number(),
    purchasedBy: v.optional(v.id("profiles")),   // Who in the client team purchased this lead
  }).index("by_lead", ["leadId"])
    .index("by_client", ["clientId"])
    .index("by_contact", ["contactId"])
    .index("by_purchased_date", ["purchasedAt"]),

  // Lead Availability - Track which leads are available to which clients
  leadAvailability: defineTable({
    leadId: v.id("leads"),
    clientId: v.id("clients"),
    isAvailable: v.boolean(),                    // Can this client purchase this lead?
    restrictionReason: v.optional(v.string()),   // Why is it not available?
    availableUntil: v.optional(v.number()),      // Expiry date for availability
  }).index("by_lead", ["leadId"])
    .index("by_client", ["clientId"])
    .index("by_available", ["isAvailable"]),

  // ===============================
  // EXTREEM ROBUUST CREDIT SYSTEEM
  // ===============================

  // Duplicate clients definition removed - merged with main definition above

  // Immutable Transaction Log (SOURCE OF TRUTH)
  creditTransactions: defineTable({
    // Core transaction data
    transactionId: v.string(), // UUID for idempotency
    clientId: v.id("clients"),
    creditType: v.string(), // "lead", "email", "linkedin", "abm"
    
    // Double-entry bookkeeping
    debitAmount: v.number(),    // Amount removed
    creditAmount: v.number(),   // Amount added
    netAmount: v.number(),      // creditAmount - debitAmount
    
    // Transaction metadata
    transactionType: v.string(), // "purchase", "usage", "refund", "bonus", "adjustment", "first_month_bonus"
    description: v.string(),
    referenceId: v.optional(v.string()), // Campaign/contact/order ID
    
    // Audit trail
    timestamp: v.number(),
    processedBy: v.optional(v.id("profiles")), // User who initiated
    systemGenerated: v.boolean(),
    batchId: v.optional(v.string()), // For bulk operations
    
    // Balance verification
    balanceAfter: v.number(), // Client balance after this transaction
    runningTotal: v.number(), // System-wide running total
    
    // Error handling
    status: v.string(), // "pending", "completed", "failed", "reversed"
    errorMessage: v.optional(v.string()),
    parentTransactionId: v.optional(v.string()), // For reversals
  }).index("by_client", ["clientId"])
    .index("by_idempotency", ["transactionId"])
    .index("by_type", ["creditType"])
    .index("by_status", ["status"])
    .index("by_timestamp", ["timestamp"]),

  // Credit Packages (Lead Engine Packages)
  creditPackages: defineTable({
    slug: v.string(), // "pilot", "grow", "scale", "dominate"
    name: v.string(), // "Start", "Grow", "Scale", "Dominate"
    description: v.optional(v.string()),
    
    // Credit allocations per billing period
    leadCredits: v.number(),
    emailCredits: v.number(),
    linkedinCredits: v.number(),
    abmCredits: v.number(),
    
    // First month bonus (double lead credits)
    firstMonthBonusLeadCredits: v.number(),
    
    // Pricing
    price: v.number(), // In cents (9900 for €99)
    currency: v.string(), // "EUR"
    billingPeriod: v.string(), // "one-time", "monthly", "annual"
    
    // Business rules
    isActive: v.boolean(),
    validFrom: v.number(),
    validUntil: v.optional(v.number()),
    maxPurchasesPerDomain: v.optional(v.number()), // 1 for Start package
    isSpecialOffer: v.boolean(), // true for Start package
    autoUpgradeToPackage: v.optional(v.id("creditPackages")), // Start -> Grow
    
    // Stripe integration
    stripeProductId: v.optional(v.string()), // Stripe product ID
    stripePriceId: v.optional(v.string()), // Stripe price ID
    isStripeIntegrated: v.optional(v.boolean()), // Whether connected to Stripe
    
    // Display
    priority: v.number(), // Display order
    isPopular: v.boolean(),
    features: v.array(v.string()),
    tags: v.array(v.string()),
    
    // Timestamps
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_slug", ["slug"], { unique: true }) // UNIQUE constraint on slug
    .index("by_active", ["isActive"])
    .index("by_priority", ["priority"])
    .index("by_stripe_product", ["stripeProductId"])
    .index("by_stripe_price", ["stripePriceId"])
    .index("by_billing_period", ["billingPeriod"])
    .index("by_valid_from", ["validFrom"]),

  // Credit Orders & Purchases
  creditOrders: defineTable({
    orderId: v.string(), // UUID
    clientId: v.id("clients"),
    packageId: v.id("creditPackages"),
    
    // Order details
    quantity: v.number(),
    totalPrice: v.number(),
    currency: v.string(),
    
    // Payment processing (Stripe)
    paymentStatus: v.string(), // "pending", "paid", "failed", "refunded"
    paymentProvider: v.optional(v.string()), // "stripe"
    paymentId: v.optional(v.string()), // Stripe payment_intent ID
    stripeSessionId: v.optional(v.string()),
    stripeProductId: v.optional(v.string()), // Stripe product used for this order
    stripePriceId: v.optional(v.string()), // Stripe price used for this order
    
    // Credit fulfillment
    creditStatus: v.string(), // "pending", "fulfilled", "failed"
    fulfilledAt: v.optional(v.number()),
    transactionIds: v.optional(v.array(v.string())), // Links to creditTransactions
    
    // Business rules tracking
    isFirstMonthBonus: v.optional(v.boolean()),
    wasAutoUpgraded: v.optional(v.boolean()),
    originalPackageId: v.optional(v.id("creditPackages")), // If auto-upgraded from Start
    
    // Discount tracking (for Pilot Pack upgrade bonus)
    discountApplied: v.optional(v.number()), // Discount amount in cents
    discountReason: v.optional(v.string()), // Reason for discount
    
    // Enhanced order tracking
    requestId: v.optional(v.string()), // Unique request identifier
    checkoutUrl: v.optional(v.string()), // Generated checkout URL
    sessionExpiresAt: v.optional(v.number()), // When the checkout session expires
    
    // Security & tracking
    clientIp: v.optional(v.string()),
    clientUserAgent: v.optional(v.string()),
    metadata: v.optional(v.object({})), // Additional order metadata
    
    // Audit
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_order_id", ["orderId"], { unique: true }) // UNIQUE constraint on orderId
    .index("by_client", ["clientId"])
    .index("by_payment_status", ["paymentStatus"])
    .index("by_credit_status", ["creditStatus"])
    .index("by_stripe_session", ["stripeSessionId"])
    .index("by_package", ["packageId"])
    .index("by_created_at", ["createdAt"])
    .index("by_fulfilled_at", ["fulfilledAt"]),

  // Credit Usage Sessions (for complex operations)
  creditSessions: defineTable({
    sessionId: v.string(),
    clientId: v.id("clients"),
    operationType: v.string(), // "campaign_send", "lead_purchase", "bulk_operation"
    
    // Pre-authorization
    estimatedCost: v.object({
      leadCredits: v.number(),
      emailCredits: v.number(),
      linkedinCredits: v.number(),
      abmCredits: v.number(),
    }),
    
    // Actual usage
    actualCost: v.optional(v.object({
      leadCredits: v.number(),
      emailCredits: v.number(),
      linkedinCredits: v.number(),
      abmCredits: v.number(),
    })),
    
    // Session management
    status: v.string(), // "reserved", "committed", "rolled_back", "expired"
    expiresAt: v.number(),
    createdAt: v.number(),
    transactionIds: v.optional(v.array(v.string())),
  }).index("by_client", ["clientId"])
    .index("by_status", ["status"])
    .index("by_expires", ["expiresAt"]),

  // System Integrity Checks
  creditAudits: defineTable({
    auditId: v.string(),
    auditType: v.string(), // "balance_verification", "transaction_integrity", "daily_reconciliation"
    
    // Audit results
    clientsAudited: v.number(),
    discrepanciesFound: v.number(),
    totalCreditsInSystem: v.object({
      leadCredits: v.number(),
      emailCredits: v.number(),
      linkedinCredits: v.number(),
      abmCredits: v.number(),
    }),
    
    // Audit metadata
    runAt: v.number(),
    runBy: v.string(), // "system" or user ID
    duration: v.number(), // milliseconds
    status: v.string(), // "passed", "failed", "warnings"
    findings: v.array(v.string()),
  }).index("by_type", ["auditType"])
    .index("by_status", ["status"])
    .index("by_run_at", ["runAt"]),

  // Domain Usage Tracking (for Start package limit)
  domainUsageTracking: defineTable({
    domain: v.string(),
    hasUsedStartPackage: v.boolean(),
    startPackageUsedAt: v.optional(v.number()),
    clientId: v.id("clients"),
    createdAt: v.number(),
  }).index("by_domain", ["domain"])
    .index("by_start_usage", ["hasUsedStartPackage"]),

  // ===============================
  // SECURITY & MONITORING
  // ===============================

  // Rate Limiting Tracking
  rateLimitAttempts: defineTable({
    key: v.string(), // Composite key like "checkout:email:domain" 
    timestamp: v.number(),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    success: v.optional(v.boolean()),
    metadata: v.optional(v.object({})),
  }).index("by_key_and_time", ["key", "timestamp"])
    .index("by_timestamp", ["timestamp"])
    .index("by_ip", ["ip"]),

  // Checkout Audit Log
  checkoutAuditLog: defineTable({
    requestId: v.string(),
    orderId: v.string(),
    clientId: v.string(),
    packageSlug: v.string(),
    sessionId: v.string(),
    
    // Performance metrics
    duration: v.number(), // milliseconds
    success: v.boolean(),
    error: v.optional(v.string()),
    
    // Security context
    timestamp: v.number(),
    clientIp: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    
    // Additional tracking
    riskScore: v.optional(v.number()),
    validationWarnings: v.optional(v.array(v.string())),
    metadata: v.optional(v.object({})),
  }).index("by_timestamp", ["timestamp"])
    .index("by_request_id", ["requestId"])
    .index("by_client", ["clientId"])
    .index("by_success", ["success"])
    .index("by_package", ["packageSlug"]),

  // System Health Monitoring
  systemHealthChecks: defineTable({
    checkId: v.string(),
    component: v.string(), // "database", "stripe", "packages", "orders"
    status: v.string(), // "healthy", "degraded", "critical"
    responseTime: v.optional(v.number()),
    errorRate: v.optional(v.number()),
    metadata: v.optional(v.object({})),
    timestamp: v.number(),
    checkedBy: v.optional(v.string()), // "system" or user ID
  }).index("by_component", ["component"])
    .index("by_timestamp", ["timestamp"])
    .index("by_status", ["status"]),

  // Security Incidents
  securityIncidents: defineTable({
    incidentId: v.string(),
    type: v.string(), // "fraud_attempt", "rate_limit_exceeded", "invalid_access"
    severity: v.string(), // "low", "medium", "high", "critical"
    
    // Incident details
    description: v.string(),
    affectedEntity: v.optional(v.string()), // client ID, domain, etc.
    sourceIp: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    
    // Response status
    status: v.string(), // "detected", "investigating", "resolved", "false_positive"
    resolvedBy: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
    
    // Timestamps
    detectedAt: v.number(),
    reportedAt: v.optional(v.number()),
    
    // Additional data
    evidence: v.optional(v.object({})),
    countermeasures: v.optional(v.array(v.string())),
  }).index("by_type", ["type"])
    .index("by_severity", ["severity"])
    .index("by_status", ["status"])
    .index("by_detected_at", ["detectedAt"])
    .index("by_affected_entity", ["affectedEntity"]),

  // Pilot Pack Upgrade Bonuses
  pilotUpgradeBonuses: defineTable({
    clientId: v.id("clients"),
    orderId: v.string(), // The new subscription order ID
    
    // Discount details
    discountAmount: v.number(), // Amount in cents (€149.00 = 14900)
    originalPrice: v.number(), // Original package price before discount
    finalPrice: v.number(), // Final price after discount
    
    // Upgrade details
    targetPackageSlug: v.string(), // "grow", "scale", or "dominate"
    upgradeWithinDays: v.number(), // How many days after Pilot Pack purchase
    
    // Status tracking
    status: v.string(), // "applied", "refunded", "disputed"
    appliedAt: v.number(),
    
    // Audit trail
    metadata: v.optional(v.object({})),
  }).index("by_client", ["clientId"])
    .index("by_order", ["orderId"])
    .index("by_applied_at", ["appliedAt"])
    .index("by_target_package", ["targetPackageSlug"])
    .index("by_status", ["status"]),

  // ===============================
  // PAY-AS-YOU-SCALE CREDIT SYSTEM
  // ===============================

  // Base subscription tiers (monthly recurring)
  subscriptionTiers: defineTable({
    slug: v.string(), // "starter", "professional", "enterprise"
    name: v.string(),
    description: v.string(),
    
    // Base monthly allowances
    baseLeadCredits: v.number(),
    baseEmailCredits: v.number(),
    baseLinkedinCredits: v.number(),
    baseAbmCredits: v.number(),
    
    // Pricing
    monthlyPrice: v.number(), // in cents
    currency: v.string(),
    
    // Stripe integration
    stripeProductId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    
    // Configuration
    isActive: v.boolean(),
    priority: v.number(), // Display order
    
    // Features & limits
    features: v.array(v.string()),
    maxAddOns: v.optional(v.number()), // Max add-ons allowed
    
    // Audit
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"], { unique: true })
    .index("by_priority", ["priority"])
    .index("by_active", ["isActive"]),

  // Available add-ons (can be combined)
  creditAddOns: defineTable({
    slug: v.string(), // "leads-250", "emails-500", "linkedin-100"
    name: v.string(),
    description: v.string(),
    
    // Credit allocation
    creditType: v.string(), // "leads", "emails", "linkedin", "abm"
    creditAmount: v.number(),
    
    // Pricing
    monthlyPrice: v.number(), // in cents
    currency: v.string(),
    
    // Stripe integration
    stripeProductId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    
    // Configuration
    isActive: v.boolean(),
    category: v.string(), // "outbound", "linkedin", "data"
    
    // Compatibility
    compatibleTiers: v.array(v.string()), // Which tiers can use this add-on
    maxQuantity: v.optional(v.number()), // Max quantity per subscription
    
    // Audit
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"], { unique: true })
    .index("by_credit_type", ["creditType"])
    .index("by_category", ["category"])
    .index("by_active", ["isActive"]),

  // Client subscriptions (replaces simple packages)
  clientSubscriptions: defineTable({
    clientId: v.id("clients"),
    
    // Current subscription details
    baseTier: v.id("subscriptionTiers"),
    status: v.string(), // "active", "cancelled", "past_due", "paused"
    
    // Billing cycle
    billingPeriod: v.string(), // "monthly"
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    nextBillingDate: v.number(),
    
    // Stripe integration
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    
    // Metadata
    metadata: v.optional(v.object({})),
    
    // Audit
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_client", ["clientId"], { unique: true })
    .index("by_stripe_subscription", ["stripeSubscriptionId"], { unique: true })
    .index("by_status", ["status"])
    .index("by_billing_date", ["nextBillingDate"]),

  // Active add-ons for each subscription
  subscriptionAddOns: defineTable({
    subscriptionId: v.id("clientSubscriptions"),
    addOnId: v.id("creditAddOns"),
    
    // Quantity & pricing
    quantity: v.number(), // How many of this add-on
    unitPrice: v.number(), // Price at time of purchase (for price changes)
    totalPrice: v.number(), // quantity × unitPrice
    
    // Billing
    addedAt: v.number(),
    firstBilledAt: v.optional(v.number()),
    lastBilledAt: v.optional(v.number()),
    
    // Status
    status: v.string(), // "active", "cancelled", "pending"
    cancelledAt: v.optional(v.number()),
    
    // Stripe integration
    stripeSubscriptionItemId: v.string(), // Stripe subscription item
    
    // Audit
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_subscription", ["subscriptionId"])
    .index("by_addon", ["addOnId"])
    .index("by_stripe_item", ["stripeSubscriptionItemId"], { unique: true })
    .index("by_status", ["status"]),

  // Monthly credit allocations (for rollover tracking)
  monthlyAllocation: defineTable({
    clientId: v.id("clients"),
    subscriptionId: v.id("clientSubscriptions"),
    
    // Billing period this allocation is for
    periodStart: v.number(),
    periodEnd: v.number(),
    month: v.string(), // "2025-01" for easy querying
    
    // Base tier credits
    baseLeadCredits: v.number(),
    baseEmailCredits: v.number(),
    baseLinkedinCredits: v.number(),
    baseAbmCredits: v.number(),
    
    // Add-on credits
    addonLeadCredits: v.number(),
    addonEmailCredits: v.number(),
    addonLinkedinCredits: v.number(),
    addonAbmCredits: v.number(),
    
    // Total credits for this month
    totalLeadCredits: v.number(),
    totalEmailCredits: v.number(),
    totalLinkedinCredits: v.number(),
    totalAbmCredits: v.number(),
    
    // Usage tracking
    usedLeadCredits: v.number(),
    usedEmailCredits: v.number(),
    usedLinkedinCredits: v.number(),
    usedAbmCredits: v.number(),
    
    // Rollover tracking (leads/emails only)
    rolloverFromPrevious: v.object({
      leadCredits: v.number(),
      emailCredits: v.number(),
    }),
    
    // Status
    status: v.string(), // "active", "completed", "expired"
    
    // Audit
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_client", ["clientId"])
    .index("by_subscription", ["subscriptionId"])
    .index("by_month", ["month"])
    .index("by_period", ["periodStart", "periodEnd"])
    .index("by_client_month", ["clientId", "month"], { unique: true }),

  // Credit rollover history (for 3-month tracking)
  creditRollovers: defineTable({
    clientId: v.id("clients"),
    
    // Source allocation (where credits came from)
    sourceAllocationId: v.id("monthlyAllocation"),
    sourceMonth: v.string(),
    
    // Target allocation (where credits rolled to)
    targetAllocationId: v.optional(v.id("monthlyAllocation")),
    targetMonth: v.string(),
    
    // Rollover details
    creditType: v.string(), // "leads" or "emails"
    amountRolled: v.number(),
    amountUsed: v.number(), // How much of the rollover was used
    amountExpired: v.number(), // Amount that expired after 3 months
    
    // Timing
    rolledAt: v.number(),
    expiresAt: v.number(), // 3 months from source month
    expiredAt: v.optional(v.number()),
    
    // Status
    status: v.string(), // "active", "expired", "fully_used"
    
    // Audit
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_client", ["clientId"])
    .index("by_source_allocation", ["sourceAllocationId"])
    .index("by_target_allocation", ["targetAllocationId"])
    .index("by_credit_type", ["creditType"])
    .index("by_expires_at", ["expiresAt"])
    .index("by_status", ["status"]),

  // Subscription change requests (for mid-cycle changes)
  subscriptionChanges: defineTable({
    clientId: v.id("clients"),
    subscriptionId: v.id("clientSubscriptions"),
    
    // Change details
    changeType: v.string(), // "tier_upgrade", "tier_downgrade", "add_addon", "remove_addon", "modify_addon"
    
    // Before state
    oldTierId: v.optional(v.id("subscriptionTiers")),
    oldAddOns: v.optional(v.array(v.object({
      addOnId: v.id("creditAddOns"),
      quantity: v.number(),
    }))),
    
    // After state
    newTierId: v.optional(v.id("subscriptionTiers")),
    newAddOns: v.optional(v.array(v.object({
      addOnId: v.id("creditAddOns"),
      quantity: v.number(),
    }))),
    
    // Pricing impact
    proratedAmount: v.number(), // Prorated charge/credit
    nextCycleAmount: v.number(), // New recurring amount
    
    // Timing
    effectiveDate: v.number(), // When change takes effect
    requestedAt: v.number(),
    processedAt: v.optional(v.number()),
    
    // Status
    status: v.string(), // "pending", "processing", "completed", "failed", "cancelled"
    
    // Stripe integration
    stripeInvoiceId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    
    // Audit
    requestedBy: v.string(), // user ID or "system"
    notes: v.optional(v.string()),
    metadata: v.optional(v.object({})),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_client", ["clientId"])
    .index("by_subscription", ["subscriptionId"])
    .index("by_status", ["status"])
    .index("by_effective_date", ["effectiveDate"])
    .index("by_change_type", ["changeType"]),
});