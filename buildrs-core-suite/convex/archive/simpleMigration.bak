import { v } from "convex/values";
import { action, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

const SUPABASE_URL = "https://bxotrymbceudxfmugsyi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4b3RyeW1iY2V1ZHhmbXVnc3lpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQ2OTc2NCwiZXhwIjoyMDcwMDQ1NzY0fQ.dINbSZST2qFGEbDqhJQydgxj-PSFrWpWDZe37ImIa60";

async function fetchSupabase(table: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
  });
  return await response.json();
}

export const insertSimpleData = mutation({
  args: { 
    clients: v.array(v.any()),
    companies: v.array(v.any()),
    contacts: v.array(v.any()),
  },
  returns: v.object({ clients: v.number(), companies: v.number(), contacts: v.number() }),
  handler: async (ctx, { clients, companies, contacts }) => {
    let clientCount = 0, companyCount = 0, contactCount = 0;

    // Insert clients (simple fields only)
    for (const client of clients) {
      await ctx.db.insert("clients", {
        company: client.company || "Unknown",
        contact: client.contact || undefined,
        phone: client.phone || undefined,
        email: client.email || undefined,
        domain: client.domain || undefined,
      });
      clientCount++;
    }

    // Insert companies (simple fields only)
    for (const company of companies) {
      await ctx.db.insert("companies", {
        name: company.name || "Unknown",
        domain: company.domain || undefined,
        website: company.website || undefined,
        industryLabel: company.industry_label || undefined,
        subindustryLabel: company.subindustry_label || undefined,
        companySize: company.company_size || undefined,
        country: company.country?.replace(/\n/g, '').trim() || undefined,
        city: company.city?.replace(/\n/g, '').trim() || undefined,
        state: company.state?.replace(/\n/g, '').trim() || undefined,
      });
      companyCount++;
    }

    // Insert contacts (simple fields only)
    for (const contact of contacts) {
      await ctx.db.insert("contacts", {
        firstName: contact.first_name?.replace(/\n/g, '').trim() || undefined,
        lastName: contact.last_name?.replace(/\n/g, '').trim() || undefined,
        email: contact.email?.replace(/\n/g, '').trim() || undefined,
        mobilePhone: contact.mobile_phone || undefined,
        linkedinUrl: contact.linkedin_url?.replace(/\n/g, '').trim() || undefined,
        jobTitle: contact.job_title?.replace(/\n/g, '').trim() || undefined,
        seniority: contact.seniority || undefined,
        functionGroup: contact.function_group || undefined,
        status: contact.status || undefined,
        country: contact.country?.replace(/\n/g, '').trim() || undefined,
        state: contact.state?.replace(/\n/g, '').trim() || undefined,
        city: contact.city?.replace(/\n/g, '').trim() || undefined,
      });
      contactCount++;
    }

    return { clients: clientCount, companies: companyCount, contacts: contactCount };
  },
});

export const quickMigration = action({
  args: {},
  returns: v.object({ 
    clients: v.number(), 
    companies: v.number(), 
    contacts: v.number(), 
    message: v.string() 
  }),
  handler: async (ctx) => {
    console.log("Fetching data from Supabase...");
    
    const [clients, companies, contacts] = await Promise.all([
      fetchSupabase("clients"),
      fetchSupabase("companies"), 
      fetchSupabase("contacts")
    ]);

    console.log(`Found ${clients.length} clients, ${companies.length} companies, ${contacts.length} contacts`);

    const result = await ctx.runMutation(internal.simpleMigration.insertSimpleData, {
      clients,
      companies,
      contacts,
    });

    return {
      ...result,
      message: `Successfully migrated ${result.clients} clients, ${result.companies} companies, ${result.contacts} contacts`,
    };
  },
});