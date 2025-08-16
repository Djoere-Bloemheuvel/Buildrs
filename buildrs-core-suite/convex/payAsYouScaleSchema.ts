import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * PAY-AS-YOU-SCALE CREDIT SYSTEM SCHEMA
 * 
 * Schema extensions for the flexible subscription + add-ons credit system
 */

export const payAsYouScaleSchema = {
  // Base subscription tiers (monthly recurring)
  subscriptionTiers: defineTable({
    slug: v.string(), // "starter", "professional", "enterprise"
    name: v.string(),
    description: v.string(),
    
    // Base monthly allowances
    baseLeadCredits: v.number(),
    baseEmailCredits: v.number(),
    baseLinkedinCredits: v.number(),
    baseAbmCredits: v.number(),
    
    // Pricing
    monthlyPrice: v.number(), // in cents
    currency: v.string(),
    
    // Stripe integration
    stripeProductId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    
    // Configuration
    isActive: v.boolean(),
    priority: v.number(), // Display order
    
    // Features & limits
    features: v.array(v.string()),
    maxAddOns: v.optional(v.number()), // Max add-ons allowed
    
    // Audit
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"], { unique: true })
    .index("by_priority", ["priority"])
    .index("by_active", ["isActive"]),

  // Available add-ons (can be combined)
  creditAddOns: defineTable({
    slug: v.string(), // "leads-250", "emails-500", "linkedin-100"
    name: v.string(),
    description: v.string(),
    
    // Credit allocation
    creditType: v.string(), // "leads", "emails", "linkedin", "abm"
    creditAmount: v.number(),
    
    // Pricing
    monthlyPrice: v.number(), // in cents
    currency: v.string(),
    
    // Stripe integration
    stripeProductId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    
    // Configuration
    isActive: v.boolean(),
    category: v.string(), // "outbound", "linkedin", "data"
    
    // Compatibility
    compatibleTiers: v.array(v.string()), // Which tiers can use this add-on
    maxQuantity: v.optional(v.number()), // Max quantity per subscription
    
    // Audit
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"], { unique: true })
    .index("by_credit_type", ["creditType"])
    .index("by_category", ["category"])
    .index("by_active", ["isActive"]),

  // Client subscriptions (replaces simple packages)
  clientSubscriptions: defineTable({
    clientId: v.id("clients"),
    
    // Current subscription details
    baseTier: v.id("subscriptionTiers"),
    status: v.string(), // "active", "cancelled", "past_due", "paused"
    
    // Billing cycle
    billingPeriod: v.string(), // "monthly"
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    nextBillingDate: v.number(),
    
    // Stripe integration
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    
    // Metadata
    metadata: v.optional(v.object({})),
    
    // Audit
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_client", ["clientId"], { unique: true })
    .index("by_stripe_subscription", ["stripeSubscriptionId"], { unique: true })
    .index("by_status", ["status"])
    .index("by_billing_date", ["nextBillingDate"]),

  // Active add-ons for each subscription
  subscriptionAddOns: defineTable({
    subscriptionId: v.id("clientSubscriptions"),
    addOnId: v.id("creditAddOns"),
    
    // Quantity & pricing
    quantity: v.number(), // How many of this add-on
    unitPrice: v.number(), // Price at time of purchase (for price changes)
    totalPrice: v.number(), // quantity × unitPrice
    
    // Billing
    addedAt: v.number(),
    firstBilledAt: v.optional(v.number()),
    lastBilledAt: v.optional(v.number()),
    
    // Status
    status: v.string(), // "active", "cancelled", "pending"
    cancelledAt: v.optional(v.number()),
    
    // Stripe integration
    stripeSubscriptionItemId: v.string(), // Stripe subscription item
    
    // Audit
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_subscription", ["subscriptionId"])
    .index("by_addon", ["addOnId"])
    .index("by_stripe_item", ["stripeSubscriptionItemId"], { unique: true })
    .index("by_status", ["status"]),

  // Monthly credit allocations (for rollover tracking)
  monthlyAllocation: defineTable({
    clientId: v.id("clients"),
    subscriptionId: v.id("clientSubscriptions"),
    
    // Billing period this allocation is for
    periodStart: v.number(),
    periodEnd: v.number(),
    month: v.string(), // "2025-01" for easy querying
    
    // Base tier credits
    baseLeadCredits: v.number(),
    baseEmailCredits: v.number(),
    baseLinkedinCredits: v.number(),
    baseAbmCredits: v.number(),
    
    // Add-on credits
    addonLeadCredits: v.number(),
    addonEmailCredits: v.number(),
    addonLinkedinCredits: v.number(),
    addonAbmCredits: v.number(),
    
    // Total credits for this month
    totalLeadCredits: v.number(),
    totalEmailCredits: v.number(),
    totalLinkedinCredits: v.number(),
    totalAbmCredits: v.number(),
    
    // Usage tracking
    usedLeadCredits: v.number(),
    usedEmailCredits: v.number(),
    usedLinkedinCredits: v.number(),
    usedAbmCredits: v.number(),
    
    // Rollover tracking (leads/emails only)
    rolloverFromPrevious: v.object({
      leadCredits: v.number(),
      emailCredits: v.number(),
    }),
    
    // Status
    status: v.string(), // "active", "completed", "expired"
    
    // Audit
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_client", ["clientId"])
    .index("by_subscription", ["subscriptionId"])
    .index("by_month", ["month"])
    .index("by_period", ["periodStart", "periodEnd"])
    .index("by_client_month", ["clientId", "month"], { unique: true }),

  // Credit rollover history (for 3-month tracking)
  creditRollovers: defineTable({
    clientId: v.id("clients"),
    
    // Source allocation (where credits came from)
    sourceAllocationId: v.id("monthlyAllocation"),
    sourceMonth: v.string(),
    
    // Target allocation (where credits rolled to)
    targetAllocationId: v.optional(v.id("monthlyAllocation")),
    targetMonth: v.string(),
    
    // Rollover details
    creditType: v.string(), // "leads" or "emails"
    amountRolled: v.number(),
    amountUsed: v.number(), // How much of the rollover was used
    amountExpired: v.number(), // Amount that expired after 3 months
    
    // Timing
    rolledAt: v.number(),
    expiresAt: v.number(), // 3 months from source month
    expiredAt: v.optional(v.number()),
    
    // Status
    status: v.string(), // "active", "expired", "fully_used"
    
    // Audit
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_client", ["clientId"])
    .index("by_source_allocation", ["sourceAllocationId"])
    .index("by_target_allocation", ["targetAllocationId"])
    .index("by_credit_type", ["creditType"])
    .index("by_expires_at", ["expiresAt"])
    .index("by_status", ["status"]),

  // Subscription change requests (for mid-cycle changes)
  subscriptionChanges: defineTable({
    clientId: v.id("clients"),
    subscriptionId: v.id("clientSubscriptions"),
    
    // Change details
    changeType: v.string(), // "tier_upgrade", "tier_downgrade", "add_addon", "remove_addon", "modify_addon"
    
    // Before state
    oldTierId: v.optional(v.id("subscriptionTiers")),
    oldAddOns: v.optional(v.array(v.object({
      addOnId: v.id("creditAddOns"),
      quantity: v.number(),
    }))),
    
    // After state
    newTierId: v.optional(v.id("subscriptionTiers")),
    newAddOns: v.optional(v.array(v.object({
      addOnId: v.id("creditAddOns"),
      quantity: v.number(),
    }))),
    
    // Pricing impact
    proratedAmount: v.number(), // Prorated charge/credit
    nextCycleAmount: v.number(), // New recurring amount
    
    // Timing
    effectiveDate: v.number(), // When change takes effect
    requestedAt: v.number(),
    processedAt: v.optional(v.number()),
    
    // Status
    status: v.string(), // "pending", "processing", "completed", "failed", "cancelled"
    
    // Stripe integration
    stripeInvoiceId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    
    // Audit
    requestedBy: v.string(), // user ID or "system"
    notes: v.optional(v.string()),
    metadata: v.optional(v.object({})),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_client", ["clientId"])
    .index("by_subscription", ["subscriptionId"])
    .index("by_status", ["status"])
    .index("by_effective_date", ["effectiveDate"])
    .index("by_change_type", ["changeType"]),
};

// Helper types for TypeScript
export type SubscriptionTier = {
  _id: string;
  slug: string;
  name: string;
  baseLeadCredits: number;
  baseEmailCredits: number;
  baseLinkedinCredits: number;
  baseAbmCredits: number;
  monthlyPrice: number;
  currency: string;
};

export type CreditAddOn = {
  _id: string;
  slug: string;
  name: string;
  creditType: "leads" | "emails" | "linkedin" | "abm";
  creditAmount: number;
  monthlyPrice: number;
  currency: string;
};

export type ClientSubscription = {
  _id: string;
  clientId: string;
  baseTier: string;
  status: "active" | "cancelled" | "past_due" | "paused";
  stripeSubscriptionId: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
};

export type MonthlyAllocation = {
  _id: string;
  clientId: string;
  month: string;
  totalLeadCredits: number;
  totalEmailCredits: number;
  totalLinkedinCredits: number;
  totalAbmCredits: number;
  usedLeadCredits: number;
  usedEmailCredits: number;
  usedLinkedinCredits: number;
  usedAbmCredits: number;
};