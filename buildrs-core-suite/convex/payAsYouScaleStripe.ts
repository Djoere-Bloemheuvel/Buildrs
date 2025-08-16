import { v } from "convex/values";
import { mutation, action } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * PAY-AS-YOU-SCALE STRIPE INTEGRATION
 * 
 * Handles Stripe subscriptions with base tiers + add-ons
 */

// ===============================
// SUBSCRIPTION CREATION
// ===============================

// Create a new subscription with base tier + add-ons
export const createSubscriptionWithAddOns = action({
  args: {
    clientId: v.id("clients"),
    baseTierId: v.id("subscriptionTiers"),
    addOns: v.array(v.object({
      addOnId: v.id("creditAddOns"),
      quantity: v.number(),
    })),
    clientEmail: v.string(),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    checkoutUrl: v.optional(v.string()),
    subscriptionId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        throw new Error("Stripe not configured");
      }

      // Get base tier details
      const baseTier = await ctx.db.get(args.baseTierId);
      if (!baseTier || !baseTier.stripePriceId) {
        throw new Error("Base tier not found or not configured with Stripe");
      }

      // Get add-on details
      const lineItems = [
        {
          price: baseTier.stripePriceId,
          quantity: 1,
        }
      ];

      // Add each add-on as a line item
      for (const addOnRequest of args.addOns) {
        const addOn = await ctx.db.get(addOnRequest.addOnId);
        if (addOn && addOn.stripePriceId) {
          lineItems.push({
            price: addOn.stripePriceId,
            quantity: addOnRequest.quantity,
          });
        }
      }

      // Create Stripe checkout session for subscription
      const sessionBody = new URLSearchParams({
        mode: "subscription",
        success_url: `${args.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: args.cancelUrl,
        customer_email: args.clientEmail,
        'metadata[clientId]': args.clientId,
        'metadata[baseTierId]': args.baseTierId,
      });

      // Add line items
      lineItems.forEach((item, index) => {
        sessionBody.append(`line_items[${index}][price]`, item.price);
        sessionBody.append(`line_items[${index}][quantity]`, item.quantity.toString());
      });

      // Add add-on metadata for webhook processing
      args.addOns.forEach((addOn, index) => {
        sessionBody.append(`metadata[addOn${index}_id]`, addOn.addOnId);
        sessionBody.append(`metadata[addOn${index}_quantity]`, addOn.quantity.toString());
      });

      const sessionResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: sessionBody,
      });

      if (!sessionResponse.ok) {
        throw new Error(`Stripe checkout creation failed: ${await sessionResponse.text()}`);
      }

      const stripeSession = await sessionResponse.json();

      return {
        success: true,
        checkoutUrl: stripeSession.url,
        subscriptionId: stripeSession.id,
      };

    } catch (error) {
      console.error("❌ Subscription creation failed:", error);
      return {
        success: false,
        error: String(error),
      };
    }
  },
});

// ===============================
// SUBSCRIPTION MODIFICATION
// ===============================

// Modify existing subscription (add/remove add-ons, change tier)
export const modifySubscription = action({
  args: {
    clientId: v.id("clients"),
    changes: v.object({
      newTierId: v.optional(v.id("subscriptionTiers")),
      addOnChanges: v.array(v.object({
        addOnId: v.id("creditAddOns"),
        action: v.string(), // "add", "remove", "update"
        quantity: v.number(),
      })),
    }),
    prorate: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    invoiceId: v.optional(v.string()),
    proratedAmount: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, { clientId, changes, prorate = true }) => {
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        throw new Error("Stripe not configured");
      }

      // Get current subscription
      const subscription = await ctx.db
        .query("clientSubscriptions")
        .withIndex("by_client", (q) => q.eq("clientId", clientId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .first();

      if (!subscription) {
        throw new Error("No active subscription found");
      }

      // Get Stripe subscription
      const stripeSubResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${subscription.stripeSubscriptionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
        },
      });

      if (!stripeSubResponse.ok) {
        throw new Error("Failed to fetch Stripe subscription");
      }

      const stripeSubscription = await stripeSubResponse.json();

      // Modify subscription items
      let totalProratedAmount = 0;

      // Handle tier change
      if (changes.newTierId) {
        const newTier = await ctx.db.get(changes.newTierId);
        const currentBaseTier = await ctx.db.get(subscription.baseTier);
        if (newTier && newTier.stripePriceId && currentBaseTier) {
          // Update the base tier subscription item
          const baseTierItem = stripeSubscription.items.data.find((item: any) => 
            item.price.id === currentBaseTier.stripePriceId
          );

          if (baseTierItem) {
            const updateBody = new URLSearchParams({
              price: newTier.stripePriceId,
              quantity: '1',
              proration_behavior: prorate ? 'create_prorations' : 'none',
            });

            await fetch(`https://api.stripe.com/v1/subscription_items/${baseTierItem.id}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${stripeSecretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: updateBody,
            });
          }
        }
      }

      // Handle add-on changes
      for (const change of changes.addOnChanges) {
        const addOn = await ctx.db.get(change.addOnId);
        if (!addOn || !addOn.stripePriceId) continue;

        if (change.action === "add" || change.action === "update") {
          // Find existing subscription item for this add-on
          const existingItem = stripeSubscription.items.data.find((item: any) => 
            item.price.id === addOn.stripePriceId
          );

          if (existingItem && change.action === "update") {
            // Update existing item
            const updateBody = new URLSearchParams({
              quantity: change.quantity.toString(),
              proration_behavior: prorate ? 'create_prorations' : 'none',
            });

            await fetch(`https://api.stripe.com/v1/subscription_items/${existingItem.id}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${stripeSecretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: updateBody,
            });
          } else if (!existingItem && change.action === "add") {
            // Add new item
            const addBody = new URLSearchParams({
              subscription: subscription.stripeSubscriptionId,
              price: addOn.stripePriceId,
              quantity: change.quantity.toString(),
              proration_behavior: prorate ? 'create_prorations' : 'none',
            });

            const addResponse = await fetch('https://api.stripe.com/v1/subscription_items', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${stripeSecretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: addBody,
            });

            if (addResponse.ok) {
              const newItem = await addResponse.json();
              
              // Update our database
              await ctx.scheduler.runAfter(0, internal.payAsYouScale.addSubscriptionAddOn, {
                subscriptionId: subscription._id,
                addOnId: change.addOnId,
                quantity: change.quantity,
                stripeSubscriptionItemId: newItem.id,
                unitPrice: addOn.monthlyPrice,
              });
            }
          }
        } else if (change.action === "remove") {
          // Remove existing item
          const existingItem = stripeSubscription.items.data.find((item: any) => 
            item.price.id === addOn.stripePriceId
          );

          if (existingItem) {
            await fetch(`https://api.stripe.com/v1/subscription_items/${existingItem.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${stripeSecretKey}`,
              },
            });

            // Update our database
            await ctx.scheduler.runAfter(0, internal.payAsYouScale.removeSubscriptionAddOn, {
              subscriptionId: subscription._id,
              addOnId: change.addOnId,
            });
          }
        }
      }

      return {
        success: true,
        proratedAmount: totalProratedAmount,
        message: "Subscription modified successfully",
      };

    } catch (error) {
      console.error("❌ Subscription modification failed:", error);
      return {
        success: false,
        proratedAmount: 0,
        message: `Failed to modify subscription: ${error}`,
      };
    }
  },
});

