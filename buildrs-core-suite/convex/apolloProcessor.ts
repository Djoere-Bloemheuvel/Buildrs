import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// Apollo.io data processor - replicates N8N workflow logic
export const processApolloData = action({
  args: {
    jsonlUrl: v.string(),
    clientId: v.string(),
  },
  returns: v.object({
    processed: v.number(),
    contactsCreated: v.number(),
    companiesCreated: v.number(),
    duplicatesSkipped: v.number(),
    filteredOut: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, { jsonlUrl, clientId }) => {
    console.log("Fetching Apollo JSONL data...");
    console.log("🆔 Received clientId:", clientId);
    
    // Validate URL format
    try {
      new URL(jsonlUrl);
    } catch (error) {
      throw new Error(`Invalid URL format: ${jsonlUrl}`);
    }
    
    // 1. Fetch JSONL data
    const response = await fetch(jsonlUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch JSONL: ${response.statusText}`);
    }
    
    const raw = await response.text();
    console.log("📄 Raw JSONL preview:", raw.substring(0, 500));
    
    const lines = raw.split('\n').filter(line => line.trim() !== '');
    console.log("📋 Found lines:", lines.length);
    
    const entries: any[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        // Skip lines that clearly aren't JSON (like headers or comments)
        if (!line.startsWith('{') && !line.startsWith('[')) {
          console.log(`⚠️ Skipping non-JSON line ${i + 1}: ${line.substring(0, 100)}`);
          continue;
        }
        
        const parsed = JSON.parse(line);
        entries.push(parsed);
      } catch (parseError) {
        console.error(`❌ Failed to parse line ${i + 1}:`, line.substring(0, 100));
        console.error(`Parse error:`, parseError);
        
        // Try to fix common JSON issues
        let fixedLine = line;
        
        // Fix trailing commas
        fixedLine = fixedLine.replace(/,(\s*[}\]])/g, '$1');
        
        // Fix unquoted keys (basic attempt)
        fixedLine = fixedLine.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
        
        try {
          const parsed = JSON.parse(fixedLine);
          console.log(`✅ Fixed and parsed line ${i + 1}`);
          entries.push(parsed);
        } catch (secondError) {
          console.error(`❌ Could not fix line ${i + 1}, skipping:`, secondError);
          // Continue processing other lines instead of failing completely
        }
      }
    }
    
    if (entries.length === 0) {
      throw new Error("No valid JSON entries found in JSONL file. Please check the file format.");
    }
    
    console.log(`Found ${entries.length} valid entries to process`);
    
    let processed = 0;
    let contactsCreated = 0;
    let companiesCreated = 0;
    let duplicatesSkipped = 0;
    let filteredOut = 0;
    
    // 2. Process entries in BATCHES with ADVANCED ERROR RECOVERY & PROGRESS TRACKING
    const BATCH_SIZE = 10; // Process 10 entries at a time
    const WAIT_TIME = 2000; // 2 seconds between batches to avoid rate limits
    const totalBatches = Math.ceil(entries.length / BATCH_SIZE);
    const failedEntries: any[] = [];
    
    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const progressPercent = Math.round((batchNum / totalBatches) * 100);
      
      // 7. 📊 PROGRESS TRACKING
      console.log(`🔄 Batch ${batchNum}/${totalBatches} (${progressPercent}%) - Processing ${batch.length} entries`);
      console.log(`📊 Current stats: ${contactsCreated} created, ${duplicatesSkipped} duplicates, ${filteredOut} filtered`);
      
      // 8. 🔧 ERROR RECOVERY - Process each entry with keyword-based classification
      for (let j = 0; j < batch.length; j++) {
        const entry = batch[j];
        
        try {
          // Elke contact krijgt keyword-based classificatie binnen processApolloEntry
          const processedContact = await processApolloEntry(ctx, entry, clientId);
          
          if (processedContact.action === 'created') {
            contactsCreated++;
            if (processedContact.companyCreated) {
              companiesCreated++;
            }
          } else if (processedContact.action === 'duplicate') {
            duplicatesSkipped++;
          } else if (processedContact.action === 'skipped') {
            filteredOut++;
          }
          
          processed++;
        } catch (error) {
          console.error(`❌ Failed entry in batch ${batchNum}:`, error);
          failedEntries.push({
            entry, 
            error: error instanceof Error ? error.message : 'Unknown error',
            batchNum
          });
        }
      }
      
      // Wait between batches to avoid rate limits (except for last batch)
      if (i + BATCH_SIZE < entries.length) {
        console.log(`⏱️ Waiting ${WAIT_TIME}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
      }
    }
    
    // 8. 🔧 RETRY FAILED ENTRIES (one more attempt)
    if (failedEntries.length > 0) {
      console.log(`🔄 Retrying ${failedEntries.length} failed entries...`);
      let retriedSuccessfully = 0;
      
      for (const {entry, error: originalError} of failedEntries) {
        try {
          const processedContact = await processApolloEntry(ctx, entry, clientId);
          
          if (processedContact.action === 'created') {
            contactsCreated++;
            if (processedContact.companyCreated) {
              companiesCreated++;
            }
            retriedSuccessfully++;
          } else if (processedContact.action === 'duplicate') {
            duplicatesSkipped++;
            retriedSuccessfully++;
          } else if (processedContact.action === 'skipped') {
            filteredOut++;
            retriedSuccessfully++;
          }
          
          processed++;
        } catch (retryError) {
          console.error(`❌ Permanently failed entry:`, {
            originalError,
            retryError: retryError instanceof Error ? retryError.message : 'Unknown retry error',
            email: entry.email || 'no email'
          });
        }
      }
      
      console.log(`✅ Retry complete: ${retriedSuccessfully}/${failedEntries.length} recovered`);
    }
    
    return {
      processed,
      contactsCreated,
      companiesCreated,
      duplicatesSkipped,
      filteredOut,
      message: `Processed ${processed} entries: ${contactsCreated} contacts created, ${companiesCreated} companies created, ${duplicatesSkipped} duplicates skipped, ${filteredOut} filtered out (no email/invalid website)`,
    };
  },
});

