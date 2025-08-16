import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * SYSTEM INTEGRITY REPAIR UTILITIES
 * 
 * Functions to fix and repair system inconsistencies
 */

// Repair running totals for all transactions
export const repairTransactionRunningTotals = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    transactionsFixed: v.number(),
    clientsProcessed: v.number(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    console.log("🔧 Starting transaction running totals repair...");
    
    let transactionsFixed = 0;
    let clientsProcessed = 0;
    
    // Get all clients with transactions
    const clients = await ctx.db.query("clients").collect();
    
    for (const client of clients) {
      const transactions = await ctx.db
        .query("creditTransactions")
        .withIndex("by_client", (q) => q.eq("clientId", client._id))
        .filter((q) => q.eq(q.field("status"), "completed"))
        .collect();
      
      if (transactions.length === 0) continue;
      
      // Sort by timestamp
      transactions.sort((a, b) => a.timestamp - b.timestamp);
      
      // Calculate correct running totals per credit type
      const runningTotals = {
        lead: 0,
        email: 0,
        linkedin: 0,
        abm: 0,
      };
      
      for (const transaction of transactions) {
        // Update running total for this credit type
        if (transaction.creditType === "lead") {
          runningTotals.lead += transaction.netAmount;
        } else if (transaction.creditType === "email") {
          runningTotals.email += transaction.netAmount;
        } else if (transaction.creditType === "linkedin") {
          runningTotals.linkedin += transaction.netAmount;
        } else if (transaction.creditType === "abm") {
          runningTotals.abm += transaction.netAmount;
        }
        
        // For simplicity, use the total across all credit types as running total
        const totalRunning = runningTotals.lead + runningTotals.email + runningTotals.linkedin + runningTotals.abm;
        
        // Update if different
        if (Math.abs(transaction.runningTotal - totalRunning) > 0.01) {
          await ctx.db.patch(transaction._id, {
            runningTotal: totalRunning,
          });
          transactionsFixed++;
          console.log(`✅ Fixed running total for transaction ${transaction.transactionId}`);
        }
      }
      
      clientsProcessed++;
    }
    
    console.log(`✅ Repair completed: ${transactionsFixed} transactions fixed across ${clientsProcessed} clients`);
    
    return {
      success: true,
      transactionsFixed,
      clientsProcessed,
      message: `Fixed ${transactionsFixed} transactions across ${clientsProcessed} clients`,
    };
  },
});

// Reconcile client balances with transaction history
export const reconcileClientBalances = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    clientsReconciled: v.number(),
    totalDiscrepancies: v.number(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    console.log("🔄 Starting client balance reconciliation...");
    
    let clientsReconciled = 0;
    let totalDiscrepancies = 0;
    
    const clients = await ctx.db.query("clients").collect();
    
    for (const client of clients) {
      const transactions = await ctx.db
        .query("creditTransactions")
        .withIndex("by_client", (q) => q.eq("clientId", client._id))
        .filter((q) => q.eq(q.field("status"), "completed"))
        .collect();
      
      // Calculate balances from transactions
      const computedBalances = {
        leadCredits: 0,
        emailCredits: 0,
        linkedinCredits: 0,
        abmCredits: 0,
      };
      
      for (const transaction of transactions) {
        if (transaction.creditType === "lead") {
          computedBalances.leadCredits += transaction.netAmount;
        } else if (transaction.creditType === "email") {
          computedBalances.emailCredits += transaction.netAmount;
        } else if (transaction.creditType === "linkedin") {
          computedBalances.linkedinCredits += transaction.netAmount;
        } else if (transaction.creditType === "abm") {
          computedBalances.abmCredits += transaction.netAmount;
        }
      }
      
      // Check for discrepancies
      let hasDiscrepancy = false;
      const updates: any = {};
      
      if (Math.abs((client.currentLeadCredits || 0) - computedBalances.leadCredits) > 0.01) {
        updates.currentLeadCredits = computedBalances.leadCredits;
        hasDiscrepancy = true;
        totalDiscrepancies++;
      }
      
      if (Math.abs((client.currentEmailCredits || 0) - computedBalances.emailCredits) > 0.01) {
        updates.currentEmailCredits = computedBalances.emailCredits;
        hasDiscrepancy = true;
        totalDiscrepancies++;
      }
      
      if (Math.abs((client.currentLinkedinCredits || 0) - computedBalances.linkedinCredits) > 0.01) {
        updates.currentLinkedinCredits = computedBalances.linkedinCredits;
        hasDiscrepancy = true;
        totalDiscrepancies++;
      }
      
      if (Math.abs((client.currentAbmCredits || 0) - computedBalances.abmCredits) > 0.01) {
        updates.currentAbmCredits = computedBalances.abmCredits;
        hasDiscrepancy = true;
        totalDiscrepancies++;
      }
      
      // Update if there are discrepancies
      if (hasDiscrepancy) {
        updates.updatedAt = Date.now();
        await ctx.db.patch(client._id, updates);
        console.log(`✅ Reconciled balances for client ${client._id}`);
        clientsReconciled++;
      }
    }
    
    console.log(`✅ Reconciliation completed: ${clientsReconciled} clients reconciled, ${totalDiscrepancies} discrepancies fixed`);
    
    return {
      success: true,
      clientsReconciled,
      totalDiscrepancies,
      message: `Reconciled ${clientsReconciled} clients with ${totalDiscrepancies} discrepancies fixed`,
    };
  },
});

