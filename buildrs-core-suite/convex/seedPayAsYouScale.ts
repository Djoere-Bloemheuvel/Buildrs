import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * SEED DATA FOR PAY-AS-YOU-SCALE SYSTEM
 * 
 * Creates initial subscription tiers and credit add-ons
 */

// Create subscription tiers
export const seedSubscriptionTiers = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    tiersCreated: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    
    const tiers = [
      {
        slug: "starter",
        name: "Starter",
        description: "Perfect voor kleine teams die beginnen met outbound sales",
        baseLeadCredits: 500,
        baseEmailCredits: 1000,
        baseLinkedinCredits: 50,
        baseAbmCredits: 0,
        monthlyPrice: 9900, // €99
        currency: "EUR",
        stripeProductId: "", // Will be set when creating Stripe products
        stripePriceId: "",
        isActive: true,
        priority: 1,
        features: [
          "500 lead credits per maand",
          "1,000 email credits per maand",
          "50 LinkedIn credits per maand",
          "Credit rollover (3 maanden)",
          "Basis analytics",
          "Email ondersteuning"
        ],
        maxAddOns: 10,
        createdAt: now,
        updatedAt: now,
      },
      {
        slug: "professional",
        name: "Professional",
        description: "Voor groeiende teams die serieuze outbound volumes draaien",
        baseLeadCredits: 1500,
        baseEmailCredits: 3000,
        baseLinkedinCredits: 150,
        baseAbmCredits: 25,
        monthlyPrice: 24900, // €249
        currency: "EUR",
        stripeProductId: "",
        stripePriceId: "",
        isActive: true,
        priority: 2,
        features: [
          "1,500 lead credits per maand",
          "3,000 email credits per maand", 
          "150 LinkedIn credits per maand",
          "25 ABM credits per maand",
          "Credit rollover (3 maanden)",
          "Geavanceerde analytics",
          "ABM campaigns",
          "Prioriteit ondersteuning"
        ],
        maxAddOns: 20,
        createdAt: now,
        updatedAt: now,
      },
      {
        slug: "enterprise",
        name: "Enterprise",
        description: "Voor grote teams met hoge volumes en enterprise-behoeften",
        baseLeadCredits: 5000,
        baseEmailCredits: 10000,
        baseLinkedinCredits: 500,
        baseAbmCredits: 100,
        monthlyPrice: 79900, // €799
        currency: "EUR",
        stripeProductId: "",
        stripePriceId: "",
        isActive: true,
        priority: 3,
        features: [
          "5,000 lead credits per maand",
          "10,000 email credits per maand",
          "500 LinkedIn credits per maand", 
          "100 ABM credits per maand",
          "Credit rollover (3 maanden)",
          "Premium analytics & reporting",
          "Dedicated account manager",
          "Custom integraties",
          "24/7 ondersteuning"
        ],
        maxAddOns: 50,
        createdAt: now,
        updatedAt: now,
      }
    ];

    let tiersCreated = 0;
    
    for (const tier of tiers) {
      const existing = await ctx.db
        .query("subscriptionTiers")
        .withIndex("by_slug", (q) => q.eq("slug", tier.slug))
        .first();
        
      if (!existing) {
        await ctx.db.insert("subscriptionTiers", tier);
        tiersCreated++;
      }
    }

    return {
      success: true,
      tiersCreated,
    };
  },
});

