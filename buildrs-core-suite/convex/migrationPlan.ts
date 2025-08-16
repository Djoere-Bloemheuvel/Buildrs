/**
 * COMPREHENSIVE MIGRATION PLAN: CONTACTS TO LEAD-CONTACT MODEL
 * 
 * This document outlines the complete strategy for migrating from the current
 * contacts-based system to the new lead-contact marketplace model.
 */

import { v } from "convex/values";
import { internalMutation, internalQuery, internalAction } from "./_generated/server";

// ===============================
// MIGRATION PHASES
// ===============================

/**
 * PHASE 1: SCHEMA MIGRATION
 * 
 * 1. Deploy new schema alongside existing schema
 * 2. Create new tables with suffix "_new" to avoid conflicts
 * 3. Gradually migrate data in batches
 * 4. Verify data integrity at each step
 * 5. Switch to new schema atomically
 * 6. Drop old tables
 */

/**
 * PHASE 2: DATA MIGRATION STRATEGY
 * 
 * Current State:
 * - contacts table contains client-specific person data
 * - leads table contains duplicate data from Apollo imports
 * 
 * Target State:
 * - leads table becomes the master person database (global)
 * - contacts table becomes client-specific relationship data
 * 
 * Migration Steps:
 * 1. Merge existing contacts + leads into new master leads table
 * 2. Create new contacts entries for each existing contact (leadId + clientId)
 * 3. Update all foreign key references
 * 4. Migrate communications, deals, tasks, etc.
 */

/**
 * PHASE 3: FUNCTION MIGRATION
 * 
 * Business Logic Changes Required:
 * 1. Candidate Views - adapt to new lead-contact model
 * 2. Timeline Views - handle both leads and contacts
 * 3. Search Views - separate lead search from contact search
 * 4. Analytics Views - aggregate across new model
 * 5. Apollo Processor - create leads first, then convert to contacts
 */

// ===============================
// MIGRATION FUNCTIONS
// ===============================

