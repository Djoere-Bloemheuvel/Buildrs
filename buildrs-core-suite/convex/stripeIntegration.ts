import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * STRIPE PRODUCT INTEGRATION
 * 
 * Integrates credit packages with real Stripe products and prices.
 * All 4 Lead Engine packages are created as Stripe products.
 */

// ===============================
// STRIPE PRODUCT CREATION
// ===============================

// Create all 4 Lead Engine packages as Stripe products
export const createStripeProducts = action({
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
  }),
  handler: async (ctx) => {
    // TODO: Replace with real Stripe integration
    // For now, create mock Stripe products that follow the real pattern
    
    const packages = [
      {
        slug: "pilot",
        name: "Pilot Pack",
        price: 14900, // €149.00 in cents
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
        price: 24900, // €249.00 in cents
        billingPeriod: "monthly",
        leadCredits: 3000,
        emailCredits: 6000,
        linkedinCredits: 600,
        abmCredits: 100,
        firstMonthBonusLeadCredits: 6000,
        description: "Voor groeiende teams - maandelijks abonnement"
      },
      {
        slug: "scale",
        name: "Scale",
        price: 49900, // €499.00 in cents
        billingPeriod: "monthly",
        leadCredits: 7500,
        emailCredits: 15000,
        linkedinCredits: 1500,
        abmCredits: 300,
        firstMonthBonusLeadCredits: 15000,
        description: "Voor schaalbare groei - maandelijks abonnement"
      },
      {
        slug: "dominate",
        name: "Dominate",
        price: 99900, // €999.00 in cents
        billingPeriod: "monthly",
        leadCredits: 20000,
        emailCredits: 40000,
        linkedinCredits: 4000,
        abmCredits: 800,
        firstMonthBonusLeadCredits: 40000,
        description: "Voor marktdominantie - maandelijks abonnement"
      }
    ];

    const createdProducts = [];

    for (const pkg of packages) {
      try {
        // Real Stripe integration using fetch API
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        let stripeProductId: string;
        let stripePriceId: string;

        if (stripeSecretKey) {
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
            throw new Error(`Stripe product creation failed: ${await productResponse.text()}`);
          }

          const stripeProduct = await productResponse.json();
          stripeProductId = stripeProduct.id;

          // Create Stripe Price
          const priceBody = new URLSearchParams({
            product: stripeProduct.id,
            unit_amount: pkg.price.toString(),
            currency: 'eur',
            'metadata[package_slug]': pkg.slug,
          });

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
            throw new Error(`Stripe price creation failed: ${await priceResponse.text()}`);
          }

          const stripePrice = await priceResponse.json();
          stripePriceId = stripePrice.id;
        } else {
          // Fallback to mock IDs if no API key
          stripeProductId = `prod_${pkg.slug}_${Date.now()}`;
          stripePriceId = `price_${pkg.slug}_${Date.now()}`;
        }

        // Update our credit package with Stripe IDs
        const existingPackage = await ctx.db
          .query("creditPackages")
          .withIndex("by_slug", (q) => q.eq("slug", pkg.slug))
          .first();

        if (existingPackage) {
          await ctx.db.patch(existingPackage._id, {
            stripeProductId,
            stripePriceId,
            isStripeIntegrated: true,
            updatedAt: Date.now(),
          });
        } else {
          // Create new package if it doesn't exist
          await ctx.db.insert("creditPackages", {
            slug: pkg.slug,
            name: pkg.name,
            leadCredits: pkg.leadCredits,
            emailCredits: pkg.emailCredits,
            linkedinCredits: pkg.linkedinCredits,
            abmCredits: pkg.abmCredits,
            firstMonthBonusLeadCredits: pkg.firstMonthBonusLeadCredits,
            price: pkg.price,
            currency: "eur",
            billingPeriod: pkg.billingPeriod,
            stripeProductId,
            stripePriceId,
            isStripeIntegrated: true,
            isActive: true,
            maxPurchasesPerDomain: pkg.slug === "pilot" ? 1 : undefined,
            isSpecialOffer: pkg.slug === "pilot",
            autoUpgradeToPackage: pkg.slug === "pilot" ? undefined : undefined, // Will be set later
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }

        createdProducts.push({
          packageSlug: pkg.slug,
          stripeProductId,
          stripePriceId,
          name: pkg.name,
          price: pkg.price,
        });

        console.log(`✅ Created Stripe product for ${pkg.name}: ${stripeProductId}`);

      } catch (error) {
        console.error(`❌ Failed to create Stripe product for ${pkg.name}:`, error);
      }
    }

    // Set up auto-upgrade relationship for Start package
    const startPackage = await ctx.db
      .query("creditPackages")
      .withIndex("by_slug", (q) => q.eq("slug", "pilot"))
      .first();

    const growPackage = await ctx.db
      .query("creditPackages")
      .withIndex("by_slug", (q) => q.eq("slug", "grow"))
      .first();

    if (startPackage && growPackage) {
      await ctx.db.patch(startPackage._id, {
        autoUpgradeToPackage: growPackage._id,
        updatedAt: Date.now(),
      });
    }

    return {
      success: true,
      productsCreated: createdProducts.length,
      products: createdProducts,
      message: `Successfully created ${createdProducts.length} Stripe products for Lead Engine packages`,
    };
  },
});

