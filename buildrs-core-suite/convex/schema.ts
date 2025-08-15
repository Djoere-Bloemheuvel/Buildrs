import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ===============================
  // CORE ENTITIES
  // ===============================
  
  clients: defineTable({
    company: v.string(),
    contact: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    domain: v.optional(v.string()),
    clientSummary: v.optional(v.string()),
    instantlyEmailListId: v.optional(v.string()),
  }).index("by_domain", ["domain"]),

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
    companyKeywords: v.optional(v.array(v.string())),
    companyCommonProblems: v.optional(v.string()),
    companyTargetCustomers: v.optional(v.string()),
    companyUniqueCharacteristics: v.optional(v.array(v.string())),
    companyUniqueQualities: v.optional(v.string()),
    companyLinkedinUrl: v.optional(v.string()),
    companyTechnologies: v.optional(v.object({})), // jsonb equivalent
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    fullEnrichment: v.optional(v.boolean()),
    lastUpdatedAt: v.optional(v.number()),
  }).index("by_domain", ["domain"])
    .index("by_industry", ["industrySlug"])
    .index("by_name", ["name"]),

  contacts: defineTable({
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
});