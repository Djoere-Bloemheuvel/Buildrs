import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * SYSTEM VALIDATION & COMPREHENSIVE TESTING
 * 
 * Complete system validation to ensure:
 * - Database integrity
 * - Business rules compliance  
 * - Stripe integration health
 * - Security measures
 * - Performance benchmarks
 */

// ===============================
// COMPREHENSIVE SYSTEM VALIDATION
// ===============================

export const runCompleteSystemValidation = mutation({
  args: {
    includePerformanceTests: v.optional(v.boolean()),
    includeSecurity: v.optional(v.boolean()),
    testDataCleanup: v.optional(v.boolean()),
  },
  returns: v.object({
    overall: v.string(), // "pass", "warning", "fail"
    score: v.number(), // 0-100
    testResults: v.array(v.object({
      category: v.string(),
      test: v.string(),
      status: v.string(), // "pass", "warning", "fail"
      message: v.string(),
      details: v.optional(v.any()),
      duration: v.number(),
    })),
    summary: v.object({
      totalTests: v.number(),
      passed: v.number(),
      warnings: v.number(),
      failed: v.number(),
      duration: v.number(),
    }),
    recommendations: v.array(v.string()),
    criticalIssues: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const startTime = Date.now();
    const testResults = [];
    const recommendations = [];
    const criticalIssues = [];
    
    console.log("🔍 Starting comprehensive system validation...");
    
    // 1. DATABASE SCHEMA VALIDATION
    console.log("📋 Testing database schema integrity...");
    
    const schemaTests = await runSchemaValidation(ctx);
    testResults.push(...schemaTests);
    
    // 2. CREDIT PACKAGE VALIDATION
    console.log("📦 Validating credit packages...");
    
    const packageTests = await runPackageValidation(ctx);
    testResults.push(...packageTests);
    
    // 3. STRIPE INTEGRATION VALIDATION
    console.log("💳 Testing Stripe integration...");
    
    const stripeTests = await runStripeValidation(ctx);
    testResults.push(...stripeTests);
    
    // 4. BUSINESS RULES VALIDATION
    console.log("🎯 Validating business rules...");
    
    const businessTests = await runBusinessRulesValidation(ctx);
    testResults.push(...businessTests);
    
    // 5. SECURITY VALIDATION
    if (args.includeSecurity !== false) {
      console.log("🔐 Testing security measures...");
      
      const securityTests = await runSecurityValidation(ctx);
      testResults.push(...securityTests);
    }
    
    // 6. PERFORMANCE TESTS
    if (args.includePerformanceTests) {
      console.log("⚡ Running performance tests...");
      
      const performanceTests = await runPerformanceTests(ctx);
      testResults.push(...performanceTests);
    }
    
    // 7. END-TO-END FLOW TESTS
    console.log("🔄 Testing end-to-end flows...");
    
    const e2eTests = await runEndToEndTests(ctx);
    testResults.push(...e2eTests);
    
    // 8. CALCULATE RESULTS
    const totalTests = testResults.length;
    const passed = testResults.filter(t => t.status === "pass").length;
    const warnings = testResults.filter(t => t.status === "warning").length;
    const failed = testResults.filter(t => t.status === "fail").length;
    
    const score = totalTests > 0 ? Math.round(((passed * 1 + warnings * 0.5) / totalTests) * 100) : 0;
    
    let overall: string;
    if (failed > 0) {
      overall = "fail";
    } else if (warnings > 3) {
      overall = "warning";
    } else {
      overall = "pass";
    }
    
    // 9. GENERATE RECOMMENDATIONS
    if (failed > 0) {
      recommendations.push(`Fix ${failed} failing tests before production deployment`);
    }
    if (warnings > 0) {
      recommendations.push(`Review ${warnings} warnings for potential improvements`);
    }
    if (score < 90) {
      recommendations.push("Consider additional testing and validation before production");
    }
    
    // Extract critical issues
    testResults.forEach(test => {
      if (test.status === "fail" && test.category === "security") {
        criticalIssues.push(`SECURITY: ${test.test} - ${test.message}`);
      }
      if (test.status === "fail" && test.category === "data_integrity") {
        criticalIssues.push(`DATA: ${test.test} - ${test.message}`);
      }
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ System validation completed in ${duration}ms`);
    console.log(`📊 Score: ${score}/100 (${passed}/${totalTests} passed)`);
    
    // 10. CLEANUP TEST DATA
    if (args.testDataCleanup) {
      console.log("🧹 Cleaning up test data...");
      await cleanupTestData(ctx);
    }
    
    return {
      overall,
      score,
      testResults,
      summary: {
        totalTests,
        passed,
        warnings,
        failed,
        duration,
      },
      recommendations,
      criticalIssues,
    };
  },
});

// Schema validation tests
async function runSchemaValidation(ctx: any) {
  const tests = [];
  const startTime = Date.now();
  
  try {
    // Test 1: Check all required tables exist
    const requiredTables = [
      'clients', 'creditPackages', 'creditOrders', 'creditTransactions',
      'domainUsageTracking', 'creditAudits'
    ];
    
    for (const table of requiredTables) {
      try {
        await ctx.db.query(table).take(1);
        tests.push({
          category: "schema",
          test: `Table exists: ${table}`,
          status: "pass",
          message: `Table ${table} is accessible`,
          duration: Date.now() - startTime,
        });
      } catch (error) {
        tests.push({
          category: "schema",
          test: `Table exists: ${table}`,
          status: "fail",
          message: `Table ${table} is not accessible: ${error}`,
          duration: Date.now() - startTime,
        });
      }
    }
    
    // Test 2: Check indexes exist and work
    try {
      await ctx.db.query("creditPackages").withIndex("by_slug", (q) => q.eq("slug", "pilot")).first();
      tests.push({
        category: "schema",
        test: "Index by_slug works",
        status: "pass",
        message: "creditPackages by_slug index is functional",
        duration: Date.now() - startTime,
      });
    } catch (error) {
      tests.push({
        category: "schema",
        test: "Index by_slug works", 
        status: "fail",
        message: `Index error: ${error}`,
        duration: Date.now() - startTime,
      });
    }
    
  } catch (error) {
    tests.push({
      category: "schema",
      test: "Schema validation",
      status: "fail",
      message: `Schema validation failed: ${error}`,
      duration: Date.now() - startTime,
    });
  }
  
  return tests;
}

// Package validation tests
async function runPackageValidation(ctx: any) {
  const tests = [];
  const startTime = Date.now();
  
  try {
    // Test 1: Check all 4 packages exist
    const packages = await ctx.db.query("creditPackages").collect();
    const expectedPackages = ['start', 'grow', 'scale', 'dominate'];
    
    for (const expectedSlug of expectedPackages) {
      const pkg = packages.find(p => p.slug === expectedSlug);
      if (pkg) {
        tests.push({
          category: "packages",
          test: `Package exists: ${expectedSlug}`,
          status: "pass",
          message: `Package ${expectedSlug} exists with ${pkg.leadCredits} lead credits`,
          duration: Date.now() - startTime,
        });
      } else {
        tests.push({
          category: "packages",
          test: `Package exists: ${expectedSlug}`,
          status: "fail",
          message: `Package ${expectedSlug} is missing`,
          duration: Date.now() - startTime,
        });
      }
    }
    
    // Test 2: Validate package pricing
    const startPackage = packages.find(p => p.slug === 'start');
    if (startPackage && startPackage.price === 9900) {
      tests.push({
        category: "packages",
        test: "Start package pricing",
        status: "pass",
        message: "Start package correctly priced at €99",
        duration: Date.now() - startTime,
      });
    } else {
      tests.push({
        category: "packages",
        test: "Start package pricing",
        status: "fail",
        message: `Start package price is ${startPackage?.price || 'unknown'}, expected 9900`,
        duration: Date.now() - startTime,
      });
    }
    
    // Test 3: Check Stripe integration
    const integratedPackages = packages.filter(p => p.isStripeIntegrated && p.stripeProductId);
    if (integratedPackages.length === packages.length) {
      tests.push({
        category: "packages",
        test: "Stripe integration",
        status: "pass",
        message: `All ${packages.length} packages are Stripe integrated`,
        duration: Date.now() - startTime,
      });
    } else {
      tests.push({
        category: "packages",
        test: "Stripe integration",
        status: "warning",
        message: `${integratedPackages.length}/${packages.length} packages are Stripe integrated`,
        duration: Date.now() - startTime,
      });
    }
    
  } catch (error) {
    tests.push({
      category: "packages",
      test: "Package validation",
      status: "fail",
      message: `Package validation failed: ${error}`,
      duration: Date.now() - startTime,
    });
  }
  
  return tests;
}

// Stripe validation tests
async function runStripeValidation(ctx: any) {
  const tests = [];
  const startTime = Date.now();
  
  try {
    // Test 1: Check Stripe integration status
    const status = await ctx.runQuery(internal.stripeIntegration.checkStripeIntegrationStatus);
    
    if (status.isSetup) {
      tests.push({
        category: "stripe",
        test: "Stripe setup status",
        status: "pass",
        message: status.message,
        details: status,
        duration: Date.now() - startTime,
      });
    } else {
      tests.push({
        category: "stripe",
        test: "Stripe setup status",
        status: "fail",
        message: status.message,
        details: status,
        duration: Date.now() - startTime,
      });
    }
    
    // Test 2: Test checkout creation
    try {
      const checkoutResult = await ctx.runMutation(internal.stripeIntegration.createStripeCheckoutWithProducts, {
        packageSlug: "grow",
        clientEmail: "validation-test@buildrs.nl",
        clientDomain: "validation-test.buildrs.nl",
        clientName: "Validation Test",
        successUrl: "https://app.buildrs.nl/success",
        cancelUrl: "https://app.buildrs.nl/cancel",
      });
      
      if (checkoutResult.checkoutUrl && checkoutResult.orderId) {
        tests.push({
          category: "stripe",
          test: "Checkout creation",
          status: "pass",
          message: "Checkout session created successfully",
          details: {
            orderId: checkoutResult.orderId,
            hasUrl: !!checkoutResult.checkoutUrl,
          },
          duration: Date.now() - startTime,
        });
      } else {
        tests.push({
          category: "stripe",
          test: "Checkout creation",
          status: "fail",
          message: "Checkout creation returned incomplete data",
          duration: Date.now() - startTime,
        });
      }
    } catch (error) {
      tests.push({
        category: "stripe",
        test: "Checkout creation",
        status: "fail",
        message: `Checkout creation failed: ${error}`,
        duration: Date.now() - startTime,
      });
    }
    
  } catch (error) {
    tests.push({
      category: "stripe",
      test: "Stripe validation",
      status: "fail",
      message: `Stripe validation failed: ${error}`,
      duration: Date.now() - startTime,
    });
  }
  
  return tests;
}

// Business rules validation tests  
async function runBusinessRulesValidation(ctx: any) {
  const tests = [];
  const startTime = Date.now();
  
  try {
    // Test 1: Start package domain limit
    const eligibility1 = await ctx.runQuery(internal.creditBusinessLogic.checkPilotPackageEligibility, {
      domain: "new-test-domain.com",
      email: "test@new-test-domain.com",
    });
    
    if (eligibility1.isEligible) {
      tests.push({
        category: "business_rules",
        test: "Start package eligibility - new domain",
        status: "pass",
        message: "New domain is eligible for Start package",
        duration: Date.now() - startTime,
      });
    } else {
      tests.push({
        category: "business_rules",
        test: "Start package eligibility - new domain",
        status: "warning",
        message: `New domain not eligible: ${eligibility1.reason}`,
        duration: Date.now() - startTime,
      });
    }
    
    // Test 2: First month bonus calculation
    // Create a test client first
    const testClientId = await ctx.db.insert("clients", {
      name: "Test Client",
      domain: "validation-business-test.com",
      email: "test@validation-business-test.com",
      currentLeadCredits: 0,
      currentEmailCredits: 0,
      currentLinkedinCredits: 0,
      currentAbmCredits: 0,
      hasUsedStartPackage: false,
      hasReceivedFirstMonthBonus: false,
      subscriptionStatus: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    const bonusEligibility = await ctx.runQuery(internal.creditBusinessLogic.checkFirstMonthBonusEligibility, {
      clientId: testClientId,
      packageSlug: "grow",
    });
    
    if (bonusEligibility.isEligible && bonusEligibility.bonusLeadCredits > 0) {
      tests.push({
        category: "business_rules",
        test: "First month bonus calculation",
        status: "pass",
        message: `Bonus correctly calculated: ${bonusEligibility.bonusLeadCredits} credits`,
        duration: Date.now() - startTime,
      });
    } else {
      tests.push({
        category: "business_rules",
        test: "First month bonus calculation",
        status: "fail",
        message: `Bonus calculation failed: ${bonusEligibility.reason}`,
        duration: Date.now() - startTime,
      });
    }
    
    // Cleanup test client
    await ctx.db.delete(testClientId);
    
  } catch (error) {
    tests.push({
      category: "business_rules",
      test: "Business rules validation",
      status: "fail",
      message: `Business rules validation failed: ${error}`,
      duration: Date.now() - startTime,
    });
  }
  
  return tests;
}

// Security validation tests
async function runSecurityValidation(ctx: any) {
  const tests = [];
  const startTime = Date.now();
  
  try {
    // Test 1: Domain eligibility security
    const riskCheck = await ctx.runQuery(internal.creditSystemSecure.checkDomainEligibilitySecure, {
      domain: "suspicious-domain.tk",
      email: "test@suspicious-domain.tk",
      ipAddress: "127.0.0.1",
    });
    
    if (riskCheck.riskScore > 0.3) {
      tests.push({
        category: "security",
        test: "Risk scoring system",
        status: "pass",
        message: `Risk correctly identified: score ${riskCheck.riskScore}`,
        details: riskCheck,
        duration: Date.now() - startTime,
      });
    } else {
      tests.push({
        category: "security",
        test: "Risk scoring system",
        status: "warning",
        message: `Risk score unexpectedly low: ${riskCheck.riskScore}`,
        duration: Date.now() - startTime,
      });
    }
    
    // Test 2: System integrity check
    const integrityCheck = await ctx.runQuery(internal.creditSystemSecure.runSystemIntegrityCheck, {
      maxClientsToCheck: 10,
    });
    
    if (integrityCheck.systemHealth.overallStatus === "healthy") {
      tests.push({
        category: "security",
        test: "System integrity check",
        status: "pass",
        message: "System integrity is healthy",
        details: integrityCheck.systemHealth,
        duration: Date.now() - startTime,
      });
    } else {
      tests.push({
        category: "security",
        test: "System integrity check",
        status: "warning",
        message: `System integrity: ${integrityCheck.systemHealth.overallStatus}`,
        details: integrityCheck.systemHealth,
        duration: Date.now() - startTime,
      });
    }
    
  } catch (error) {
    tests.push({
      category: "security",
      test: "Security validation",
      status: "fail",
      message: `Security validation failed: ${error}`,
      duration: Date.now() - startTime,
    });
  }
  
  return tests;
}

// Performance tests
async function runPerformanceTests(ctx: any) {
  const tests = [];
  const startTime = Date.now();
  
  try {
    // Test 1: Database query performance
    const queryStart = Date.now();
    await ctx.db.query("creditPackages").collect();
    const queryTime = Date.now() - queryStart;
    
    if (queryTime < 100) {
      tests.push({
        category: "performance",
        test: "Database query speed",
        status: "pass",
        message: `Query completed in ${queryTime}ms`,
        duration: Date.now() - startTime,
      });
    } else if (queryTime < 500) {
      tests.push({
        category: "performance",
        test: "Database query speed",
        status: "warning",
        message: `Query took ${queryTime}ms (acceptable but could be optimized)`,
        duration: Date.now() - startTime,
      });
    } else {
      tests.push({
        category: "performance",
        test: "Database query speed",
        status: "fail",
        message: `Query took ${queryTime}ms (too slow)`,
        duration: Date.now() - startTime,
      });
    }
    
    // Test 2: Credit balance calculation performance
    const clients = await ctx.db.query("clients").take(5);
    if (clients.length > 0) {
      const balanceStart = Date.now();
      await ctx.runQuery(internal.creditSystem.getCurrentCreditBalances, {
        clientId: clients[0]._id,
      });
      const balanceTime = Date.now() - balanceStart;
      
      if (balanceTime < 200) {
        tests.push({
          category: "performance",
          test: "Credit balance calculation",
          status: "pass",
          message: `Balance calculation completed in ${balanceTime}ms`,
          duration: Date.now() - startTime,
        });
      } else {
        tests.push({
          category: "performance",
          test: "Credit balance calculation",
          status: "warning",
          message: `Balance calculation took ${balanceTime}ms`,
          duration: Date.now() - startTime,
        });
      }
    }
    
  } catch (error) {
    tests.push({
      category: "performance",
      test: "Performance validation",
      status: "fail",
      message: `Performance validation failed: ${error}`,
      duration: Date.now() - startTime,
    });
  }
  
  return tests;
}

// End-to-end flow tests
async function runEndToEndTests(ctx: any) {
  const tests = [];
  const startTime = Date.now();
  
  try {
    // Test 1: Complete purchase flow
    const flowStart = Date.now();
    
    // Step 1: Create checkout
    const checkout = await ctx.runMutation(internal.stripeIntegration.createStripeCheckoutWithProducts, {
      packageSlug: "pilot",
      clientEmail: "e2e-test@buildrs.nl",
      clientDomain: "e2e-test.buildrs.nl",
      clientName: "E2E Test",
      successUrl: "https://app.buildrs.nl/success",
      cancelUrl: "https://app.buildrs.nl/cancel",
    });
    
    // Step 2: Fulfill purchase
    const fulfillment = await ctx.runMutation(internal.creditBusinessLogic.fulfillCreditPurchaseWithBusinessLogic, {
      orderId: checkout.orderId,
      stripeSessionId: checkout.sessionId,
      paymentIntentId: "pi_test_e2e",
    });
    
    // Step 3: Verify balances
    const balances = await ctx.runQuery(internal.creditSystem.getCurrentCreditBalances, {
      clientId: checkout.clientId,
    });
    
    const flowTime = Date.now() - flowStart;
    
    if (fulfillment.success && balances.leadCredits > 0) {
      tests.push({
        category: "e2e",
        test: "Complete purchase flow",
        status: "pass",
        message: `End-to-end flow completed in ${flowTime}ms with ${balances.leadCredits} lead credits`,
        details: {
          checkout: !!checkout.checkoutUrl,
          fulfillment: fulfillment.success,
          credits: balances.leadCredits,
        },
        duration: Date.now() - startTime,
      });
    } else {
      tests.push({
        category: "e2e",
        test: "Complete purchase flow",
        status: "fail",
        message: "End-to-end flow failed",
        details: {
          checkout: !!checkout.checkoutUrl,
          fulfillment: fulfillment.success,
          credits: balances.leadCredits,
        },
        duration: Date.now() - startTime,
      });
    }
    
  } catch (error) {
    tests.push({
      category: "e2e",
      test: "End-to-end flow test",
      status: "fail",
      message: `E2E test failed: ${error}`,
      duration: Date.now() - startTime,
    });
  }
  
  return tests;
}

// Cleanup test data
async function cleanupTestData(ctx: any) {
  try {
    // Remove test clients
    const testClients = await ctx.db
      .query("clients")
      .filter((q) => q.or(
        q.eq(q.field("domain"), "validation-test.buildrs.nl"),
        q.eq(q.field("domain"), "e2e-test.buildrs.nl"),
        q.eq(q.field("domain"), "validation-business-test.com")
      ))
      .collect();
    
    for (const client of testClients) {
      // Remove related orders
      const orders = await ctx.db
        .query("creditOrders")
        .withIndex("by_client", (q) => q.eq("clientId", client._id))
        .collect();
      
      for (const order of orders) {
        await ctx.db.delete(order._id);
      }
      
      // Remove client
      await ctx.db.delete(client._id);
    }
    
    console.log(`🧹 Cleaned up ${testClients.length} test clients`);
    
  } catch (error) {
    console.error("Cleanup failed:", error);
  }
}

// Quick health check
export const quickHealthCheck = query({
  args: {},
  returns: v.object({
    status: v.string(),
    components: v.object({
      database: v.boolean(),
      packages: v.boolean(),
      stripe: v.boolean(),
    }),
    message: v.string(),
  }),
  handler: async (ctx) => {
    try {
      // Check database
      const packages = await ctx.db.query("creditPackages").take(1);
      const dbHealthy = packages.length > 0;
      
      // Check packages
      const allPackages = await ctx.db.query("creditPackages").collect();
      const packagesHealthy = allPackages.length >= 4;
      
      // Check Stripe integration
      const integratedPackages = allPackages.filter(p => p.isStripeIntegrated);
      const stripeHealthy = integratedPackages.length === allPackages.length;
      
      const allHealthy = dbHealthy && packagesHealthy && stripeHealthy;
      
      return {
        status: allHealthy ? "healthy" : "degraded",
        components: {
          database: dbHealthy,
          packages: packagesHealthy,
          stripe: stripeHealthy,
        },
        message: allHealthy 
          ? "All systems operational"
          : `Issues detected: ${!dbHealthy ? 'database ' : ''}${!packagesHealthy ? 'packages ' : ''}${!stripeHealthy ? 'stripe' : ''}`.trim(),
      };
      
    } catch (error) {
      return {
        status: "critical",
        components: {
          database: false,
          packages: false,
          stripe: false,
        },
        message: `Health check failed: ${error}`,
      };
    }
  },
});