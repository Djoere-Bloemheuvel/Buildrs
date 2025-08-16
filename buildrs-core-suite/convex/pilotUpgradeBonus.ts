import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * PILOT PACK UPGRADE BONUS SYSTEM
 * 
 * When a client upgrades from Pilot Pack to Tier 1+ within 14 days,
 * they get €149 discount (the Pilot Pack price) on their first subscription payment.
 */

// Check if client is eligible for Pilot Pack upgrade bonus
export const checkPilotUpgradeEligibility = query({
  args: {
    clientId: v.id("clients"),
    targetPackageSlug: v.string(), // "grow", "scale", or "dominate"
  },
  returns: v.object({
    isEligible: v.boolean(),
    discountAmount: v.number(), // in cents
    reason: v.string(),
    pilotOrderDate: v.optional(v.number()),
    daysRemaining: v.optional(v.number()),
  }),
  handler: async (ctx, { clientId, targetPackageSlug }) => {
    // Only Tier 1+ packages are eligible for upgrade
    const eligiblePackages = ["grow", "scale", "dominate"];
    if (!eligiblePackages.includes(targetPackageSlug)) {
      return {
        isEligible: false,
        discountAmount: 0,
        reason: "Target package is not eligible for upgrade bonus",
      };
    }

    // Find the client's Pilot Pack purchase
    const pilotOrders = await ctx.db
      .query("creditOrders")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .filter((q) => q.eq(q.field("paymentStatus"), "paid"))
      .filter((q) => q.eq(q.field("creditStatus"), "fulfilled"))
      .collect();

    // Find the Pilot Pack order
    let pilotOrder = null;
    for (const order of pilotOrders) {
      const package_ = await ctx.db.get(order.packageId);
      if (package_?.slug === "pilot") {
        pilotOrder = order;
        break;
      }
    }

    if (!pilotOrder) {
      return {
        isEligible: false,
        discountAmount: 0,
        reason: "Client heeft geen Pilot Pack aangeschaft",
      };
    }

    // Check if it's within 14 days
    const now = Date.now();
    const daysSincePilot = (now - pilotOrder.fulfilledAt!) / (1000 * 60 * 60 * 24);
    const daysRemaining = Math.max(0, 14 - Math.floor(daysSincePilot));

    if (daysSincePilot > 14) {
      return {
        isEligible: false,
        discountAmount: 0,
        reason: "De 14-dagen upgrade periode is verlopen",
        pilotOrderDate: pilotOrder.fulfilledAt,
        daysRemaining: 0,
      };
    }

    // Check if they already used the upgrade bonus
    const existingUpgrade = await ctx.db
      .query("pilotUpgradeBonuses")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .first();

    if (existingUpgrade) {
      return {
        isEligible: false,
        discountAmount: 0,
        reason: "Upgrade bonus al eerder gebruikt",
        pilotOrderDate: pilotOrder.fulfilledAt,
        daysRemaining,
      };
    }

    // Get the Pilot Pack price for the discount
    const pilotPackage = await ctx.db.get(pilotOrder.packageId);
    const discountAmount = pilotPackage?.price || 14900; // €149.00

    return {
      isEligible: true,
      discountAmount,
      reason: `Upgrade binnen ${Math.ceil(daysRemaining)} dagen voor €${(discountAmount / 100).toFixed(2)} korting!`,
      pilotOrderDate: pilotOrder.fulfilledAt,
      daysRemaining: Math.ceil(daysRemaining),
    };
  },
});

// Apply the Pilot Pack upgrade bonus
export const applyPilotUpgradeBonus = mutation({
  args: {
    clientId: v.id("clients"),
    newOrderId: v.string(),
    targetPackageSlug: v.string(),
    originalPrice: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    finalPrice: v.number(),
    discountApplied: v.number(),
    message: v.string(),
    bonusRecordId: v.optional(v.id("pilotUpgradeBonuses")),
  }),
  handler: async (ctx, { clientId, newOrderId, targetPackageSlug, originalPrice }) => {
    // Check eligibility first
    const eligibility = await ctx.runQuery(internal.pilotUpgradeBonus.checkPilotUpgradeEligibility, {
      clientId,
      targetPackageSlug,
    });

    if (!eligibility.isEligible) {
      return {
        success: false,
        finalPrice: originalPrice,
        discountApplied: 0,
        message: eligibility.reason,
      };
    }

    const discountAmount = eligibility.discountAmount;
    const finalPrice = Math.max(0, originalPrice - discountAmount); // Can't be negative

    // Record the bonus usage
    const bonusRecordId = await ctx.db.insert("pilotUpgradeBonuses", {
      clientId,
      orderId: newOrderId,
      discountAmount,
      originalPrice,
      finalPrice,
      targetPackageSlug,
      appliedAt: Date.now(),
      status: "applied",
      upgradeWithinDays: Math.floor((Date.now() - eligibility.pilotOrderDate!) / (1000 * 60 * 60 * 24)),
    });

    return {
      success: true,
      finalPrice,
      discountApplied: discountAmount,
      message: `€${(discountAmount / 100).toFixed(2)} Pilot Pack upgrade bonus toegepast!`,
      bonusRecordId,
    };
  },
});

// Get all upgrade bonuses for a client (for analytics)
export const getClientUpgradeBonuses = query({
  args: { clientId: v.id("clients") },
  returns: v.array(v.any()),
  handler: async (ctx, { clientId }) => {
    return await ctx.db
      .query("pilotUpgradeBonuses")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .collect();
  },
});

// Admin: Get all upgrade bonus statistics
export const getUpgradeBonusStats = query({
  args: {},
  returns: v.object({
    totalBonusesApplied: v.number(),
    totalDiscountGiven: v.number(),
    averageUpgradeTime: v.number(), // in days
    conversionRate: v.number(), // percentage of pilot users who upgrade
    bonusesByPackage: v.any(),
  }),
  handler: async (ctx) => {
    const allBonuses = await ctx.db.query("pilotUpgradeBonuses").collect();
    
    const totalBonusesApplied = allBonuses.length;
    const totalDiscountGiven = allBonuses.reduce((sum, bonus) => sum + bonus.discountAmount, 0);
    const averageUpgradeTime = totalBonusesApplied > 0 
      ? allBonuses.reduce((sum, bonus) => sum + bonus.upgradeWithinDays, 0) / totalBonusesApplied
      : 0;

    // Calculate conversion rate (pilot users who upgrade)
    const pilotOrders = await ctx.db
      .query("creditOrders")
      .filter((q) => q.eq(q.field("paymentStatus"), "paid"))
      .collect();

    let pilotUserCount = 0;
    for (const order of pilotOrders) {
      const package_ = await ctx.db.get(order.packageId);
      if (package_?.slug === "pilot") {
        pilotUserCount++;
      }
    }

    const conversionRate = pilotUserCount > 0 ? (totalBonusesApplied / pilotUserCount) * 100 : 0;

    // Group bonuses by target package
    const bonusesByPackage = allBonuses.reduce((acc, bonus) => {
      acc[bonus.targetPackageSlug] = (acc[bonus.targetPackageSlug] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalBonusesApplied,
      totalDiscountGiven,
      averageUpgradeTime,
      conversionRate,
      bonusesByPackage,
    };
  },
});