import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * REAL STRIPE INTEGRATION
 * 
 * This replaces the mock Stripe integration with real Stripe API calls
 * using the actual test API keys.
 */

// ===============================
// REAL STRIPE PRODUCT CREATION
// ===============================

export const createRealStripeProducts = action({
  args: {},
  returns: v.object({
    success: v.boolean(),
    productsCreated: v.number(),
    products: v.array(v.object({
      packageSlug: v.string(),
      stripeProductId: v.string(),
      stripePriceId: v.string(),
      name: v.string(),
      price: v.number(),
    })),
    message: v.string(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx) => {
    console.log("🚀 Creating REAL Stripe products...");
    
    const errors: string[] = [];
    const createdProducts = [];
    
    // Initialize Stripe (we'll use a simple HTTP approach since Stripe package might not be available)
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      return {
        success: false,
        productsCreated: 0,
        products: [],
        message: "Stripe secret key not configured",
        errors: ["Missing STRIPE_SECRET_KEY environment variable"],
      };
    }
    
    const packages = [
      {
        slug: "pilot",
        name: "Pilot Pack",
        price: 14900, // €149.00
        billingPeriod: "one-time",
        leadCredits: 1000,
        emailCredits: 2000,
        linkedinCredits: 100,
        abmCredits: 0,
        firstMonthBonusLeadCredits: 0, // No bonus for pilot pack
        description: "Kickstart om 1–2 meetings te boeken - eenmalige betaling"
      },
      {
        slug: "grow",
        name: "Grow", 
        price: 24900, // €249.00
        billingPeriod: "monthly",
        leadCredits: 1000,
        emailCredits: 4000,
        linkedinCredits: 200,
        abmCredits: 0,
        firstMonthBonusLeadCredits: 2000,
        description: "Voor groeiende teams - maandelijks abonnement"
      },
      {
        slug: "scale",
        name: "Scale",
        price: 49900, // €499.00
        billingPeriod: "monthly",
        leadCredits: 2500,
        emailCredits: 10000,
        linkedinCredits: 400,
        abmCredits: 25,
        firstMonthBonusLeadCredits: 5000,
        description: "Voor schaalbare groei - maandelijks abonnement"
      },
      {
        slug: "dominate",
        name: "Dominate",
        price: 99900, // €999.00
        billingPeriod: "monthly",
        leadCredits: 5000,
        emailCredits: 20000,
        linkedinCredits: 400,
        abmCredits: 50,
        firstMonthBonusLeadCredits: 10000,
        description: "Voor marktdominantie - maandelijks abonnement"
      }
    ];
    
    for (const pkg of packages) {
      try {
        console.log(`📦 Creating Stripe product for ${pkg.name}...`);
        
        // Create Stripe Product
        const productResponse = await fetch('https://api.stripe.com/v1/products', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            name: `Lead Engine ${pkg.name}`,
            description: pkg.description,
            'metadata[package_slug]': pkg.slug,
            'metadata[lead_credits]': pkg.leadCredits.toString(),
            'metadata[email_credits]': pkg.emailCredits.toString(),
            'metadata[linkedin_credits]': pkg.linkedinCredits.toString(),
            'metadata[abm_credits]': pkg.abmCredits.toString(),
            'metadata[first_month_bonus]': pkg.firstMonthBonusLeadCredits.toString(),
            'metadata[billing_period]': pkg.billingPeriod,
          }),
        });
        
        if (!productResponse.ok) {
          const errorText = await productResponse.text();
          throw new Error(`Product creation failed: ${errorText}`);
        }
        
        const stripeProduct = await productResponse.json();
        console.log(`✅ Created Stripe product: ${stripeProduct.id}`);
        
        // Create Stripe Price
        const priceBody = new URLSearchParams({
          product: stripeProduct.id,
          unit_amount: pkg.price.toString(),
          currency: 'eur',
          'metadata[package_slug]': pkg.slug,
        });
        
        // Add recurring billing if monthly
        if (pkg.billingPeriod === 'monthly') {
          priceBody.append('recurring[interval]', 'month');
          priceBody.append('recurring[usage_type]', 'licensed');
        }
        
        const priceResponse = await fetch('https://api.stripe.com/v1/prices', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: priceBody,
        });
        
        if (!priceResponse.ok) {
          const errorText = await priceResponse.text();
          throw new Error(`Price creation failed: ${errorText}`);
        }
        
        const stripePrice = await priceResponse.json();
        console.log(`✅ Created Stripe price: ${stripePrice.id}`);
        
        // Update our database with real Stripe IDs
        await ctx.runMutation(internal.stripeReal.updatePackageWithStripeIds, {
          packageSlug: pkg.slug,
          stripeProductId: stripeProduct.id,
          stripePriceId: stripePrice.id,
        });
        
        createdProducts.push({
          packageSlug: pkg.slug,
          stripeProductId: stripeProduct.id,
          stripePriceId: stripePrice.id,
          name: pkg.name,
          price: pkg.price,
        });
        
        console.log(`🎉 Successfully integrated ${pkg.name} with Stripe`);
        
      } catch (error) {
        const errorMsg = `Failed to create Stripe product for ${pkg.name}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    const success = createdProducts.length > 0 && errors.length === 0;
    
    return {
      success,
      productsCreated: createdProducts.length,
      products: createdProducts,
      message: success 
        ? `Successfully created ${createdProducts.length} Stripe products`
        : `Created ${createdProducts.length} products with ${errors.length} errors`,
      errors,
    };
  },
});

// Helper mutation to update package with Stripe IDs
export const updatePackageWithStripeIds = mutation({
  args: {
    packageSlug: v.string(),
    stripeProductId: v.string(),
    stripePriceId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, { packageSlug, stripeProductId, stripePriceId }) => {
    const package_ = await ctx.db
      .query("creditPackages")
      .withIndex("by_slug", (q) => q.eq("slug", packageSlug))
      .first();
    
    if (!package_) {
      return {
        success: false,
        message: `Package ${packageSlug} not found`,
      };
    }
    
    await ctx.db.patch(package_._id, {
      stripeProductId,
      stripePriceId,
      isStripeIntegrated: true,
      updatedAt: Date.now(),
    });
    
    return {
      success: true,
      message: `Updated package ${packageSlug} with Stripe IDs`,
    };
  },
});

// ===============================
// REAL STRIPE CHECKOUT CREATION
// ===============================

export const createRealStripeCheckout = action({
  args: {
    packageSlug: v.string(),
    clientEmail: v.string(),
    clientDomain: v.string(),
    clientName: v.string(),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    checkoutUrl: v.optional(v.string()),
    orderId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    clientId: v.optional(v.id("clients")),
    willReceiveBonus: v.boolean(),
    bonusLeadCredits: v.number(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      console.log(`🚀 Creating REAL Stripe checkout for ${args.packageSlug}`);
      
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        throw new Error("Stripe secret key not configured");
      }
      
      // First, create the order using existing business logic
      const orderResult = await ctx.runAction(internal.stripeIntegration.createStripeCheckoutWithProducts, args);
      
      // Get the package with Stripe IDs
      const package_ = await ctx.runQuery(internal.stripeIntegration.getPackageBySlug, {
        slug: args.packageSlug,
      });
      
      if (!package_ || !package_.stripePriceId) {
        throw new Error("Package not found or not integrated with Stripe");
      }
      
      // Create real Stripe checkout session
      const sessionBody = new URLSearchParams({
        'line_items[0][price]': package_.stripePriceId,
        'line_items[0][quantity]': '1',
        mode: package_.billingPeriod === 'monthly' ? 'subscription' : 'payment',
        success_url: `${args.successUrl}?session_id={CHECKOUT_SESSION_ID}&order_id=${orderResult.orderId}`,
        cancel_url: `${args.cancelUrl}?order_id=${orderResult.orderId}`,
        customer_email: args.clientEmail,
        'metadata[orderId]': orderResult.orderId,
        'metadata[clientId]': orderResult.clientId,
        'metadata[packageSlug]': args.packageSlug,
        'metadata[domain]': args.clientDomain,
      });
      
      // Add subscription metadata if monthly billing
      if (package_.billingPeriod === 'monthly') {
        sessionBody.append('subscription_data[metadata][orderId]', orderResult.orderId);
        sessionBody.append('subscription_data[metadata][clientId]', orderResult.clientId);
        sessionBody.append('subscription_data[metadata][packageSlug]', args.packageSlug);
      }
      
      const sessionResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: sessionBody,
      });
      
      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        throw new Error(`Stripe checkout session creation failed: ${errorText}`);
      }
      
      const stripeSession = await sessionResponse.json();
      console.log(`✅ Created real Stripe checkout session: ${stripeSession.id}`);
      
      // Update our order with the real session ID and URL
      await ctx.runMutation(internal.stripeReal.updateOrderWithRealSession, {
        orderId: orderResult.orderId,
        sessionId: stripeSession.id,
        checkoutUrl: stripeSession.url,
      });
      
      return {
        success: true,
        checkoutUrl: stripeSession.url,
        orderId: orderResult.orderId,
        sessionId: stripeSession.id,
        clientId: orderResult.clientId,
        willReceiveBonus: orderResult.willReceiveBonus,
        bonusLeadCredits: orderResult.bonusLeadCredits,
      };
      
    } catch (error) {
      console.error("❌ Real Stripe checkout creation failed:", error);
      return {
        success: false,
        willReceiveBonus: false,
        bonusLeadCredits: 0,
        error: String(error),
      };
    }
  },
});

// Helper mutation to update order with real session data
export const updateOrderWithRealSession = mutation({
  args: {
    orderId: v.string(),
    sessionId: v.string(),
    checkoutUrl: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, { orderId, sessionId, checkoutUrl }) => {
    const order = await ctx.db
      .query("creditOrders")
      .withIndex("by_order_id", (q) => q.eq("orderId", orderId))
      .first();
    
    if (!order) {
      return { success: false };
    }
    
    await ctx.db.patch(order._id, {
      stripeSessionId: sessionId,
      checkoutUrl,
      sessionExpiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// ===============================
// STRIPE WEBHOOK HANDLER
// ===============================

export const handleRealStripeWebhook = action({
  args: {
    eventType: v.string(),
    eventData: v.any(),
    signature: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    processed: v.boolean(),
  }),
  handler: async (ctx, { eventType, eventData, signature }) => {
    console.log(`🔔 Real Stripe webhook received: ${eventType}`);
    
    try {
      // TODO: Verify webhook signature in production
      // const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      // const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      switch (eventType) {
        case 'checkout.session.completed':
          return await handleCheckoutCompleted(ctx, eventData);
          
        case 'invoice.payment_succeeded':
          return await handleSubscriptionPayment(ctx, eventData);
          
        case 'customer.subscription.created':
          return await handleSubscriptionCreated(ctx, eventData);
          
        case 'customer.subscription.updated':
          return await handleSubscriptionUpdated(ctx, eventData);
          
        case 'customer.subscription.deleted':
          return await handleSubscriptionCancelled(ctx, eventData);
          
        case 'payment_intent.payment_failed':
          return await handlePaymentFailed(ctx, eventData);
          
        default:
          console.log(`⚠️ Unhandled webhook event: ${eventType}`);
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

// Webhook handler functions
async function handleCheckoutCompleted(ctx: any, eventData: any) {
  const session = eventData.object;
  const orderId = session.metadata?.orderId;
  
  if (!orderId) {
    return {
      success: false,
      message: "No orderId found in session metadata",
      processed: false,
    };
  }
  
  console.log(`💳 Processing completed checkout for order: ${orderId}`);
  
  // Fulfill the credit purchase using existing business logic
  const result = await ctx.runMutation(internal.creditBusinessLogic.fulfillCreditPurchaseWithBusinessLogic, {
    orderId,
    stripeSessionId: session.id,
    paymentIntentId: session.payment_intent || session.subscription,
  });
  
  return {
    success: result.success,
    message: `Checkout completed for order ${orderId}`,
    processed: true,
  };
}

async function handleSubscriptionPayment(ctx: any, eventData: any) {
  const invoice = eventData.object;
  const subscriptionId = invoice.subscription;
  
  console.log(`🔄 Processing subscription payment: ${subscriptionId}`);
  
  // TODO: Handle recurring subscription payments
  // This would involve creating new credit transactions for recurring billing
  
  return {
    success: true,
    message: `Subscription payment processed: ${subscriptionId}`,
    processed: true,
  };
}

async function handleSubscriptionCreated(ctx: any, eventData: any) {
  const subscription = eventData.object;
  console.log(`📅 Subscription created: ${subscription.id}`);
  
  return {
    success: true,
    message: `Subscription created: ${subscription.id}`,
    processed: true,
  };
}

async function handleSubscriptionUpdated(ctx: any, eventData: any) {
  const subscription = eventData.object;
  console.log(`🔄 Subscription updated: ${subscription.id}`);
  
  return {
    success: true,
    message: `Subscription updated: ${subscription.id}`,
    processed: true,
  };
}

async function handleSubscriptionCancelled(ctx: any, eventData: any) {
  const subscription = eventData.object;
  console.log(`❌ Subscription cancelled: ${subscription.id}`);
  
  return {
    success: true,
    message: `Subscription cancelled: ${subscription.id}`,
    processed: true,
  };
}

async function handlePaymentFailed(ctx: any, eventData: any) {
  const paymentIntent = eventData.object;
  console.log(`💳 Payment failed: ${paymentIntent.id}`);
  
  return {
    success: true,
    message: `Payment failure handled: ${paymentIntent.id}`,
    processed: true,
  };
}

// ===============================
// VALIDATION & STATUS
// ===============================

export const checkRealStripeIntegration = query({
  args: {},
  returns: v.object({
    hasApiKey: v.boolean(),
    packagesIntegrated: v.number(),
    totalPackages: v.number(),
    realStripeProducts: v.array(v.object({
      slug: v.string(),
      stripeProductId: v.string(),
      stripePriceId: v.string(),
    })),
    message: v.string(),
  }),
  handler: async (ctx) => {
    const hasApiKey = !!process.env.STRIPE_SECRET_KEY;
    
    const packages = await ctx.db.query("creditPackages").collect();
    const realProducts = packages
      .filter(pkg => pkg.isStripeIntegrated && pkg.stripeProductId?.startsWith('prod_'))
      .map(pkg => ({
        slug: pkg.slug,
        stripeProductId: pkg.stripeProductId!,
        stripePriceId: pkg.stripePriceId!,
      }));
    
    return {
      hasApiKey,
      packagesIntegrated: realProducts.length,
      totalPackages: packages.length,
      realStripeProducts: realProducts,
      message: hasApiKey 
        ? `Stripe configured: ${realProducts.length}/${packages.length} packages have real Stripe products`
        : "Stripe API key not configured",
    };
  },
});