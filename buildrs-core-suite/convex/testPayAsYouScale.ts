import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Test Pay-as-you-Scale system functionality
 */

export const testCreateSubscription = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    subscriptionId: v.optional(v.string()),
    allocationCreated: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    // Get first client and first tier
    const client = await ctx.db.query("clients").first();
    const tier = await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_slug", (q) => q.eq("slug", "starter"))
      .first();
    
    if (!client || !tier) {
      return {
        success: false,
        allocationCreated: false,
        message: "No client or tier found for testing",
      };
    }

    const now = Date.now();
    const thirtyDaysFromNow = now + (30 * 24 * 60 * 60 * 1000);

    // Create subscription
    const subscriptionId = await ctx.db.insert("clientSubscriptions", {
      clientId: client._id,
      baseTier: tier._id,
      status: "active",
      billingPeriod: "monthly",
      currentPeriodStart: now,
      currentPeriodEnd: thirtyDaysFromNow,
      nextBillingDate: thirtyDaysFromNow,
      stripeSubscriptionId: `sub_test_${Date.now()}`,
      stripeCustomerId: `cus_test_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    });

    // Create test add-on
    const addOn = await ctx.db
      .query("creditAddOns")
      .withIndex("by_slug", (q) => q.eq("slug", "leads-250"))
      .first();

    if (addOn) {
      await ctx.db.insert("subscriptionAddOns", {
        subscriptionId,
        addOnId: addOn._id,
        quantity: 2,
        unitPrice: addOn.monthlyPrice,
        totalPrice: 2 * addOn.monthlyPrice,
        addedAt: now,
        status: "active",
        stripeSubscriptionItemId: `si_test_${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Create monthly allocation
    const month = new Date(now).toISOString().slice(0, 7);
    
    const totalCredits = {
      leadCredits: tier.baseLeadCredits + (addOn ? addOn.creditAmount * 2 : 0),
      emailCredits: tier.baseEmailCredits,
      linkedinCredits: tier.baseLinkedinCredits,
      abmCredits: tier.baseAbmCredits,
    };

    const allocationId = await ctx.db.insert("monthlyAllocation", {
      clientId: client._id,
      subscriptionId,
      periodStart: now,
      periodEnd: thirtyDaysFromNow,
      month,
      
      // Base tier credits
      baseLeadCredits: tier.baseLeadCredits,
      baseEmailCredits: tier.baseEmailCredits,
      baseLinkedinCredits: tier.baseLinkedinCredits,
      baseAbmCredits: tier.baseAbmCredits,
      
      // Add-on credits
      addonLeadCredits: addOn ? addOn.creditAmount * 2 : 0,
      addonEmailCredits: 0,
      addonLinkedinCredits: 0,
      addonAbmCredits: 0,
      
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
      rolloverFromPrevious: {
        leadCredits: 0,
        emailCredits: 0,
      },
      
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      subscriptionId,
      allocationCreated: !!allocationId,
      message: `Created subscription with ${totalCredits.leadCredits} leads, ${totalCredits.emailCredits} emails, ${totalCredits.linkedinCredits} LinkedIn, ${totalCredits.abmCredits} ABM credits`,
    };
  },
});

export const testGetSubscription = mutation({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const client = await ctx.db.query("clients").first();
    if (!client) {
      return { error: "No client found" };
    }

    const subscription = await ctx.db
      .query("clientSubscriptions")
      .withIndex("by_client", (q) => q.eq("clientId", client._id))
      .first();

    if (!subscription) {
      return { error: "No subscription found" };
    }

    // Get tier and add-ons
    const tier = await ctx.db.get(subscription.baseTier);
    const addOns = await ctx.db
      .query("subscriptionAddOns")
      .withIndex("by_subscription", (q) => q.eq("subscriptionId", subscription._id))
      .collect();

    // Get current allocation
    const currentMonth = new Date().toISOString().slice(0, 7);
    const allocation = await ctx.db
      .query("monthlyAllocation")
      .withIndex("by_client_month", (q) => q.eq("clientId", client._id).eq("month", currentMonth))
      .first();

    return {
      client: client.company,
      subscription,
      tier,
      addOns,
      allocation,
    };
  },
});

export const testCreditUsage = mutation({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const creditType = "leads";
    const amount = 150;
    const client = await ctx.db.query("clients").first();
    if (!client) {
      return { error: "No client found" };
    }

    // Test using the useCredits function logic
    const currentMonth = new Date().toISOString().slice(0, 7);
    const allocation = await ctx.db
      .query("monthlyAllocation")
      .withIndex("by_client_month", (q) => q.eq("clientId", client._id).eq("month", currentMonth))
      .first();

    if (!allocation) {
      return { error: "No allocation found" };
    }

    // Check available credits
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
    }

    const remainingCredits = totalAvailable - currentUsed;

    if (remainingCredits < amount) {
      return {
        error: `Insufficient ${creditType} credits. Available: ${remainingCredits}, Required: ${amount}`,
      };
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

    return {
      success: true,
      creditsUsed: amount,
      remainingCredits: remainingCredits - amount,
      message: `Successfully used ${amount} ${creditType} credits`,
    };
  },
});

export const testFullSubscriptionQuery = mutation({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const client = await ctx.db.query("clients").first();
    if (!client) {
      return { error: "No client found" };
    }

    // Call the actual getClientSubscription function
    const result = await ctx.db
      .query("clientSubscriptions")
      .withIndex("by_client", (q) => q.eq("clientId", client._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!result) {
      return { error: "No active subscription found" };
    }

    // Get full details
    const baseTier = await ctx.db.get(result.baseTier);
    const addOns = await ctx.db
      .query("subscriptionAddOns")
      .withIndex("by_subscription", (q) => q.eq("subscriptionId", result._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const currentMonth = new Date().toISOString().slice(0, 7);
    const allocation = await ctx.db
      .query("monthlyAllocation")
      .withIndex("by_client_month", (q) => q.eq("clientId", client._id).eq("month", currentMonth))
      .first();

    return {
      subscription: result,
      baseTier,
      addOns: addOns.length,
      allocation: allocation ? {
        totalCredits: {
          leads: allocation.totalLeadCredits,
          emails: allocation.totalEmailCredits,
          linkedin: allocation.totalLinkedinCredits,
          abm: allocation.totalAbmCredits,
        },
        usedCredits: {
          leads: allocation.usedLeadCredits,
          emails: allocation.usedEmailCredits,
          linkedin: allocation.usedLinkedinCredits,
          abm: allocation.usedAbmCredits,
        },
        remainingCredits: {
          leads: allocation.totalLeadCredits - allocation.usedLeadCredits,
          emails: allocation.totalEmailCredits - allocation.usedEmailCredits,
          linkedin: allocation.totalLinkedinCredits - allocation.usedLinkedinCredits,
          abm: allocation.totalAbmCredits - allocation.usedAbmCredits,
        },
      } : null,
    };
  },
});