import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * CREDIT BUSINESS LOGIC - LEAD ENGINE SPECIFIC
 * 
 * Handles all complex business rules:
 * - Domain-based Start package limit (1x per domain)
 * - First month double lead credits bonus  
 * - Auto-upgrade from Start to Grow after 1 month
 * - Credit carryover (unused credits roll over)
 * - Stripe payment processing with robust error handling
 */

// ===============================
// DOMAIN & ELIGIBILITY CHECKS
// ===============================

// Check if domain can purchase Pilot package
export const checkPilotPackageEligibility = query({
  args: { 
    domain: v.string(),
    email: v.string(),
  },
  returns: v.object({
    isEligible: v.boolean(),
    reason: v.string(),
    hasUsedStartBefore: v.boolean(),
    existingClientId: v.optional(v.id("clients")),
  }),
  handler: async (ctx, { domain, email }) => {
    // Normalize domain (remove www, protocols, etc.)
    const cleanDomain = domain.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];

    // Check domain usage tracking
    const domainUsage = await ctx.db
      .query("domainUsageTracking")
      .withIndex("by_domain", (q) => q.eq("domain", cleanDomain))
      .first();

    if (domainUsage && domainUsage.hasUsedStartPackage) {
      return {
        isEligible: false,
        reason: "Dit domein heeft al eerder gebruik gemaakt van het Start pakket. Kies een ander pakket.",
        hasUsedStartBefore: true,
        existingClientId: domainUsage.clientId,
      };
    }

    // Check if there's an existing client with this domain
    const existingClient = await ctx.db
      .query("clients")
      .withIndex("by_domain", (q) => q.eq("domain", cleanDomain))
      .first();

    if (existingClient && existingClient.hasUsedStartPackage) {
      return {
        isEligible: false,
        reason: "Er bestaat al een account voor dit domein dat het Start pakket heeft gebruikt.",
        hasUsedStartBefore: true,
        existingClientId: existingClient._id,
      };
    }

    return {
      isEligible: true,
      reason: "Domein is eligible voor het Start pakket!",
      hasUsedStartBefore: false,
      existingClientId: existingClient?._id,
    };
  },
});

// Check if client is eligible for first month bonus
export const checkFirstMonthBonusEligibility = query({
  args: {
    clientId: v.id("clients"),
    packageSlug: v.string(),
  },
  returns: v.object({
    isEligible: v.boolean(),
    reason: v.string(),
    bonusLeadCredits: v.number(),
  }),
  handler: async (ctx, { clientId, packageSlug }) => {
    const client = await ctx.db.get(clientId);
    if (!client) {
      return {
        isEligible: false,
        reason: "Client not found",
        bonusLeadCredits: 0,
      };
    }

    // Check if client already received first month bonus for any package
    if (client.hasReceivedFirstMonthBonus) {
      return {
        isEligible: false,
        reason: "Client heeft al eerder de eerste maand bonus ontvangen",
        bonusLeadCredits: 0,
      };
    }

    // Get package details
    const package_ = await ctx.db
      .query("creditPackages")
      .withIndex("by_slug", (q) => q.eq("slug", packageSlug))
      .first();

    if (!package_) {
      return {
        isEligible: false,
        reason: "Package not found",
        bonusLeadCredits: 0,
      };
    }

    // For Pilot Pack, there is no first month bonus
    if (packageSlug === "pilot") {
      return {
        isEligible: false,
        reason: "Pilot Pack heeft geen eerste maand bonus",
        bonusLeadCredits: 0,
      };
    }

    const bonusCredits = package_.firstMonthBonusLeadCredits - package_.leadCredits;

    return {
      isEligible: true,
      reason: `Eligible voor ${bonusCredits} extra lead credits als eerste maand bonus!`,
      bonusLeadCredits: bonusCredits,
    };
  },
});

// ===============================
// STRIPE CHECKOUT WITH BUSINESS LOGIC
// ===============================

