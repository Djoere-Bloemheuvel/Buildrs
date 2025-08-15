import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// Find duplicate companies by domain
export const findDuplicateCompanies = query({
  args: {},
  returns: v.array(v.object({
    domain: v.string(),
    count: v.number(),
    companies: v.array(v.object({
      _id: v.id("companies"),
      name: v.string(),
      _creationTime: v.number(),
      contactCount: v.number(),
    })),
  })),
  handler: async (ctx) => {
    // Get all companies with domains
    const companies = await ctx.db
      .query("companies")
      .filter((q) => q.neq(q.field("domain"), undefined))
      .collect();
    
    // Group by domain
    const domainGroups: Record<string, typeof companies> = {};
    
    for (const company of companies) {
      if (company.domain) {
        if (!domainGroups[company.domain]) {
          domainGroups[company.domain] = [];
        }
        domainGroups[company.domain].push(company);
      }
    }
    
    // Find duplicates (domains with more than 1 company)
    const duplicates = [];
    
    for (const [domain, companyList] of Object.entries(domainGroups)) {
      if (companyList.length > 1) {
        // Get contact count for each company
        const companiesWithCounts = await Promise.all(
          companyList.map(async (company) => {
            const contacts = await ctx.db
              .query("contacts")
              .filter((q) => q.eq(q.field("companyId"), company._id))
              .collect();
            
            return {
              _id: company._id,
              name: company.name,
              _creationTime: company._creationTime,
              contactCount: contacts.length,
            };
          })
        );
        
        duplicates.push({
          domain,
          count: companyList.length,
          companies: companiesWithCounts.sort((a, b) => b.contactCount - a.contactCount), // Sort by contact count desc
        });
      }
    }
    
    return duplicates.sort((a, b) => b.count - a.count); // Sort by duplicate count desc
  },
});

