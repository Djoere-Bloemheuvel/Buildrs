import { v } from "convex/values";
import { action } from "./_generated/server";

const SUPABASE_URL = "https://bxotrymbceudxfmugsyi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4b3RyeW1iY2V1ZHhmbXVnc3lpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQ2OTc2NCwiZXhwIjoyMDcwMDQ1NzY0fQ.dINbSZST2qFGEbDqhJQydgxj-PSFrWpWDZe37ImIa60";

export const fastMigrate = action({
  args: {},
  returns: v.object({ clients: v.number(), companies: v.number(), contacts: v.number(), message: v.string() }),
  handler: async (ctx) => {
    async function fetchData(table: string) {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
      });
      return await response.json();
    }

    // 1. Migrate clients first
    const clients = await fetchData("clients");
    let clientCount = 0;
    for (const client of clients) {
      try {
        await ctx.runMutation("api.clients.create", {
          company: client.company || "",
          contact: client.contact || undefined,
          phone: client.phone || undefined,
          email: client.email || undefined,
          domain: client.domain || undefined,
        });
        clientCount++;
      } catch (e) {
        console.log("Client skip:", e);
      }
    }

    // 2. Migrate companies
    const companies = await fetchData("companies");
    let companyCount = 0;
    for (const company of companies) {
      try {
        await ctx.runMutation("api.companies.create", {
          name: company.name || "",
          domain: company.domain || undefined,
          website: company.website || undefined,
          industryLabel: company.industry_label || undefined,
          subindustryLabel: company.subindustry_label || undefined,
          companySize: company.company_size || undefined,
          country: company.country || undefined,
          city: company.city || undefined,
          state: company.state || undefined,
        });
        companyCount++;
      } catch (e) {
        console.log("Company skip:", e);
      }
    }

    // 3. Migrate contacts
    const contacts = await fetchData("contacts");
    let contactCount = 0;
    for (const contact of contacts) {
      try {
        await ctx.runMutation("api.contacts.create", {
          firstName: contact.first_name || undefined,
          lastName: contact.last_name || undefined,
          email: contact.email || undefined,
          mobilePhone: contact.mobile_phone || undefined,
          linkedinUrl: contact.linkedin_url || undefined,
          jobTitle: contact.job_title || undefined,
          seniority: contact.seniority || undefined,
          functionGroup: contact.function_group || undefined,
          status: contact.status || undefined,
          country: contact.country || undefined,
          state: contact.state || undefined,
          city: contact.city || undefined,
        });
        contactCount++;
      } catch (e) {
        console.log("Contact skip:", e);
      }
    }

    return {
      clients: clientCount,
      companies: companyCount,
      contacts: contactCount,
      message: `Migrated ${clientCount} clients, ${companyCount} companies, ${contactCount} contacts`,
    };
  },
});