// Process individual Apollo entry
async function processApolloEntry(ctx: any, entry: any, clientId: string) {
  console.log("📥 Raw entry keys:", Object.keys(entry));
  console.log("📥 Raw entry data:", JSON.stringify(entry, null, 2));
  
  const org = entry.organization || entry.company || entry.org || {};
  console.log("🏢 Organization keys:", Object.keys(org));
  
  // ULTRA ROBUUSTE DATA EXTRACTIE - probeer ALLE mogelijke veldnamen + GEFORCEERDE FALLBACKS
  const contactData = {
    // Naam - probeer alle varianten
    firstName: sanitizeString(
      entry.first_name || entry.firstName || entry.name?.split(' ')[0] || 
      entry.contact_first_name || entry.given_name || entry.fname
    ),
    lastName: sanitizeString(
      entry.last_name || entry.lastName || entry.name?.split(' ').slice(1).join(' ') || 
      entry.contact_last_name || entry.family_name || entry.lname || entry.surname
    ),
    
    // Email - probeer alle varianten
    email: sanitizeString(
      entry.email || entry.email_address || entry.contact_email || 
      entry.work_email || entry.business_email || entry.primary_email
    ),
    
    // Job titel - probeer alle varianten
    jobTitle: sanitizeString(
      entry.title || entry.job_title || entry.position || entry.role || 
      entry.job_position || entry.occupation || entry.designation || 
      entry.current_title || entry.professional_title
    ),
    
    // Seniority
    seniority: sanitizeString(
      entry.seniority || entry.seniority_level || entry.level || entry.rank
    ),
    
    // LinkedIn - probeer alle varianten
    linkedinUrl: sanitizeString(
      entry.linkedin_url || entry.linkedin || entry.linkedin_profile || 
      entry.li_url || entry.linked_in_url || entry.contact_linkedin || 
      entry.linkedin_profile_url || entry.social_linkedin
    ),
    
    // Telefoon - ALLEEN persoonlijke/mobiele nummers voor contact
    mobilePhone: normalizePhone(
      entry.mobile_phone || entry.mobile || entry.cell_phone || entry.personal_phone ||
      entry.direct_phone || entry.contact_mobile || entry.private_phone
    ),
    
    // Locatie - probeer contact eerst, dan org + NEDERLANDSE NORMALISATIE
    country: normalizeLocationDutch(
      entry.country || entry.contact_country || entry.person_country ||
      org.country || org.company_country || org.location_country, 'country'
    ),
    state: normalizeLocationDutch(
      entry.state || entry.region || entry.province || entry.contact_state ||
      org.state || org.region || org.province || org.company_state, 'state'
    ),
    city: normalizeLocationDutch(
      entry.city || entry.locality || entry.contact_city || entry.person_city ||
      org.city || org.locality || org.company_city || org.location_city, 'city'
    ),
  };
  
  // INTELLIGENTE FALLBACKS met juiste info
  // Als er geen voornaam is, probeer de volledige naam te splitsen
  if (!contactData.firstName && entry.full_name) {
    const parts = entry.full_name.split(' ');
    contactData.firstName = parts[0];
    contactData.lastName = parts.slice(1).join(' ') || contactData.lastName;
  }
  
  // Probeer alternatieve email velden
  if (!contactData.email) {
    contactData.email = sanitizeString(
      entry.personal_email || entry.work_email || entry.email_address ||
      entry.contact_email || entry.business_email || entry.primary_email
    );
  }
  
  // Probeer alternatieve job title velden 
  if (!contactData.jobTitle) {
    contactData.jobTitle = sanitizeString(
      entry.job_title || entry.position || entry.role || entry.current_position ||
      entry.professional_title || entry.work_title || "Professional"
    );
  }
  
  console.log("👤 Enhanced contact data:", JSON.stringify(contactData, null, 2));
  
  // STRIKTE FILTERING: Alleen leads met geldig zakelijk email adres
  if (!contactData.email || contactData.email.trim() === '') {
    console.log(`❌ SKIPPED: No email address for ${contactData.firstName} ${contactData.lastName}`);
    return { action: 'skipped', reason: 'no_email' };
  }
  
  if (!isValidBusinessEmail(contactData.email)) {
    console.log(`❌ SKIPPED: Invalid business email ${contactData.email} for ${contactData.firstName} ${contactData.lastName}`);
    return { action: 'skipped', reason: 'invalid_email' };
  }
  
  // ROBUUSTE COMPANY DATA EXTRACTIE
  const companyData = {
    // Bedrijfsnaam - probeer alle varianten + NORMALISATIE
    name: normalizeCompanyName(sanitizeString(
      org.name || org.company_name || org.organization_name || 
      org.business_name || org.company || org.organization ||
      entry.company || entry.company_name || entry.organization || entry.employer
    ) || ''),
    
    // Domain - probeer meerdere bronnen + NORMALISATIE
    domain: normalizeDomain(
      org.domain || org.website_domain || org.company_domain ||
      extractDomain(contactData.email) || 
      extractDomain(org.website_url) || extractDomain(org.website)
    ),
    
    // Website - probeer alle varianten
    website: sanitizeString(
      org.website_url || org.website || org.company_website || 
      org.web_site || org.url || org.homepage || org.site_url ||
      entry.website || entry.company_website
    ),
    
    // LinkedIn - probeer alle varianten
    linkedinUrl: sanitizeString(
      org.linkedin_url || org.company_linkedin || org.linkedin || 
      org.linkedin_profile || org.li_url || org.social_linkedin ||
      org.company_linkedin_url || entry.company_linkedin
    ),
    
    // Industrie - probeer alle varianten (raw scraped data)
    scrapedIndustry: sanitizeString(
      org.industry || org.sector || org.business_type || org.category ||
      org.industry_sector || org.company_industry || org.vertical ||
      entry.industry || entry.sector || entry.company_industry
    ),
    
    // Company size - probeer alle varianten
    companySize: parseNumber(
      org.estimated_num_employees || org.employee_count || org.employees || 
      org.size || org.company_size || org.headcount || org.staff_count ||
      org.number_of_employees || org.employee_range || entry.company_size ||
      entry.employees || entry.headcount
    ),
    
    // Company phone - ALLEEN bedrijfsnummers (vaste lijnen, hoofdnummers)
    companyPhone: normalizePhone(
      org.phone || org.work_phone || org.main_phone || org.business_phone ||
      org.office_phone || org.company_phone || org.headquarters_phone ||
      org.sanitized_phone || entry.phone || entry.phone_number ||
      entry.work_phone || entry.business_phone || entry.company_phone
    ),
    
    // Locatie + NEDERLANDSE NORMALISATIE
    country: normalizeLocationDutch(
      org.country || org.company_country || org.location_country ||
      org.headquarters_country || entry.company_country, 'country'
    ),
    state: normalizeLocationDutch(
      org.state || org.region || org.province || org.company_state ||
      org.headquarters_state || entry.company_state, 'state'
    ),
    city: normalizeLocationDutch(
      org.city || org.locality || org.company_city || org.location_city ||
      org.headquarters_city || entry.company_city, 'city'
    ),
    
    // Technologies - probeer alle varianten en parse correct
    companyTechnologies: parseCompanyTechnologies(
      org.technologies || org.tech_stack || org.technology_stack || 
      org.company_technologies || org.tools || org.software || org.platforms ||
      entry.technologies || entry.tech_stack || entry.technology_stack ||
      entry.company_technologies || entry.tools || entry.software
    ),
  };
  
  // INTELLIGENTE COMPANY FALLBACKS met juiste info
  // Als geen bedrijfsnaam, gebruik email domain als hint
  if (!companyData.name && contactData.email) {
    const emailDomain = normalizeDomain(contactData.email);
    if (emailDomain && !emailDomain.includes('gmail') && !emailDomain.includes('hotmail') && !emailDomain.includes('yahoo')) {
      // Maak een bedrijfsnaam van domain (bijv. "buildrs.ai" -> "Buildrs")
      companyData.name = emailDomain
        .split('.')[0]
        .charAt(0).toUpperCase() + emailDomain.split('.')[0].slice(1);
      
      // Zorg ook dat domain is ingesteld
      if (!companyData.domain) {
        companyData.domain = emailDomain;
      }
    }
  }
  
  // Als geen domain, probeer uit website of email + NORMALISATIE
  if (!companyData.domain) {
    companyData.domain = normalizeDomain(companyData.website) || normalizeDomain(contactData.email);
  }
  
  // Als geen website maar wel domain, maak website
  if (!companyData.website && companyData.domain) {
    companyData.website = `https://${companyData.domain}`;
  }
  
  // Default company size als niets gevonden
  if (!companyData.companySize) {
    // Probeer uit andere velden te schatten
    if (entry.company_headcount || entry.headcount || entry.employees_count) {
      companyData.companySize = parseNumber(entry.company_headcount || entry.headcount || entry.employees_count);
    }
  }
  
  console.log("🏢 Enhanced company data:", JSON.stringify(companyData, null, 2));
  
  // STRIKTE FILTERING: Alleen leads met werkende company website
  if (!companyData.website) {
    console.log(`❌ SKIPPED: No website for company ${companyData.name}`);
    return { action: 'skipped', reason: 'no_website' };
  }
  
  // Valideer of website werkt
  let isWebsiteWorking = false;
  try {
    isWebsiteWorking = await validateWebsite(companyData.website);
  } catch (error) {
    console.log("Website validation failed:", error);
  }
  
  if (!isWebsiteWorking) {
    console.log(`❌ SKIPPED: Website not working for ${companyData.name} (${companyData.website})`);
    return { action: 'skipped', reason: 'invalid_website' };
  }
  
  console.log(`✅ PASSED: Valid email (${contactData.email}) and working website (${companyData.website})`);
  
  // 4. 🔄 ADVANCED DUPLICATE PREVENTION
  const isDuplicate = await advancedDuplicateCheck(ctx, contactData, companyData.domain);
  if (isDuplicate.found) {
    console.log(`🔄 DUPLICATE found via ${isDuplicate.method}: ${contactData.email}`);
    return { action: 'duplicate', contactId: isDuplicate.contactId };
  }
  
  // Website is already validated in strict filtering above
  const websiteValid = true; // We know it's valid because we passed the filter
  
  // 4. 📋 KEYWORD-BASED FUNCTION GROUP CLASSIFICATION
  let functionGroup = undefined;
  if (contactData.jobTitle) {
    console.log(`📋 Classifying function group for job title: ${contactData.jobTitle}`);
    functionGroup = classifyFunctionGroupKeywords(contactData.jobTitle);
    console.log(`✅ Classified "${contactData.jobTitle}" as: ${functionGroup}`);
  } else {
    // No job title - use default
    functionGroup = "Operational Decision Makers";
    console.log(`⚠️ No job title provided, using default: ${functionGroup}`);
  }
  
  // 5. Check/create company - SMART EMAIL DOMAIN LINKING
  let companyId = undefined;
  let companyCreated = false;
  
  // STAP 1: Probeer EERST via email domain (meest betrouwbare methode)
  const emailDomain = normalizeDomain(contactData.email);
  
  if (emailDomain && !emailDomain.includes('gmail') && !emailDomain.includes('hotmail') && !emailDomain.includes('yahoo') && !emailDomain.includes('outlook')) {
    const existingByEmailDomain = await ctx.runQuery(internal.apolloProcessor.checkCompanyExists, {
      domain: emailDomain,
    });
    
    if (existingByEmailDomain) {
      companyId = existingByEmailDomain._id;
      console.log(`🔗 Linked to existing company via email domain: ${emailDomain}`);
    } else {
      // Maak nieuwe company gebaseerd op email domain
      companyId = await ctx.runMutation(internal.apolloProcessor.createCompany, {
        name: companyData.name || emailDomain.split('.')[0].charAt(0).toUpperCase() + emailDomain.split('.')[0].slice(1),
        domain: emailDomain, // Gebruik email domain als primaire domain
        website: companyData.website || `https://${emailDomain}`,
        linkedinUrl: companyData.linkedinUrl,
        scrapedIndustry: companyData.scrapedIndustry,
        companySize: companyData.companySize,
        companyPhone: companyData.companyPhone,
        companyTechnologies: companyData.companyTechnologies,
        country: companyData.country,
        state: companyData.state,
        city: companyData.city,
        clientId,
      });
      companyCreated = true;
      console.log(`🏢 Created new company via email domain: ${emailDomain}`);
      
      // 🚀 TRIGGER COMPANY ENRICHMENT (async, don't wait)
      if (emailDomain) {
        triggerCompanyEnrichment(ctx, companyId, emailDomain);
      }
    }
  }
  // STAP 2: Fallback via scraped domain (als anders dan email domain)
  else if (companyData.domain && companyData.domain !== emailDomain) {
    const existingByScrapedDomain = await ctx.runQuery(internal.apolloProcessor.checkCompanyExists, {
      domain: companyData.domain,
    });
    
    if (existingByScrapedDomain) {
      companyId = existingByScrapedDomain._id;
      console.log(`🔗 Linked to existing company via scraped domain: ${companyData.domain}`);
    } else {
      // Maak company met scraped domain
      companyId = await ctx.runMutation(internal.apolloProcessor.createCompany, {
        name: companyData.name,
        domain: companyData.domain,
        website: companyData.website,
        linkedinUrl: companyData.linkedinUrl,
        scrapedIndustry: companyData.scrapedIndustry,
        companySize: companyData.companySize,
        companyPhone: companyData.companyPhone,
        companyTechnologies: companyData.companyTechnologies,
        country: companyData.country,
        state: companyData.state,
        city: companyData.city,
        clientId,
      });
      companyCreated = true;
      console.log(`🏢 Created new company via scraped domain: ${companyData.domain}`);
      
      // 🚀 TRIGGER COMPANY ENRICHMENT (async, don't wait)
      if (companyData.domain) {
        triggerCompanyEnrichment(ctx, companyId, companyData.domain);
      }
    }
  }
  // STAP 3: Laatste fallback - company name only (zeer onbetrouwbaar)
  else if (companyData.name && companyData.name !== "Unknown Company") {
    const existingByName = await ctx.runQuery(internal.apolloProcessor.checkCompanyByName, {
      name: companyData.name,
    });
    
    if (existingByName) {
      companyId = existingByName._id;
      console.log(`🔗 Linked to existing company via name: ${companyData.name}`);
    } else {
      // Maak company alleen met naam (geen domain)
      companyId = await ctx.runMutation(internal.apolloProcessor.createCompany, {
        name: companyData.name,
        domain: undefined,
        website: companyData.website,
        linkedinUrl: companyData.linkedinUrl,
        scrapedIndustry: companyData.scrapedIndustry,
        companySize: companyData.companySize,
        companyPhone: companyData.companyPhone,
        companyTechnologies: companyData.companyTechnologies,
        country: companyData.country,
        state: companyData.state,
        city: companyData.city,
        clientId,
      });
      companyCreated = true;
      console.log(`🏢 Created new company via name only: ${companyData.name}`);
    }
  }
  
  // Log final result
  if (!companyId) {
    console.log(`⚠️ No company created/linked for contact: ${contactData.firstName} ${contactData.lastName}`);
  }
  
  // 6. Create contact met ALLE velden (normalize email)
  const contactId = await ctx.runMutation(internal.apolloProcessor.createContact, {
    firstName: contactData.firstName,
    lastName: contactData.lastName,
    email: contactData.email?.toLowerCase().trim(),
    mobilePhone: contactData.mobilePhone,
    linkedinUrl: contactData.linkedinUrl,
    jobTitle: contactData.jobTitle,
    seniority: contactData.seniority,
    functionGroup: functionGroup,
    country: contactData.country,
    state: contactData.state,
    city: contactData.city,
    companyId: companyId,
    clientId: clientId,
    status: "cold",
    isLinkedinConnected: false,
    optedIn: false, // Default naar false
  });
  
  // 7. 📊 KOPIEER CONTACT NAAR OPENBARE LEADS DATABASE (only if email exists)
  if (contactData.email) {
    console.log("📊 Adding contact to public leads database...");
    try {
      await ctx.runMutation(internal.apolloProcessor.createLead, {
        companyId: companyId,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        email: contactData.email.toLowerCase().trim(), // Required field
        mobilePhone: contactData.mobilePhone,
        linkedinUrl: contactData.linkedinUrl,
        jobTitle: contactData.jobTitle,
        seniority: contactData.seniority,
        functionGroup: functionGroup,
        country: contactData.country,
        state: contactData.state,
        city: contactData.city,
        originalContactId: contactId,
        sourceType: "apollo",
        isActive: true,
      });
      console.log("✅ Contact added to public leads database");
    } catch (error) {
      console.error("❌ Failed to add contact to leads database:", error);
      // Don't fail the whole process if leads creation fails
    }
  } else {
    console.log("⚠️ Skipping leads database - no email provided");
  }
  
  return { 
    action: 'created', 
    contactId, 
    companyId, 
    companyCreated,
    functionGroup,
    websiteValid,
  };
}