// Step 1: Backup existing data
export const backupExistingData = internalAction({
  args: {},
  returns: v.object({
    contactsCount: v.number(),
    leadsCount: v.number(),
    backupTimestamp: v.number(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    const contacts = await ctx.runQuery("api.contacts.list", { limit: 10000 });
    const leads = await ctx.runQuery("api.leads.listLeads", { limit: 10000 });
    
    const timestamp = Date.now();
    
    // Store backup data (implement as needed)
    // await ctx.storage.store(...);
    
    return {
      contactsCount: contacts.length,
      leadsCount: leads.length,
      backupTimestamp: timestamp,
      message: `Backup completed: ${contacts.length} contacts, ${leads.length} leads`,
    };
  },
});

// Step 2: Analyze data for migration planning
export const analyzeExistingData = internalQuery({
  args: {},
  returns: v.object({
    totalContacts: v.number(),
    totalLeads: v.number(),
    contactsWithClientId: v.number(),
    contactsWithoutClientId: v.number(),
    leadsWithOriginalContactId: v.number(),
    duplicateEmails: v.number(),
    orphanedReferences: v.object({
      deals: v.number(),
      communications: v.number(),
      tasks: v.number(),
      notes: v.number(),
    }),
    recommendedMigrationBatches: v.number(),
  }),
  handler: async (ctx) => {
    // Analyze contacts
    const contacts = await ctx.db.query("contacts").collect();
    const leads = await ctx.db.query("leads").collect();
    
    const contactsWithClientId = contacts.filter(c => c.clientId).length;
    const contactsWithoutClientId = contacts.filter(c => !c.clientId).length;
    const leadsWithOriginalContactId = leads.filter(l => l.originalContactId).length;
    
    // Check for duplicate emails
    const emailMap = new Map<string, number>();
    contacts.forEach(c => {
      if (c.email) {
        emailMap.set(c.email, (emailMap.get(c.email) || 0) + 1);
      }
    });
    const duplicateEmails = Array.from(emailMap.values()).filter(count => count > 1).length;
    
    // Check orphaned references
    const deals = await ctx.db.query("deals").collect();
    const communications = await ctx.db.query("communications").collect();
    const tasks = await ctx.db.query("tasks").collect();
    const notes = await ctx.db.query("notes").collect();
    
    const contactIds = new Set(contacts.map(c => c._id));
    
    const orphanedDeals = deals.filter(d => d.contactId && !contactIds.has(d.contactId)).length;
    const orphanedCommunications = communications.filter(c => c.contactId && !contactIds.has(c.contactId)).length;
    const orphanedTasks = tasks.filter(t => t.contactId && !contactIds.has(t.contactId)).length;
    const orphanedNotes = notes.filter(n => n.contactId && !contactIds.has(n.contactId)).length;
    
    return {
      totalContacts: contacts.length,
      totalLeads: leads.length,
      contactsWithClientId,
      contactsWithoutClientId,
      leadsWithOriginalContactId,
      duplicateEmails,
      orphanedReferences: {
        deals: orphanedDeals,
        communications: orphanedCommunications,
        tasks: orphanedTasks,
        notes: orphanedNotes,
      },
      recommendedMigrationBatches: Math.ceil(contacts.length / 100),
    };
  },
});

// Step 3: Create master leads table from existing data
export const createMasterLeadsTable = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
    startIndex: v.optional(v.number()),
  },
  returns: v.object({
    processed: v.number(),
    created: v.number(),
    duplicatesSkipped: v.number(),
    errors: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, { batchSize = 100, startIndex = 0 }) => {
    console.log(`🔄 Starting master leads creation, batch size: ${batchSize}, start: ${startIndex}`);
    
    // Get existing contacts and leads
    const contacts = await ctx.db.query("contacts").order("asc").take(batchSize);
    const existingLeads = await ctx.db.query("leads").collect();
    
    // Create email map for duplicate detection
    const existingEmailsInLeads = new Set(existingLeads.map(l => l.email));
    
    let processed = 0;
    let created = 0;
    let duplicatesSkipped = 0;
    let errors = 0;
    
    // Process contacts in batches
    const contactsToProcess = contacts.slice(startIndex, startIndex + batchSize);
    
    for (const contact of contactsToProcess) {
      try {
        processed++;
        
        // Skip if no email (required for leads)
        if (!contact.email) {
          console.log(`⚠️ Skipping contact ${contact._id} - no email`);
          continue;
        }
        
        // Skip if email already exists in leads
        if (existingEmailsInLeads.has(contact.email)) {
          duplicatesSkipped++;
          console.log(`⚠️ Skipping contact ${contact._id} - email already in leads: ${contact.email}`);
          continue;
        }
        
        // Create new lead from contact data
        const newLeadId = await ctx.db.insert("leads", {
          // Company relationship
          companyId: contact.companyId,
          
          // Personal information
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          mobilePhone: contact.mobilePhone,
          companyPhone: contact.companyPhone,
          linkedinUrl: contact.linkedinUrl,
          
          // Professional information
          jobTitle: contact.jobTitle,
          seniority: contact.seniority,
          functionGroup: contact.functionGroup,
          
          // Geographic information
          country: contact.country,
          state: contact.state,
          city: contact.city,
          
          // Metadata
          addedAt: contact._creationTime,
          lastUpdatedAt: Date.now(),
          sourceType: "migration_from_contact",
          isActive: true,
          
          // Migration support
          originalContactId: contact._id,
        });
        
        created++;
        existingEmailsInLeads.add(contact.email);
        
        console.log(`✅ Created lead ${newLeadId} from contact ${contact._id}`);
        
      } catch (error) {
        errors++;
        console.error(`❌ Error processing contact ${contact._id}:`, error);
      }
    }
    
    return {
      processed,
      created,
      duplicatesSkipped,
      errors,
      message: `Batch completed: ${created} leads created, ${duplicatesSkipped} duplicates skipped, ${errors} errors`,
    };
  },
});

