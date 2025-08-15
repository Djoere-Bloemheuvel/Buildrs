import { v } from "convex/values";
import { action, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

const SUPABASE_URL = "https://bxotrymbceudxfmugsyi.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4b3RyeW1iY2V1ZHhmbXVnc3lpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQ2OTc2NCwiZXhwIjoyMDcwMDQ1NzY0fQ.dINbSZST2qFGEbDqhJQydgxj-PSFrWpWDZe37ImIa60";

async function fetchSupabaseData(table: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    headers: {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${table}: ${response.statusText}`);
  }
  
  return await response.json();
}

// CLIENTS MIGRATION
export const insertClients = mutation({
  args: { clients: v.array(v.any()) },
  returns: v.number(),
  handler: async (ctx, { clients }) => {
    let count = 0;
    for (const client of clients) {
      await ctx.db.insert("clients", {
        company: client.company || "",
        contact: client.contact?.trim() || undefined,
        phone: client.phone?.trim() || undefined,
        email: client.email?.trim() || undefined,
        domain: client.domain?.trim() || undefined,
        clientSummary: client.client_summary || undefined,
        instantlyEmailListId: client.instantly_email_list_id || undefined,
      });
      count++;
    }
    return count;
  },
});

export const migrateClients = action({
  args: {},
  returns: v.object({ count: v.number(), message: v.string() }),
  handler: async (ctx) => {
    const data = await fetchSupabaseData("clients");
    const count = await ctx.runMutation(internal.migrations.insertClients, { clients: data });
    return { count, message: `Migrated ${count} clients` };
  },
});

// COMPANIES MIGRATION
export const insertCompanies = mutation({
  args: { companies: v.array(v.any()) },
  returns: v.number(),
  handler: async (ctx, { companies }) => {
    let count = 0;
    for (const company of companies) {
      // Build company object, skipping problematic fields
      const companyData: any = {
        name: company.name || "",
        domain: company.domain?.trim() || undefined,
        website: company.website?.trim() || undefined,
        industrySlug: company.industry_slug || undefined,
        industryLabel: company.industry_label || undefined,
        subindustryLabel: company.subindustry_label || undefined,
        companySize: company.company_size || undefined,
        tags: company.tags || undefined,
        companySummary: company.company_summary || undefined,
        companyKeywords: company.company_keywords || undefined,
        companyCommonProblems: company.company_common_problems || undefined,
        companyTargetCustomers: company.company_target_customers || undefined,
        companyUniqueCharacteristics: company.company_unique_characteristics || undefined,
        companyUniqueQualities: company.company_unique_qualities || undefined,
        companyLinkedinUrl: company.company_linkedin_url || undefined,
        country: company.country?.trim() || undefined,
        city: company.city?.trim() || undefined,
        state: company.state?.trim() || undefined,
        fullEnrichment: company.full_enrichment || undefined,
        lastUpdatedAt: company.last_updated_at ? new Date(company.last_updated_at).getTime() : undefined,
      };

      // Only add companyTechnologies if it's valid
      if (company.company_technologies && company.company_technologies !== null) {
        try {
          const tech = typeof company.company_technologies === 'string' 
            ? JSON.parse(company.company_technologies) 
            : company.company_technologies;
          if (tech && (Array.isArray(tech) || typeof tech === 'object')) {
            companyData.companyTechnologies = tech;
          }
        } catch {
          // Skip this field if parsing fails
        }
      }

      await ctx.db.insert("companies", companyData);
      count++;
    }
    return count;
  },
});

export const migrateCompanies = action({
  args: {},
  returns: v.object({ count: v.number(), message: v.string() }),
  handler: async (ctx) => {
    const data = await fetchSupabaseData("companies");
    const count = await ctx.runMutation(internal.migrations.insertCompanies, { companies: data });
    return { count, message: `Migrated ${count} companies` };
  },
});

// CONTACTS MIGRATION
export const insertContacts = mutation({
  args: { contacts: v.array(v.any()) },
  returns: v.number(),
  handler: async (ctx, { contacts }) => {
    let count = 0;
    for (const contact of contacts) {
      // Build contact object, handling IDs carefully
      const contactData: any = {
        firstName: contact.first_name?.trim() || undefined,
        lastName: contact.last_name?.trim() || undefined,
        email: contact.email?.trim() || undefined,
        mobilePhone: contact.mobile_phone?.trim() || undefined,
        companyPhone: contact.company_phone?.trim() || undefined,
        linkedinUrl: contact.linkedin_url?.trim() || undefined,
        jobTitle: contact.job_title?.trim() || undefined,
        seniority: contact.seniority || undefined,
        functionGroup: contact.function_group || undefined,
        tags: contact.tags || undefined,
        notes: contact.notes || undefined,
        status: contact.status || undefined,
        isLinkedinConnected: contact.is_linkedin_connected || undefined,
        lastLinkedinConnectionCheck: contact.last_linkedin_connection_check ? new Date(contact.last_linkedin_connection_check).getTime() : undefined,
        optedIn: contact.optedin || undefined,
        country: contact.country?.trim() || undefined,
        state: contact.state?.trim() || undefined,
        city: contact.city?.trim() || undefined,
      };

      // Only add IDs if they exist and are valid
      if (contact.company_id && contact.company_id !== null) {
        try {
          contactData.companyId = ctx.db.normalizeId("companies", contact.company_id);
        } catch {
          // Skip invalid company ID
        }
      }
      
      if (contact.client_id && contact.client_id !== null) {
        try {
          contactData.clientId = ctx.db.normalizeId("clients", contact.client_id);
        } catch {
          // Skip invalid client ID
        }
      }

      await ctx.db.insert("contacts", contactData);
      count++;
    }
    return count;
  },
});

export const migrateContacts = action({
  args: {},
  returns: v.object({ count: v.number(), message: v.string() }),
  handler: async (ctx) => {
    const data = await fetchSupabaseData("contacts");
    const count = await ctx.runMutation(internal.migrations.insertContacts, { contacts: data });
    return { count, message: `Migrated ${count} contacts` };
  },
});

// FULL MIGRATION
export const migrateAll = action({
  args: {},
  returns: v.object({
    clients: v.number(),
    companies: v.number(),
    contacts: v.number(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    // Migration order is important due to foreign key relationships
    const clientsResult = await ctx.runAction(internal.migrations.migrateClients, {});
    const companiesResult = await ctx.runAction(internal.migrations.migrateCompanies, {});
    const contactsResult = await ctx.runAction(internal.migrations.migrateContacts, {});
    
    return {
      clients: clientsResult.count,
      companies: companiesResult.count,
      contacts: contactsResult.count,
      message: `Migration complete! ${clientsResult.count} clients, ${companiesResult.count} companies, ${contactsResult.count} contacts`,
    };
  },
});