// Complete system repair (runs all repair functions)
export const runCompleteSystemRepair = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    repairResults: v.object({
      runningTotals: v.object({
        transactionsFixed: v.number(),
        clientsProcessed: v.number(),
      }),
      balanceReconciliation: v.object({
        clientsReconciled: v.number(),
        totalDiscrepancies: v.number(),
      }),
    }),
    message: v.string(),
  }),
  handler: async (ctx) => {
    console.log("🚀 Starting complete system repair...");
    
    // 1. Fix running totals
    console.log("1. Repairing transaction running totals...");
    const runningTotalsResult = await ctx.runMutation(internal.repairSystemIntegrity.repairTransactionRunningTotals);
    
    // 2. Reconcile balances
    console.log("2. Reconciling client balances...");
    const balanceResult = await ctx.runMutation(internal.repairSystemIntegrity.reconcileClientBalances);
    
    const success = runningTotalsResult.success && balanceResult.success;
    
    console.log("✅ Complete system repair finished");
    
    return {
      success,
      repairResults: {
        runningTotals: {
          transactionsFixed: runningTotalsResult.transactionsFixed,
          clientsProcessed: runningTotalsResult.clientsProcessed,
        },
        balanceReconciliation: {
          clientsReconciled: balanceResult.clientsReconciled,
          totalDiscrepancies: balanceResult.totalDiscrepancies,
        },
      },
      message: success 
        ? "System repair completed successfully"
        : "System repair completed with some issues",
    };
  },
});

// Verify system integrity after repair
export const verifySystemIntegrityAfterRepair = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    verificationResults: v.object({
      totalClients: v.number(),
      clientsWithIssues: v.number(),
      totalTransactions: v.number(),
      inconsistentTransactions: v.number(),
      overallStatus: v.string(),
    }),
    issuesFound: v.array(v.string()),
    message: v.string(),
  }),
  handler: async (ctx) => {
    console.log("🔍 Verifying system integrity after repair...");
    
    // Run the system integrity check again
    const integrityCheck = await ctx.runQuery(internal.creditSystemSecure.runSystemIntegrityCheck, {
      maxClientsToCheck: 50,
    });
    
    const issuesFound = integrityCheck.criticalIssues.map(issue => 
      `${issue.severity.toUpperCase()}: ${issue.description}`
    );
    
    const success = integrityCheck.systemHealth.overallStatus === "healthy";
    
    console.log(`🔍 Verification completed: ${integrityCheck.systemHealth.overallStatus}`);
    
    return {
      success,
      verificationResults: {
        totalClients: integrityCheck.systemHealth.totalClients,
        clientsWithIssues: integrityCheck.systemHealth.clientsWithIssues,
        totalTransactions: integrityCheck.systemHealth.totalTransactions,
        inconsistentTransactions: integrityCheck.systemHealth.inconsistentTransactions,
        overallStatus: integrityCheck.systemHealth.overallStatus,
      },
      issuesFound,
      message: success 
        ? "System integrity verified - all checks passed"
        : `System has ${issuesFound.length} remaining issues`,
    };
  },
});