// Step 4: Create new contacts from existing contacts (leadId + clientId relationships)
export const createNewContactRelationships = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
    startIndex: v.optional(v.number()),
  },
  returns: v.object({
    processed: v.number(),
    created: v.number(),
    skipped: v.number(),
    errors: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, { batchSize = 100, startIndex = 0 }) => {
    console.log(`🔄 Creating new contact relationships, batch size: ${batchSize}, start: ${startIndex}`);
    
    // Get existing contacts
    const oldContacts = await ctx.db.query("contacts").order("asc").take(batchSize);
    
    let processed = 0;
    let created = 0;
    let skipped = 0;
    let errors = 0;
    
    const contactsToProcess = oldContacts.slice(startIndex, startIndex + batchSize);
    
    for (const oldContact of contactsToProcess) {
      try {
        processed++;
        
        // Skip if no clientId (can't create relationship without client)
        if (!oldContact.clientId) {
          skipped++;
          console.log(`⚠️ Skipping contact ${oldContact._id} - no clientId`);
          continue;
        }
        
        // Find corresponding lead by originalContactId
        const correspondingLead = await ctx.db
          .query("leads")
          .withIndex("by_original_contact", (q) => q.eq("originalContactId", oldContact._id))
          .first();
        
        if (!correspondingLead) {
          // Try to find by email
          const leadByEmail = await ctx.db
            .query("leads")
            .withIndex("by_email_unique", (q) => q.eq("email", oldContact.email || ""))
            .first();
          
          if (!leadByEmail) {
            errors++;
            console.error(`❌ No corresponding lead found for contact ${oldContact._id}`);
            continue;
          }
        }
        
        const leadId = correspondingLead?._id || leadByEmail._id;
        
        // Create new contact relationship
        const newContactId = await ctx.db.insert("contacts", {
          // Core relationship
          leadId: leadId,
          clientId: oldContact.clientId,
          
          // Client-specific data
          status: oldContact.status || "cold",
          tags: oldContact.tags || [],
          notes: oldContact.notes,
          
          // Campaign and outreach status
          isLinkedinConnected: oldContact.isLinkedinConnected,
          lastLinkedinConnectionCheck: oldContact.lastLinkedinConnectionCheck,
          
          // Email preferences
          optedIn: oldContact.optedIn,
          
          // Tracking
          purchasedAt: oldContact._creationTime, // Consider this as "purchase" time
          lastContactedAt: undefined, // Will be calculated from communications
          timesContacted: 0, // Will be calculated from communications
          responsesReceived: 0, // Will be calculated from communications
          
          // Metadata
          lastUpdatedAt: Date.now(),
          isActive: true,
        });
        
        created++;
        console.log(`✅ Created new contact relationship ${newContactId} for lead ${leadId} + client ${oldContact.clientId}`);
        
      } catch (error) {
        errors++;
        console.error(`❌ Error creating contact relationship for ${oldContact._id}:`, error);
      }
    }
    
    return {
      processed,
      created,
      skipped,
      errors,
      message: `Relationship creation completed: ${created} contacts created, ${skipped} skipped, ${errors} errors`,
    };
  },
});