// ===============================
// WEBHOOK HANDLERS
// ===============================

// Handle Stripe subscription webhooks
export const handleSubscriptionWebhook = action({
  args: {
    eventType: v.string(),
    eventData: v.any(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    processed: v.boolean(),
  }),
  handler: async (ctx, { eventType, eventData }) => {
    console.log(`🔔 Subscription webhook received: ${eventType}`);

    try {
      switch (eventType) {
        case 'checkout.session.completed':
          return await handleCheckoutCompleted(ctx, eventData);
          
        case 'customer.subscription.created':
          return await handleSubscriptionCreated(ctx, eventData);
          
        case 'customer.subscription.updated':
          return await handleSubscriptionUpdated(ctx, eventData);
          
        case 'invoice.payment_succeeded':
          return await handleSubscriptionPayment(ctx, eventData);
          
        case 'customer.subscription.deleted':
          return await handleSubscriptionCancelled(ctx, eventData);
          
        default:
          return {
            success: true,
            message: `Event ${eventType} received but not processed`,
            processed: false,
          };
      }
    } catch (error) {
      console.error("❌ Webhook processing failed:", error);
      return {
        success: false,
        message: `Webhook processing failed: ${error}`,
        processed: false,
      };
    }
  },
});

// Handle completed checkout session (creates subscription)
async function handleCheckoutCompleted(ctx: any, eventData: any) {
  const session = eventData.object;
  const clientId = session.metadata?.clientId;
  const baseTierId = session.metadata?.baseTierId;

  if (!clientId || !baseTierId) {
    return {
      success: false,
      message: "Missing required metadata in session",
      processed: false,
    };
  }

  // Extract add-on information from metadata
  const addOns = [];
  let index = 0;
  while (session.metadata[`addOn${index}_id`]) {
    addOns.push({
      addOnId: session.metadata[`addOn${index}_id`],
      quantity: parseInt(session.metadata[`addOn${index}_quantity`] || "1"),
    });
    index++;
  }

  if (session.mode === 'subscription' && session.subscription) {
    // Create subscription record
    await ctx.scheduler.runAfter(0, internal.payAsYouScale.createSubscriptionRecord, {
      clientId,
      baseTierId,
      stripeSubscriptionId: session.subscription,
      stripeCustomerId: session.customer,
      addOns,
    });

    return {
      success: true,
      message: `Subscription created for client ${clientId}`,
      processed: true,
    };
  }

  return {
    success: false,
    message: "Session was not for subscription",
    processed: false,
  };
}

