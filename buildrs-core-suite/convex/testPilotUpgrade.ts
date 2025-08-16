import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * TEST: Complete Pilot Pack to Tier 1 upgrade flow
 */

export const testCompleteUpgradeFlow = mutation({
  args: {
    testDomain: v.string(),
    testEmail: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    steps: v.array(v.object({
      step: v.string(),
      success: v.boolean(),
      result: v.any(),
    })),
    finalSummary: v.object({
      pilotOrderId: v.optional(v.string()),
      upgradeOrderId: v.optional(v.string()),
      originalGrowPrice: v.number(),
      discountApplied: v.number(),
      finalUpgradePrice: v.number(),
      totalPaid: v.number(),
    }),
  }),
  handler: async (ctx, { testDomain, testEmail }) => {
    const steps = [];
    let pilotOrderId = "";
    let upgradeOrderId = "";
    
    try {
      // Step 1: Create client with Pilot Pack purchase
      const clientId = await ctx.db.insert("clients", {
        name: "Test Upgrade Client",
        domain: testDomain,
        email: testEmail,
        currentLeadCredits: 0,
        currentEmailCredits: 0,
        currentLinkedinCredits: 0,
        currentAbmCredits: 0,
        hasUsedStartPackage: true,
        hasReceivedFirstMonthBonus: false,
        subscriptionStatus: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      steps.push({
        step: "1. Create test client",
        success: true,
        result: { clientId },
      });

      // Step 2: Get Pilot package
      const pilotPackage = await ctx.db
        .query("creditPackages")
        .withIndex("by_slug", (q) => q.eq("slug", "pilot"))
        .first();

      if (!pilotPackage) {
        throw new Error("Pilot package not found");
      }

      steps.push({
        step: "2. Get Pilot package",
        success: true,
        result: { packageId: pilotPackage._id, price: pilotPackage.price },
      });

      // Step 3: Create and fulfill Pilot Pack order
      pilotOrderId = `test_pilot_${Date.now()}`;
      const pilotOrderDocId = await ctx.db.insert("creditOrders", {
        orderId: pilotOrderId,
        clientId,
        packageId: pilotPackage._id,
        quantity: 1,
        totalPrice: pilotPackage.price,
        currency: pilotPackage.currency,
        paymentStatus: "paid",
        creditStatus: "fulfilled",
        fulfilledAt: Date.now(), // Fulfilled just now
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      steps.push({
        step: "3. Create and fulfill Pilot Pack order",
        success: true,
        result: { orderId: pilotOrderId, orderDocId: pilotOrderDocId },
      });

      // Step 4: Check upgrade eligibility for Grow package
      const eligibility = await ctx.runQuery(internal.pilotUpgradeBonus.checkPilotUpgradeEligibility, {
        clientId,
        targetPackageSlug: "grow",
      });

      steps.push({
        step: "4. Check upgrade eligibility",
        success: eligibility.isEligible,
        result: eligibility,
      });

      if (!eligibility.isEligible) {
        throw new Error(`Not eligible for upgrade: ${eligibility.reason}`);
      }

      // Step 5: Get Grow package details
      const growPackage = await ctx.db
        .query("creditPackages")
        .withIndex("by_slug", (q) => q.eq("slug", "grow"))
        .first();

      if (!growPackage) {
        throw new Error("Grow package not found");
      }

      steps.push({
        step: "5. Get Grow package",
        success: true,
        result: { packageId: growPackage._id, originalPrice: growPackage.price },
      });

      // Step 6: Apply upgrade bonus
      upgradeOrderId = `test_upgrade_${Date.now()}`;
      const bonusResult = await ctx.runMutation(internal.pilotUpgradeBonus.applyPilotUpgradeBonus, {
        clientId,
        newOrderId: upgradeOrderId,
        targetPackageSlug: "grow",
        originalPrice: growPackage.price,
      });

      steps.push({
        step: "6. Apply upgrade bonus",
        success: bonusResult.success,
        result: bonusResult,
      });

      // Step 7: Create discounted upgrade order
      const upgradeOrderDocId = await ctx.db.insert("creditOrders", {
        orderId: upgradeOrderId,
        clientId,
        packageId: growPackage._id,
        quantity: 1,
        totalPrice: bonusResult.finalPrice,
        currency: growPackage.currency,
        paymentStatus: "paid",
        creditStatus: "fulfilled",
        discountApplied: bonusResult.discountApplied,
        discountReason: "Pilot Pack upgrade bonus",
        fulfilledAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      steps.push({
        step: "7. Create discounted upgrade order",
        success: true,
        result: { orderId: upgradeOrderId, orderDocId: upgradeOrderDocId },
      });

      // Step 8: Update client subscription status
      await ctx.db.patch(clientId, {
        subscriptionStatus: "active",
        currentPackage: growPackage._id,
        updatedAt: Date.now(),
      });

      steps.push({
        step: "8. Update client subscription",
        success: true,
        result: { newStatus: "active", currentPackage: growPackage._id },
      });

      // Calculate final summary
      const finalSummary = {
        pilotOrderId,
        upgradeOrderId,
        originalGrowPrice: growPackage.price,
        discountApplied: bonusResult.discountApplied,
        finalUpgradePrice: bonusResult.finalPrice,
        totalPaid: pilotPackage.price + bonusResult.finalPrice,
      };

      return {
        success: true,
        steps,
        finalSummary,
      };

    } catch (error) {
      steps.push({
        step: "ERROR",
        success: false,
        result: { error: String(error) },
      });

      return {
        success: false,
        steps,
        finalSummary: {
          pilotOrderId,
          upgradeOrderId,
          originalGrowPrice: 0,
          discountApplied: 0,
          finalUpgradePrice: 0,
          totalPaid: 0,
        },
      };
    }
  },
});