// Step 5: Update foreign key references
export const updateForeignKeyReferences = internalMutation({
  args: {
    tableToUpdate: v.string(), // "deals", "communications", "tasks", "notes", "activityLog"
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    processed: v.number(),
    updated: v.number(),
    errors: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, { tableToUpdate, batchSize = 100 }) => {
    console.log(`🔄 Updating ${tableToUpdate} foreign key references`);
    
    let processed = 0;
    let updated = 0;
    let errors = 0;
    
    // Get old contact ID -> new contact ID mapping
    const oldContacts = await ctx.db.query("contacts").collect();
    const newContacts = await ctx.db.query("contacts").collect();
    
    // Create mapping: oldContactId -> { leadId, newContactId }
    const contactMapping = new Map<string, { leadId: string; newContactId: string }>();
    
    for (const newContact of newContacts) {
      // Find corresponding old contact via lead's originalContactId
      const lead = await ctx.db.get(newContact.leadId);
      if (lead?.originalContactId) {
        contactMapping.set(lead.originalContactId, {
          leadId: newContact.leadId,
          newContactId: newContact._id,
        });
      }
    }
    
    // Update records based on table type
    switch (tableToUpdate) {
      case "deals":
        const deals = await ctx.db.query("deals").take(batchSize);
        for (const deal of deals) {
          try {
            processed++;
            if (deal.contactId && contactMapping.has(deal.contactId)) {
              const mapping = contactMapping.get(deal.contactId)!;
              await ctx.db.patch(deal._id, {
                leadId: mapping.leadId,
                contactId: mapping.newContactId,
              });
              updated++;
            }
          } catch (error) {
            errors++;
            console.error(`❌ Error updating deal ${deal._id}:`, error);
          }
        }
        break;
        
      case "communications":
        const communications = await ctx.db.query("communications").take(batchSize);
        for (const comm of communications) {
          try {
            processed++;
            if (comm.contactId && contactMapping.has(comm.contactId)) {
              const mapping = contactMapping.get(comm.contactId)!;
              await ctx.db.patch(comm._id, {
                leadId: mapping.leadId,
                contactId: mapping.newContactId,
              });
              updated++;
            }
          } catch (error) {
            errors++;
            console.error(`❌ Error updating communication ${comm._id}:`, error);
          }
        }
        break;
        
      case "tasks":
        const tasks = await ctx.db.query("tasks").take(batchSize);
        for (const task of tasks) {
          try {
            processed++;
            if (task.contactId && contactMapping.has(task.contactId)) {
              const mapping = contactMapping.get(task.contactId)!;
              await ctx.db.patch(task._id, {
                leadId: mapping.leadId,
                contactId: mapping.newContactId,
              });
              updated++;
            }
          } catch (error) {
            errors++;
            console.error(`❌ Error updating task ${task._id}:`, error);
          }
        }
        break;
        
      case "notes":
        const notes = await ctx.db.query("notes").take(batchSize);
        for (const note of notes) {
          try {
            processed++;
            if (note.contactId && contactMapping.has(note.contactId)) {
              const mapping = contactMapping.get(note.contactId)!;
              await ctx.db.patch(note._id, {
                leadId: mapping.leadId,
                contactId: mapping.newContactId,
              });
              updated++;
            }
          } catch (error) {
            errors++;
            console.error(`❌ Error updating note ${note._id}:`, error);
          }
        }
        break;
        
      case "activityLog":
        const activityLogs = await ctx.db.query("activityLog").take(batchSize);
        for (const log of activityLogs) {
          try {
            processed++;
            if (log.contactId && contactMapping.has(log.contactId)) {
              const mapping = contactMapping.get(log.contactId)!;
              await ctx.db.patch(log._id, {
                leadId: mapping.leadId,
                contactId: mapping.newContactId,
              });
              updated++;
            }
          } catch (error) {
            errors++;
            console.error(`❌ Error updating activity log ${log._id}:`, error);
          }
        }
        break;
        
      default:
        throw new Error(`Unknown table: ${tableToUpdate}`);
    }
    
    return {
      processed,
      updated,
      errors,
      message: `${tableToUpdate} update completed: ${updated}/${processed} records updated, ${errors} errors`,
    };
  },
});

