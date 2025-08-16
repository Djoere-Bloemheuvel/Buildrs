import { v } from "convex/values";
import { internalMutation, internalQuery, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * DENORMALIZED PERFORMANCE MIGRATION
 * 
 * This migration updates the contacts table to include denormalized fields
 * from leads and companies tables for optimal performance:
 * 
 * From LEADS: firstName, lastName, linkedinUrl, jobTitle, functionGroup
 * From COMPANIES: name, website, companyLinkedinUrl, industryLabel, subindustryLabel, companySummary, shortCompanySummary
 */

// ===============================
// MIGRATE TO DENORMALIZED CONTACTS
// ===============================

export const migrateToDenormalizedContacts = internalMutation({
  args: {},
  returns: v.object({
    contactsUpdated: v.number(),
    contactsSkipped: v.number(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    console.log("🔄 Migrating to denormalized contacts table...");
    
    // Get all existing contacts
    const existingContacts = await ctx.db.query("contacts").collect();
    console.log(`📊 Found ${existingContacts.length} existing contacts to update`);
    
    if (existingContacts.length === 0) {
      return {
        contactsUpdated: 0,
        contactsSkipped: 0,
        message: "No existing contacts to migrate",
      };
    }
    
    let contactsUpdated = 0;
    let contactsSkipped = 0;
    
    // Update each contact with denormalized data
    for (const contact of existingContacts) {
      try {
        // Skip if this contact already has denormalized data
        if (contact.firstName !== undefined || contact.name !== undefined) {
          console.log(`⚠️ Skipping contact ${contact._id} - already has denormalized data`);
          contactsSkipped++;
          continue;
        }
        
        // Get lead data
        const lead = await ctx.db.get(contact.leadId);
        if (!lead) {
          console.log(`⚠️ Skipping contact ${contact._id} - lead not found`);
          contactsSkipped++;
          continue;
        }
        
        // Get company data
        const company = await ctx.db.get(contact.companyId);
        if (!company) {
          console.log(`⚠️ Skipping contact ${contact._id} - company not found`);
          contactsSkipped++;
          continue;
        }
        
        // Update contact with denormalized data
        await ctx.db.patch(contact._id, {
          // Denormalized lead data
          firstName: lead.firstName,
          lastName: lead.lastName,
          linkedinUrl: lead.linkedinUrl,
          jobTitle: lead.jobTitle,
          functionGroup: lead.functionGroup,
          
          // Denormalized company data
          name: company.name,
          website: company.website,
          companyLinkedinUrl: company.companyLinkedinUrl,
          industryLabel: company.industryLabel,
          subindustryLabel: company.subindustryLabel,
          companySummary: company.companySummary,
          shortCompanySummary: company.shortCompanySummary,
        });
        
        contactsUpdated++;
        
        if (contactsUpdated % 50 === 0) {
          console.log(`📈 Progress: ${contactsUpdated} updated, ${contactsSkipped} skipped`);
        }
        
      } catch (error) {
        console.error(`❌ Error updating contact ${contact._id}:`, error);
        contactsSkipped++;
      }
    }
    
    console.log(`✅ Migration completed: ${contactsUpdated} updated, ${contactsSkipped} skipped`);
    
    return {
      contactsUpdated,
      contactsSkipped,
      message: `Successfully updated ${contactsUpdated} contacts with denormalized data, ${contactsSkipped} skipped`,
    };
  },
});

// ===============================
// SYNC DENORMALIZED DATA (for ongoing maintenance)
// ===============================

export const syncDenormalizedData = internalMutation({
  args: {
    leadId: v.optional(v.id("leads")),
    companyId: v.optional(v.id("companies")),
  },
  returns: v.object({
    contactsUpdated: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, { leadId, companyId }) => {
    let contactsToUpdate: any[] = [];
    
    if (leadId) {
      // Update all contacts that reference this lead
      contactsToUpdate = await ctx.db
        .query("contacts")
        .withIndex("by_lead", (q) => q.eq("leadId", leadId))
        .collect();
      
      // Get the updated lead data
      const lead = await ctx.db.get(leadId);
      if (!lead) {
        throw new Error(`Lead ${leadId} not found`);
      }
      
      // Update all contacts with new lead data
      for (const contact of contactsToUpdate) {
        await ctx.db.patch(contact._id, {
          firstName: lead.firstName,
          lastName: lead.lastName,
          linkedinUrl: lead.linkedinUrl,
          jobTitle: lead.jobTitle,
          functionGroup: lead.functionGroup,
        });
      }
    }
    
    if (companyId) {
      // Update all contacts that reference this company
      const companyContacts = await ctx.db
        .query("contacts")
        .withIndex("by_company", (q) => q.eq("companyId", companyId))
        .collect();
      
      // Get the updated company data
      const company = await ctx.db.get(companyId);
      if (!company) {
        throw new Error(`Company ${companyId} not found`);
      }
      
      // Update all contacts with new company data
      for (const contact of companyContacts) {
        await ctx.db.patch(contact._id, {
          name: company.name,
          website: company.website,
          companyLinkedinUrl: company.companyLinkedinUrl,
          industryLabel: company.industryLabel,
          subindustryLabel: company.subindustryLabel,
          companySummary: company.companySummary,
          shortCompanySummary: company.shortCompanySummary,
        });
      }
      
      contactsToUpdate = [...contactsToUpdate, ...companyContacts];
    }
    
    return {
      contactsUpdated: contactsToUpdate.length,
      message: `Synced denormalized data for ${contactsToUpdate.length} contacts`,
    };
  },
});

// ===============================
// VALIDATE DENORMALIZED MIGRATION
// ===============================

export const validateDenormalizedMigration = internalQuery({
  args: {},
  returns: v.object({
    isValid: v.boolean(),
    issues: v.array(v.string()),
    statistics: v.object({
      totalContacts: v.number(),
      contactsWithDenormalizedData: v.number(),
      contactsMissingLeadData: v.number(),
      contactsMissingCompanyData: v.number(),
      dataConsistencyIssues: v.number(),
    }),
    message: v.string(),
  }),
  handler: async (ctx) => {
    console.log("🔄 Validating denormalized migration...");
    
    const issues: string[] = [];
    
    // Get all contacts
    const contacts = await ctx.db.query("contacts").collect();
    
    let contactsWithDenormalizedData = 0;
    let contactsMissingLeadData = 0;
    let contactsMissingCompanyData = 0;
    let dataConsistencyIssues = 0;
    
    // Check each contact
    for (const contact of contacts) {
      // Check if contact has denormalized data
      const hasLeadData = contact.firstName !== undefined || contact.lastName !== undefined;
      const hasCompanyData = contact.name !== undefined;
      
      if (hasLeadData && hasCompanyData) {
        contactsWithDenormalizedData++;
        
        // Validate data consistency
        const lead = await ctx.db.get(contact.leadId);
        const company = await ctx.db.get(contact.companyId);
        
        if (lead) {
          // Check lead data consistency
          if (contact.firstName !== lead.firstName ||
              contact.lastName !== lead.lastName ||
              contact.linkedinUrl !== lead.linkedinUrl ||
              contact.jobTitle !== lead.jobTitle ||
              contact.functionGroup !== lead.functionGroup) {
            issues.push(`Contact ${contact._id} has inconsistent lead data`);
            dataConsistencyIssues++;
          }
        }
        
        if (company) {
          // Check company data consistency
          if (contact.name !== company.name ||
              contact.website !== company.website ||
              contact.companyLinkedinUrl !== company.companyLinkedinUrl ||
              contact.industryLabel !== company.industryLabel ||
              contact.subindustryLabel !== company.subindustryLabel ||
              contact.companySummary !== company.companySummary ||
              contact.shortCompanySummary !== company.shortCompanySummary) {
            issues.push(`Contact ${contact._id} has inconsistent company data`);
            dataConsistencyIssues++;
          }
        }
      } else {
        if (!hasLeadData) contactsMissingLeadData++;
        if (!hasCompanyData) contactsMissingCompanyData++;
      }
    }
    
    const isValid = issues.length === 0 && contactsMissingLeadData === 0 && contactsMissingCompanyData === 0;
    
    console.log(`✅ Denormalized migration validation ${isValid ? "PASSED" : "FAILED"} with ${issues.length} issues`);
    
    return {
      isValid,
      issues,
      statistics: {
        totalContacts: contacts.length,
        contactsWithDenormalizedData,
        contactsMissingLeadData,
        contactsMissingCompanyData,
        dataConsistencyIssues,
      },
      message: isValid ? "Denormalized migration validation passed" : `Denormalized migration validation failed with ${issues.length} issues`,
    };
  },
});

// ===============================
// RUN COMPLETE DENORMALIZED MIGRATION
// ===============================

export const runDenormalizedMigration = internalAction({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    migrationResult: v.object({
      contactsUpdated: v.number(),
      contactsSkipped: v.number(),
      message: v.string(),
    }),
    validationResult: v.object({
      isValid: v.boolean(),
      issues: v.array(v.string()),
      statistics: v.object({
        totalContacts: v.number(),
        contactsWithDenormalizedData: v.number(),
        contactsMissingLeadData: v.number(),
        contactsMissingCompanyData: v.number(),
        dataConsistencyIssues: v.number(),
      }),
      message: v.string(),
    }),
    message: v.string(),
  }),
  handler: async (ctx, { dryRun = false }) => {
    console.log(`🚀 Starting denormalized migration (${dryRun ? "DRY RUN" : "LIVE RUN"})...`);
    
    try {
      if (dryRun) {
        // Just validate current state
        const validationResult = await ctx.runQuery(internal.denormalizedMigration.validateDenormalizedMigration, {});
        
        return {
          success: true,
          migrationResult: {
            contactsUpdated: 0,
            contactsSkipped: 0,
            message: "Dry run - no changes made",
          },
          validationResult,
          message: "Dry run completed successfully",
        };
      }
      
      // Run the migration
      const migrationResult = await ctx.runMutation(internal.denormalizedMigration.migrateToDenormalizedContacts, {});
      
      // Validate the results
      const validationResult = await ctx.runQuery(internal.denormalizedMigration.validateDenormalizedMigration, {});
      
      const success = validationResult.isValid;
      
      console.log(`🏁 Denormalized migration ${success ? "COMPLETED SUCCESSFULLY" : "COMPLETED WITH ISSUES"}`);
      
      return {
        success,
        migrationResult,
        validationResult,
        message: success ? "Denormalized migration completed successfully" : "Denormalized migration completed with validation issues",
      };
      
    } catch (error) {
      console.error("💥 Denormalized migration failed:", error);
      
      // Get current validation state
      const validationResult = await ctx.runQuery(internal.denormalizedMigration.validateDenormalizedMigration, {});
      
      return {
        success: false,
        migrationResult: {
          contactsUpdated: 0,
          contactsSkipped: 0,
          message: `Migration failed: ${error}`,
        },
        validationResult,
        message: "Denormalized migration failed",
      };
    }
  },
});