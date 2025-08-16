import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * SEED CREDIT PACKAGES - LEAD ENGINE SPECIFIC
 * 
 * Exact packages as specified:
 * - Start: €99 one-time, 1x per domain, auto-upgrade to Grow
 * - Grow: €249/month 
 * - Scale: €499/month
 * - Dominate: €999/month
 * 
 * All with first month double lead credits bonus
 */

export const seedLeadEnginePackages = mutation({
  args: {},
  returns: v.object({
    packagesCreated: v.number(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    console.log("🌱 Seeding Lead Engine Credit Packages...");

    // Clear existing packages (dev only)
    const existingPackages = await ctx.db.query("creditPackages").collect();
    for (const pkg of existingPackages) {
      await ctx.db.delete(pkg._id);
    }

    const now = Date.now();

    // 1. START PACKAGE - €99 EENMALIG
    const startPackageId = await ctx.db.insert("creditPackages", {
      slug: "start",
      name: "Start",
      description: "Instappakket - Speciale actie, slechts 1x per bedrijf. Wordt na een maand automatisch omgezet naar Grow pakket.",
      
      // Credits (EENMALIG)
      leadCredits: 1000,
      emailCredits: 2000,
      linkedinCredits: 200,
      abmCredits: 0,
      
      // First month bonus (dubbele lead credits)
      firstMonthBonusLeadCredits: 2000, // 1000 + 1000 bonus
      
      // Pricing
      price: 9900, // €99.00 in cents
      currency: "EUR",
      billingPeriod: "one-time",
      
      // Business rules
      isActive: true,
      validFrom: now,
      maxPurchasesPerDomain: 1, // Only once per domain
      isSpecialOffer: true,
      autoUpgradeToPackage: undefined, // Will be set after creating Grow package
      
      // Display
      priority: 1,
      isPopular: true,
      features: [
        "1.000 Lead Credits (eenmalig)",
        "2.000 Email Credits (eenmalig)", 
        "200 LinkedIn Credits (eenmalig)",
        "Speciale introductie actie",
        "Slechts 1x per bedrijf",
        "Auto-upgrade naar Grow na 1 maand"
      ],
      tags: ["special-offer", "one-time", "starter"],
    });

    // 2. GROW PACKAGE - €249/MAAND
    const growPackageId = await ctx.db.insert("creditPackages", {
      slug: "grow",
      name: "Grow", 
      description: "Perfect voor groeiende bedrijven. Maandelijks hernieuwbare credits.",
      
      // Credits (PER MAAND)
      leadCredits: 1000,
      emailCredits: 4000,
      linkedinCredits: 200,
      abmCredits: 0,
      
      // First month bonus (dubbele lead credits)
      firstMonthBonusLeadCredits: 2000, // 1000 + 1000 bonus
      
      // Pricing
      price: 24900, // €249.00 in cents
      currency: "EUR",
      billingPeriod: "monthly",
      
      // Business rules
      isActive: true,
      validFrom: now,
      maxPurchasesPerDomain: undefined, // No limit
      isSpecialOffer: false,
      autoUpgradeToPackage: undefined,
      
      // Display
      priority: 2,
      isPopular: true,
      features: [
        "1.000 Lead Credits per maand",
        "4.000 Email Credits per maand",
        "200 LinkedIn Credits per maand", 
        "Eerste maand: 2.000 Lead Credits",
        "Credits rollen over bij ongebruik",
        "Maandelijks opzegbaar"
      ],
      tags: ["monthly", "popular", "growth"],
    });

    // 3. SCALE PACKAGE - €499/MAAND  
    const scalePackageId = await ctx.db.insert("creditPackages", {
      slug: "scale",
      name: "Scale",
      description: "Voor bedrijven die serieus willen schalen. Inclusief ABM functies.",
      
      // Credits (PER MAAND)
      leadCredits: 2500,
      emailCredits: 10000,
      linkedinCredits: 400,
      abmCredits: 25,
      
      // First month bonus (dubbele lead credits)
      firstMonthBonusLeadCredits: 5000, // 2500 + 2500 bonus
      
      // Pricing
      price: 49900, // €499.00 in cents
      currency: "EUR", 
      billingPeriod: "monthly",
      
      // Business rules
      isActive: true,
      validFrom: now,
      maxPurchasesPerDomain: undefined,
      isSpecialOffer: false,
      autoUpgradeToPackage: undefined,
      
      // Display
      priority: 3,
      isPopular: false,
      features: [
        "2.500 Lead Credits per maand",
        "10.000 Email Credits per maand",
        "400 LinkedIn Credits per maand",
        "25 ABM Credits per maand",
        "Eerste maand: 5.000 Lead Credits",
        "Account Based Marketing",
        "Credits rollen over bij ongebruik"
      ],
      tags: ["monthly", "scale", "abm"],
    });

    // 4. DOMINATE PACKAGE - €999/MAAND
    const dominatePackageId = await ctx.db.insert("creditPackages", {
      slug: "dominate",
      name: "Dominate",
      description: "Voor marktleiders die de concurrentie willen domineren. Maximum volume en ABM.",
      
      // Credits (PER MAAND)
      leadCredits: 5000,
      emailCredits: 20000,
      linkedinCredits: 400,
      abmCredits: 50,
      
      // First month bonus (dubbele lead credits)  
      firstMonthBonusLeadCredits: 10000, // 5000 + 5000 bonus
      
      // Pricing
      price: 99900, // €999.00 in cents
      currency: "EUR",
      billingPeriod: "monthly",
      
      // Business rules
      isActive: true,
      validFrom: now,
      maxPurchasesPerDomain: undefined,
      isSpecialOffer: false,
      autoUpgradeToPackage: undefined,
      
      // Display
      priority: 4,
      isPopular: false,
      features: [
        "5.000 Lead Credits per maand",
        "20.000 Email Credits per maand", 
        "400 LinkedIn Credits per maand",
        "50 ABM Credits per maand",
        "Eerste maand: 10.000 Lead Credits",
        "Premium Account Based Marketing",
        "Credits rollen over bij ongebruik",
        "Priority support"
      ],
      tags: ["monthly", "enterprise", "dominate"],
    });

    // Update Start package to auto-upgrade to Grow
    await ctx.db.patch(startPackageId, {
      autoUpgradeToPackage: growPackageId,
    });

    console.log("✅ Lead Engine Credit Packages seeded successfully!");
    console.log("📦 Packages created:");
    console.log("  - Start: €99 (one-time, auto-upgrade to Grow)");
    console.log("  - Grow: €249/month"); 
    console.log("  - Scale: €499/month");
    console.log("  - Dominate: €999/month");
    console.log("🎁 All packages include first month double lead credits!");

    return {
      packagesCreated: 4,
      message: "Successfully seeded all 4 Lead Engine credit packages with exact specifications",
    };
  },
});