// Cleanup duplicate companies (keep the one with most contacts)
export const cleanupDuplicateCompanies = action({
  args: {
    domain: v.string(),
    keepCompanyId: v.id("companies"),
    removeCompanyIds: v.array(v.id("companies")),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    mergedContacts: v.number(),
    removedCompanies: v.number(),
  }),
  handler: async (ctx, { domain, keepCompanyId, removeCompanyIds }) => {
    console.log(`🧹 Cleaning up duplicates for domain: ${domain}`);
    console.log(`📌 Keeping company: ${keepCompanyId}`);
    console.log(`🗑️ Removing companies: ${removeCompanyIds.join(', ')}`);
    
    let mergedContacts = 0;
    let removedCompanies = 0;
    
    try {
      // Move all contacts from duplicate companies to the main company
      for (const removeId of removeCompanyIds) {
        // Get all contacts from the company to be removed
        const contactsToMove = await ctx.runQuery(internal.cleanupDuplicates.getCompanyContacts, {
          companyId: removeId,
        });
        
        console.log(`📞 Moving ${contactsToMove.length} contacts from ${removeId} to ${keepCompanyId}`);
        
        // Move each contact to the main company
        for (const contact of contactsToMove) {
          await ctx.runMutation(internal.cleanupDuplicates.moveContact, {
            contactId: contact._id,
            newCompanyId: keepCompanyId,
          });
          mergedContacts++;
        }
        
        // Remove the duplicate company
        await ctx.runMutation(internal.cleanupDuplicates.removeCompany, {
          companyId: removeId,
        });
        removedCompanies++;
        
        console.log(`✅ Removed duplicate company: ${removeId}`);
      }
      
      console.log(`🎉 Cleanup complete for domain: ${domain}`);
      console.log(`📊 Merged ${mergedContacts} contacts, removed ${removedCompanies} companies`);
      
      return {
        success: true,
        message: `Successfully cleaned up ${removedCompanies} duplicate companies for domain ${domain}`,
        mergedContacts,
        removedCompanies,
      };
      
    } catch (error) {
      console.error(`❌ Cleanup failed for domain ${domain}:`, error);
      return {
        success: false,
        message: `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        mergedContacts,
        removedCompanies,
      };
    }
  },
});

// Helper query to get company contacts
export const getCompanyContacts = query({
  args: { companyId: v.id("companies") },
  returns: v.array(v.object({
    _id: v.id("contacts"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
  })),
  handler: async (ctx, { companyId }) => {
    const contacts = await ctx.db
      .query("contacts")
      .filter((q) => q.eq(q.field("companyId"), companyId))
      .collect();
    
    return contacts.map(contact => ({
      _id: contact._id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
    }));
  },
});

// Helper mutation to move contact to new company
export const moveContact = mutation({
  args: {
    contactId: v.id("contacts"),
    newCompanyId: v.id("companies"),
  },
  returns: v.id("contacts"),
  handler: async (ctx, { contactId, newCompanyId }) => {
    await ctx.db.patch(contactId, {
      companyId: newCompanyId,
    });
    
    return contactId;
  },
});

// Helper mutation to remove company
export const removeCompany = mutation({
  args: { companyId: v.id("companies") },
  returns: v.string(),
  handler: async (ctx, { companyId }) => {
    await ctx.db.delete(companyId);
    return `Company ${companyId} removed`;
  },
});

// Auto cleanup all duplicates (use with caution!)
export const autoCleanupAllDuplicates = action({
  args: { 
    dryRun: v.optional(v.boolean()), // Set to true to see what would be cleaned without doing it
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    processedDomains: v.number(),
    totalMergedContacts: v.number(),
    totalRemovedCompanies: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, { dryRun = false }) => {
    console.log(`🧹 Starting auto cleanup of all duplicates (dryRun: ${dryRun})`);
    
    // Get all duplicates
    const duplicates = await ctx.runQuery(internal.cleanupDuplicates.findDuplicateCompanies);
    
    let processedDomains = 0;
    let totalMergedContacts = 0;
    let totalRemovedCompanies = 0;
    const errors: string[] = [];
    
    console.log(`📊 Found ${duplicates.length} domains with duplicates`);
    
    if (dryRun) {
      console.log("🔍 DRY RUN - No changes will be made");
      duplicates.forEach(dup => {
        console.log(`Domain: ${dup.domain} has ${dup.count} duplicates`);
        dup.companies.forEach(company => {
          console.log(`  - ${company.name} (${company.contactCount} contacts) ${company._id}`);
        });
      });
      
      return {
        success: true,
        message: `DRY RUN: Found ${duplicates.length} domains with duplicates`,
        processedDomains: duplicates.length,
        totalMergedContacts: 0,
        totalRemovedCompanies: 0,
        errors: [],
      };
    }
    
    // Process each duplicate domain
    for (const duplicate of duplicates) {
      try {
        // Keep the company with the most contacts (first in sorted list)
        const keepCompany = duplicate.companies[0];
        const removeCompanies = duplicate.companies.slice(1);
        
        if (removeCompanies.length === 0) continue;
        
        const result = await ctx.runAction(internal.cleanupDuplicates.cleanupDuplicateCompanies, {
          domain: duplicate.domain,
          keepCompanyId: keepCompany._id,
          removeCompanyIds: removeCompanies.map(c => c._id),
        });
        
        if (result.success) {
          processedDomains++;
          totalMergedContacts += result.mergedContacts;
          totalRemovedCompanies += result.removedCompanies;
        } else {
          errors.push(`${duplicate.domain}: ${result.message}`);
        }
        
        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        const errorMsg = `${duplicate.domain}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`❌ Error processing ${duplicate.domain}:`, error);
      }
    }
    
    const message = `Cleanup complete: processed ${processedDomains} domains, merged ${totalMergedContacts} contacts, removed ${totalRemovedCompanies} companies`;
    console.log(`🎉 ${message}`);
    
    if (errors.length > 0) {
      console.log(`⚠️ ${errors.length} errors occurred during cleanup`);
      errors.forEach(error => console.error(`  - ${error}`));
    }
    
    return {
      success: true,
      message,
      processedDomains,
      totalMergedContacts,
      totalRemovedCompanies,
      errors,
    };
  },
});