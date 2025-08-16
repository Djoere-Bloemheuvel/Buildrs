import { mutation } from "./_generated/server";

export const seedAutomationTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Check if templates already exist
    const existingTemplates = await ctx.db.query("automationTemplates").collect();
    if (existingTemplates.length > 0) {
      return { message: "Templates already exist", count: existingTemplates.length };
    }

    const templates = [
      // LEAD CONVERSION AUTOMATIONS
      {
        key: "lead-conversion-basic",
        name: "Basic Lead Conversie",
        description: "Dagelijkse conversie van hoogwaardige leads naar contacten",
        category: "lead-conversion",
        type: "scheduled",
        defaultSettings: {
          dailyLimit: 10,
          executionTime: "09:00",
          maxRetries: 3,
          retryDelayMinutes: 60,
          targetingOptions: ["functionGroups", "industries", "countries", "companySize"],
          requiredCredits: 1,
        },
        validationRules: {
          requiredFields: ["dailyLimit", "executionTime"],
          minDailyLimit: 1,
          maxDailyLimit: 50,
          allowedExecutionTimes: ["07:00", "08:00", "09:00", "10:00", "11:00"],
        },
        isActive: true,
        version: "1.1.0",
        priority: 100,
        createdAt: now,
        updatedAt: now,
      },
      {
        key: "lead-conversion-advanced",
        name: "Geavanceerde Lead Conversie",
        description: "Uitgebreide dagelijkse lead conversie met precisie targeting en intelligente filters",
        category: "lead-conversion",
        type: "scheduled",
        defaultSettings: {
          dailyLimit: 25,
          executionTime: "08:30",
          maxRetries: 5,
          retryDelayMinutes: 30,
          targetingOptions: ["functionGroups", "industries", "countries", "companySize", "location", "keywords"],
          requiredCredits: 1,
        },
        validationRules: {
          requiredFields: ["dailyLimit", "executionTime"],
          minDailyLimit: 10,
          maxDailyLimit: 100,
        },
        isActive: true,
        version: "1.1.0",
        priority: 200,
        createdAt: now,
        updatedAt: now,
      },
      {
        key: "lead-conversion-enterprise",
        name: "Enterprise Lead Conversie",
        description: "Hoogvolume lead conversie voor enterprise klanten met premium features",
        category: "lead-conversion",
        type: "scheduled",
        defaultSettings: {
          dailyLimit: 100,
          executionTime: "07:00",
          maxRetries: 10,
          retryDelayMinutes: 15,
          targetingOptions: ["functionGroups", "industries", "countries", "companySize", "location", "keywords", "technology"],
          requiredCredits: 1,
        },
        validationRules: {
          requiredFields: ["dailyLimit", "executionTime"],
          minDailyLimit: 50,
          maxDailyLimit: 500,
        },
        isActive: true,
        version: "1.1.0",
        priority: 300,
        createdAt: now,
        updatedAt: now,
      },

      // FUTURE AUTOMATION TYPES (for scalability)
      {
        key: "email-nurturing-basic",
        name: "Email Nurturing Campagne",
        description: "Geautomatiseerde email nurturing voor nieuwe contacten",
        category: "lead-nurturing",
        type: "trigger-based",
        defaultSettings: {
          dailyLimit: 50,
          maxRetries: 3,
          retryDelayMinutes: 120,
          targetingOptions: ["contactAge", "lastActivity", "interests"],
          requiredCredits: 2,
        },
        validationRules: {
          requiredFields: ["emailTemplate", "triggerEvent"],
          minDailyLimit: 10,
          maxDailyLimit: 200,
        },
        isActive: false, // Will be activated later
        version: "1.0.0",
        priority: 400,
        createdAt: now,
        updatedAt: now,
      },
      {
        key: "linkedin-outreach-basic",
        name: "LinkedIn Outreach Automation",
        description: "Geautomatiseerde LinkedIn berichten naar nieuwe leads",
        category: "outreach",
        type: "scheduled",
        defaultSettings: {
          dailyLimit: 20,
          executionTime: "10:00",
          maxRetries: 2,
          retryDelayMinutes: 240,
          targetingOptions: ["functionGroups", "industries", "connectionLevel"],
          requiredCredits: 3,
        },
        validationRules: {
          requiredFields: ["messageTemplate", "dailyLimit"],
          minDailyLimit: 5,
          maxDailyLimit: 50,
        },
        isActive: false, // Will be activated later
        version: "1.0.0",
        priority: 500,
        createdAt: now,
        updatedAt: now,
      },
      {
        key: "lead-scoring-daily",
        name: "Dagelijkse Lead Scoring Update",
        description: "Automatische herberekening van lead scores op basis van nieuwe data",
        category: "analytics",
        type: "scheduled",
        defaultSettings: {
          executionTime: "02:00",
          maxRetries: 5,
          retryDelayMinutes: 60,
          targetingOptions: [],
          requiredCredits: 0,
        },
        validationRules: {
          requiredFields: ["executionTime"],
        },
        isActive: false, // Will be activated later
        version: "1.0.0",
        priority: 50,
        createdAt: now,
        updatedAt: now,
      },
      {
        key: "data-cleanup-weekly",
        name: "Wekelijkse Data Cleanup",
        description: "Automatische opruiming van verouderde leads en contacten",
        category: "maintenance",
        type: "scheduled",
        defaultSettings: {
          executionTime: "03:00",
          maxRetries: 3,
          retryDelayMinutes: 180,
          targetingOptions: ["lastActivity", "dataQuality"],
          requiredCredits: 0,
        },
        validationRules: {
          requiredFields: ["executionTime", "retentionDays"],
        },
        isActive: false, // Will be activated later
        version: "1.0.0",
        priority: 25,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const results = await Promise.all(
      templates.map(template => ctx.db.insert("automationTemplates", template))
    );

    return {
      message: "Automation templates seeded successfully",
      count: results.length,
      templateIds: results,
    };
  },
});