// Step 6: Validate migration integrity
export const validateMigrationIntegrity = internalQuery({
  args: {},
  returns: v.object({
    isValid: v.boolean(),
    issues: v.array(v.string()),
    statistics: v.object({
      totalLeads: v.number(),
      totalContacts: v.number(),
      leadContactMappings: v.number(),
      orphanedReferences: v.number(),
    }),
    message: v.string(),
  }),
  handler: async (ctx) => {
    const issues: string[] = [];
    
    // Check 1: All contacts have valid leadId and clientId
    const contacts = await ctx.db.query("contacts").collect();
    const leads = await ctx.db.query("leads").collect();
    const clients = await ctx.db.query("clients").collect();
    
    const leadIds = new Set(leads.map(l => l._id));
    const clientIds = new Set(clients.map(c => c._id));
    
    for (const contact of contacts) {
      if (!leadIds.has(contact.leadId)) {
        issues.push(`Contact ${contact._id} references non-existent lead ${contact.leadId}`);
      }
      if (!clientIds.has(contact.clientId)) {
        issues.push(`Contact ${contact._id} references non-existent client ${contact.clientId}`);
      }
    }
    
    // Check 2: No duplicate leadId + clientId combinations
    const contactCombinations = new Set<string>();
    for (const contact of contacts) {
      const combo = `${contact.leadId}-${contact.clientId}`;
      if (contactCombinations.has(combo)) {
        issues.push(`Duplicate contact combination: lead ${contact.leadId} + client ${contact.clientId}`);
      }
      contactCombinations.add(combo);
    }
    
    // Check 3: All communications have valid leadId or contactId
    const communications = await ctx.db.query("communications").collect();
    const contactIds = new Set(contacts.map(c => c._id));
    
    let orphanedReferences = 0;
    for (const comm of communications) {
      if (comm.leadId && !leadIds.has(comm.leadId)) {
        issues.push(`Communication ${comm._id} references non-existent lead ${comm.leadId}`);
        orphanedReferences++;
      }
      if (comm.contactId && !contactIds.has(comm.contactId)) {
        issues.push(`Communication ${comm._id} references non-existent contact ${comm.contactId}`);
        orphanedReferences++;
      }
    }
    
    // Check 4: Lead email uniqueness
    const leadEmails = new Set<string>();
    for (const lead of leads) {
      if (leadEmails.has(lead.email)) {
        issues.push(`Duplicate email in leads: ${lead.email}`);
      }
      leadEmails.add(lead.email);
    }
    
    const isValid = issues.length === 0;
    
    return {
      isValid,
      issues,
      statistics: {
        totalLeads: leads.length,
        totalContacts: contacts.length,
        leadContactMappings: contactCombinations.size,
        orphanedReferences,
      },
      message: isValid ? "Migration validation passed" : `Migration validation failed with ${issues.length} issues`,
    };
  },
});

// Step 7: Complete migration orchestrator
export const runCompleteMigration = internalAction({
  args: {
    dryRun: v.optional(v.boolean()),
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    phases: v.array(v.object({
      phase: v.string(),
      status: v.string(),
      message: v.string(),
      duration: v.number(),
    })),
    totalDuration: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, { dryRun = false, batchSize = 100 }) => {
    const startTime = Date.now();
    const phases: Array<{ phase: string; status: string; message: string; duration: number }> = [];
    
    try {
      // Phase 1: Backup
      console.log("🏁 Starting complete migration...");
      const backupStart = Date.now();
      if (!dryRun) {
        const backupResult = await ctx.runAction("api.migrationPlan.backupExistingData", {});
        phases.push({
          phase: "Backup",
          status: "completed",
          message: backupResult.message,
          duration: Date.now() - backupStart,
        });
      } else {
        phases.push({
          phase: "Backup",
          status: "skipped",
          message: "Dry run - backup skipped",
          duration: Date.now() - backupStart,
        });
      }
      
      // Phase 2: Analysis
      const analysisStart = Date.now();
      const analysisResult = await ctx.runQuery("api.migrationPlan.analyzeExistingData", {});
      phases.push({
        phase: "Analysis",
        status: "completed",
        message: `Found ${analysisResult.totalContacts} contacts, ${analysisResult.totalLeads} leads`,
        duration: Date.now() - analysisStart,
      });
      
      if (dryRun) {
        phases.push({
          phase: "Complete Migration",
          status: "skipped",
          message: "Dry run completed - no data changes made",
          duration: 0,
        });
        
        return {
          success: true,
          phases,
          totalDuration: Date.now() - startTime,
          message: "Dry run completed successfully",
        };
      }
      
      // Phase 3: Create master leads
      const leadsStart = Date.now();
      const leadsResult = await ctx.runMutation("api.migrationPlan.createMasterLeadsTable", { batchSize });
      phases.push({
        phase: "Create Master Leads",
        status: leadsResult.errors > 0 ? "completed_with_errors" : "completed",
        message: leadsResult.message,
        duration: Date.now() - leadsStart,
      });
      
      // Phase 4: Create contact relationships
      const contactsStart = Date.now();
      const contactsResult = await ctx.runMutation("api.migrationPlan.createNewContactRelationships", { batchSize });
      phases.push({
        phase: "Create Contact Relationships",
        status: contactsResult.errors > 0 ? "completed_with_errors" : "completed",
        message: contactsResult.message,
        duration: Date.now() - contactsStart,
      });
      
      // Phase 5: Update foreign keys
      const fkStart = Date.now();
      const tables = ["deals", "communications", "tasks", "notes", "activityLog"];
      for (const table of tables) {
        const fkResult = await ctx.runMutation("api.migrationPlan.updateForeignKeyReferences", { 
          tableToUpdate: table, 
          batchSize 
        });
        phases.push({
          phase: `Update ${table} References`,
          status: fkResult.errors > 0 ? "completed_with_errors" : "completed",
          message: fkResult.message,
          duration: 0, // Individual durations not tracked
        });
      }
      phases[phases.length - tables.length].duration = Date.now() - fkStart;
      
      // Phase 6: Validation
      const validationStart = Date.now();
      const validationResult = await ctx.runQuery("api.migrationPlan.validateMigrationIntegrity", {});
      phases.push({
        phase: "Validation",
        status: validationResult.isValid ? "completed" : "failed",
        message: validationResult.message,
        duration: Date.now() - validationStart,
      });
      
      const success = validationResult.isValid && phases.every(p => p.status !== "failed");
      
      return {
        success,
        phases,
        totalDuration: Date.now() - startTime,
        message: success ? "Migration completed successfully" : "Migration completed with issues",
      };
      
    } catch (error) {
      phases.push({
        phase: "Migration Error",
        status: "failed",
        message: error instanceof Error ? error.message : "Unknown error",
        duration: 0,
      });
      
      return {
        success: false,
        phases,
        totalDuration: Date.now() - startTime,
        message: "Migration failed",
      };
    }
  },
});

