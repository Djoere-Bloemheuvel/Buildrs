import { v } from "convex/values";
import { internalMutation, internalQuery, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * FINAL SIMPLIFIED MIGRATION
 * 
 * This migration completely replaces the complex contacts table with the new simplified version:
 * - leadId: v.id("leads")
 * - clientId: v.id("clients") 
 * - companyId: v.id("companies")
 * - purchasedAt: v.number()
 * - status: v.optional(v.string())
 * - lastCommunicationAt: v.optional(v.number())
 * - optedIn: v.optional(v.boolean())
 * - fullEnrichment: v.optional(v.boolean())
 */

// ===============================
// MIGRATE TO SIMPLIFIED CONTACTS
// ===============================

export const migrateToSimplifiedContacts = internalMutation({
  args: {},
  returns: v.object({
    contactsMigrated: v.number(),
    contactsSkipped: v.number(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    console.log("🔄 Migrating to simplified contacts table...");
    
    // Get all existing contacts
    const existingContacts = await ctx.db.query("contacts").collect();
    console.log(`📊 Found ${existingContacts.length} existing contacts to migrate`);
    
    if (existingContacts.length === 0) {
      return {
        contactsMigrated: 0,
        contactsSkipped: 0,
        message: "No existing contacts to migrate - already using simplified schema",
      };
    }
    
    let contactsMigrated = 0;
    let contactsSkipped = 0;
    
    // First, backup existing contacts to contacts_old if not already done
    const existingOldContacts = await ctx.db.query("contacts_old").collect();
    if (existingOldContacts.length === 0) {
      console.log("📦 Backing up existing contacts to contacts_old...");
      for (const contact of existingContacts) {
        await ctx.db.insert("contacts_old", {
          ...contact,
          _id: undefined, // Remove the _id field
          _creationTime: undefined, // Remove the _creationTime field
        });
      }
    }
    
    // Migrate each contact to simplified format
    for (const contact of existingContacts) {
      try {
        // Skip if this contact doesn't have required fields
        if (!contact.leadId || !contact.clientId) {
          console.log(`⚠️ Skipping contact ${contact._id} - missing leadId or clientId`);
          contactsSkipped++;
          continue;
        }
        
        // Get lead to determine companyId
        const lead = await ctx.db.get(contact.leadId);
        if (!lead || !lead.companyId) {
          console.log(`⚠️ Skipping contact ${contact._id} - lead not found or no company`);
          contactsSkipped++;
          continue;
        }
        
        // Delete the old contact
        await ctx.db.delete(contact._id);
        
        // Create simplified contact
        await ctx.db.insert("contacts", {
          leadId: contact.leadId,
          clientId: contact.clientId,
          companyId: lead.companyId,
          purchasedAt: contact.purchasedAt || contact._creationTime,
          
          // Map essential fields
          status: contact.status || "cold",
          lastCommunicationAt: contact.lastContactedAt,
          optedIn: contact.optedIn || false,
          fullEnrichment: false, // Default to false for migrated contacts
        });
        
        contactsMigrated++;
        
        if (contactsMigrated % 50 === 0) {
          console.log(`📈 Progress: ${contactsMigrated} migrated, ${contactsSkipped} skipped`);
        }
        
      } catch (error) {
        console.error(`❌ Error migrating contact ${contact._id}:`, error);
        contactsSkipped++;
      }
    }
    
    console.log(`✅ Migration completed: ${contactsMigrated} migrated, ${contactsSkipped} skipped`);
    
    return {
      contactsMigrated,
      contactsSkipped,
      message: `Successfully migrated ${contactsMigrated} contacts to simplified schema, ${contactsSkipped} skipped`,
    };
  },
});

// ===============================
// VALIDATE SIMPLIFIED MIGRATION
// ===============================

export const validateSimplifiedMigration = internalQuery({
  args: {},
  returns: v.object({
    isValid: v.boolean(),
    issues: v.array(v.string()),
    statistics: v.object({
      totalContacts: v.number(),
      contactsWithoutCompany: v.number(),
      contactsWithoutLead: v.number(),
      duplicateRelationships: v.number(),
      optedInContacts: v.number(),
      fullyEnrichedContacts: v.number(),
    }),
    message: v.string(),
  }),
  handler: async (ctx) => {
    console.log("🔄 Validating simplified migration...");
    
    const issues: string[] = [];
    
    // Get all contacts
    const contacts = await ctx.db.query("contacts").collect();
    const leads = await ctx.db.query("leads").collect();
    const companies = await ctx.db.query("companies").collect();
    const clients = await ctx.db.query("clients").collect();
    
    // Create ID sets for validation
    const leadIds = new Set(leads.map(l => l._id));
    const companyIds = new Set(companies.map(c => c._id));
    const clientIds = new Set(clients.map(c => c._id));
    
    let contactsWithoutCompany = 0;
    let contactsWithoutLead = 0;
    let duplicateRelationships = 0;
    let optedInContacts = 0;
    let fullyEnrichedContacts = 0;
    
    // Check 1: All contacts have valid references
    for (const contact of contacts) {
      if (!leadIds.has(contact.leadId)) {
        issues.push(`Contact ${contact._id} references non-existent lead ${contact.leadId}`);
        contactsWithoutLead++;
      }
      if (!companyIds.has(contact.companyId)) {
        issues.push(`Contact ${contact._id} references non-existent company ${contact.companyId}`);
        contactsWithoutCompany++;
      }
      if (!clientIds.has(contact.clientId)) {
        issues.push(`Contact ${contact._id} references non-existent client ${contact.clientId}`);
      }
      
      if (contact.optedIn === true) optedInContacts++;
      if (contact.fullEnrichment === true) fullyEnrichedContacts++;
    }
    
    // Check 2: No duplicate leadId + clientId combinations
    const contactCombinations = new Set<string>();
    for (const contact of contacts) {
      const combo = `${contact.leadId}-${contact.clientId}`;
      if (contactCombinations.has(combo)) {
        issues.push(`Duplicate contact combination: lead ${contact.leadId} + client ${contact.clientId}`);
        duplicateRelationships++;
      }
      contactCombinations.add(combo);
    }
    
    // Check 3: Company consistency (leadId's company should match contact's companyId)
    for (const contact of contacts) {
      const lead = leads.find(l => l._id === contact.leadId);
      if (lead && lead.companyId !== contact.companyId) {
        issues.push(`Contact ${contact._id}: lead's company (${lead.companyId}) doesn't match contact's company (${contact.companyId})`);
      }
    }
    
    const isValid = issues.length === 0;
    
    console.log(`✅ Simplified migration validation ${isValid ? "PASSED" : "FAILED"} with ${issues.length} issues`);
    
    return {
      isValid,
      issues,
      statistics: {
        totalContacts: contacts.length,
        contactsWithoutCompany,
        contactsWithoutLead,
        duplicateRelationships,
        optedInContacts,
        fullyEnrichedContacts,
      },
      message: isValid ? "Simplified migration validation passed" : `Simplified migration validation failed with ${issues.length} issues`,
    };
  },
});

// ===============================
// RUN COMPLETE SIMPLIFIED MIGRATION
// ===============================

export const runSimplifiedMigration = internalAction({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    migrationResult: v.object({
      contactsMigrated: v.number(),
      contactsSkipped: v.number(),
      message: v.string(),
    }),
    validationResult: v.object({
      isValid: v.boolean(),
      issues: v.array(v.string()),
      statistics: v.object({
        totalContacts: v.number(),
        contactsWithoutCompany: v.number(),
        contactsWithoutLead: v.number(),
        duplicateRelationships: v.number(),
        optedInContacts: v.number(),
        fullyEnrichedContacts: v.number(),
      }),
      message: v.string(),
    }),
    message: v.string(),
  }),
  handler: async (ctx, { dryRun = false }) => {
    console.log(`🚀 Starting simplified migration (${dryRun ? "DRY RUN" : "LIVE RUN"})...`);
    
    try {
      if (dryRun) {
        // Just validate current state
        const validationResult = await ctx.runQuery(internal.finalSimplifiedMigration.validateSimplifiedMigration, {});
        
        return {
          success: true,
          migrationResult: {
            contactsMigrated: 0,
            contactsSkipped: 0,
            message: "Dry run - no changes made",
          },
          validationResult,
          message: "Dry run completed successfully",
        };
      }
      
      // Run the migration
      const migrationResult = await ctx.runMutation(internal.finalSimplifiedMigration.migrateToSimplifiedContacts, {});
      
      // Validate the results
      const validationResult = await ctx.runQuery(internal.finalSimplifiedMigration.validateSimplifiedMigration, {});
      
      const success = validationResult.isValid;
      
      console.log(`🏁 Simplified migration ${success ? "COMPLETED SUCCESSFULLY" : "COMPLETED WITH ISSUES"}`);
      
      return {
        success,
        migrationResult,
        validationResult,
        message: success ? "Simplified migration completed successfully" : "Simplified migration completed with validation issues",
      };
      
    } catch (error) {
      console.error("💥 Simplified migration failed:", error);
      
      // Get current validation state
      const validationResult = await ctx.runQuery(internal.finalSimplifiedMigration.validateSimplifiedMigration, {});
      
      return {
        success: false,
        migrationResult: {
          contactsMigrated: 0,
          contactsSkipped: 0,
          message: `Migration failed: ${error}`,
        },
        validationResult,
        message: "Simplified migration failed",
      };
    }
  },
});