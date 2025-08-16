import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Stage automation configuration for future implementation
export const getStageAutomations = query({
  args: { 
    stageId: v.id("stages"),
    clientId: v.optional(v.id("clients"))
  },
  returns: v.array(v.object({
    _id: v.id("stageAutomations"),
    _creationTime: v.number(),
    stageId: v.id("stages"),
    pipelineId: v.id("pipelines"),
    clientId: v.id("clients"),
    automationType: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    triggerConditions: v.object({}),
    actions: v.array(v.object({})),
    settings: v.optional(v.object({})),
  })),
  handler: async (ctx, args) => {
    // For future implementation - would fetch stage automations
    // For now, return empty array as the table doesn't exist yet
    return [];
  },
});

// Create stage automation (placeholder for future)
export const createStageAutomation = mutation({
  args: {
    stageId: v.id("stages"),
    pipelineId: v.id("pipelines"),
    clientId: v.id("clients"),
    automationType: v.string(), // "email_sequence", "task_creation", "notification", "deal_update"
    name: v.string(),
    description: v.optional(v.string()),
    triggerConditions: v.object({
      onStageEnter: v.optional(v.boolean()),
      onStageExit: v.optional(v.boolean()),
      delayHours: v.optional(v.number()),
      dayOfWeek: v.optional(v.array(v.string())),
      timeOfDay: v.optional(v.string()),
    }),
    actions: v.array(v.object({
      type: v.string(), // "send_email", "create_task", "send_notification", "update_deal_field"
      config: v.object({}), // Flexible config per action type
    })),
    settings: v.optional(v.object({
      isActive: v.boolean(),
      maxExecutions: v.optional(v.number()),
      cooldownHours: v.optional(v.number()),
    })),
  },
  returns: v.string(), // Return placeholder ID for future implementation
  handler: async (ctx, args) => {
    // For future implementation when we add stage automations to schema
    // For now, just return a placeholder
    console.log("Stage automation creation requested:", {
      stageId: args.stageId,
      automationType: args.automationType,
      name: args.name
    });
    
    return "placeholder-automation-id";
  },
});

// Get automation templates for stages
export const getAutomationTemplates = query({
  args: {},
  returns: v.array(v.object({
    id: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    automationType: v.string(),
    defaultTriggers: v.object({}),
    defaultActions: v.array(v.object({})),
    isPopular: v.boolean(),
  })),
  handler: async (ctx, args) => {
    // Return predefined automation templates
    return [
      {
        id: "welcome-email-sequence",
        name: "Welkom E-mail Reeks",
        description: "Verstuur automatisch een welkom e-mail reeks wanneer een deal deze stage bereikt",
        category: "email",
        automationType: "email_sequence",
        defaultTriggers: {
          onStageEnter: true,
          delayHours: 0
        },
        defaultActions: [
          {
            type: "send_email",
            config: {
              templateType: "welcome_sequence",
              sendToContact: true,
              emailCount: 3,
              intervalDays: 2
            }
          }
        ],
        isPopular: true
      },
      {
        id: "follow-up-task",
        name: "Follow-up Taak Aanmaken",
        description: "Maak automatisch een follow-up taak aan na een bepaalde tijd in deze stage",
        category: "task",
        automationType: "task_creation",
        defaultTriggers: {
          onStageEnter: true,
          delayHours: 48
        },
        defaultActions: [
          {
            type: "create_task",
            config: {
              taskTitle: "Follow-up met {contact_name} over {deal_title}",
              taskDescription: "Neem contact op voor status update",
              assignToOwner: true,
              priority: "medium"
            }
          }
        ],
        isPopular: true
      },
      {
        id: "proposal-reminder",
        name: "Voorstel Herinnering",
        description: "Verstuur herinnering wanneer voorstel te lang in deze stage blijft",
        category: "notification",
        automationType: "notification",
        defaultTriggers: {
          onStageEnter: false,
          delayHours: 168 // 1 week
        },
        defaultActions: [
          {
            type: "send_notification",
            config: {
              notificationType: "deal_stale",
              message: "Deal {deal_title} staat al 1 week in {stage_name}",
              sendToOwner: true,
              sendToTeam: false
            }
          }
        ],
        isPopular: true
      },
      {
        id: "confidence-update",
        name: "Confidence Auto-Update",
        description: "Update automatisch de deal confidence op basis van stage",
        category: "deal_update",
        automationType: "deal_update",
        defaultTriggers: {
          onStageEnter: true,
          delayHours: 0
        },
        defaultActions: [
          {
            type: "update_deal_field",
            config: {
              field: "confidence",
              value: "stage_default_probability",
              onlyIfLower: true
            }
          }
        ],
        isPopular: false
      },
      {
        id: "won-celebration",
        name: "Deal Won Viering",
        description: "Verstuur felicitatie berichten en maak celebration taken aan",
        category: "celebration",
        automationType: "celebration",
        defaultTriggers: {
          onStageEnter: true,
          delayHours: 0
        },
        defaultActions: [
          {
            type: "send_notification",
            config: {
              notificationType: "deal_won",
              message: "🎉 Deal gewonnen: {deal_title} - €{deal_value}!",
              sendToOwner: true,
              sendToTeam: true
            }
          },
          {
            type: "create_task",
            config: {
              taskTitle: "Project kick-off voorbereiden voor {company_name}",
              taskDescription: "Start voorbereidingen voor project implementatie",
              assignToOwner: true,
              priority: "high"
            }
          }
        ],
        isPopular: true
      }
    ];
  },
});

// Future: Schema addition for stage automations
// This would be added to schema.ts when we implement automations:
/*
stageAutomations: defineTable({
  stageId: v.id("stages"),
  pipelineId: v.id("pipelines"), 
  clientId: v.id("clients"),
  automationType: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  isActive: v.boolean(),
  triggerConditions: v.object({
    onStageEnter: v.optional(v.boolean()),
    onStageExit: v.optional(v.boolean()),
    delayHours: v.optional(v.number()),
    dayOfWeek: v.optional(v.array(v.string())),
    timeOfDay: v.optional(v.string()),
  }),
  actions: v.array(v.object({
    type: v.string(),
    config: v.object({})
  })),
  settings: v.optional(v.object({
    isActive: v.boolean(),
    maxExecutions: v.optional(v.number()),
    cooldownHours: v.optional(v.number()),
  })),
  executionStats: v.optional(v.object({
    totalExecutions: v.number(),
    successCount: v.number(),
    failureCount: v.number(),
    lastExecuted: v.optional(v.number()),
  })),
}).index("by_stage", ["stageId"])
  .index("by_pipeline", ["pipelineId"])
  .index("by_client", ["clientId"])
  .index("by_type", ["automationType"])
  .index("by_active", ["isActive"])
*/