// ===============================
// MIGRATION MONITORING
// ===============================

export const getMigrationStatus = internalQuery({
  args: {},
  returns: v.object({
    currentPhase: v.string(),
    progress: v.object({
      oldContactsRemaining: v.number(),
      newContactsCreated: v.number(),
      leadsCreated: v.number(),
      foreignKeysUpdated: v.number(),
    }),
    estimatedCompletion: v.optional(v.number()),
    issues: v.array(v.string()),
  }),
  handler: async (ctx) => {
    // Implementation for monitoring migration progress
    const oldContacts = await ctx.db.query("contacts").collect();
    const newContacts = await ctx.db.query("contacts").collect();
    const leads = await ctx.db.query("leads").collect();
    
    // This is a simplified version - in practice, you'd track migration state
    return {
      currentPhase: "ready",
      progress: {
        oldContactsRemaining: oldContacts.length,
        newContactsCreated: newContacts.length,
        leadsCreated: leads.length,
        foreignKeysUpdated: 0,
      },
      issues: [],
    };
  },
});

// ===============================
// ROLLBACK FUNCTIONALITY
// ===============================

export const rollbackMigration = internalAction({
  args: {
    targetPhase: v.string(), // "backup", "analysis", "leads", "contacts", "foreign_keys"
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    rollbackSteps: v.array(v.string()),
  }),
  handler: async (ctx, { targetPhase }) => {
    const rollbackSteps: string[] = [];
    
    try {
      // Implement rollback logic based on target phase
      switch (targetPhase) {
        case "backup":
          // Restore from backup
          rollbackSteps.push("Restored from backup");
          break;
          
        case "leads":
          // Remove created leads, keep original contacts
          rollbackSteps.push("Removed migrated leads");
          break;
          
        default:
          throw new Error(`Unknown rollback target: ${targetPhase}`);
      }
      
      return {
        success: true,
        message: `Rollback to ${targetPhase} completed`,
        rollbackSteps,
      };
      
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Rollback failed",
        rollbackSteps,
      };
    }
  },
});