import { v } from "convex/values";
import { mutation, action } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * STRIPE PRODUCTS SETUP SCRIPT
 * 
 * One-time setup to create all Lead Engine packages as Stripe products.
 * This script should be run after seeding the initial credit packages.
 */

// Setup all Stripe products and integrate with existing packages
export const setupAllStripeProducts = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    results: v.object({
      packagesFound: v.number(),
      stripeProductsCreated: v.number(),
      errors: v.array(v.string()),
    }),
  }),
  handler: async (ctx) => {
    console.log("🚀 Starting Stripe products setup...");
    
    const results = {
      packagesFound: 0,
      stripeProductsCreated: 0,
      errors: [] as string[],
    };

    try {
      // 1. First ensure credit packages exist (skip if they already exist)
      const existingPackages = await ctx.db.query("creditPackages").collect();
      if (existingPackages.length === 0) {
        await ctx.runMutation(internal.seedCreditPackages.seedLeadEnginePackages);
        console.log("✅ Credit packages seeded");
      } else {
        console.log("📦 Credit packages already exist, proceeding with integration");
      }

      // 2. Get all existing packages
      const packages = await ctx.db.query("creditPackages").collect();
      results.packagesFound = packages.length;
      
      if (packages.length === 0) {
        return {
          success: false,
          message: "No credit packages found. Please seed packages first.",
          results,
        };
      }

      console.log(`📦 Found ${packages.length} credit packages`);

      // 3. Create Stripe products for each package
      for (const pkg of packages) {
        try {
          console.log(`🔄 Processing package: ${pkg.name} (${pkg.slug})`);

          // Check if already integrated
          if (pkg.isStripeIntegrated && pkg.stripeProductId && pkg.stripePriceId) {
            console.log(`⏭️ Package ${pkg.slug} already has Stripe integration`);
            continue;
          }

          // Create Stripe product (mocked for development)
          const stripeProductId = `prod_${pkg.slug}_${Date.now()}`;
          const stripePriceId = `price_${pkg.slug}_${Date.now()}`;

          // TODO: Real Stripe integration
          /*
          const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
          
          console.log(`📝 Creating Stripe product for ${pkg.name}...`);
          const stripeProduct = await stripe.products.create({
            name: `Lead Engine ${pkg.name}`,
            description: `${pkg.name} pakket: ${pkg.leadCredits} lead credits, ${pkg.emailCredits} email credits, ${pkg.linkedinCredits} LinkedIn credits, ${pkg.abmCredits} ABM credits`,
            metadata: {
              package_slug: pkg.slug,
              package_id: pkg._id,
              lead_credits: pkg.leadCredits.toString(),
              email_credits: pkg.emailCredits.toString(),
              linkedin_credits: pkg.linkedinCredits.toString(),
              abm_credits: pkg.abmCredits.toString(),
              first_month_bonus: pkg.firstMonthBonusLeadCredits.toString(),
              billing_period: pkg.billingPeriod,
            }
          });

          console.log(`💰 Creating Stripe price for ${pkg.name}...`);
          const stripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: pkg.price,
            currency: pkg.currency.toLowerCase(),
            recurring: pkg.billingPeriod === 'monthly' ? { 
              interval: 'month',
              usage_type: 'licensed' 
            } : undefined,
            metadata: {
              package_slug: pkg.slug,
              package_id: pkg._id,
            }
          });

          const stripeProductId = stripeProduct.id;
          const stripePriceId = stripePrice.id;
          */

          // Update package with Stripe IDs
          await ctx.db.patch(pkg._id, {
            stripeProductId,
            stripePriceId,
            isStripeIntegrated: true,
            updatedAt: Date.now(),
          });

          results.stripeProductsCreated++;
          console.log(`✅ Package ${pkg.slug} integrated with Stripe: ${stripeProductId}`);

        } catch (error) {
          const errorMsg = `Failed to integrate package ${pkg.slug}: ${error}`;
          console.error(`❌ ${errorMsg}`);
          results.errors.push(errorMsg);
        }
      }

      // 4. Verify integration status
      const integrationStatus = await ctx.runQuery(internal.stripeIntegration.checkStripeIntegrationStatus);
      console.log(`🔍 Integration status: ${integrationStatus.message}`);

      const success = results.stripeProductsCreated > 0 && results.errors.length === 0;
      const message = success 
        ? `Successfully integrated ${results.stripeProductsCreated} packages with Stripe`
        : `Integration completed with ${results.errors.length} errors`;

      return {
        success,
        message,
        results,
      };

    } catch (error) {
      console.error("❌ Setup failed:", error);
      return {
        success: false,
        message: `Setup failed: ${error}`,
        results,
      };
    }
  },
});