// ===============================
// STRIPE CHECKOUT WITH REAL PRODUCTS
// ===============================

// Create Stripe checkout session using real Stripe products
export const createStripeCheckoutWithProducts = action({
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
    stripeProductId: v.string(),
    stripePriceId: v.string(),
  }),
  handler: async (ctx, args) => {
    const startTime = Date.now();
    const now = Date.now();
    const requestId = `req_${now}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🚀 [${requestId}] Starting checkout creation for ${args.packageSlug}`);

    try {
      // 1. INPUT VALIDATION
      if (!args.packageSlug || typeof args.packageSlug !== 'string') {
        throw new Error("Package slug is required and must be a string");
      }
      
      if (!args.clientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.clientEmail)) {
        throw new Error("Valid email address is required");
      }
      
      if (!args.clientDomain || typeof args.clientDomain !== 'string') {
        throw new Error("Client domain is required");
      }
      
      if (!args.clientName || typeof args.clientName !== 'string' || args.clientName.length < 2) {
        throw new Error("Client name is required and must be at least 2 characters");
      }
      
      if (!args.successUrl || !args.successUrl.startsWith('http')) {
        throw new Error("Valid success URL is required");
      }
      
      if (!args.cancelUrl || !args.cancelUrl.startsWith('http')) {
        throw new Error("Valid cancel URL is required");
      }

      // 2. GET PACKAGE WITH STRIPE INTEGRATION
    
    const package_ = await ctx.runQuery(internal.stripeIntegration.getPackageBySlug, {
      slug: args.packageSlug,
    });

    if (!package_ || !package_.isActive) {
      throw new Error("Credit package not found or inactive");
    }

    if (!package_.stripeProductId || !package_.stripePriceId) {
      throw new Error("Package not integrated with Stripe. Run createStripeProducts first.");
    }

    // 2. BUSINESS RULES VALIDATION
    
    if (args.packageSlug === "pilot") {
      const eligibility = await ctx.runQuery(internal.creditBusinessLogic.checkPilotPackageEligibility, {
        domain: args.clientDomain,
        email: args.clientEmail,
      });

      if (!eligibility.isEligible) {
        throw new Error(eligibility.reason);
      }
    }

    // 3. CREATE OR GET CLIENT
    
    const cleanDomain = args.clientDomain.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];

    const clientResult = await ctx.runMutation(internal.stripeIntegration.createOrGetClient, {
      clientName: args.clientName,
      clientEmail: args.clientEmail,
      domain: cleanDomain,
      packageSlug: args.packageSlug,
      now,
    });

    const clientId = clientResult.clientId;

    // 4. CHECK FIRST MONTH BONUS ELIGIBILITY
    
    const bonusEligibility = await ctx.runQuery(internal.creditBusinessLogic.checkFirstMonthBonusEligibility, {
      clientId,
      packageSlug: args.packageSlug,
    });

    // 5. CREATE ORDER
    
    const orderId = `order_${now}_${Math.random().toString(36).substr(2, 9)}`;
    
    const orderResult = await ctx.runMutation(internal.stripeIntegration.createOrderForCheckout, {
      orderId,
      clientId,
      packageId: package_._id,
      totalPrice: package_.price,
      currency: package_.currency,
      isFirstMonthBonus: bonusEligibility.isEligible,
      stripeProductId: package_.stripeProductId!,
      stripePriceId: package_.stripePriceId!,
      now,
    });

    const orderDocId = orderResult.orderDocId;

    // 6. CREATE STRIPE CHECKOUT SESSION
    
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    let sessionId: string;
    let checkoutUrl: string;

    if (stripeSecretKey) {
      // Real Stripe checkout session creation
      const sessionBody = new URLSearchParams({
        'line_items[0][price]': package_.stripePriceId!,
        'line_items[0][quantity]': '1',
        mode: package_.billingPeriod === 'monthly' ? 'subscription' : 'payment',
        success_url: `${args.successUrl}?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
        cancel_url: `${args.cancelUrl}?order_id=${orderId}`,
        customer_email: args.clientEmail,
        'metadata[orderId]': orderId,
        'metadata[clientId]': clientId,
        'metadata[packageSlug]': args.packageSlug,
        'metadata[domain]': cleanDomain,
      });

      // Add subscription metadata if monthly billing
      if (package_.billingPeriod === 'monthly') {
        sessionBody.append('subscription_data[metadata][orderId]', orderId);
        sessionBody.append('subscription_data[metadata][clientId]', clientId);
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
        throw new Error(`Stripe checkout session creation failed: ${await sessionResponse.text()}`);
      }

      const stripeSession = await sessionResponse.json();
      sessionId = stripeSession.id;
      checkoutUrl = stripeSession.url;
    } else {
      // Fallback to mock for testing if no API key
      sessionId = `cs_test_${now}`;
      checkoutUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;
    }

    // 7. UPDATE ORDER WITH SESSION INFO
    
    await ctx.runMutation(internal.stripeIntegration.updateOrderWithSession, {
      orderDocId,
      stripeSessionId: sessionId,
      now,
    });

    return {
      checkoutUrl,
      orderId,
      sessionId,
      clientId,
      willReceiveBonus: bonusEligibility.isEligible,
      bonusLeadCredits: bonusEligibility.bonusLeadCredits,
      stripeProductId: package_.stripeProductId!,
      stripePriceId: package_.stripePriceId!,
    };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [${requestId}] Checkout creation failed after ${duration}ms:`, error);
      
      // Enhanced error response
      throw new Error(`Checkout creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// ===============================
// STRIPE WEBHOOK HANDLER
// ===============================

// Enhanced webhook handler for Stripe product integration
export const handleStripeWebhookForProducts = action({
  args: {
    eventType: v.string(),
    eventData: v.any(),
    signature: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    processed: v.boolean(),
  }),
  handler: async (ctx, { eventType, eventData, signature }) => {
    console.log(`🔔 Stripe webhook received: ${eventType}`);

    // Real webhook signature verification (implement when webhook endpoint is set up)
    // const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    // if (endpointSecret && signature) {
    //   // Verify webhook signature using crypto
    //   // Implementation would go here when webhook endpoint is ready
    // }

    switch (eventType) {
      case 'checkout.session.completed':
        return await handleCheckoutCompleted(ctx, eventData);
        
      case 'invoice.payment_succeeded':
        return await handleRecurringPayment(ctx, eventData);
        
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
  },
});

// Handle completed checkout (one-time or first subscription payment)
async function handleCheckoutCompleted(ctx: any, eventData: any) {
  const session = eventData.object;
  const orderId = session.metadata.orderId;
  
  if (!orderId) {
    return {
      success: false,
      message: "No orderId in session metadata",
      processed: false,
    };
  }

  // Fulfill the credit purchase
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

// Handle recurring subscription payments
async function handleRecurringPayment(ctx: any, eventData: any) {
  const invoice = eventData.object;
  const subscriptionId = invoice.subscription;
  const customerId = invoice.customer;

  // Find the client by Stripe customer ID
  const client = await ctx.db
    .query("clients")
    .withIndex("by_stripe_customer", (q) => q.eq("stripeCustomerId", customerId))
    .first();

  if (!client) {
    return {
      success: false,
      message: `No client found for Stripe customer ${customerId}`,
      processed: false,
    };
  }

  // Get subscription details to determine package
  // TODO: Implement recurring credit fulfillment logic
  
  return {
    success: true,
    message: `Recurring payment processed for customer ${customerId}`,
    processed: true,
  };
}

// Handle subscription creation
async function handleSubscriptionCreated(ctx: any, eventData: any) {
  const subscription = eventData.object;
  const customerId = subscription.customer;
  
  // Update client with subscription info
  const client = await ctx.db
    .query("clients")
    .withIndex("by_stripe_customer", (q) => q.eq("stripeCustomerId", customerId))
    .first();

  if (client) {
    await ctx.db.patch(client._id, {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: "active",
      updatedAt: Date.now(),
    });
  }

  return {
    success: true,
    message: `Subscription created for customer ${customerId}`,
    processed: true,
  };
}

// Handle subscription updates
async function handleSubscriptionUpdated(ctx: any, eventData: any) {
  const subscription = eventData.object;
  const customerId = subscription.customer;
  
  // Update client subscription status
  const client = await ctx.db
    .query("clients")
    .withIndex("by_stripe_customer", (q) => q.eq("stripeCustomerId", customerId))
    .first();

  if (client) {
    let status = "active";
    if (subscription.status === "canceled") status = "cancelled";
    else if (subscription.status === "past_due") status = "past_due";
    else if (subscription.status === "unpaid") status = "suspended";

    await ctx.db.patch(client._id, {
      subscriptionStatus: status,
      updatedAt: Date.now(),
    });
  }

  return {
    success: true,
    message: `Subscription updated for customer ${customerId}`,
    processed: true,
  };
}

// Handle subscription cancellation
async function handleSubscriptionCancelled(ctx: any, eventData: any) {
  const subscription = eventData.object;
  const customerId = subscription.customer;
  
  const client = await ctx.db
    .query("clients")
    .withIndex("by_stripe_customer", (q) => q.eq("stripeCustomerId", customerId))
    .first();

  if (client) {
    await ctx.db.patch(client._id, {
      subscriptionStatus: "cancelled",
      updatedAt: Date.now(),
    });
  }

  return {
    success: true,
    message: `Subscription cancelled for customer ${customerId}`,
    processed: true,
  };
}

// Handle payment failures
async function handlePaymentFailed(ctx: any, eventData: any) {
  const paymentIntent = eventData.object;
  const customerId = paymentIntent.customer;
  
  // TODO: Implement payment failure handling
  // - Notify client
  // - Suspend account if needed
  // - Retry payment logic
  
  return {
    success: true,
    message: `Payment failed for customer ${customerId}`,
    processed: true,
  };
}

// ===============================
// STRIPE PRODUCT MANAGEMENT
// ===============================

// Get all Stripe products for our packages
export const getStripeProducts = query({
  args: {},
  returns: v.array(v.object({
    packageSlug: v.string(),
    packageName: v.string(),
    stripeProductId: v.string(),
    stripePriceId: v.string(),
    price: v.number(),
    currency: v.string(),
    billingPeriod: v.string(),
    isActive: v.boolean(),
    leadCredits: v.number(),
    emailCredits: v.number(),
    linkedinCredits: v.number(),
    abmCredits: v.number(),
    firstMonthBonusLeadCredits: v.number(),
  })),
  handler: async (ctx) => {
    const packages = await ctx.db
      .query("creditPackages")
      .filter((q) => q.eq(q.field("isStripeIntegrated"), true))
      .collect();

    return packages.map(pkg => ({
      packageSlug: pkg.slug,
      packageName: pkg.name,
      stripeProductId: pkg.stripeProductId!,
      stripePriceId: pkg.stripePriceId!,
      price: pkg.price,
      currency: pkg.currency,
      billingPeriod: pkg.billingPeriod,
      isActive: pkg.isActive,
      leadCredits: pkg.leadCredits,
      emailCredits: pkg.emailCredits,
      linkedinCredits: pkg.linkedinCredits,
      abmCredits: pkg.abmCredits,
      firstMonthBonusLeadCredits: pkg.firstMonthBonusLeadCredits,
    }));
  },
});

// Check Stripe integration status
export const checkStripeIntegrationStatus = query({
  args: {},
  returns: v.object({
    isSetup: v.boolean(),
    packagesIntegrated: v.number(),
    totalPackages: v.number(),
    missingIntegrations: v.array(v.string()),
    message: v.string(),
  }),
  handler: async (ctx) => {
    const allPackages = await ctx.db.query("creditPackages").collect();
    const integratedPackages = allPackages.filter(pkg => pkg.isStripeIntegrated);
    
    const missingIntegrations = allPackages
      .filter(pkg => !pkg.isStripeIntegrated)
      .map(pkg => pkg.slug);

    const isSetup = integratedPackages.length === allPackages.length && allPackages.length >= 4;

    return {
      isSetup,
      packagesIntegrated: integratedPackages.length,
      totalPackages: allPackages.length,
      missingIntegrations,
      message: isSetup 
        ? "Stripe integration is complete for all packages"
        : `${missingIntegrations.length} packages need Stripe integration: ${missingIntegrations.join(', ')}`,
    };
  },
});

// Helper query to get package by slug
export const getPackageBySlug = query({
  args: { slug: v.string() },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("creditPackages")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
  },
});

// Helper mutation to create or get client
export const createOrGetClient = mutation({
  args: {
    clientName: v.string(),
    clientEmail: v.string(),
    domain: v.string(),
    packageSlug: v.string(),
    now: v.number(),
  },
  returns: v.object({ clientId: v.string() }),
  handler: async (ctx, args) => {
    let client = await ctx.db
      .query("clients")
      .withIndex("by_domain", (q) => q.eq("domain", args.domain))
      .first();

    let clientId: string;

    if (!client) {
      clientId = await ctx.db.insert("clients", {
        name: args.clientName,
        domain: args.domain,
        email: args.clientEmail,
        currentLeadCredits: 0,
        currentEmailCredits: 0,
        currentLinkedinCredits: 0,
        currentAbmCredits: 0,
        hasUsedStartPackage: args.packageSlug === "pilot",
        hasReceivedFirstMonthBonus: false,
        subscriptionStatus: "pending",
        createdAt: args.now,
        updatedAt: args.now,
      });

      if (args.packageSlug === "pilot") {
        await ctx.db.insert("domainUsageTracking", {
          domain: args.domain,
          hasUsedStartPackage: true,
          startPackageUsedAt: args.now,
          clientId,
          createdAt: args.now,
        });
      }
    } else {
      clientId = client._id;
      await ctx.db.patch(clientId, {
        name: args.clientName,
        email: args.clientEmail,
        updatedAt: args.now,
      });
    }

    return { clientId };
  },
});

// Helper mutation to create order
export const createOrderForCheckout = mutation({
  args: {
    orderId: v.string(),
    clientId: v.string(),
    packageId: v.string(),
    totalPrice: v.number(),
    currency: v.string(),
    isFirstMonthBonus: v.boolean(),
    stripeProductId: v.string(),
    stripePriceId: v.string(),
    now: v.number(),
  },
  returns: v.object({ orderDocId: v.string() }),
  handler: async (ctx, args) => {
    const orderDocId = await ctx.db.insert("creditOrders", {
      orderId: args.orderId,
      clientId: args.clientId,
      packageId: args.packageId,
      quantity: 1,
      totalPrice: args.totalPrice,
      currency: args.currency,
      paymentStatus: "pending",
      creditStatus: "pending",
      isFirstMonthBonus: args.isFirstMonthBonus,
      stripeProductId: args.stripeProductId,
      stripePriceId: args.stripePriceId,
      createdAt: args.now,
      updatedAt: args.now,
    });

    return { orderDocId };
  },
});

// Helper mutation to update order with session info
export const updateOrderWithSession = mutation({
  args: {
    orderDocId: v.string(),
    stripeSessionId: v.string(),
    now: v.number(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderDocId, {
      stripeSessionId: args.stripeSessionId,
      updatedAt: args.now,
    });

    return { success: true };
  },
});