// Create credit add-ons
export const seedCreditAddOns = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    addOnsCreated: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    
    const addOns = [
      // Lead Credit Add-ons
      {
        slug: "leads-250",
        name: "+250 Lead Credits",
        description: "Extra 250 lead credits per maand",
        creditType: "leads",
        creditAmount: 250,
        monthlyPrice: 1500, // €15
        currency: "EUR",
        stripeProductId: "",
        stripePriceId: "",
        isActive: true,
        category: "outbound",
        compatibleTiers: ["starter", "professional", "enterprise"],
        maxQuantity: 20,
        createdAt: now,
        updatedAt: now,
      },
      {
        slug: "leads-500",
        name: "+500 Lead Credits",
        description: "Extra 500 lead credits per maand",
        creditType: "leads",
        creditAmount: 500,
        monthlyPrice: 2500, // €25
        currency: "EUR",
        stripeProductId: "",
        stripePriceId: "",
        isActive: true,
        category: "outbound",
        compatibleTiers: ["starter", "professional", "enterprise"],
        maxQuantity: 20,
        createdAt: now,
        updatedAt: now,
      },
      {
        slug: "leads-1000",
        name: "+1,000 Lead Credits",
        description: "Extra 1,000 lead credits per maand",
        creditType: "leads",
        creditAmount: 1000,
        monthlyPrice: 4500, // €45
        currency: "EUR",
        stripeProductId: "",
        stripePriceId: "",
        isActive: true,
        category: "outbound",
        compatibleTiers: ["professional", "enterprise"],
        maxQuantity: 10,
        createdAt: now,
        updatedAt: now,
      },
      
      // Email Credit Add-ons
      {
        slug: "emails-500",
        name: "+500 Email Credits",
        description: "Extra 500 email credits per maand",
        creditType: "emails",
        creditAmount: 500,
        monthlyPrice: 1000, // €10
        currency: "EUR",
        stripeProductId: "",
        stripePriceId: "",
        isActive: true,
        category: "outbound",
        compatibleTiers: ["starter", "professional", "enterprise"],
        maxQuantity: 20,
        createdAt: now,
        updatedAt: now,
      },
      {
        slug: "emails-1000",
        name: "+1,000 Email Credits",
        description: "Extra 1,000 email credits per maand",
        creditType: "emails",
        creditAmount: 1000,
        monthlyPrice: 1800, // €18
        currency: "EUR",
        stripeProductId: "",
        stripePriceId: "",
        isActive: true,
        category: "outbound",
        compatibleTiers: ["starter", "professional", "enterprise"],
        maxQuantity: 20,
        createdAt: now,
        updatedAt: now,
      },
      {
        slug: "emails-2500",
        name: "+2,500 Email Credits",
        description: "Extra 2,500 email credits per maand",
        creditType: "emails",
        creditAmount: 2500,
        monthlyPrice: 4000, // €40
        currency: "EUR",
        stripeProductId: "",
        stripePriceId: "",
        isActive: true,
        category: "outbound",
        compatibleTiers: ["professional", "enterprise"],
        maxQuantity: 10,
        createdAt: now,
        updatedAt: now,
      },
      
      // LinkedIn Credit Add-ons
      {
        slug: "linkedin-50",
        name: "+50 LinkedIn Credits",
        description: "Extra 50 LinkedIn credits per maand",
        creditType: "linkedin",
        creditAmount: 50,
        monthlyPrice: 1500, // €15
        currency: "EUR",
        stripeProductId: "",
        stripePriceId: "",
        isActive: true,
        category: "linkedin",
        compatibleTiers: ["starter", "professional", "enterprise"],
        maxQuantity: 10,
        createdAt: now,
        updatedAt: now,
      },
      {
        slug: "linkedin-100",
        name: "+100 LinkedIn Credits",
        description: "Extra 100 LinkedIn credits per maand",
        creditType: "linkedin",
        creditAmount: 100,
        monthlyPrice: 2500, // €25
        currency: "EUR",
        stripeProductId: "",
        stripePriceId: "",
        isActive: true,
        category: "linkedin",
        compatibleTiers: ["starter", "professional", "enterprise"],
        maxQuantity: 10,
        createdAt: now,
        updatedAt: now,
      },
      {
        slug: "linkedin-250",
        name: "+250 LinkedIn Credits",
        description: "Extra 250 LinkedIn credits per maand",
        creditType: "linkedin",
        creditAmount: 250,
        monthlyPrice: 5500, // €55
        currency: "EUR",
        stripeProductId: "",
        stripePriceId: "",
        isActive: true,
        category: "linkedin",
        compatibleTiers: ["professional", "enterprise"],
        maxQuantity: 5,
        createdAt: now,
        updatedAt: now,
      },
      
      // ABM Credit Add-ons
      {
        slug: "abm-25",
        name: "+25 ABM Credits",
        description: "Extra 25 ABM credits per maand",
        creditType: "abm",
        creditAmount: 25,
        monthlyPrice: 2500, // €25
        currency: "EUR",
        stripeProductId: "",
        stripePriceId: "",
        isActive: true,
        category: "data",
        compatibleTiers: ["professional", "enterprise"],
        maxQuantity: 10,
        createdAt: now,
        updatedAt: now,
      },
      {
        slug: "abm-50",
        name: "+50 ABM Credits",
        description: "Extra 50 ABM credits per maand",
        creditType: "abm",
        creditAmount: 50,
        monthlyPrice: 4500, // €45
        currency: "EUR",
        stripeProductId: "",
        stripePriceId: "",
        isActive: true,
        category: "data",
        compatibleTiers: ["professional", "enterprise"],
        maxQuantity: 10,
        createdAt: now,
        updatedAt: now,
      },
      {
        slug: "abm-100",
        name: "+100 ABM Credits",
        description: "Extra 100 ABM credits per maand",
        creditType: "abm",
        creditAmount: 100,
        monthlyPrice: 8000, // €80
        currency: "EUR",
        stripeProductId: "",
        stripePriceId: "",
        isActive: true,
        category: "data",
        compatibleTiers: ["enterprise"],
        maxQuantity: 5,
        createdAt: now,
        updatedAt: now,
      }
    ];

    let addOnsCreated = 0;
    
    for (const addOn of addOns) {
      const existing = await ctx.db
        .query("creditAddOns")
        .withIndex("by_slug", (q) => q.eq("slug", addOn.slug))
        .first();
        
      if (!existing) {
        await ctx.db.insert("creditAddOns", addOn);
        addOnsCreated++;
      }
    }

    return {
      success: true,
      addOnsCreated,
    };
  },
});

// Seed both tiers and add-ons
export const seedAllPayAsYouScale = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    tiersCreated: v.number(),
    addOnsCreated: v.number(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    const tierResult = await ctx.scheduler.runAfter(0, "seedPayAsYouScale:seedSubscriptionTiers", {});
    const addOnResult = await ctx.scheduler.runAfter(0, "seedPayAsYouScale:seedCreditAddOns", {});
    
    return {
      success: true,
      tiersCreated: 0,
      addOnsCreated: 0,
      message: "Scheduled seeding of subscription tiers and credit add-ons",
    };
  },
});

// Get all available tiers and add-ons (for frontend)
export const getAvailableOptions = mutation({
  args: {},
  returns: v.object({
    tiers: v.array(v.any()),
    addOnsByCategory: v.object({
      outbound: v.array(v.any()),
      linkedin: v.array(v.any()),
      data: v.array(v.any()),
    }),
  }),
  handler: async (ctx) => {
    // Get active tiers
    const tiers = await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("asc")
      .collect();

    // Get active add-ons by category
    const allAddOns = await ctx.db
      .query("creditAddOns")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const addOnsByCategory = {
      outbound: allAddOns.filter(a => a.category === "outbound"),
      linkedin: allAddOns.filter(a => a.category === "linkedin"),
      data: allAddOns.filter(a => a.category === "data"),
    };

    return {
      tiers: tiers.sort((a, b) => a.priority - b.priority),
      addOnsByCategory,
    };
  },
});