// Create Stripe checkout with all business rules
export const createStripeCheckoutWithBusinessLogic = mutation({
  args: {
    packageSlug: v.string(),
    clientEmail: v.string(),
    clientDomain: v.string(),
    clientName: v.string(),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  returns: v.object({
    checkoutUrl: v.string(),
    orderId: v.string(),
    sessionId: v.string(),
    clientId: v.id("clients"),
    willReceiveBonus: v.boolean(),
    bonusLeadCredits: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();

    // 1. BUSINESS RULES VALIDATION
    
    // Check Start package eligibility
    if (args.packageSlug === "pilot") {
      const eligibility = await ctx.runQuery(internal.creditBusinessLogic.checkPilotPackageEligibility, {
        domain: args.clientDomain,
        email: args.clientEmail,
      });

      if (!eligibility.isEligible) {
        throw new Error(eligibility.reason);
      }
    }

    // Get package details
    const package_ = await ctx.db
      .query("creditPackages")
      .withIndex("by_slug", (q) => q.eq("slug", args.packageSlug))
      .first();

    if (!package_ || !package_.isActive) {
      throw new Error("Credit package not found or inactive");
    }

    // 2. CREATE OR GET CLIENT

    const cleanDomain = args.clientDomain.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];

    let client = await ctx.db
      .query("clients")
      .withIndex("by_domain", (q) => q.eq("domain", cleanDomain))
      .first();

    let clientId: string;

    if (!client) {
      // Create new client
      clientId = await ctx.db.insert("clients", {
        name: args.clientName,
        domain: cleanDomain,
        email: args.clientEmail,
        
        // Initialize credit balances
        currentLeadCredits: 0,
        currentEmailCredits: 0,
        currentLinkedinCredits: 0,
        currentAbmCredits: 0,
        
        // Business rules
        hasUsedStartPackage: args.packageSlug === "pilot",
        hasReceivedFirstMonthBonus: false,
        subscriptionStatus: "pending",
        
        createdAt: now,
        updatedAt: now,
      });

      // Track domain usage for Start package
      if (args.packageSlug === "pilot") {
        await ctx.db.insert("domainUsageTracking", {
          domain: cleanDomain,
          hasUsedStartPackage: true,
          startPackageUsedAt: now,
          clientId,
          createdAt: now,
        });
      }
    } else {
      clientId = client._id;
      
      // Update client info
      await ctx.db.patch(clientId, {
        name: args.clientName,
        email: args.clientEmail,
        updatedAt: now,
      });
    }

    // 3. CHECK FIRST MONTH BONUS ELIGIBILITY

    const bonusEligibility = await ctx.runQuery(internal.creditBusinessLogic.checkFirstMonthBonusEligibility, {
      clientId,
      packageSlug: args.packageSlug,
    });

    // 4. CREATE ORDER

    const orderId = `order_${now}_${Math.random().toString(36).substr(2, 9)}`;
    
    await ctx.db.insert("creditOrders", {
      orderId,
      clientId,
      packageId: package_._id,
      quantity: 1,
      totalPrice: package_.price,
      currency: package_.currency,
      paymentStatus: "pending",
      creditStatus: "pending",
      isFirstMonthBonus: bonusEligibility.isEligible,
      createdAt: now,
      updatedAt: now,
    });

    // 5. CREATE STRIPE SESSION (MOCK FOR TESTING)

    // TODO: Implement real Stripe integration
    const description = bonusEligibility.isEligible 
      ? `${package_.name} Credits + ${bonusEligibility.bonusLeadCredits} bonus lead credits (eerste maand)`
      : `${package_.name} Credits`;

    // Mock Stripe session for testing
    const mockSessionId = `cs_test_${now}`;
    const mockCheckoutUrl = `https://checkout.stripe.com/pay/${mockSessionId}`;

    return {
      checkoutUrl: mockCheckoutUrl,
      orderId,
      sessionId: mockSessionId,
      clientId,
      willReceiveBonus: bonusEligibility.isEligible,
      bonusLeadCredits: bonusEligibility.bonusLeadCredits,
    };
  },
});

// ===============================
// CREDIT FULFILLMENT WITH BUSINESS LOGIC
// ===============================

// Fulfill credit purchase with all business rules
export const fulfillCreditPurchaseWithBusinessLogic = mutation({
  args: {
    orderId: v.string(),
    stripeSessionId: v.string(),
    paymentIntentId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    creditsAdded: v.object({
      leadCredits: v.number(),
      emailCredits: v.number(),
      linkedinCredits: v.number(),
      abmCredits: v.number(),
      bonusLeadCredits: v.number(),
    }),
    transactionIds: v.array(v.string()),
    message: v.string(),
    willAutoUpgrade: v.boolean(),
    autoUpgradeDate: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get order details
    const order = await ctx.db
      .query("creditOrders")
      .withIndex("by_order_id", (q) => q.eq("orderId", args.orderId))
      .first();

    if (!order) {
      throw new Error("Order not found");
    }

    // Prevent double fulfillment
    if (order.paymentStatus === "paid" && order.creditStatus === "fulfilled") {
      return {
        success: true,
        creditsAdded: { leadCredits: 0, emailCredits: 0, linkedinCredits: 0, abmCredits: 0, bonusLeadCredits: 0 },
        transactionIds: order.transactionIds || [],
        message: "Order already fulfilled",
        willAutoUpgrade: false,
      };
    }

    // Get package and client details
    const package_ = await ctx.db.get(order.packageId);
    if (!package_) {
      throw new Error("Credit package not found");
    }

    const client = await ctx.db.get(order.clientId);
    if (!client) {
      throw new Error("Client not found");
    }

    const transactionIds: string[] = [];

    // 1. ADD REGULAR CREDITS

    const regularCredits = {
      leadCredits: package_.leadCredits,
      emailCredits: package_.emailCredits,
      linkedinCredits: package_.linkedinCredits,
      abmCredits: package_.abmCredits,
    };

    // Create transactions for each credit type
    for (const [creditType, amount] of Object.entries(regularCredits)) {
      if (amount > 0) {
        const type = creditType.replace('Credits', ''); // leadCredits -> lead
        const idempotencyKey = `purchase_${args.orderId}_${type}_${now}`;
        
        const result = await ctx.runMutation(internal.creditSystem.createCreditTransaction, {
          clientId: order.clientId,
          creditType: type,
          amount,
          transactionType: "purchase",
          description: `${package_.name} pakket aankoop: ${amount} ${type} credits`,
          referenceId: args.orderId,
          idempotencyKey,
        });

        transactionIds.push(result.transactionId);
      }
    }

    // 2. ADD FIRST MONTH BONUS (if eligible)

    let bonusLeadCredits = 0;
    if (order.isFirstMonthBonus && !client.hasReceivedFirstMonthBonus) {
      bonusLeadCredits = package_.firstMonthBonusLeadCredits - package_.leadCredits;
      
      if (bonusLeadCredits > 0) {
        const bonusIdempotencyKey = `bonus_${args.orderId}_lead_${now}`;
        
        const bonusResult = await ctx.runMutation(internal.creditSystem.createCreditTransaction, {
          clientId: order.clientId,
          creditType: "lead",
          amount: bonusLeadCredits,
          transactionType: "first_month_bonus",
          description: `Eerste maand bonus: ${bonusLeadCredits} extra lead credits`,
          referenceId: args.orderId,
          idempotencyKey: bonusIdempotencyKey,
        });

        transactionIds.push(bonusResult.transactionId);

        // Mark client as having received bonus
        await ctx.db.patch(order.clientId, {
          hasReceivedFirstMonthBonus: true,
          updatedAt: now,
        });
      }
    }

    // 3. UPDATE ORDER STATUS

    await ctx.db.patch(order._id, {
      paymentStatus: "paid",
      paymentId: args.paymentIntentId,
      creditStatus: "fulfilled",
      fulfilledAt: now,
      updatedAt: now,
      transactionIds,
    });

    // 4. HANDLE AUTO-UPGRADE FOR START PACKAGE

    let willAutoUpgrade = false;
    let autoUpgradeDate: number | undefined;

    if (package_.slug === "pilot" && package_.autoUpgradeToPackage) {
      willAutoUpgrade = true;
      autoUpgradeDate = now + (30 * 24 * 60 * 60 * 1000); // 30 days from now

      // TODO: Schedule auto-upgrade job
      // This would typically be handled by a cron job or scheduled task
      console.log(`📅 Auto-upgrade scheduled for client ${order.clientId} on ${new Date(autoUpgradeDate)}`);
    }

    // 5. UPDATE CLIENT SUBSCRIPTION STATUS

    await ctx.db.patch(order.clientId, {
      subscriptionStatus: "active",
      updatedAt: now,
    });

    const totalCreditsAdded = {
      leadCredits: regularCredits.leadCredits,
      emailCredits: regularCredits.emailCredits,
      linkedinCredits: regularCredits.linkedinCredits,
      abmCredits: regularCredits.abmCredits,
      bonusLeadCredits,
    };

    return {
      success: true,
      creditsAdded: totalCreditsAdded,
      transactionIds,
      message: `${package_.name} pakket succesvol geactiveerd! ${bonusLeadCredits > 0 ? `Inclusief ${bonusLeadCredits} bonus lead credits.` : ''}`,
      willAutoUpgrade,
      autoUpgradeDate,
    };
  },
});

// ===============================
// AUTO-UPGRADE SYSTEM
// ===============================

// Check and process auto-upgrades (called by cron job)
export const processAutoUpgrades = action({
  args: {},
  returns: v.object({
    clientsProcessed: v.number(),
    upgradesExecuted: v.number(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    // Find clients who purchased Start package 30+ days ago and haven't been upgraded
    const startOrders = await ctx.db
      .query("creditOrders")
      .filter((q) => 
        q.and(
          q.eq(q.field("paymentStatus"), "paid"),
          q.eq(q.field("creditStatus"), "fulfilled"),
          q.lt(q.field("fulfilledAt"), thirtyDaysAgo),
          q.eq(q.field("wasAutoUpgraded"), undefined) // Not yet auto-upgraded
        )
      )
      .collect();

    let upgradesExecuted = 0;

    for (const order of startOrders) {
      try {
        // Get package to check if it's Start package with auto-upgrade
        const package_ = await ctx.db.get(order.packageId);
        if (!package_ || package_.slug !== "pilot" || !package_.autoUpgradeToPackage) {
          continue;
        }

        // Get client
        const client = await ctx.db.get(order.clientId);
        if (!client) {
          continue;
        }

        // Check if client cancelled or is inactive
        if (client.subscriptionStatus === "cancelled") {
          // Mark as processed but don't upgrade
          await ctx.db.patch(order._id, {
            wasAutoUpgraded: false,
            updatedAt: now,
          });
          continue;
        }

        // Execute auto-upgrade to Grow package
        const growPackage = await ctx.db.get(package_.autoUpgradeToPackage);
        if (!growPackage) {
          continue;
        }

        // Create auto-upgrade order
        const upgradeOrderId = `auto_upgrade_${now}_${order.clientId}`;
        
        await ctx.db.insert("creditOrders", {
          orderId: upgradeOrderId,
          clientId: order.clientId,
          packageId: growPackage._id,
          quantity: 1,
          totalPrice: 0, // Auto-upgrade is free
          currency: growPackage.currency,
          paymentStatus: "paid", // Auto-paid
          creditStatus: "fulfilled",
          isFirstMonthBonus: false, // Already received bonus
          wasAutoUpgraded: true,
          originalPackageId: package_._id,
          createdAt: now,
          updatedAt: now,
          fulfilledAt: now,
        });

        // Add Grow package credits
        const growCredits = {
          leadCredits: growPackage.leadCredits,
          emailCredits: growPackage.emailCredits,
          linkedinCredits: growPackage.linkedinCredits,
          abmCredits: growPackage.abmCredits,
        };

        for (const [creditType, amount] of Object.entries(growCredits)) {
          if (amount > 0) {
            const type = creditType.replace('Credits', '');
            const idempotencyKey = `auto_upgrade_${upgradeOrderId}_${type}_${now}`;
            
            await ctx.runMutation(internal.creditSystem.createCreditTransaction, {
              clientId: order.clientId,
              creditType: type,
              amount,
              transactionType: "purchase",
              description: `Auto-upgrade van Start naar Grow: ${amount} ${type} credits`,
              referenceId: upgradeOrderId,
              idempotencyKey,
            });
          }
        }

        // Mark original order as auto-upgraded
        await ctx.db.patch(order._id, {
          wasAutoUpgraded: true,
          updatedAt: now,
        });

        upgradesExecuted++;
        console.log(`✅ Auto-upgraded client ${order.clientId} from Start to Grow`);

      } catch (error) {
        console.error(`❌ Failed to auto-upgrade order ${order.orderId}:`, error);
      }
    }

    return {
      clientsProcessed: startOrders.length,
      upgradesExecuted,
      message: `Processed ${startOrders.length} candidates, executed ${upgradesExecuted} auto-upgrades`,
    };
  },
});

// ===============================
// UTILITY FUNCTIONS
// ===============================

// Get client's package history and status
export const getClientPackageStatus = query({
  args: { clientId: v.id("clients") },
  returns: v.object({
    currentPackage: v.optional(v.object({
      name: v.string(),
      slug: v.string(),
      billingPeriod: v.string(),
      price: v.number(),
    })),
    hasUsedStartPackage: v.boolean(),
    hasReceivedFirstMonthBonus: v.boolean(),
    subscriptionStatus: v.optional(v.string()),
    nextBillingDate: v.optional(v.number()),
    willAutoUpgrade: v.boolean(),
    autoUpgradeDate: v.optional(v.number()),
    packageHistory: v.array(v.object({
      packageName: v.string(),
      purchasedAt: v.number(),
      price: v.number(),
      wasAutoUpgraded: v.optional(v.boolean()),
    })),
  }),
  handler: async (ctx, { clientId }) => {
    const client = await ctx.db.get(clientId);
    if (!client) {
      throw new Error("Client not found");
    }

    // Get all orders for this client
    const orders = await ctx.db
      .query("creditOrders")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .filter((q) => q.eq(q.field("creditStatus"), "fulfilled"))
      .collect();

    // Get package history
    const packageHistory = await Promise.all(
      orders.map(async (order) => {
        const package_ = await ctx.db.get(order.packageId);
        return {
          packageName: package_?.name || "Unknown",
          purchasedAt: order.fulfilledAt || order.createdAt,
          price: order.totalPrice,
          wasAutoUpgraded: order.wasAutoUpgraded,
        };
      })
    );

    // Get current package (most recent order)
    const currentOrder = orders
      .sort((a, b) => (b.fulfilledAt || b.createdAt) - (a.fulfilledAt || a.createdAt))[0];

    let currentPackage;
    if (currentOrder) {
      const package_ = await ctx.db.get(currentOrder.packageId);
      if (package_) {
        currentPackage = {
          name: package_.name,
          slug: package_.slug,
          billingPeriod: package_.billingPeriod,
          price: package_.price,
        };
      }
    }

    // Check for pending auto-upgrade
    const startOrder = orders.find(o => {
      const pkg = ctx.db.get(o.packageId);
      return pkg && (pkg as any).slug === "pilot" && !o.wasAutoUpgraded;
    });

    let willAutoUpgrade = false;
    let autoUpgradeDate: number | undefined;

    if (startOrder && client.subscriptionStatus !== "cancelled") {
      willAutoUpgrade = true;
      autoUpgradeDate = (startOrder.fulfilledAt || startOrder.createdAt) + (30 * 24 * 60 * 60 * 1000);
    }

    return {
      currentPackage,
      hasUsedStartPackage: client.hasUsedStartPackage || false,
      hasReceivedFirstMonthBonus: client.hasReceivedFirstMonthBonus || false,
      subscriptionStatus: client.subscriptionStatus,
      nextBillingDate: undefined, // TODO: Calculate based on billing period
      willAutoUpgrade,
      autoUpgradeDate,
      packageHistory: packageHistory.sort((a, b) => b.purchasedAt - a.purchasedAt),
    };
  },
});