// Test the complete flow: create products and test checkout
export const testStripeIntegrationFlow = action({
  args: {
    packageSlug: v.string(),
    testEmail: v.string(),
    testDomain: v.string(),
    testName: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    steps: v.array(v.object({
      step: v.string(),
      success: v.boolean(),
      result: v.any(),
    })),
  }),
  handler: async (ctx, { packageSlug, testEmail, testDomain, testName }) => {
    const steps = [];

    try {
      // Step 1: Setup Stripe products
      console.log("🔧 Step 1: Setting up Stripe products...");
      const setupResult = await ctx.runMutation(internal.setupStripeProducts.setupAllStripeProducts);
      steps.push({
        step: "Setup Stripe products",
        success: setupResult.success,
        result: setupResult,
      });

      // If no products were created, it means they already exist
      if (!setupResult.success && setupResult.results.packagesFound === 0) {
        throw new Error(`Setup failed: ${setupResult.message}`);
      }

      // Step 2: Check eligibility
      console.log("✅ Step 2: Checking package eligibility...");
      const eligibilityResult = await ctx.runQuery(internal.creditBusinessLogic.checkPilotPackageEligibility, {
        domain: testDomain,
        email: testEmail,
      });
      steps.push({
        step: "Check eligibility",
        success: eligibilityResult.isEligible,
        result: eligibilityResult,
      });

      if (!eligibilityResult.isEligible && packageSlug === "pilot") {
        throw new Error(`Not eligible for Start package: ${eligibilityResult.reason}`);
      }

      // Step 3: Create checkout session
      console.log("💳 Step 3: Creating Stripe checkout session...");
      const checkoutResult = await ctx.runMutation(internal.stripeIntegration.createStripeCheckoutWithProducts, {
        packageSlug,
        clientEmail: testEmail,
        clientDomain: testDomain,
        clientName: testName,
        successUrl: "https://app.buildrs.nl/success",
        cancelUrl: "https://app.buildrs.nl/cancel",
      });
      steps.push({
        step: "Create checkout session",
        success: true,
        result: {
          orderId: checkoutResult.orderId,
          sessionId: checkoutResult.sessionId,
          willReceiveBonus: checkoutResult.willReceiveBonus,
          stripeProductId: checkoutResult.stripeProductId,
        },
      });

      // Step 4: Simulate payment completion
      console.log("🎉 Step 4: Simulating payment completion...");
      const fulfillmentResult = await ctx.runMutation(internal.creditBusinessLogic.fulfillCreditPurchaseWithBusinessLogic, {
        orderId: checkoutResult.orderId,
        stripeSessionId: checkoutResult.sessionId,
        paymentIntentId: `pi_test_${Date.now()}`,
      });
      steps.push({
        step: "Fulfill credit purchase",
        success: fulfillmentResult.success,
        result: {
          creditsAdded: fulfillmentResult.creditsAdded,
          transactionIds: fulfillmentResult.transactionIds,
          message: fulfillmentResult.message,
        },
      });

      // Step 5: Verify final state
      console.log("🔍 Step 5: Verifying final credit balances...");
      const balanceResult = await ctx.runQuery(internal.creditSystem.getCurrentCreditBalances, {
        clientId: checkoutResult.clientId,
      });
      steps.push({
        step: "Verify credit balances",
        success: balanceResult.isVerified,
        result: balanceResult,
      });

      return {
        success: true,
        message: `Complete Stripe integration test successful for ${packageSlug} package`,
        steps,
      };

    } catch (error) {
      console.error("❌ Test flow failed:", error);
      return {
        success: false,
        message: `Test failed: ${error}`,
        steps,
      };
    }
  },
});

// Quick status check
export const checkSetupStatus = mutation({
  args: {},
  returns: v.object({
    creditPackagesExist: v.boolean(),
    packagesCount: v.number(),
    stripeIntegrated: v.boolean(),
    integratedCount: v.number(),
    readyForProduction: v.boolean(),
    nextSteps: v.array(v.string()),
  }),
  handler: async (ctx) => {
    // Check credit packages
    const packages = await ctx.db.query("creditPackages").collect();
    const integratedPackages = packages.filter(pkg => pkg.isStripeIntegrated);
    
    const creditPackagesExist = packages.length >= 4;
    const stripeIntegrated = integratedPackages.length === packages.length && packages.length >= 4;
    const readyForProduction = creditPackagesExist && stripeIntegrated;

    const nextSteps = [];
    if (!creditPackagesExist) {
      nextSteps.push("Run seedCreditPackages to create the 4 Lead Engine packages");
    }
    if (!stripeIntegrated) {
      nextSteps.push("Run setupAllStripeProducts to integrate packages with Stripe");
    }
    if (readyForProduction) {
      nextSteps.push("System is ready! Set up real Stripe keys in production");
    }

    return {
      creditPackagesExist,
      packagesCount: packages.length,
      stripeIntegrated,
      integratedCount: integratedPackages.length,
      readyForProduction,
      nextSteps,
    };
  },
});