// Handle subscription creation (after checkout)
async function handleSubscriptionCreated(ctx: any, eventData: any) {
  const subscription = eventData.object;
  
  console.log(`📅 Subscription created: ${subscription.id}`);
  
  // The subscription should already be created by checkout.session.completed
  // This is mainly for logging/verification
  
  return {
    success: true,
    message: `Subscription confirmed: ${subscription.id}`,
    processed: true,
  };
}

// Handle subscription updates (changes to items, etc.)
async function handleSubscriptionUpdated(ctx: any, eventData: any) {
  const subscription = eventData.object;
  
  console.log(`🔄 Subscription updated: ${subscription.id}`);
  
  // Update our subscription record
  const dbSubscription = await ctx.db
    .query("clientSubscriptions")
    .withIndex("by_stripe_subscription", (q) => q.eq("stripeSubscriptionId", subscription.id))
    .first();

  if (dbSubscription) {
    const updates: any = {
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start * 1000,
      currentPeriodEnd: subscription.current_period_end * 1000,
      updatedAt: Date.now(),
    };

    await ctx.db.patch(dbSubscription._id, updates);

    // Sync add-ons with Stripe subscription items
    await syncSubscriptionItems(ctx, dbSubscription, subscription.items.data);
  }
  
  return {
    success: true,
    message: `Subscription updated: ${subscription.id}`,
    processed: true,
  };
}

