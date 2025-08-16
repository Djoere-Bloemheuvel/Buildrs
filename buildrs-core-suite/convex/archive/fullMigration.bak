import { v } from "convex/values";
import { internalMutation, internalQuery, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * FULL MIGRATION IMPLEMENTATION
 * 
 * This script performs the complete migration from the old contacts-based model
 * to the new lead-contact marketplace model.
 * 
 * MIGRATION STEPS:
 * 1. Move existing contacts data to contacts_old table
 * 2. Enhance leads table with personal data from contacts
 * 3. Create new contact relationships (leadId + clientId)
 * 4. Update all foreign key references
 * 5. Validate data integrity
 */

// ===============================
// STEP 1: MOVE EXISTING CONTACTS TO OLD TABLE
// ===============================

export const moveContactsToOldTable = internalMutation({
  args: {},
  returns: v.object({
    contactsMoved: v.number(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    console.log("🔄 Step 1: Moving existing contacts to contacts_old table...");
    
    // Get all existing contacts
    const existingContacts = await ctx.db.query("contacts").collect();
    console.log(`📊 Found ${existingContacts.length} existing contacts to migrate`);
    
    let contactsMoved = 0;
    
    // Move each contact to the old table
    for (const contact of existingContacts) {
      try {
        // Create contact in old table
        await ctx.db.insert("contacts_old", {
          companyId: contact.companyId,
          clientId: contact.clientId,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          mobilePhone: contact.mobilePhone,
          companyPhone: contact.companyPhone,
          linkedinUrl: contact.linkedinUrl,
          jobTitle: contact.jobTitle,
          seniority: contact.seniority,
          functionGroup: contact.functionGroup,
          tags: contact.tags,
          notes: contact.notes,
          status: contact.status,
          isLinkedinConnected: contact.isLinkedinConnected,
          lastLinkedinConnectionCheck: contact.lastLinkedinConnectionCheck,
          optedIn: contact.optedIn,
          country: contact.country,
          state: contact.state,
          city: contact.city,
        });
        
        // Delete from current contacts table
        await ctx.db.delete(contact._id);
        
        contactsMoved++;
        
        if (contactsMoved % 50 === 0) {
          console.log(`📈 Progress: ${contactsMoved}/${existingContacts.length} contacts moved`);
        }
        
      } catch (error) {
        console.error(`❌ Error moving contact ${contact._id}:`, error);
        throw new Error(`Failed to move contact ${contact._id}: ${error}`);
      }
    }
    
    console.log(`✅ Step 1 completed: ${contactsMoved} contacts moved to contacts_old`);
    
    return {
      contactsMoved,
      message: `Successfully moved ${contactsMoved} contacts to contacts_old table`,
    };
  },
});

// ===============================
// STEP 2: ENHANCE LEADS WITH CONTACT DATA
// ===============================

export const enhanceLeadsWithContactData = internalMutation({
  args: {},
  returns: v.object({
    leadsEnhanced: v.number(),
    leadsCreated: v.number(),
    duplicatesSkipped: v.number(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    console.log("🔄 Step 2: Enhancing leads with contact data...");
    
    // Get all old contacts
    const oldContacts = await ctx.db.query("contacts_old").collect();
    console.log(`📊 Found ${oldContacts.length} old contacts to process`);
    
    // Get existing leads to check for duplicates
    const existingLeads = await ctx.db.query("leads").collect();
    const existingEmailsInLeads = new Set(existingLeads.map(l => l.email));
    
    let leadsEnhanced = 0;
    let leadsCreated = 0;
    let duplicatesSkipped = 0;
    
    for (const contact of oldContacts) {
      try {
        // Skip contacts without email (required for leads)
        if (!contact.email) {
          console.log(`⚠️ Skipping contact ${contact._id} - no email`);
          continue;
        }
        
        // Check if lead already exists with this email
        const existingLead = await ctx.db
          .query("leads")
          .withIndex("by_email_unique", (q) => q.eq("email", contact.email))
          .first();
        
        if (existingLead) {
          // Update existing lead with additional contact data if missing
          const updateData: any = {
            lastUpdatedAt: Date.now(),
            originalContactId: contact._id, // Reference to old contact
          };
          
          // Only update fields that are missing in the lead
          if (!existingLead.firstName && contact.firstName) updateData.firstName = contact.firstName;
          if (!existingLead.lastName && contact.lastName) updateData.lastName = contact.lastName;
          if (!existingLead.mobilePhone && contact.mobilePhone) updateData.mobilePhone = contact.mobilePhone;
          if (!existingLead.companyPhone && contact.companyPhone) updateData.companyPhone = contact.companyPhone;
          if (!existingLead.linkedinUrl && contact.linkedinUrl) updateData.linkedinUrl = contact.linkedinUrl;
          if (!existingLead.jobTitle && contact.jobTitle) updateData.jobTitle = contact.jobTitle;
          if (!existingLead.seniority && contact.seniority) updateData.seniority = contact.seniority;
          if (!existingLead.functionGroup && contact.functionGroup) updateData.functionGroup = contact.functionGroup;
          if (!existingLead.country && contact.country) updateData.country = contact.country;
          if (!existingLead.state && contact.state) updateData.state = contact.state;
          if (!existingLead.city && contact.city) updateData.city = contact.city;
          if (!existingLead.companyId && contact.companyId) updateData.companyId = contact.companyId;
          
          await ctx.db.patch(existingLead._id, updateData);
          leadsEnhanced++;
          
        } else {
          // Create new lead from contact data
          await ctx.db.insert("leads", {
            // Company relationship
            companyId: contact.companyId,
            
            // Personal information from contact
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
            sourceType: "migrated_from_contact",
            isActive: true,
            
            // Lead scoring (initial values)
            leadScore: 50, // Default score
            leadQuality: "medium", // Default quality
            
            // Migration reference
            originalContactId: contact._id,
          });
          
          leadsCreated++;
        }
        
        if ((leadsEnhanced + leadsCreated) % 50 === 0) {
          console.log(`📈 Progress: ${leadsEnhanced} enhanced, ${leadsCreated} created, ${duplicatesSkipped} skipped`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing contact ${contact._id}:`, error);
        throw new Error(`Failed to process contact ${contact._id}: ${error}`);
      }
    }
    
    console.log(`✅ Step 2 completed: ${leadsEnhanced} leads enhanced, ${leadsCreated} leads created`);
    
    return {
      leadsEnhanced,
      leadsCreated,
      duplicatesSkipped,
      message: `Enhanced ${leadsEnhanced} existing leads, created ${leadsCreated} new leads`,
    };
  },
});

// ===============================
// STEP 3: CREATE NEW CONTACT RELATIONSHIPS
// ===============================

export const createNewContactRelationships = internalMutation({
  args: {},
  returns: v.object({
    contactsCreated: v.number(),
    skippedNoClient: v.number(),
    skippedNoLead: v.number(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    console.log("🔄 Step 3: Creating new contact relationships...");
    
    // Get all old contacts that have a clientId
    const oldContacts = await ctx.db
      .query("contacts_old")
      .filter((q) => q.neq(q.field("clientId"), undefined))
      .collect();
    
    console.log(`📊 Found ${oldContacts.length} old contacts with clientId to convert`);
    
    let contactsCreated = 0;
    let skippedNoClient = 0;
    let skippedNoLead = 0;
    
    for (const oldContact of oldContacts) {
      try {
        if (!oldContact.clientId) {
          skippedNoClient++;
          continue;
        }
        
        if (!oldContact.email) {
          console.log(`⚠️ Skipping contact ${oldContact._id} - no email for lead lookup`);
          skippedNoLead++;
          continue;
        }
        
        // Find corresponding lead by originalContactId
        let correspondingLead = await ctx.db
          .query("leads")
          .filter((q) => q.eq(q.field("originalContactId"), oldContact._id))
          .first();
        
        if (!correspondingLead) {
          // Fallback: find by email
          correspondingLead = await ctx.db
            .query("leads")
            .withIndex("by_email_unique", (q) => q.eq("email", oldContact.email))
            .first();
        }
        
        if (!correspondingLead) {
          console.error(`❌ No corresponding lead found for contact ${oldContact._id} (email: ${oldContact.email})`);
          skippedNoLead++;
          continue;
        }
        
        // Check if this contact relationship already exists
        const existingContact = await ctx.db
          .query("contacts")
          .withIndex("by_lead_client", (q) => 
            q.eq("leadId", correspondingLead._id).eq("clientId", oldContact.clientId)
          )
          .first();
        
        if (existingContact) {
          console.log(`⚠️ Contact relationship already exists for lead ${correspondingLead._id} + client ${oldContact.clientId}`);
          continue;
        }
        
        // Create new contact relationship
        await ctx.db.insert("contacts", {
          // Core relationship
          leadId: correspondingLead._id,
          clientId: oldContact.clientId,
          
          // Client-specific data from old contact
          status: oldContact.status || "cold",
          tags: oldContact.tags || [],
          notes: oldContact.notes,
          
          // Campaign and outreach status
          isLinkedinConnected: oldContact.isLinkedinConnected || false,
          lastLinkedinConnectionCheck: oldContact.lastLinkedinConnectionCheck,
          
          // Email preferences
          optedIn: oldContact.optedIn || true,
          optedOut: false,
          
          // Client-specific tracking
          purchasedAt: oldContact._creationTime, // Consider creation time as "purchase" time
          lastContactedAt: undefined, // Will be calculated from communications
          timesContacted: 0, // Will be calculated from communications
          responsesReceived: 0, // Will be calculated from communications
          
          // Initial values
          priority: "medium",
          relationshipStage: "prospect",
          
          // Metadata
          lastUpdatedAt: Date.now(),
          isActive: true,
        });
        
        contactsCreated++;
        
        if (contactsCreated % 50 === 0) {
          console.log(`📈 Progress: ${contactsCreated} contact relationships created`);
        }
        
      } catch (error) {
        console.error(`❌ Error creating contact relationship for ${oldContact._id}:`, error);
        throw new Error(`Failed to create contact relationship for ${oldContact._id}: ${error}`);
      }
    }
    
    console.log(`✅ Step 3 completed: ${contactsCreated} contact relationships created`);
    
    return {
      contactsCreated,
      skippedNoClient,
      skippedNoLead,
      message: `Created ${contactsCreated} contact relationships, skipped ${skippedNoClient + skippedNoLead} contacts`,
    };
  },
});

// ===============================
// STEP 4: UPDATE FOREIGN KEY REFERENCES
// ===============================

export const updateForeignKeyReferences = internalMutation({
  args: {
    tableToUpdate: v.string(),
  },
  returns: v.object({
    recordsProcessed: v.number(),
    recordsUpdated: v.number(),
    recordsSkipped: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, { tableToUpdate }) => {
    console.log(`🔄 Step 4: Updating ${tableToUpdate} foreign key references...`);
    
    // Build mapping from old contact IDs to new contact IDs and lead IDs
    const oldContacts = await ctx.db.query("contacts_old").collect();
    const newContacts = await ctx.db.query("contacts").collect();
    
    // Create mapping: oldContactId -> { leadId, newContactId }
    const contactMapping = new Map<string, { leadId: string; newContactId: string }>();
    
    for (const oldContact of oldContacts) {
      if (!oldContact.email) continue;
      
      // Find corresponding lead
      const lead = await ctx.db
        .query("leads")
        .withIndex("by_email_unique", (q) => q.eq("email", oldContact.email))
        .first();
      
      if (!lead || !oldContact.clientId) continue;
      
      // Find corresponding new contact
      const newContact = await ctx.db
        .query("contacts")
        .withIndex("by_lead_client", (q) => 
          q.eq("leadId", lead._id).eq("clientId", oldContact.clientId)
        )
        .first();
      
      if (newContact) {
        contactMapping.set(oldContact._id, {
          leadId: lead._id,
          newContactId: newContact._id,
        });
      }
    }
    
    console.log(`📊 Created mapping for ${contactMapping.size} contact relationships`);
    
    let recordsProcessed = 0;
    let recordsUpdated = 0;
    let recordsSkipped = 0;
    
    // Update records based on table type
    switch (tableToUpdate) {
      case "deals":
        const deals = await ctx.db.query("deals").collect();
        for (const deal of deals) {
          recordsProcessed++;
          
          if (deal.contactId && contactMapping.has(deal.contactId)) {
            const mapping = contactMapping.get(deal.contactId)!;
            await ctx.db.patch(deal._id, {
              leadId: mapping.leadId,
              contactId: mapping.newContactId,
            });
            recordsUpdated++;
          } else {
            recordsSkipped++;
          }
        }
        break;
        
      case "communications":
        const communications = await ctx.db.query("communications").collect();
        for (const comm of communications) {
          recordsProcessed++;
          
          if (comm.contactId && contactMapping.has(comm.contactId)) {
            const mapping = contactMapping.get(comm.contactId)!;
            await ctx.db.patch(comm._id, {
              leadId: mapping.leadId,
              contactId: mapping.newContactId,
            });
            recordsUpdated++;
          } else {
            recordsSkipped++;
          }
        }
        break;
        
      case "tasks":
        const tasks = await ctx.db.query("tasks").collect();
        for (const task of tasks) {
          recordsProcessed++;
          
          if (task.contactId && contactMapping.has(task.contactId)) {
            const mapping = contactMapping.get(task.contactId)!;
            await ctx.db.patch(task._id, {
              leadId: mapping.leadId,
              contactId: mapping.newContactId,
            });
            recordsUpdated++;
          } else {
            recordsSkipped++;
          }
        }
        break;
        
      case "notes":
        const notes = await ctx.db.query("notes").collect();
        for (const note of notes) {
          recordsProcessed++;
          
          if (note.contactId && contactMapping.has(note.contactId)) {
            const mapping = contactMapping.get(note.contactId)!;
            await ctx.db.patch(note._id, {
              leadId: mapping.leadId,
              contactId: mapping.newContactId,
            });
            recordsUpdated++;
          } else {
            recordsSkipped++;
          }
        }
        break;
        
      case "activityLog":
        const activityLogs = await ctx.db.query("activityLog").collect();
        for (const log of activityLogs) {
          recordsProcessed++;
          
          if (log.contactId && contactMapping.has(log.contactId)) {
            const mapping = contactMapping.get(log.contactId)!;
            await ctx.db.patch(log._id, {
              leadId: mapping.leadId,
              contactId: mapping.newContactId,
            });
            recordsUpdated++;
          } else {
            recordsSkipped++;
          }
        }
        break;
        
      case "campaignContacts":
        const campaignContacts = await ctx.db.query("campaignContacts").collect();
        for (const cc of campaignContacts) {
          recordsProcessed++;
          
          if (cc.contactId && contactMapping.has(cc.contactId)) {
            const mapping = contactMapping.get(cc.contactId)!;
            await ctx.db.patch(cc._id, {
              contactId: mapping.newContactId,
            });
            recordsUpdated++;
          } else {
            recordsSkipped++;
          }
        }
        break;
        
      case "emailDispatchLog":
        const emailLogs = await ctx.db.query("emailDispatchLog").collect();
        for (const log of emailLogs) {
          recordsProcessed++;
          
          if (log.contactId && contactMapping.has(log.contactId)) {
            const mapping = contactMapping.get(log.contactId)!;
            await ctx.db.patch(log._id, {
              contactId: mapping.newContactId,
            });
            recordsUpdated++;
          } else {
            recordsSkipped++;
          }
        }
        break;
        
      default:
        throw new Error(`Unknown table: ${tableToUpdate}`);
    }
    
    console.log(`✅ ${tableToUpdate} update completed: ${recordsUpdated}/${recordsProcessed} records updated`);
    
    return {
      recordsProcessed,
      recordsUpdated,
      recordsSkipped,
      message: `${tableToUpdate}: ${recordsUpdated}/${recordsProcessed} records updated, ${recordsSkipped} skipped`,
    };
  },
});

// ===============================
// STEP 5: VALIDATE MIGRATION
// ===============================

export const validateMigration = internalQuery({
  args: {},
  returns: v.object({
    isValid: v.boolean(),
    issues: v.array(v.string()),
    statistics: v.object({
      oldContacts: v.number(),
      newContacts: v.number(),
      leads: v.number(),
      contactLeadMappings: v.number(),
    }),
    message: v.string(),
  }),
  handler: async (ctx) => {
    console.log("🔄 Step 5: Validating migration...");
    
    const issues: string[] = [];
    
    // Get counts
    const oldContacts = await ctx.db.query("contacts_old").collect();
    const newContacts = await ctx.db.query("contacts").collect();
    const leads = await ctx.db.query("leads").collect();
    const clients = await ctx.db.query("clients").collect();
    
    // Check 1: All new contacts have valid leadId and clientId
    const leadIds = new Set(leads.map(l => l._id));
    const clientIds = new Set(clients.map(c => c._id));
    
    for (const contact of newContacts) {
      if (!leadIds.has(contact.leadId)) {
        issues.push(`Contact ${contact._id} references non-existent lead ${contact.leadId}`);
      }
      if (!clientIds.has(contact.clientId)) {
        issues.push(`Contact ${contact._id} references non-existent client ${contact.clientId}`);
      }
    }
    
    // Check 2: No duplicate leadId + clientId combinations
    const contactCombinations = new Set<string>();
    for (const contact of newContacts) {
      const combo = `${contact.leadId}-${contact.clientId}`;
      if (contactCombinations.has(combo)) {
        issues.push(`Duplicate contact combination: lead ${contact.leadId} + client ${contact.clientId}`);
      }
      contactCombinations.add(combo);
    }
    
    // Check 3: Lead email uniqueness
    const leadEmails = new Set<string>();
    for (const lead of leads) {
      if (leadEmails.has(lead.email)) {
        issues.push(`Duplicate email in leads: ${lead.email}`);
      }
      leadEmails.add(lead.email);
    }
    
    // Check 4: Contact count makes sense
    const oldContactsWithClient = oldContacts.filter(c => c.clientId).length;
    if (newContacts.length < oldContactsWithClient * 0.8) {
      issues.push(`Significant contact loss: ${oldContactsWithClient} old contacts with client vs ${newContacts.length} new contacts`);
    }
    
    const isValid = issues.length === 0;
    
    console.log(`✅ Migration validation ${isValid ? "PASSED" : "FAILED"} with ${issues.length} issues`);
    
    return {
      isValid,
      issues,
      statistics: {
        oldContacts: oldContacts.length,
        newContacts: newContacts.length,
        leads: leads.length,
        contactLeadMappings: contactCombinations.size,
      },
      message: isValid ? "Migration validation passed" : `Migration validation failed with ${issues.length} issues`,
    };
  },
});

// ===============================
// COMPLETE MIGRATION ORCHESTRATOR
// ===============================

export const runFullMigration = internalAction({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    steps: v.array(v.object({
      step: v.string(),
      status: v.string(),
      message: v.string(),
      duration: v.number(),
    })),
    totalDuration: v.number(),
    finalValidation: v.object({
      isValid: v.boolean(),
      issues: v.array(v.string()),
      statistics: v.object({
        oldContacts: v.number(),
        newContacts: v.number(),
        leads: v.number(),
        contactLeadMappings: v.number(),
      }),
      message: v.string(),
    }),
    message: v.string(),
  }),
  handler: async (ctx, { dryRun = false }) => {
    const startTime = Date.now();
    const steps: Array<{ step: string; status: string; message: string; duration: number }> = [];
    
    console.log(`🚀 Starting full migration (${dryRun ? "DRY RUN" : "LIVE RUN"})...`);
    
    try {
      if (dryRun) {
        // Just validate current state
        const validationStart = Date.now();
        const validation = await ctx.runQuery(internal.fullMigration.validateMigration, {});
        
        steps.push({
          step: "Dry Run Validation",
          status: "completed",
          message: "Dry run completed - no changes made",
          duration: Date.now() - validationStart,
        });
        
        return {
          success: true,
          steps,
          totalDuration: Date.now() - startTime,
          finalValidation: validation,
          message: "Dry run completed successfully",
        };
      }
      
      // Step 1: Move contacts to old table
      const step1Start = Date.now();
      const step1Result = await ctx.runMutation(internal.fullMigration.moveContactsToOldTable, {});
      steps.push({
        step: "Move Contacts to Old Table",
        status: "completed",
        message: step1Result.message,
        duration: Date.now() - step1Start,
      });
      
      // Step 2: Enhance leads with contact data
      const step2Start = Date.now();
      const step2Result = await ctx.runMutation(internal.fullMigration.enhanceLeadsWithContactData, {});
      steps.push({
        step: "Enhance Leads with Contact Data",
        status: "completed",
        message: step2Result.message,
        duration: Date.now() - step2Start,
      });
      
      // Step 3: Create new contact relationships
      const step3Start = Date.now();
      const step3Result = await ctx.runMutation(internal.fullMigration.createNewContactRelationships, {});
      steps.push({
        step: "Create New Contact Relationships",
        status: "completed",
        message: step3Result.message,
        duration: Date.now() - step3Start,
      });
      
      // Step 4: Update foreign key references
      const step4Start = Date.now();
      const tablesToUpdate = ["deals", "communications", "tasks", "notes", "activityLog", "campaignContacts", "emailDispatchLog"];
      
      for (const table of tablesToUpdate) {
        const fkResult = await ctx.runMutation(internal.fullMigration.updateForeignKeyReferences, { 
          tableToUpdate: table
        });
        steps.push({
          step: `Update ${table} References`,
          status: "completed",
          message: fkResult.message,
          duration: 0, // Individual timing not tracked
        });
      }
      
      // Update the step 4 duration
      steps[steps.length - tablesToUpdate.length].duration = Date.now() - step4Start;
      
      // Step 5: Final validation
      const step5Start = Date.now();
      const validation = await ctx.runQuery(internal.fullMigration.validateMigration, {});
      steps.push({
        step: "Final Validation",
        status: validation.isValid ? "completed" : "failed",
        message: validation.message,
        duration: Date.now() - step5Start,
      });
      
      const success = validation.isValid && steps.every(s => s.status !== "failed");
      
      console.log(`🏁 Migration ${success ? "COMPLETED SUCCESSFULLY" : "COMPLETED WITH ISSUES"}`);
      
      return {
        success,
        steps,
        totalDuration: Date.now() - startTime,
        finalValidation: validation,
        message: success ? "Migration completed successfully" : "Migration completed with validation issues",
      };
      
    } catch (error) {
      console.error("💥 Migration failed:", error);
      
      steps.push({
        step: "Migration Error",
        status: "failed",
        message: error instanceof Error ? error.message : "Unknown error",
        duration: 0,
      });
      
      // Get current validation state
      const validation = await ctx.runQuery(internal.fullMigration.validateMigration, {});
      
      return {
        success: false,
        steps,
        totalDuration: Date.now() - startTime,
        finalValidation: validation,
        message: "Migration failed",
      };
    }
  },
});