import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * PAY-AS-YOU-SCALE CREDIT SYSTEM
 * 
 * Core business logic for flexible subscription + add-ons credit system
 */

// ===============================
// SUBSCRIPTION MANAGEMENT
// ===============================

// Get client's current subscription with all add-ons
export const getClientSubscription = query({
  args: { clientId: v.id("clients") },
  returns: v.union(v.null(), v.object({
    subscription: v.any(),
    baseTier: v.any(),
    addOns: v.array(v.any()),
    currentMonthAllocation: v.optional(v.any()),
    totalMonthlyCredits: v.object({
      leadCredits: v.number(),
      emailCredits: v.number(),
      linkedinCredits: v.number(),
      abmCredits: v.number(),
    }),
    totalMonthlyCost: v.number(),
  })),
  handler: async (ctx, { clientId }) => {
    // Get active subscription
    const subscription = await ctx.db
      .query("clientSubscriptions")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!subscription) {
      return null;
    }

    // Get base tier details
    const baseTier = await ctx.db.get(subscription.baseTier);
    if (!baseTier) {
      throw new Error("Base tier not found");
    }

    // Get all active add-ons
    const addOnsData = await ctx.db
      .query("subscriptionAddOns")
      .withIndex("by_subscription", (q) => q.eq("subscriptionId", subscription._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Enrich add-ons with details
    const addOns = [];
    let totalAddOnCredits = {
      leadCredits: 0,
      emailCredits: 0,
      linkedinCredits: 0,
      abmCredits: 0,
    };

    for (const addOnSub of addOnsData) {
      const addOn = await ctx.db.get(addOnSub.addOnId);
      if (addOn) {
        const totalCredits = addOn.creditAmount * addOnSub.quantity;
        addOns.push({
          ...addOnSub,
          addOn,
          totalCredits,
        });

        // Accumulate credits by type
        if (addOn.creditType === "leads") {
          totalAddOnCredits.leadCredits += totalCredits;
        } else if (addOn.creditType === "emails") {
          totalAddOnCredits.emailCredits += totalCredits;
        } else if (addOn.creditType === "linkedin") {
          totalAddOnCredits.linkedinCredits += totalCredits;
        } else if (addOn.creditType === "abm") {
          totalAddOnCredits.abmCredits += totalCredits;
        }
      }
    }

    // Get current month allocation
    const currentMonth = new Date().toISOString().slice(0, 7); // "2025-01"
    const currentMonthAllocation = await ctx.db
      .query("monthlyAllocation")
      .withIndex("by_client_month", (q) => q.eq("clientId", clientId).eq("month", currentMonth))
      .first();

    // Calculate total monthly credits
    const totalMonthlyCredits = {
      leadCredits: baseTier.baseLeadCredits + totalAddOnCredits.leadCredits,
      emailCredits: baseTier.baseEmailCredits + totalAddOnCredits.emailCredits,
      linkedinCredits: baseTier.baseLinkedinCredits + totalAddOnCredits.linkedinCredits,
      abmCredits: baseTier.baseAbmCredits + totalAddOnCredits.abmCredits,
    };

    // Calculate total monthly cost
    const totalMonthlyCost = baseTier.monthlyPrice + addOns.reduce((sum, addon) => sum + addon.totalPrice, 0);

    return {
      subscription,
      baseTier,
      addOns,
      currentMonthAllocation,
      totalMonthlyCredits,
      totalMonthlyCost,
    };
  },
});

// ===============================
// CREDIT ALLOCATION & ROLLOVER
// ===============================

// Create monthly allocation for a client (called at billing cycle start)
export const createMonthlyAllocation = mutation({
  args: {
    clientId: v.id("clients"),
    subscriptionId: v.id("clientSubscriptions"),
    periodStart: v.number(),
    periodEnd: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    allocationId: v.string(),
    totalCredits: v.object({
      leadCredits: v.number(),
      emailCredits: v.number(),
      linkedinCredits: v.number(),
      abmCredits: v.number(),
    }),
    rolloverApplied: v.object({
      leadCredits: v.number(),
      emailCredits: v.number(),
    }),
  }),
  handler: async (ctx, { clientId, subscriptionId, periodStart, periodEnd }) => {
    const month = new Date(periodStart).toISOString().slice(0, 7);

    // Check if allocation already exists
    const existingAllocation = await ctx.db
      .query("monthlyAllocation")
      .withIndex("by_client_month", (q) => q.eq("clientId", clientId).eq("month", month))
      .first();

    if (existingAllocation) {
      return {
        success: false,
        allocationId: existingAllocation._id,
        totalCredits: {
          leadCredits: existingAllocation.totalLeadCredits,
          emailCredits: existingAllocation.totalEmailCredits,
          linkedinCredits: existingAllocation.totalLinkedinCredits,
          abmCredits: existingAllocation.totalAbmCredits,
        },
        rolloverApplied: existingAllocation.rolloverFromPrevious,
      };
    }

    // Get subscription details
    const subscription = await ctx.db.get(subscriptionId);
    if (!subscription || subscription.clientId !== clientId) {
      throw new Error("Invalid subscription");
    }

    const baseTier = await ctx.db.get(subscription.baseTier);
    if (!baseTier) {
      throw new Error("Base tier not found");
    }

    // Calculate base credits
    let baseCredits = {
      leadCredits: baseTier.baseLeadCredits,
      emailCredits: baseTier.baseEmailCredits,
      linkedinCredits: baseTier.baseLinkedinCredits,
      abmCredits: baseTier.baseAbmCredits,
    };

    // Add credits from active add-ons
    const addOns = await ctx.db
      .query("subscriptionAddOns")
      .withIndex("by_subscription", (q) => q.eq("subscriptionId", subscriptionId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    let addonCredits = {
      leadCredits: 0,
      emailCredits: 0,
      linkedinCredits: 0,
      abmCredits: 0,
    };

    for (const addOnSub of addOns) {
      const addOn = await ctx.db.get(addOnSub.addOnId);
      if (addOn) {
        const totalCredits = addOn.creditAmount * addOnSub.quantity;
        if (addOn.creditType === "leads") {
          addonCredits.leadCredits += totalCredits;
        } else if (addOn.creditType === "emails") {
          addonCredits.emailCredits += totalCredits;
        } else if (addOn.creditType === "linkedin") {
          addonCredits.linkedinCredits += totalCredits;
        } else if (addOn.creditType === "abm") {
          addonCredits.abmCredits += totalCredits;
        }
      }
    }

    // Calculate rollover (only for leads and emails)
    const rolloverCredits = await calculateRolloverCredits(ctx, clientId, month);

    // Apply 2x monthly bundle cap for rollover
    const monthlyCap = {
      leadCredits: 2 * (baseCredits.leadCredits + addonCredits.leadCredits),
      emailCredits: 2 * (baseCredits.emailCredits + addonCredits.emailCredits),
    };

    const cappedRollover = {
      leadCredits: Math.min(rolloverCredits.leadCredits, monthlyCap.leadCredits - (baseCredits.leadCredits + addonCredits.leadCredits)),
      emailCredits: Math.min(rolloverCredits.emailCredits, monthlyCap.emailCredits - (baseCredits.emailCredits + addonCredits.emailCredits)),
    };

    // Total credits = base + add-ons + rollover
    const totalCredits = {
      leadCredits: baseCredits.leadCredits + addonCredits.leadCredits + cappedRollover.leadCredits,
      emailCredits: baseCredits.emailCredits + addonCredits.emailCredits + cappedRollover.emailCredits,
      linkedinCredits: baseCredits.linkedinCredits + addonCredits.linkedinCredits, // No rollover
      abmCredits: baseCredits.abmCredits + addonCredits.abmCredits, // No rollover
    };

    // Create allocation record
    const allocationId = await ctx.db.insert("monthlyAllocation", {
      clientId,
      subscriptionId,
      periodStart,
      periodEnd,
      month,
      
      // Base tier credits
      baseLeadCredits: baseCredits.leadCredits,
      baseEmailCredits: baseCredits.emailCredits,
      baseLinkedinCredits: baseCredits.linkedinCredits,
      baseAbmCredits: baseCredits.abmCredits,
      
      // Add-on credits
      addonLeadCredits: addonCredits.leadCredits,
      addonEmailCredits: addonCredits.emailCredits,
      addonLinkedinCredits: addonCredits.linkedinCredits,
      addonAbmCredits: addonCredits.abmCredits,
      
      // Total credits
      totalLeadCredits: totalCredits.leadCredits,
      totalEmailCredits: totalCredits.emailCredits,
      totalLinkedinCredits: totalCredits.linkedinCredits,
      totalAbmCredits: totalCredits.abmCredits,
      
      // Usage (starts at 0)
      usedLeadCredits: 0,
      usedEmailCredits: 0,
      usedLinkedinCredits: 0,
      usedAbmCredits: 0,
      
      // Rollover tracking
      rolloverFromPrevious: cappedRollover,
      
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create rollover records for tracking
    if (cappedRollover.leadCredits > 0) {
      await createRolloverRecord(ctx, clientId, allocationId, "leads", cappedRollover.leadCredits, month);
    }
    if (cappedRollover.emailCredits > 0) {
      await createRolloverRecord(ctx, clientId, allocationId, "emails", cappedRollover.emailCredits, month);
    }

    return {
      success: true,
      allocationId,
      totalCredits,
      rolloverApplied: cappedRollover,
    };
  },
});

// Helper function to calculate available rollover credits
async function calculateRolloverCredits(ctx: any, clientId: string, currentMonth: string) {
  const rolloverCredits = { leadCredits: 0, emailCredits: 0 };
  
  // Get previous 3 months of allocations
  const currentDate = new Date(currentMonth + "-01");
  const months = [];
  
  for (let i = 1; i <= 3; i++) {
    const prevDate = new Date(currentDate);
    prevDate.setMonth(prevDate.getMonth() - i);
    months.push(prevDate.toISOString().slice(0, 7));
  }

  // Check each previous month for unused credits
  for (const month of months) {
    const allocation = await ctx.db
      .query("monthlyAllocation")
      .withIndex("by_client_month", (q) => q.eq("clientId", clientId).eq("month", month))
      .first();

    if (allocation && allocation.status === "completed") {
      // Calculate unused credits
      const unusedLeads = allocation.totalLeadCredits - allocation.usedLeadCredits;
      const unusedEmails = allocation.totalEmailCredits - allocation.usedEmailCredits;

      if (unusedLeads > 0) {
        rolloverCredits.leadCredits += unusedLeads;
      }
      if (unusedEmails > 0) {
        rolloverCredits.emailCredits += unusedEmails;
      }
    }
  }

  return rolloverCredits;
}

// Helper function to create rollover tracking record
async function createRolloverRecord(ctx: any, clientId: string, targetAllocationId: string, creditType: string, amount: number, targetMonth: string) {
  // Find the source allocation (most recent with unused credits)
  const currentDate = new Date(targetMonth + "-01");
  const threeMonthsAgo = new Date(currentDate);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const expiresAt = threeMonthsAgo.getTime() + (3 * 30 * 24 * 60 * 60 * 1000); // 3 months in ms

  await ctx.db.insert("creditRollovers", {
    clientId,
    sourceAllocationId: "", // We'll need to track this properly
    sourceMonth: "", // Previous month with unused credits
    targetAllocationId,
    targetMonth,
    creditType,
    amountRolled: amount,
    amountUsed: 0,
    amountExpired: 0,
    rolledAt: Date.now(),
    expiresAt,
    status: "active",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

// ===============================
// CREDIT USAGE
// ===============================

// Use credits from current allocation (with rollover priority)
export const useCredits = mutation({
  args: {
    clientId: v.id("clients"),
    creditType: v.string(),
    amount: v.number(),
    description: v.string(),
    referenceId: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    creditsUsed: v.number(),
    remainingCredits: v.number(),
    rolloverUsed: v.number(),
    newCreditsUsed: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, { clientId, creditType, amount, description, referenceId }) => {
    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }

    const currentMonth = new Date().toISOString().slice(0, 7);

    // Get current month allocation
    const allocation = await ctx.db
      .query("monthlyAllocation")
      .withIndex("by_client_month", (q) => q.eq("clientId", clientId).eq("month", currentMonth))
      .first();

    if (!allocation) {
      throw new Error("No allocation found for current month");
    }

    // Get current usage and total for this credit type
    let currentUsed = 0;
    let totalAvailable = 0;

    if (creditType === "leads") {
      currentUsed = allocation.usedLeadCredits;
      totalAvailable = allocation.totalLeadCredits;
    } else if (creditType === "emails") {
      currentUsed = allocation.usedEmailCredits;
      totalAvailable = allocation.totalEmailCredits;
    } else if (creditType === "linkedin") {
      currentUsed = allocation.usedLinkedinCredits;
      totalAvailable = allocation.totalLinkedinCredits;
    } else if (creditType === "abm") {
      currentUsed = allocation.usedAbmCredits;
      totalAvailable = allocation.totalAbmCredits;
    } else {
      throw new Error("Invalid credit type");
    }

    const remainingCredits = totalAvailable - currentUsed;

    if (remainingCredits < amount) {
      throw new Error(`Insufficient ${creditType} credits. Available: ${remainingCredits}, Required: ${amount}`);
    }

    // Update usage
    const newUsed = currentUsed + amount;
    const updates: any = { updatedAt: Date.now() };

    if (creditType === "leads") {
      updates.usedLeadCredits = newUsed;
    } else if (creditType === "emails") {
      updates.usedEmailCredits = newUsed;
    } else if (creditType === "linkedin") {
      updates.usedLinkedinCredits = newUsed;
    } else if (creditType === "abm") {
      updates.usedAbmCredits = newUsed;
    }

    await ctx.db.patch(allocation._id, updates);

    // Track rollover usage (for leads/emails only)
    let rolloverUsed = 0;
    let newCreditsUsed = amount;

    if (creditType === "leads" || creditType === "emails") {
      const rolloverAmount = creditType === "leads" 
        ? allocation.rolloverFromPrevious.leadCredits
        : allocation.rolloverFromPrevious.emailCredits;

      if (rolloverAmount > 0 && currentUsed < rolloverAmount) {
        // Still using rollover credits
        rolloverUsed = Math.min(amount, rolloverAmount - currentUsed);
        newCreditsUsed = amount - rolloverUsed;

        // Update rollover records
        await updateRolloverUsage(ctx, clientId, currentMonth, creditType, rolloverUsed);
      }
    }

    // Create transaction record for audit trail
    await ctx.db.insert("creditTransactions", {
      transactionId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clientId,
      creditType,
      debitAmount: amount,
      creditAmount: 0,
      netAmount: -amount,
      transactionType: "usage",
      description,
      referenceId,
      timestamp: Date.now(),
      systemGenerated: true,
      balanceAfter: remainingCredits - amount,
      runningTotal: 0, // TODO: Calculate properly
      status: "completed",
    });

    return {
      success: true,
      creditsUsed: amount,
      remainingCredits: remainingCredits - amount,
      rolloverUsed,
      newCreditsUsed,
      message: `Successfully used ${amount} ${creditType} credits`,
    };
  },
});

// Helper function to update rollover usage tracking
async function updateRolloverUsage(ctx: any, clientId: string, month: string, creditType: string, amountUsed: number) {
  const rollovers = await ctx.db
    .query("creditRollovers")
    .withIndex("by_client", (q) => q.eq("clientId", clientId))
    .filter((q) => q.eq(q.field("targetMonth"), month))
    .filter((q) => q.eq(q.field("creditType"), creditType))
    .filter((q) => q.eq(q.field("status"), "active"))
    .collect();

  let remainingToUse = amountUsed;

  for (const rollover of rollovers) {
    if (remainingToUse <= 0) break;

    const available = rollover.amountRolled - rollover.amountUsed;
    const toUse = Math.min(remainingToUse, available);

    if (toUse > 0) {
      const newUsed = rollover.amountUsed + toUse;
      const updates: any = {
        amountUsed: newUsed,
        updatedAt: Date.now(),
      };

      if (newUsed >= rollover.amountRolled) {
        updates.status = "fully_used";
      }

      await ctx.db.patch(rollover._id, updates);
      remainingToUse -= toUse;
    }
  }
}

// ===============================
// SUBSCRIPTION CHANGES
// ===============================

// Request subscription change (tier upgrade/downgrade or add-on modification)
export const requestSubscriptionChange = mutation({
  args: {
    clientId: v.id("clients"),
    changeType: v.string(),
    newTierId: v.optional(v.id("subscriptionTiers")),
    addOnChanges: v.optional(v.array(v.object({
      addOnId: v.id("creditAddOns"),
      action: v.string(), // "add", "remove", "modify"
      quantity: v.number(),
    }))),
    effectiveDate: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    changeRequestId: v.string(),
    proratedAmount: v.number(),
    nextCycleAmount: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get current subscription
    const subscription = await ctx.db
      .query("clientSubscriptions")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!subscription) {
      throw new Error("No active subscription found");
    }

    // Calculate pricing impact
    const pricingImpact = await calculatePricingImpact(ctx, subscription, args);

    // Create change request
    const changeRequestId = await ctx.db.insert("subscriptionChanges", {
      clientId: args.clientId,
      subscriptionId: subscription._id,
      changeType: args.changeType,
      oldTierId: subscription.baseTier,
      newTierId: args.newTierId,
      // oldAddOns and newAddOns would be calculated here
      proratedAmount: pricingImpact.proratedAmount,
      nextCycleAmount: pricingImpact.nextCycleAmount,
      effectiveDate: args.effectiveDate || Date.now(),
      requestedAt: Date.now(),
      status: "pending",
      requestedBy: "client", // In real app, this would be the authenticated user
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      success: true,
      changeRequestId,
      proratedAmount: pricingImpact.proratedAmount,
      nextCycleAmount: pricingImpact.nextCycleAmount,
      message: "Subscription change request created successfully",
    };
  },
});

// Helper function to calculate pricing impact of subscription changes
async function calculatePricingImpact(ctx: any, subscription: any, changeArgs: any) {
  // This is a simplified calculation - in production you'd need more complex proration logic
  let proratedAmount = 0;
  let nextCycleAmount = 0;

  if (changeArgs.newTierId) {
    const newTier = await ctx.db.get(changeArgs.newTierId);
    const oldTier = await ctx.db.get(subscription.baseTier);
    
    if (newTier && oldTier) {
      const priceDiff = newTier.monthlyPrice - oldTier.monthlyPrice;
      
      // Calculate days remaining in current period
      const daysRemaining = Math.max(0, 
        (subscription.currentPeriodEnd - Date.now()) / (1000 * 60 * 60 * 24)
      );
      const daysInPeriod = 30; // Assuming monthly billing
      
      proratedAmount = Math.round((priceDiff * daysRemaining) / daysInPeriod);
      nextCycleAmount = newTier.monthlyPrice;
    }
  }

  return { proratedAmount, nextCycleAmount };
}

// ===============================
// ROLLOVER EXPIRY MANAGEMENT
// ===============================

// Expire old rollover credits (run monthly)
export const expireRolloverCredits = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    expiredRollovers: v.number(),
    totalExpiredCredits: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    
    // Find all rollover records that should expire
    const expiredRollovers = await ctx.db
      .query("creditRollovers")
      .withIndex("by_expires_at", (q) => q.lte("expiresAt", now))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    let totalExpiredCredits = 0;

    for (const rollover of expiredRollovers) {
      const unusedAmount = rollover.amountRolled - rollover.amountUsed;
      
      await ctx.db.patch(rollover._id, {
        status: "expired",
        amountExpired: unusedAmount,
        expiredAt: now,
        updatedAt: now,
      });

      totalExpiredCredits += unusedAmount;
    }

    return {
      success: true,
      expiredRollovers: expiredRollovers.length,
      totalExpiredCredits,
    };
  },
});

// ===============================
// STRIPE WEBHOOK HELPERS
// ===============================

// Create subscription record after successful Stripe checkout
export const createSubscriptionRecord = mutation({
  args: {
    clientId: v.id("clients"),
    baseTierId: v.id("subscriptionTiers"),
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    addOns: v.array(v.object({
      addOnId: v.id("creditAddOns"),
      quantity: v.number(),
    })),
  },
  returns: v.object({
    success: v.boolean(),
    subscriptionId: v.string(),
  }),
  handler: async (ctx, { clientId, baseTierId, stripeSubscriptionId, stripeCustomerId, addOns }) => {
    const now = Date.now();
    const thirtyDaysFromNow = now + (30 * 24 * 60 * 60 * 1000);

    // Create subscription record
    const subscriptionId = await ctx.db.insert("clientSubscriptions", {
      clientId,
      baseTier: baseTierId,
      status: "active",
      billingPeriod: "monthly",
      currentPeriodStart: now,
      currentPeriodEnd: thirtyDaysFromNow,
      nextBillingDate: thirtyDaysFromNow,
      stripeSubscriptionId,
      stripeCustomerId,
      createdAt: now,
      updatedAt: now,
    });

    // Create add-on records
    for (const addOnRequest of addOns) {
      const addOn = await ctx.db.get(addOnRequest.addOnId);
      if (addOn) {
        await ctx.db.insert("subscriptionAddOns", {
          subscriptionId,
          addOnId: addOnRequest.addOnId,
          quantity: addOnRequest.quantity,
          unitPrice: addOn.monthlyPrice,
          totalPrice: addOnRequest.quantity * addOn.monthlyPrice,
          addedAt: now,
          status: "active",
          stripeSubscriptionItemId: "", // Will be updated when we get the subscription details
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // Create initial monthly allocation
    await ctx.scheduler.runAfter(0, internal.payAsYouScale.createMonthlyAllocation, {
      clientId,
      subscriptionId,
      periodStart: now,
      periodEnd: thirtyDaysFromNow,
    });

    return {
      success: true,
      subscriptionId,
    };
  },
});

// Add a new add-on to existing subscription
export const addSubscriptionAddOn = mutation({
  args: {
    subscriptionId: v.id("clientSubscriptions"),
    addOnId: v.id("creditAddOns"),
    quantity: v.number(),
    stripeSubscriptionItemId: v.string(),
    unitPrice: v.number(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { subscriptionId, addOnId, quantity, stripeSubscriptionItemId, unitPrice }) => {
    await ctx.db.insert("subscriptionAddOns", {
      subscriptionId,
      addOnId,
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      addedAt: Date.now(),
      status: "active",
      stripeSubscriptionItemId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Remove add-on from subscription
export const removeSubscriptionAddOn = mutation({
  args: {
    subscriptionId: v.id("clientSubscriptions"),
    addOnId: v.id("creditAddOns"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { subscriptionId, addOnId }) => {
    const addOn = await ctx.db
      .query("subscriptionAddOns")
      .withIndex("by_subscription", (q) => q.eq("subscriptionId", subscriptionId))
      .filter((q) => q.eq(q.field("addOnId"), addOnId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (addOn) {
      await ctx.db.patch(addOn._id, {
        status: "cancelled",
        cancelledAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// ===============================
// ANALYTICS & REPORTING
// ===============================

// Get credit usage analytics for a client
export const getCreditAnalytics = query({
  args: { 
    clientId: v.id("clients"),
    months: v.optional(v.number()), // How many months back to analyze
  },
  returns: v.object({
    currentMonth: v.any(),
    historicalUsage: v.array(v.any()),
    rolloverTrends: v.object({
      totalRolloverUsed: v.number(),
      totalRolloverExpired: v.number(),
      rolloverEfficiency: v.number(), // % of rollover actually used
    }),
    recommendations: v.array(v.string()),
  }),
  handler: async (ctx, { clientId, months = 6 }) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // Get current month allocation
    const currentAllocation = await ctx.db
      .query("monthlyAllocation")
      .withIndex("by_client_month", (q) => q.eq("clientId", clientId).eq("month", currentMonth))
      .first();

    // Get historical data
    const historicalData = [];
    const currentDate = new Date();
    
    for (let i = 0; i < months; i++) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      const month = date.toISOString().slice(0, 7);
      
      const allocation = await ctx.db
        .query("monthlyAllocation")
        .withIndex("by_client_month", (q) => q.eq("clientId", clientId).eq("month", month))
        .first();
      
      if (allocation) {
        historicalData.push({
          month,
          ...allocation,
          efficiency: {
            leads: allocation.totalLeadCredits > 0 ? (allocation.usedLeadCredits / allocation.totalLeadCredits * 100) : 0,
            emails: allocation.totalEmailCredits > 0 ? (allocation.usedEmailCredits / allocation.totalEmailCredits * 100) : 0,
            linkedin: allocation.totalLinkedinCredits > 0 ? (allocation.usedLinkedinCredits / allocation.totalLinkedinCredits * 100) : 0,
            abm: allocation.totalAbmCredits > 0 ? (allocation.usedAbmCredits / allocation.totalAbmCredits * 100) : 0,
          },
        });
      }
    }

    // Analyze rollover trends
    const rolloverData = await ctx.db
      .query("creditRollovers")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .collect();

    const totalRolloverUsed = rolloverData.reduce((sum, r) => sum + r.amountUsed, 0);
    const totalRolloverExpired = rolloverData.reduce((sum, r) => sum + r.amountExpired, 0);
    const totalRollover = totalRolloverUsed + totalRolloverExpired;
    const rolloverEfficiency = totalRollover > 0 ? (totalRolloverUsed / totalRollover * 100) : 0;

    // Generate recommendations
    const recommendations = [];
    
    if (rolloverEfficiency < 50) {
      recommendations.push("Consider downgrading your plan - you're not using rollover credits efficiently");
    }
    
    const avgUsage = historicalData.reduce((sum, h) => sum + h.efficiency.leads, 0) / historicalData.length;
    if (avgUsage > 90) {
      recommendations.push("Consider adding lead credit add-ons - you're consistently using >90% of credits");
    }

    return {
      currentMonth: currentAllocation,
      historicalUsage: historicalData,
      rolloverTrends: {
        totalRolloverUsed,
        totalRolloverExpired,
        rolloverEfficiency,
      },
      recommendations,
    };
  },
});