// Handle successful subscription payment (monthly billing)
async function handleSubscriptionPayment(ctx: any, eventData: any) {
  const invoice = eventData.object;
  const subscriptionId = invoice.subscription;
  
  console.log(`💳 Subscription payment succeeded: ${subscriptionId}`);
  
  // Find our subscription
  const subscription = await ctx.db
    .query("clientSubscriptions")
    .withIndex("by_stripe_subscription", (q) => q.eq("stripeSubscriptionId", subscriptionId))
    .first();

  if (subscription) {
    // Create new monthly allocation for the upcoming period
    const periodStart = invoice.period_start * 1000;
    const periodEnd = invoice.period_end * 1000;

    await ctx.scheduler.runAfter(0, internal.payAsYouScale.createMonthlyAllocation, {
      clientId: subscription.clientId,
      subscriptionId: subscription._id,
      periodStart,
      periodEnd,
    });

    // Update billing date
    await ctx.db.patch(subscription._id, {
      nextBillingDate: periodEnd,
      updatedAt: Date.now(),
    });
  }
  
  return {
    success: true,
    message: `Payment processed for subscription: ${subscriptionId}`,
    processed: true,
  };
}

// Handle subscription cancellation
async function handleSubscriptionCancelled(ctx: any, eventData: any) {
  const subscription = eventData.object;
  
  console.log(`❌ Subscription cancelled: ${subscription.id}`);
  
  // Update our subscription status
  const dbSubscription = await ctx.db
    .query("clientSubscriptions")
    .withIndex("by_stripe_subscription", (q) => q.eq("stripeSubscriptionId", subscription.id))
    .first();

  if (dbSubscription) {
    await ctx.db.patch(dbSubscription._id, {
      status: "cancelled",
      updatedAt: Date.now(),
    });

    // Cancel all active add-ons
    const addOns = await ctx.db
      .query("subscriptionAddOns")
      .withIndex("by_subscription", (q) => q.eq("subscriptionId", dbSubscription._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    for (const addOn of addOns) {
      await ctx.db.patch(addOn._id, {
        status: "cancelled",
        cancelledAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  }
  
  return {
    success: true,
    message: `Subscription cancelled: ${subscription.id}`,
    processed: true,
  };
}

// Helper function to sync subscription items with our database
async function syncSubscriptionItems(ctx: any, dbSubscription: any, stripeItems: any[]) {
  // Get current add-ons from our database
  const currentAddOns = await ctx.db
    .query("subscriptionAddOns")
    .withIndex("by_subscription", (q) => q.eq("subscriptionId", dbSubscription._id))
    .filter((q) => q.eq(q.field("status"), "active"))
    .collect();

  // Map of Stripe item ID to our add-on record
  const addOnMap = new Map();
  currentAddOns.forEach(addOn => {
    addOnMap.set(addOn.stripeSubscriptionItemId, addOn);
  });

  // Process each Stripe item
  for (const stripeItem of stripeItems) {
    const existingAddOn = addOnMap.get(stripeItem.id);
    
    if (existingAddOn) {
      // Update quantity if changed
      if (existingAddOn.quantity !== stripeItem.quantity) {
        await ctx.db.patch(existingAddOn._id, {
          quantity: stripeItem.quantity,
          totalPrice: stripeItem.quantity * existingAddOn.unitPrice,
          updatedAt: Date.now(),
        });
      }
      
      // Remove from map so we know it still exists
      addOnMap.delete(stripeItem.id);
    } else {
      // This is a new item - find matching add-on by price ID
      const addOn = await ctx.db
        .query("creditAddOns")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .filter((q) => q.eq(q.field("stripePriceId"), stripeItem.price.id))
        .first();

      if (addOn) {
        // Create new add-on subscription record
        await ctx.db.insert("subscriptionAddOns", {
          subscriptionId: dbSubscription._id,
          addOnId: addOn._id,
          quantity: stripeItem.quantity,
          unitPrice: addOn.monthlyPrice,
          totalPrice: stripeItem.quantity * addOn.monthlyPrice,
          addedAt: Date.now(),
          status: "active",
          stripeSubscriptionItemId: stripeItem.id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }
  }

  // Any remaining items in the map were removed from Stripe
  for (const [stripeItemId, addOn] of addOnMap) {
    await ctx.db.patch(addOn._id, {
      status: "cancelled",
      cancelledAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
}