// ROBUUSTE HELPER FUNCTIONS
function sanitizeString(str: any): string | undefined {
  if (!str) return undefined;
  if (typeof str === 'string') {
    const cleaned = str.trim();
    return cleaned === '' || cleaned === 'null' || cleaned === 'undefined' ? undefined : cleaned;
  }
  if (typeof str === 'number') return str.toString();
  return undefined;
}

// EXTREEM ROBUUSTE NEDERLANDSE LOCATIE NORMALISATIE
function normalizeLocationDutch(location: string | undefined, type: 'city' | 'state' | 'country'): string | undefined {
  if (!location) return undefined;
  
  let normalized = location.toString().trim().toLowerCase();
  if (!normalized || normalized === 'null' || normalized === 'undefined') return undefined;
  
  // Remove common prefixes and clean up
  normalized = normalized
    .replace(/^(the\s+|het\s+|de\s+)/i, '')
    .replace(/[^\w\s\-'àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (type === 'country') {
    return normalizeCountryDutch(normalized);
  } else if (type === 'state') {
    return normalizeStateDutch(normalized);
  } else if (type === 'city') {
    return normalizeCityDutch(normalized);
  }
  
  return normalized;
}

function normalizeCountryDutch(country: string): string {
  const countryMappings: Record<string, string> = {
    // Nederlands
    'netherlands': 'Nederland',
    'the netherlands': 'Nederland',
    'holland': 'Nederland',
    'nl': 'Nederland',
    'nld': 'Nederland',
    'nederland': 'Nederland',
    
    // Engelse landen - UITGEBREID
    'united kingdom': 'Verenigd Koninkrijk',
    'uk': 'Verenigd Koninkrijk',
    'great britain': 'Verenigd Koninkrijk',
    'britain': 'Verenigd Koninkrijk',
    'england': 'Engeland',
    'scotland': 'Schotland',
    'wales': 'Wales',
    'northern ireland': 'Noord-Ierland',
    'ireland': 'Ierland',
    'republic of ireland': 'Ierland',
    'irish republic': 'Ierland',
    'isle of man': 'Eiland Man',
    'channel islands': 'Kanaaleilanden',
    'jersey': 'Jersey',
    'guernsey': 'Guernsey',
    
    // Andere Europese landen - VEEL UITGEBREIDER
    'germany': 'Duitsland',
    'deutschland': 'Duitsland',
    'de': 'Duitsland',
    'federal republic of germany': 'Duitsland',
    'german': 'Duitsland',
    
    'france': 'Frankrijk',
    'frankreich': 'Frankrijk',
    'fr': 'Frankrijk',
    'french republic': 'Frankrijk',
    'francia': 'Frankrijk',
    
    'spain': 'Spanje',
    'españa': 'Spanje',
    'es': 'Spanje',
    'kingdom of spain': 'Spanje',
    'spanish': 'Spanje',
    
    'italy': 'Italië',
    'italia': 'Italië',
    'it': 'Italië',
    'italian republic': 'Italië',
    'italian': 'Italië',
    
    'belgium': 'België',
    'belgique': 'België',
    'belgien': 'België',
    'be': 'België',
    'kingdom of belgium': 'België',
    'belgian': 'België',
    
    'austria': 'Oostenrijk',
    'österreich': 'Oostenrijk',
    'at': 'Oostenrijk',
    'republic of austria': 'Oostenrijk',
    'austrian': 'Oostenrijk',
    
    'switzerland': 'Zwitserland',
    'schweiz': 'Zwitserland',
    'suisse': 'Zwitserland',
    'svizzera': 'Zwitserland',
    'ch': 'Zwitserland',
    'swiss confederation': 'Zwitserland',
    'swiss': 'Zwitserland',
    
    'luxembourg': 'Luxemburg',
    'lu': 'Luxemburg',
    'grand duchy of luxembourg': 'Luxemburg',
    'luxembourgish': 'Luxemburg',
    
    'portugal': 'Portugal',
    'pt': 'Portugal',
    'portuguese republic': 'Portugal',
    'portuguese': 'Portugal',
    
    'denmark': 'Denemarken',
    'danmark': 'Denemarken',
    'dk': 'Denemarken',
    'kingdom of denmark': 'Denemarken',
    'danish': 'Denemarken',
    
    'sweden': 'Zweden',
    'sverige': 'Zweden',
    'se': 'Zweden',
    'kingdom of sweden': 'Zweden',
    'swedish': 'Zweden',
    
    'norway': 'Noorwegen',
    'norge': 'Noorwegen',
    'no': 'Noorwegen',
    'kingdom of norway': 'Noorwegen',
    'norwegian': 'Noorwegen',
    
    'finland': 'Finland',
    'suomi': 'Finland',
    'fi': 'Finland',
    'republic of finland': 'Finland',
    'finnish': 'Finland',
    
    'iceland': 'IJsland',
    'island': 'IJsland',
    'is': 'IJsland',
    'republic of iceland': 'IJsland',
    'icelandic': 'IJsland',
    
    'poland': 'Polen',
    'polska': 'Polen',
    'pl': 'Polen',
    'republic of poland': 'Polen',
    'polish': 'Polen',
    
    'czech republic': 'Tsjechië',
    'czechia': 'Tsjechië',
    'ceska republika': 'Tsjechië',
    'cz': 'Tsjechië',
    'czech': 'Tsjechië',
    
    'slovakia': 'Slowakije',
    'slovak republic': 'Slowakije',
    'slovensko': 'Slowakije',
    'sk': 'Slowakije',
    'slovak': 'Slowakije',
    
    'hungary': 'Hongarije',
    'magyarország': 'Hongarije',
    'hu': 'Hongarije',
    'republic of hungary': 'Hongarije',
    'hungarian': 'Hongarije',
    
    'romania': 'Roemenië',
    'ro': 'Roemenië',
    'romanian': 'Roemenië',
    
    'bulgaria': 'Bulgarije',
    'bg': 'Bulgarije',
    'republic of bulgaria': 'Bulgarije',
    'bulgarian': 'Bulgarije',
    
    'croatia': 'Kroatië',
    'hrvatska': 'Kroatië',
    'hr': 'Kroatië',
    'republic of croatia': 'Kroatië',
    'croatian': 'Kroatië',
    
    'slovenia': 'Slovenië',
    'slovenija': 'Slovenië',
    'si': 'Slovenië',
    'republic of slovenia': 'Slovenië',
    'slovenian': 'Slovenië',
    
    'greece': 'Griekenland',
    'hellas': 'Griekenland',
    'gr': 'Griekenland',
    'hellenic republic': 'Griekenland',
    'greek': 'Griekenland',
    
    'serbia': 'Servië',
    'srbija': 'Servië',
    'rs': 'Servië',
    'republic of serbia': 'Servië',
    'serbian': 'Servië',
    
    'bosnia and herzegovina': 'Bosnië en Herzegovina',
    'bosnia': 'Bosnië en Herzegovina',
    'ba': 'Bosnië en Herzegovina',
    'bosnian': 'Bosnië en Herzegovina',
    
    'montenegro': 'Montenegro',
    'me': 'Montenegro',
    'montenegrin': 'Montenegro',
    
    'north macedonia': 'Noord-Macedonië',
    'macedonia': 'Noord-Macedonië',
    'mk': 'Noord-Macedonië',
    'macedonian': 'Noord-Macedonië',
    
    'albania': 'Albanië',
    'al': 'Albanië',
    'republic of albania': 'Albanië',
    'albanian': 'Albanië',
    
    'kosovo': 'Kosovo',
    'xk': 'Kosovo',
    'kosovar': 'Kosovo',
    
    'moldova': 'Moldavië',
    'md': 'Moldavië',
    'republic of moldova': 'Moldavië',
    'moldovan': 'Moldavië',
    
    'ukraine': 'Oekraïne',
    'ua': 'Oekraïne',
    'ukrainian': 'Oekraïne',
    
    'belarus': 'Wit-Rusland',
    'by': 'Wit-Rusland',
    'republic of belarus': 'Wit-Rusland',
    'belarusian': 'Wit-Rusland',
    
    'lithuania': 'Litouwen',
    'lt': 'Litouwen',
    'republic of lithuania': 'Litouwen',
    'lithuanian': 'Litouwen',
    
    'latvia': 'Letland',
    'lv': 'Letland',
    'republic of latvia': 'Letland',
    'latvian': 'Letland',
    
    'estonia': 'Estland',
    'ee': 'Estland',
    'republic of estonia': 'Estland',
    'estonian': 'Estland',
    
    'cyprus': 'Cyprus',
    'cy': 'Cyprus',
    'republic of cyprus': 'Cyprus',
    'cypriot': 'Cyprus',
    
    'malta': 'Malta',
    'mt': 'Malta',
    'republic of malta': 'Malta',
    'maltese': 'Malta',
    
    // Grote landen buiten Europa - UITGEBREID
    'united states': 'Verenigde Staten',
    'united states of america': 'Verenigde Staten',
    'usa': 'Verenigde Staten',
    'us': 'Verenigde Staten',
    'america': 'Verenigde Staten',
    'american': 'Verenigde Staten',
    'u.s.': 'Verenigde Staten',
    'u.s.a.': 'Verenigde Staten',
    'states': 'Verenigde Staten',
    
    'canada': 'Canada',
    'ca': 'Canada',
    'canadian': 'Canada',
    
    'china': 'China',
    'peoples republic of china': 'China',
    'prc': 'China',
    'cn': 'China',
    'chinese': 'China',
    'mainland china': 'China',
    
    'japan': 'Japan',
    'jp': 'Japan',
    'japanese': 'Japan',
    'nippon': 'Japan',
    'nihon': 'Japan',
    
    'south korea': 'Zuid-Korea',
    'republic of korea': 'Zuid-Korea',
    'korea': 'Zuid-Korea',
    'kr': 'Zuid-Korea',
    'korean': 'Zuid-Korea',
    'south korean': 'Zuid-Korea',
    
    'north korea': 'Noord-Korea',
    'democratic peoples republic of korea': 'Noord-Korea',
    'kp': 'Noord-Korea',
    'north korean': 'Noord-Korea',
    
    'australia': 'Australië',
    'au': 'Australië',
    'commonwealth of australia': 'Australië',
    'australian': 'Australië',
    
    'new zealand': 'Nieuw-Zeeland',
    'nz': 'Nieuw-Zeeland',
    
    'brazil': 'Brazilië',
    'brasil': 'Brazilië',
    'br': 'Brazilië',
    'federative republic of brazil': 'Brazilië',
    'brazilian': 'Brazilië',
    
    'india': 'India',
    'in': 'India',
    'republic of india': 'India',
    'indian': 'India',
    'bharat': 'India',
    
    'russia': 'Rusland',
    'russian federation': 'Rusland',
    'ru': 'Rusland',
    'russian': 'Rusland',
    'rossiya': 'Rusland',
    
    'south africa': 'Zuid-Afrika',
    'za': 'Zuid-Afrika',
    'republic of south africa': 'Zuid-Afrika',
    'south african': 'Zuid-Afrika',
    
    'israel': 'Israël',
    'il': 'Israël',
    'state of israel': 'Israël',
    'israeli': 'Israël',
    
    'turkey': 'Turkije',
    'türkiye': 'Turkije',
    'tr': 'Turkije',
    'republic of turkey': 'Turkije',
    'turkish': 'Turkije',
    
    'mexico': 'Mexico',
    'mx': 'Mexico',
    'united mexican states': 'Mexico',
    'mexican': 'Mexico',
    
    'argentina': 'Argentinië',
    'ar': 'Argentinië',
    'argentine republic': 'Argentinië',
    'argentinian': 'Argentinië',
    'argentine': 'Argentinië',
    
    // Meer landen wereldwijd
    'indonesia': 'Indonesië',
    'id': 'Indonesië',
    'republic of indonesia': 'Indonesië',
    'indonesian': 'Indonesië',
    
    'thailand': 'Thailand',
    'th': 'Thailand',
    'kingdom of thailand': 'Thailand',
    'thai': 'Thailand',
    
    'vietnam': 'Vietnam',
    'vn': 'Vietnam',
    'vietnamese': 'Vietnam',
    
    'philippines': 'Filipijnen',
    'ph': 'Filipijnen',
    'republic of the philippines': 'Filipijnen',
    'filipino': 'Filipijnen',
    'philippine': 'Filipijnen',
    
    'malaysia': 'Maleisië',
    'my': 'Maleisië',
    'malaysian': 'Maleisië',
    
    'singapore': 'Singapore',
    'sg': 'Singapore',
    'republic of singapore': 'Singapore',
    'singaporean': 'Singapore',
    
    'taiwan': 'Taiwan',
    'tw': 'Taiwan',
    'republic of china': 'Taiwan',
    'taiwanese': 'Taiwan',
    
    'hong kong': 'Hongkong',
    'hk': 'Hongkong',
    'hong kong sar': 'Hongkong',
    
    'united arab emirates': 'Verenigde Arabische Emiraten',
    'uae': 'Verenigde Arabische Emiraten',
    'ae': 'Verenigde Arabische Emiraten',
    'emirates': 'Verenigde Arabische Emiraten',
    
    'saudi arabia': 'Saoedi-Arabië',
    'sa': 'Saoedi-Arabië',
    'kingdom of saudi arabia': 'Saoedi-Arabië',
    'saudi': 'Saoedi-Arabië',
    
    'egypt': 'Egypte',
    'eg': 'Egypte',
    'arab republic of egypt': 'Egypte',
    'egyptian': 'Egypte',
    
    'nigeria': 'Nigeria',
    'ng': 'Nigeria',
    'federal republic of nigeria': 'Nigeria',
    'nigerian': 'Nigeria',
    
    'kenya': 'Kenia',
    'ke': 'Kenia',
    'republic of kenya': 'Kenia',
    'kenyan': 'Kenia',
    
    'ghana': 'Ghana',
    'gh': 'Ghana',
    'republic of ghana': 'Ghana',
    'ghanaian': 'Ghana',
    
    'chile': 'Chili',
    'cl': 'Chili',
    'republic of chile': 'Chili',
    'chilean': 'Chili',
    
    'colombia': 'Colombia',
    'co': 'Colombia',
    'republic of colombia': 'Colombia',
    'colombian': 'Colombia',
    
    'peru': 'Peru',
    'pe': 'Peru',
    'republic of peru': 'Peru',
    'peruvian': 'Peru',
    
    'venezuela': 'Venezuela',
    've': 'Venezuela',
    'bolivarian republic of venezuela': 'Venezuela',
    'venezuelan': 'Venezuela',
    
    'ecuador': 'Ecuador',
    'ec': 'Ecuador',
    'republic of ecuador': 'Ecuador',
    'ecuadorian': 'Ecuador',
    
    'uruguay': 'Uruguay',
    'uy': 'Uruguay',
    'eastern republic of uruguay': 'Uruguay',
    'uruguayan': 'Uruguay',
    
    'paraguay': 'Paraguay',
    'py': 'Paraguay',
    'republic of paraguay': 'Paraguay',
    'paraguayan': 'Paraguay',
    
    'bolivia': 'Bolivia',
    'bo': 'Bolivia',
    'plurinational state of bolivia': 'Bolivia',
    'bolivian': 'Bolivia',
  };
  
  const mapped = countryMappings[country];
  if (mapped) return mapped;
  
  // Als geen mapping, capitalize eerste letter van elk woord
  return country.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeStateDutch(state: string): string {
  const stateMappings: Record<string, string> = {
    // Nederlandse provincies
    'north holland': 'Noord-Holland',
    'noord holland': 'Noord-Holland',
    'nh': 'Noord-Holland',
    'south holland': 'Zuid-Holland',
    'zuid holland': 'Zuid-Holland',
    'zh': 'Zuid-Holland',
    'utrecht': 'Utrecht',
    'ut': 'Utrecht',
    'gelderland': 'Gelderland',
    'gld': 'Gelderland',
    'overijssel': 'Overijssel',
    'ov': 'Overijssel',
    'flevoland': 'Flevoland',
    'friesland': 'Friesland',
    'frisia': 'Friesland',
    'fr': 'Friesland',
    'groningen': 'Groningen',
    'gr': 'Groningen',
    'drenthe': 'Drenthe',
    'dr': 'Drenthe',
    'north brabant': 'Noord-Brabant',
    'noord brabant': 'Noord-Brabant',
    'brabant': 'Noord-Brabant',
    'nb': 'Noord-Brabant',
    'limburg': 'Limburg',
    'lb': 'Limburg',
    'zeeland': 'Zeeland',
    'zld': 'Zeeland',
    
    // Duitse deelstaten (veel Nederlandse connecties)
    'north rhine westphalia': 'Noordrijn-Westfalen',
    'nordrhein westfalen': 'Noordrijn-Westfalen',
    'nrw': 'Noordrijn-Westfalen',
    'lower saxony': 'Nedersaksen',
    'niedersachsen': 'Nedersaksen',
    'bavaria': 'Beieren',
    'bayern': 'Beieren',
    'baden württemberg': 'Baden-Württemberg',
    'hesse': 'Hessen',
    'hessen': 'Hessen',
    'rhineland palatinate': 'Rijnland-Palts',
    'rheinland pfalz': 'Rijnland-Palts',
    'schleswig holstein': 'Sleeswijk-Holstein',
    
    // Belgische provincies/gewesten
    'flanders': 'Vlaanderen',
    'vlaanderen': 'Vlaanderen',
    'wallonia': 'Wallonië',
    'wallonie': 'Wallonië',
    'brussels': 'Brussel',
    'bruxelles': 'Brussel',
    'antwerp': 'Antwerpen',
    'antwerpen': 'Antwerpen',
    'east flanders': 'Oost-Vlaanderen',
    'oost vlaanderen': 'Oost-Vlaanderen',
    'west flanders': 'West-Vlaanderen',
    'west vlaanderen': 'West-Vlaanderen',
    'flemish brabant': 'Vlaams-Brabant',
    'vlaams brabant': 'Vlaams-Brabant',
    'walloon brabant': 'Waals-Brabant',
    'waals brabant': 'Waals-Brabant',
    'liege': 'Luik',
    'luik': 'Luik',
    'namur': 'Namen',
    'namen': 'Namen',
    'hainaut': 'Henegouwen',
    'henegouwen': 'Henegouwen',
    'luxembourg': 'Luxemburg',
    'luxemburg': 'Luxemburg',
    
    // UK counties (veel zakelijke connecties)
    'greater london': 'Groot-Londen',
    'london': 'Londen',
    'england': 'Engeland',
    'scotland': 'Schotland',
    'wales': 'Wales',
    'northern ireland': 'Noord-Ierland',
    
    // Franse regio's
    'ile de france': 'Île-de-France',
    'provence alpes cote dazur': 'Provence-Alpes-Côte d\'Azur',
    'nouvelle aquitaine': 'Nouvelle-Aquitaine',
    'auvergne rhone alpes': 'Auvergne-Rhône-Alpes',
    'hauts de france': 'Hauts-de-France',
    'grand est': 'Grand Est',
    
    // US states (veel tech bedrijven)
    'california': 'Californië',
    'ca': 'Californië',
    'new york': 'New York',
    'ny': 'New York',
    'texas': 'Texas',
    'tx': 'Texas',
    'florida': 'Florida',
    'fl': 'Florida',
    'illinois': 'Illinois',
    'il': 'Illinois',
    'washington': 'Washington',
    'wa': 'Washington',
    'massachusetts': 'Massachusetts',
    'ma': 'Massachusetts',
    'pennsylvania': 'Pennsylvania',
    'pa': 'Pennsylvania',
  };
  
  const mapped = stateMappings[state];
  if (mapped) return mapped;
  
  // Als geen mapping, capitalize eerste letter van elk woord
  return state.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeCityDutch(city: string): string {
  const cityMappings: Record<string, string> = {
    // Nederlandse steden - UITGEBREID
    'amsterdam': 'Amsterdam',
    'rotterdam': 'Rotterdam',
    'the hague': 'Den Haag',
    'den haag': 'Den Haag',
    's gravenhage': 'Den Haag',
    'utrecht': 'Utrecht',
    'eindhoven': 'Eindhoven',
    'tilburg': 'Tilburg',
    'groningen': 'Groningen',
    'almere': 'Almere',
    'breda': 'Breda',
    'nijmegen': 'Nijmegen',
    'enschede': 'Enschede',
    'haarlem': 'Haarlem',
    'arnhem': 'Arnhem',
    'zaanstad': 'Zaanstad',
    'amersfoort': 'Amersfoort',
    'apeldoorn': 'Apeldoorn',
    'zwolle': 'Zwolle',
    'ede': 'Ede',
    'dordrecht': 'Dordrecht',
    'leiden': 'Leiden',
    'alphen aan den rijn': 'Alphen aan den Rijn',
    'westland': 'Westland',
    'zoetermeer': 'Zoetermeer',
    'leeuwarden': 'Leeuwarden',
    'maastricht': 'Maastricht',
    'delft': 'Delft',
    'oss': 'Oss',
    'alkmaar': 'Alkmaar',
    'hilversum': 'Hilversum',
    'hoofddorp': 'Hoofddorp',
    'amstelveen': 'Amstelveen',
    'purmerend': 'Purmerend',
    'emmen': 'Emmen',
    'venlo': 'Venlo',
    'deventer': 'Deventer',
    'leidschendam': 'Leidschendam',
    'voorburg': 'Voorburg',
    'rijswijk': 'Rijswijk',
    'schiedam': 'Schiedam',
    'spijkenisse': 'Spijkenisse',
    'vlaardingen': 'Vlaardingen',
    'capelle aan den ijssel': 'Capelle aan den IJssel',
    'nieuwegein': 'Nieuwegein',
    'veenendaal': 'Veenendaal',
    'helmond': 'Helmond',
    's hertogenbosch': '\'s-Hertogenbosch',
    'den bosch': '\'s-Hertogenbosch',
    'hertogenbosch': '\'s-Hertogenbosch',
    'sittard': 'Sittard',
    'geleen': 'Geleen',
    'heerlen': 'Heerlen',
    'roermond': 'Roermond',
    'weert': 'Weert',
    'assen': 'Assen',
    'hoogeveen': 'Hoogeveen',
    'coevorden': 'Coevorden',
    'meppel': 'Meppel',
    'hardenberg': 'Hardenberg',
    'kampen': 'Kampen',
    'raalte': 'Raalte',
    'oldenzaal': 'Oldenzaal',
    'hengelo': 'Hengelo',
    'almelo': 'Almelo',
    'borne': 'Borne',
    'winterswijk': 'Winterswijk',
    'doetinchem': 'Doetinchem',
    'tiel': 'Tiel',
    'cuijk': 'Cuijk',
    'uden': 'Uden',
    'veghel': 'Veghel',
    'boxmeer': 'Boxmeer',
    'roosendaal': 'Roosendaal',
    'bergen op zoom': 'Bergen op Zoom',
    'goes': 'Goes',
    'middelburg': 'Middelburg',
    'vlissingen': 'Vlissingen',
    'terneuzen': 'Terneuzen',
    'sneek': 'Sneek',
    'heerenveen': 'Heerenveen',
    'franeker': 'Franeker',
    'harlingen': 'Harlingen',
    'drachten': 'Drachten',
    'emmeloord': 'Emmeloord',
    'lelystad': 'Lelystad',
    'dronten': 'Dronten',
    'zeewolde': 'Zeewolde',
    'urk': 'Urk',
    
    // Belgische steden - UITGEBREID  
    'brussels': 'Brussel',
    'bruxelles': 'Brussel',
    'brussel': 'Brussel',
    'antwerp': 'Antwerpen',
    'antwerpen': 'Antwerpen',
    'anvers': 'Antwerpen',
    'ghent': 'Gent',
    'gent': 'Gent',
    'gand': 'Gent',
    'bruges': 'Brugge',
    'brugge': 'Brugge',
    'charleroi': 'Charleroi',
    'liege': 'Luik',
    'luik': 'Luik',
    'liège': 'Luik',
    'namur': 'Namen',
    'namen': 'Namen',
    'mons': 'Bergen',
    'bergen': 'Bergen',
    'leuven': 'Leuven',
    'louvain': 'Leuven',
    'mechelen': 'Mechelen',
    'malines': 'Mechelen',
    'aalst': 'Aalst',
    'alost': 'Aalst',
    'kortrijk': 'Kortrijk',
    'courtrai': 'Kortrijk',
    'hasselt': 'Hasselt',
    'genk': 'Genk',
    'ostend': 'Oostende',
    'oostende': 'Oostende',
    'ostende': 'Oostende',
    'sint niklaas': 'Sint-Niklaas',
    'saint nicolas': 'Sint-Niklaas',
    'tournai': 'Doornik',
    'doornik': 'Doornik',
    'verviers': 'Verviers',
    'mouscron': 'Moeskroen',
    'moeskroen': 'Moeskroen',
    'dendermonde': 'Dendermonde',
    'termonde': 'Dendermonde',
    'lokeren': 'Lokeren',
    'roeselare': 'Roeselare',
    'roulers': 'Roeselare',
    'turnhout': 'Turnhout',
    'vilvoorde': 'Vilvoorde',
    'vilvorde': 'Vilvoorde',
    'wavre': 'Waver',
    'waver': 'Waver',
    'nivelles': 'Nijvel',
    'nijvel': 'Nijvel',
    'dinant': 'Dinant',
    'spa': 'Spa',
    'eupen': 'Eupen',
    'arlon': 'Aarlen',
    'aarlen': 'Aarlen',
    'bastogne': 'Bastenaken',
    'bastenaken': 'Bastenaken',
    'marche en famenne': 'Marche-en-Famenne',
    'ieper': 'Ieper',
    'ypres': 'Ieper',
    'poperinge': 'Poperinge',
    'veurne': 'Veurne',
    'furnes': 'Veurne',
    'diksmuide': 'Diksmuide',
    'dixmude': 'Diksmuide',
    'tielt': 'Tielt',
    'izegem': 'Izegem',
    'waregem': 'Waregem',
    'menen': 'Menen',
    'menin': 'Menen',
    'koksijde': 'Koksijde',
    'coxyde': 'Koksijde',
    'de panne': 'De Panne',
    'la panne': 'De Panne',
    'knokke heist': 'Knokke-Heist',
    'blankenberge': 'Blankenberge',
    'bredene': 'Bredene',
    'zeebrugge': 'Zeebrugge',
    
    // Belangrijke internationale steden
    'london': 'Londen',
    'paris': 'Parijs',
    'berlin': 'Berlijn',
    'munich': 'München',
    'vienna': 'Wenen',
    'zurich': 'Zürich',
    'geneva': 'Genève',
    'cologne': 'Keulen',
    'düsseldorf': 'Düsseldorf',
    'frankfurt': 'Frankfurt',
    'hamburg': 'Hamburg',
    'new york': 'New York',
    'los angeles': 'Los Angeles',
  };
  
  const mapped = cityMappings[city];
  if (mapped) return mapped;
  
  // Special handling voor Nederlandse plaatsnamen
  if (city.includes(' aan ')) {
    // "alphen aan den rijn" -> "Alphen aan den Rijn"
    return city.split(' ')
      .map((word, index) => {
        if (word === 'aan' || word === 'den' || word === 'der' || word === 'de' || word === 'het') {
          return word; // lowercase voor tussenvoegsels
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }
  
  if (city.includes(' op ') || city.includes(' onder ') || city.includes(' bij ')) {
    // "bergen op zoom" -> "Bergen op Zoom"
    return city.split(' ')
      .map((word, index) => {
        if (word === 'op' || word === 'onder' || word === 'bij' || word === 'aan' || word === 'in') {
          return word; // lowercase voor tussenvoegsels
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }
  
  // Als geen mapping, capitalize eerste letter van elk woord
  return city.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function parseNumber(value: any): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  
  // Handle string ranges like "10-50", "1-10", etc.
  if (typeof value === 'string') {
    // Remove common prefixes/suffixes
    let cleaned = value.toLowerCase()
      .replace(/employees?/, '')
      .replace(/people/, '')
      .replace(/staff/, '')
      .replace(/[^\d\-+]/g, '');
    
    // Handle ranges - take the middle value
    if (cleaned.includes('-')) {
      const parts = cleaned.split('-').map(p => parseInt(p)).filter(n => !isNaN(n));
      if (parts.length === 2) {
        return Math.round((parts[0] + parts[1]) / 2);
      }
    }
    
    const num = parseFloat(cleaned);
    return !isNaN(num) ? num : undefined;
  }
  
  const num = Number(value);
  return !isNaN(num) ? num : undefined;
}

// PARSE COMPANY TECHNOLOGIES - handle different input formats
function parseCompanyTechnologies(technologies: any): string[] | undefined {
  if (!technologies) return undefined;
  
  // Als het al een array is
  if (Array.isArray(technologies)) {
    return technologies
      .map(tech => sanitizeString(tech))
      .filter(tech => tech && tech.length > 0) as string[];
  }
  
  // Als het een object is (bijv. {react: true, nodejs: false})
  if (typeof technologies === 'object' && technologies !== null) {
    const techArray = Object.entries(technologies)
      .filter(([key, value]) => value === true || value === 'true' || value === 1)
      .map(([key]) => sanitizeString(key))
      .filter(tech => tech && tech.length > 0) as string[];
    
    return techArray.length > 0 ? techArray : undefined;
  }
  
  // Als het een string is (bijv. "React, Node.js, PostgreSQL")
  if (typeof technologies === 'string') {
    const techArray = technologies
      .split(/[,;|\n]/) // Split op komma's, puntkomma's, pipes of newlines
      .map(tech => sanitizeString(tech?.trim()))
      .filter(tech => tech && tech.length > 1) as string[]; // Filter te korte strings
    
    return techArray.length > 0 ? techArray : undefined;
  }
  
  return undefined;
}

function normalizePhone(raw: any): string | undefined {
  if (!raw) return undefined;
  
  const phone = raw.toString().replace(/\s|\(|\)|-|\./g, '');
  
  // Handle international formats
  if (phone.startsWith('00')) {
    return '+' + phone.substring(2);
  } else if (phone.startsWith('+')) {
    return phone;
  } else if (phone.startsWith('31') && phone.length >= 10) {
    return '+' + phone;
  } else if (phone.startsWith('0') && phone.length >= 9) {
    return '+31' + phone.substring(1);
  }
  
  return phone.length >= 8 ? phone : undefined;
}

function extractDomain(input: string | undefined): string | undefined {
  if (!input) return undefined;
  
  let url = input.toString().trim().toLowerCase();
  
  // If it's an email, extract domain
  if (url.includes('@') && !url.includes('://')) {
    const parts = url.split('@');
    if (parts.length === 2) {
      url = parts[1];
    }
  }
  
  // If it's a URL, extract domain
  if (url.includes('://')) {
    try {
      const urlObj = new URL(url);
      url = urlObj.hostname;
    } catch {
      // Extract manually if URL parsing fails
      url = url.split('://')[1]?.split('/')[0] || url;
    }
  }
  
  // Remove www prefix
  url = url.replace(/^www\./, '');
  
  // Basic domain validation
  if (url.includes('.') && url.length > 3 && !url.includes(' ')) {
    return url;
  }
  
  return undefined;
}

// NORMALISEER DOMEIN - altijd lowercase, geen protocol
function normalizeDomain(domain: string | undefined): string | undefined {
  if (!domain) return undefined;
  
  const normalized = extractDomain(domain);
  return normalized ? normalized.toLowerCase() : undefined;
}

// 1. 🔒 BETERE EMAIL VALIDATIE
function isValidBusinessEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  
  // Reject consumer domains
  const consumerDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 
                          'icloud.com', 'aol.com', 'live.com', 'msn.com', 'protonmail.com'];
  
  // Reject temporary/disposable emails
  const disposableDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com', 
                           'mailinator.com', 'yopmail.com', 'temp-mail.org'];
  
  const domain = email.split('@')[1]?.toLowerCase();
  return domain && !consumerDomains.includes(domain) && !disposableDomains.includes(domain);
}

// 5. 📱 PHONE NUMBER INTELLIGENCE  
function smartPhoneClassification(phone: string, country: string): {type: 'mobile'|'landline', confidence: number} {
  if (!phone) return {type: 'landline', confidence: 0};
  
  // Nederlandse logica
  if (country === 'Nederland') {
    if (phone.startsWith('+316')) return {type: 'mobile', confidence: 0.95};
    if (phone.match(/^\+31[2-7]/)) return {type: 'landline', confidence: 0.90};
  }
  
  // Belgische logica
  if (country === 'België') {
    if (phone.startsWith('+324') || phone.startsWith('+3247') || phone.startsWith('+3248') || phone.startsWith('+3249')) {
      return {type: 'mobile', confidence: 0.95};
    }
    if (phone.match(/^\+32[1-9]/)) return {type: 'landline', confidence: 0.85};
  }
  
  // Internationale patterns
  if (phone.match(/^\+\d{10,15}$/)) {
    // Longer numbers are often mobile
    return phone.length > 12 ? {type: 'mobile', confidence: 0.70} : {type: 'landline', confidence: 0.60};
  }
  
  return {type: 'landline', confidence: 0.50};
}

// 4. 🔄 ADVANCED DUPLICATE PREVENTION
async function advancedDuplicateCheck(ctx: any, contactData: any, companyDomain: string): Promise<{found: boolean, method?: string, contactId?: any}> {
  // Check email (primary method)
  if (contactData.email) {
    const existingByEmail = await ctx.runQuery(internal.apolloProcessor.checkContactExists, {
      email: contactData.email,
    });
    if (existingByEmail) {
      return {found: true, method: 'email', contactId: existingByEmail._id};
    }
  }
  
  // Check LinkedIn URL (secondary method)  
  if (contactData.linkedinUrl) {
    const existingByLinkedIn = await ctx.runQuery(internal.apolloProcessor.checkContactByLinkedIn, {
      linkedinUrl: contactData.linkedinUrl,
    });
    if (existingByLinkedIn) {
      return {found: true, method: 'linkedin', contactId: existingByLinkedIn._id};
    }
  }
  
  // Check name + company domain combo (fuzzy method)
  if (contactData.firstName && contactData.lastName && companyDomain) {
    const existingByNameCompany = await ctx.runQuery(internal.apolloProcessor.checkContactByNameAndDomain, {
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      companyDomain: companyDomain,
    });
    if (existingByNameCompany) {
      return {found: true, method: 'name_company', contactId: existingByNameCompany._id};
    }
  }
  
  return {found: false};
}

// 6. 🏢 COMPANY NAME NORMALIZATION
function normalizeCompanyName(name: string): string {
  if (!name) return name;
  
  return name
    .replace(/\b(inc|ltd|llc|corp|bv|nv|gmbh|sa|sas|sarl)\b\.?$/i, '') // Remove legal suffixes
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// 3. 🌐 SMART WEBSITE VALIDATION
async function smartWebsiteValidation(url: string): Promise<{valid: boolean, score: number}> {
  try {
    const response = await fetch(url, { 
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeadValidator/1.0)' },
      // Note: Fetch API doesn't support timeout directly in Convex, but we can add error handling
    });
    
    if (!response.ok) return {valid: false, score: 0};
    
    const html = await response.text();
    let score = 0;
    
    // Content quality checks
    if (html.includes('<title>')) score += 20;
    if (html.toLowerCase().includes('contact')) score += 15;  
    if (html.toLowerCase().includes('about')) score += 15;
    if (html.match(/\b\w+@\w+\.\w+\b/)) score += 20; // Has email
    if (html.toLowerCase().includes('linkedin')) score += 10;
    if (html.toLowerCase().includes('privacy')) score += 10; // Professional sites have privacy policies
    if (html.includes('</nav>')) score += 10; // Has navigation
    
    // Word count
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    if (words > 500) score += 20;
    if (words > 1000) score += 10; // Bonus for substantial content
    
    // Negative indicators
    if (html.includes('404') || html.includes('not found')) score -= 50;
    if (html.includes('under construction')) score -= 30;
    if (html.includes('coming soon')) score -= 30;
    
    return {valid: score > 60, score};
  } catch (error) {
    console.log("Smart website validation failed:", error);
    return {valid: false, score: 0};
  }
}

// Legacy function for backward compatibility
async function validateWebsite(url: string): Promise<boolean> {
  const result = await smartWebsiteValidation(url);
  return result.valid;
}

// EFFICIËNTE KEYWORD-BASED CLASSIFICATIE (geen API calls)
function classifyFunctionGroupKeywords(jobTitle: string): string {
  const title = jobTitle.toLowerCase();
  
  // Owner/Founder keywords
  if (title.includes('founder') || title.includes('owner') || title.includes('ceo') || 
      title.includes('oprichter') || title.includes('eigenaar') || title.includes('director')) {
    return "Owner/Founder";
  }
  
  // Marketing keywords
  if (title.includes('marketing') || title.includes('cmo') || title.includes('brand') ||
      title.includes('communication') || title.includes('pr ') || title.includes('content')) {
    return "Marketing Decision Makers";
  }
  
  // Sales keywords  
  if (title.includes('sales') || title.includes('account') || title.includes('business development') ||
      title.includes('bd ') || title.includes('verkoop') || title.includes('commercial')) {
    return "Sales Decision Makers";
  }
  
  // Technical keywords
  if (title.includes('cto') || title.includes('developer') || title.includes('engineer') ||
      title.includes('tech') || title.includes('software') || title.includes('it ') ||
      title.includes('product manager') || title.includes('lead dev')) {
    return "Technical Decision Makers";
  }
  
  // Financial keywords
  if (title.includes('cfo') || title.includes('finance') || title.includes('accounting') ||
      title.includes('controller') || title.includes('treasurer')) {
    return "Financial Decision Makers";
  }
  
  // HR keywords
  if (title.includes('hr') || title.includes('people') || title.includes('human resources') ||
      title.includes('talent') || title.includes('recruitment')) {
    return "HR Decision Makers";
  }
  
  // Operations keywords
  if (title.includes('operations') || title.includes('coo') || title.includes('logistics') ||
      title.includes('supply') || title.includes('process')) {
    return "Operational Decision Makers";
  }
  
  // Product keywords
  if (title.includes('product') || title.includes('innovation') || title.includes('development') ||
      title.includes('design') || title.includes('ux') || title.includes('ui')) {
    return "Product & Innovation Decision Makers";
  }
  
  // Customer Success keywords
  if (title.includes('customer') || title.includes('support') || title.includes('success') ||
      title.includes('service') || title.includes('client relations')) {
    return "Customer Success & Support Decision Makers";
  }
  
  // Default fallback
  return "Marketing Decision Makers";
}

// BATCH KEYWORD CLASSIFICATION - Process multiple job titles at once
function classifyFunctionGroupsBatch(jobTitles: string[]): string[] {
  console.log(`📋 Processing ${jobTitles.length} job titles with keyword-based classification...`);
  
  const results = jobTitles.map(title => classifyFunctionGroupKeywords(title));
  
  console.log(`✅ Classified ${results.length} job titles successfully`);
  return results;
}

// SINGLE CLASSIFICATION - Simple wrapper for keyword-based classification
function classifyFunctionGroup(jobTitle: string): string {
  return classifyFunctionGroupKeywords(jobTitle);
}


// Database helper queries  
export const checkContactExists = query({
  args: { email: v.string() },
  returns: v.union(v.object({ _id: v.id("contacts") }), v.null()),
  handler: async (ctx, { email }) => {
    const contact = await ctx.db
      .query("contacts")
      .filter((q) => q.eq(q.field("email"), email.trim().toLowerCase()))
      .first();
    
    // Return only the _id field as expected by the validator
    return contact ? { _id: contact._id } : null;
  },
});

export const checkCompanyExists = query({
  args: { domain: v.string() },
  returns: v.union(v.object({ _id: v.id("companies") }), v.null()),
  handler: async (ctx, { domain }) => {
    if (!domain || domain.trim() === '') return null;
    
    // Normalize domain to prevent duplicates
    const normalizedDomain = domain.toLowerCase().trim()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]; // Remove path if present
    
    const company = await ctx.db
      .query("companies")
      .filter((q) => q.eq(q.field("domain"), normalizedDomain))
      .first();
    
    // Return only the _id field as expected by the validator
    return company ? { _id: company._id } : null;
  },
});

export const checkCompanyByName = query({
  args: { name: v.string() },
  returns: v.union(v.object({ _id: v.id("companies") }), v.null()),
  handler: async (ctx, { name }) => {
    const company = await ctx.db
      .query("companies")
      .filter((q) => q.eq(q.field("name"), name))
      .first();
    
    // Return only the _id field as expected by the validator
    return company ? { _id: company._id } : null;
  },
});

// New duplicate check queries
export const checkContactByLinkedIn = query({
  args: { linkedinUrl: v.string() },
  returns: v.union(v.object({ _id: v.id("contacts") }), v.null()),
  handler: async (ctx, { linkedinUrl }) => {
    const contact = await ctx.db
      .query("contacts")
      .filter((q) => q.eq(q.field("linkedinUrl"), linkedinUrl))
      .first();
    
    return contact ? { _id: contact._id } : null;
  },
});

export const checkContactByNameAndDomain = query({
  args: { 
    firstName: v.string(),
    lastName: v.string(), 
    companyDomain: v.string()
  },
  returns: v.union(v.object({ _id: v.id("contacts") }), v.null()),
  handler: async (ctx, { firstName, lastName, companyDomain }) => {
    // Find company by domain first
    const company = await ctx.db
      .query("companies")
      .filter((q) => q.eq(q.field("domain"), companyDomain))
      .first();
    
    if (!company) return null;
    
    // Find contact by name and company
    const contact = await ctx.db
      .query("contacts")
      .filter((q) => 
        q.and(
          q.eq(q.field("firstName"), firstName),
          q.eq(q.field("lastName"), lastName),
          q.eq(q.field("companyId"), company._id)
        )
      )
      .first();
    
    return contact ? { _id: contact._id } : null;
  },
});

export const createCompany = mutation({
  args: {
    name: v.optional(v.string()),
    domain: v.optional(v.string()),
    website: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    scrapedIndustry: v.optional(v.string()),
    companySize: v.optional(v.number()),
    companyPhone: v.optional(v.string()),
    companyTechnologies: v.optional(v.array(v.string())),
    country: v.optional(v.string()),
    state: v.optional(v.string()),
    city: v.optional(v.string()),
    clientId: v.string(),
  },
  returns: v.id("companies"),
  handler: async (ctx, args) => {
    const { clientId, ...companyData } = args;
    
    // Parse companySize to ensure it's a number
    const parsedCompanySize = parseNumber(companyData.companySize);
    
    // Normalize domain before saving to prevent duplicates
    let normalizedDomain = companyData.domain;
    if (normalizedDomain) {
      normalizedDomain = normalizedDomain.toLowerCase().trim()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0]; // Remove path if present
    }
    
    // DUPLICATE CHECK: Last resort check before insert
    if (normalizedDomain) {
      const existingCompany = await ctx.db
        .query("companies")
        .filter((q) => q.eq(q.field("domain"), normalizedDomain))
        .first();
      
      if (existingCompany) {
        console.log(`⚠️ Prevented duplicate company creation for domain: ${normalizedDomain}`);
        return existingCompany._id;
      }
    }
    
    return await ctx.db.insert("companies", {
      name: companyData.name || "Unknown Company",
      domain: normalizedDomain,
      website: companyData.website,
      scrapedIndustry: companyData.scrapedIndustry,
      companySize: parsedCompanySize,
      companyPhone: companyData.companyPhone,
      companyTechnologies: companyData.companyTechnologies,
      country: companyData.country,
      state: companyData.state,
      city: companyData.city,
      companyLinkedinUrl: companyData.linkedinUrl,
    });
  },
});

export const createContact = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    mobilePhone: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    seniority: v.optional(v.string()),
    functionGroup: v.optional(v.string()),
    country: v.optional(v.string()),
    state: v.optional(v.string()),
    city: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    clientId: v.string(),
    status: v.string(),
    isLinkedinConnected: v.optional(v.boolean()),
    optedIn: v.optional(v.boolean()),
  },
  returns: v.id("contacts"),
  handler: async (ctx, args) => {
    const { clientId, companyId, ...contactData } = args;
    
    // Use clientId directly + insert ALL contact fields (normalize email)
    return await ctx.db.insert("contacts", {
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      email: contactData.email?.toLowerCase().trim(),
      mobilePhone: contactData.mobilePhone,
      linkedinUrl: contactData.linkedinUrl,
      jobTitle: contactData.jobTitle,
      seniority: contactData.seniority,
      functionGroup: contactData.functionGroup,
      country: contactData.country,
      state: contactData.state,
      city: contactData.city,
      status: contactData.status,
      isLinkedinConnected: contactData.isLinkedinConnected,
      optedIn: contactData.optedIn,
      companyId,
      clientId: clientId as any,
    });
  },
});

export const createLead = mutation({
  args: {
    companyId: v.optional(v.id("companies")),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.string(), // Required field for unique constraint
    mobilePhone: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    seniority: v.optional(v.string()),
    functionGroup: v.optional(v.string()),
    country: v.optional(v.string()),
    state: v.optional(v.string()),
    city: v.optional(v.string()),
    originalContactId: v.optional(v.id("contacts")),
    sourceType: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.id("leads"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Normalize email (required field)
    const normalizedEmail = args.email.toLowerCase().trim();
    
    try {
      // Create new lead in public database with unique constraint
      return await ctx.db.insert("leads", {
        ...args,
        email: normalizedEmail,
        addedAt: now,
        lastUpdatedAt: now,
      });
    } catch (error) {
      // Handle unique constraint violation - update existing lead
      if (error.message && error.message.includes('unique')) {
        console.log(`📊 Lead with email ${normalizedEmail} already exists, updating...`);
        
        const existingLead = await ctx.db
          .query("leads")
          .filter((q) => q.eq(q.field("email"), normalizedEmail))
          .first();
        
        if (existingLead) {
          await ctx.db.patch(existingLead._id, {
            ...args,
            email: normalizedEmail,
            lastUpdatedAt: now,
          });
          return existingLead._id;
        }
      }
      
      // Re-throw other errors
      throw error;
    }
  },
});

// 🚀 COMPANY ENRICHMENT TRIGGER (async, non-blocking)
async function triggerCompanyEnrichment(ctx: any, companyId: any, domain: string) {
  try {
    console.log(`🚀 Triggering enrichment for company ${companyId} with domain ${domain}`);
    
    // Fire-and-forget enrichment (don't await to avoid blocking)
    ctx.runAction(internal.companyEnrichment.enrichCompany, {
      companyId,
      domain,
    }).catch((error: any) => {
      console.error(`❌ Background enrichment failed for ${companyId}:`, error);
    });
    
    console.log(`📅 Enrichment triggered for company ${companyId}`);
  } catch (error) {
    console.error(`❌ Failed to trigger enrichment for company ${companyId}:`, error);
    // Don't throw - enrichment failure shouldn't break contact creation
  }
}