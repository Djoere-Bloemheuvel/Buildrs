import { v } from "convex/values";
import { action, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Company enrichment workflow - replicates N8N logic
// Circuit breaker state - in memory (resets on deployment)
let enrichmentCircuitBreaker = {
  failureCount: 0,
  lastFailureTime: 0,
  isOpen: false,
  FAILURE_THRESHOLD: 5,
  RECOVERY_TIMEOUT: 300000, // 5 minutes
};

export const enrichCompany = action({
  args: {
    companyId: v.id("companies"),
    domain: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    enrichmentData: v.optional(v.object({
      companySummary: v.optional(v.string()),
      companyCommonProblems: v.optional(v.string()),
      companyTargetCustomers: v.optional(v.string()),
      companyUniqueQualities: v.optional(v.string()),
      industrySlug: v.optional(v.string()),
      industryLabel: v.optional(v.string()),
      subindustryLabel: v.optional(v.string()),
      companyKeywords: v.optional(v.array(v.string())),
    })),
  }),
  handler: async (ctx, { companyId, domain }) => {
    console.log(`🔍 Starting enrichment for company ${companyId} with domain ${domain}`);
    
    // Circuit breaker check
    const now = Date.now();
    if (enrichmentCircuitBreaker.isOpen) {
      if (now - enrichmentCircuitBreaker.lastFailureTime > enrichmentCircuitBreaker.RECOVERY_TIMEOUT) {
        // Try to recover
        console.log("🔄 Circuit breaker recovery attempt");
        enrichmentCircuitBreaker.isOpen = false;
        enrichmentCircuitBreaker.failureCount = 0;
      } else {
        console.log("⚠️ Circuit breaker is OPEN - skipping enrichment");
        return {
          success: false,
          message: "Circuit breaker is open - enrichment temporarily disabled",
        };
      }
    }
    
    try {
      // Step 1: Firecrawl scraping with graceful fallback
      console.log("🌐 Starting website scraping...");
      const websiteContent = await firecrawlScrape(domain);
      
      if (!websiteContent.success) {
        console.log(`⚠️ Website scraping failed: ${websiteContent.error}`);
        
        // Try basic enrichment without website content
        const basicEnrichment = await performBasicEnrichment(ctx, companyId, domain);
        if (basicEnrichment.success) {
          return basicEnrichment;
        }
        
        // Complete failure
        enrichmentCircuitBreaker.failureCount++;
        enrichmentCircuitBreaker.lastFailureTime = now;
        
        if (enrichmentCircuitBreaker.failureCount >= enrichmentCircuitBreaker.FAILURE_THRESHOLD) {
          enrichmentCircuitBreaker.isOpen = true;
          console.log("🚨 Circuit breaker OPENED due to repeated failures");
        }
        
        return {
          success: false,
          message: `Failed to scrape website: ${websiteContent.error}`,
        };
      }
      
      // Step 2: GPT-5-mini analysis with content validation
      console.log("🤖 Starting AI analysis...");
      if (!websiteContent.markdown || websiteContent.markdown.length < 100) {
        console.log("⚠️ Website content too short for meaningful analysis");
        const basicEnrichment = await performBasicEnrichment(ctx, companyId, domain);
        return basicEnrichment;
      }
      
      const aiAnalysis = await generateCompanySummary(websiteContent.markdown!);
      if (!aiAnalysis.success) {
        console.log(`⚠️ AI analysis failed: ${aiAnalysis.error}`);
        
        // Increment failure count but don't open circuit for AI failures
        const basicEnrichment = await performBasicEnrichment(ctx, companyId, domain);
        return basicEnrichment;
      }
      
      // Step 3: Industry classification with validation
      console.log("🏭 Classifying industry...");
      const industryData = await classifyIndustry(aiAnalysis.data);
      
      // Step 4: Update company in database with comprehensive data
      console.log("💾 Updating database...");
      await ctx.runMutation(internal.companyEnrichment.updateCompanyEnrichment, {
        companyId,
        enrichmentData: {
          companySummary: aiAnalysis.data.company_summary || undefined,
          companyCommonProblems: aiAnalysis.data.company_common_problems || undefined,
          companyTargetCustomers: aiAnalysis.data.company_target_customers || undefined,
          companyUniqueQualities: aiAnalysis.data.company_unique_characteristics || undefined,
          industrySlug: aiAnalysis.data.main_industry || undefined,
          industryLabel: industryData.industryLabel,
          subindustryLabel: industryData.subindustryLabel,
          companyKeywords: industryData.keywords,
        },
      });
      
      // Reset circuit breaker on success
      enrichmentCircuitBreaker.failureCount = 0;
      enrichmentCircuitBreaker.isOpen = false;
      
      console.log(`✅ Successfully enriched company ${companyId}`);
      
      return {
        success: true,
        message: "Company enrichment completed successfully",
        enrichmentData: {
          companySummary: aiAnalysis.data.company_summary,
          companyCommonProblems: aiAnalysis.data.company_common_problems,
          companyTargetCustomers: aiAnalysis.data.company_target_customers,
          companyUniqueQualities: aiAnalysis.data.company_unique_characteristics,
          industrySlug: aiAnalysis.data.main_industry,
          industryLabel: industryData.industryLabel,
          subindustryLabel: industryData.subindustryLabel,
          companyKeywords: industryData.keywords,
        },
      };
      
    } catch (error) {
      console.error("💥 Company enrichment failed with unexpected error:", error);
      
      // Increment circuit breaker
      enrichmentCircuitBreaker.failureCount++;
      enrichmentCircuitBreaker.lastFailureTime = now;
      
      if (enrichmentCircuitBreaker.failureCount >= enrichmentCircuitBreaker.FAILURE_THRESHOLD) {
        enrichmentCircuitBreaker.isOpen = true;
        console.log("🚨 Circuit breaker OPENED due to unexpected errors");
      }
      
      // Try basic enrichment as last resort
      try {
        const basicEnrichment = await performBasicEnrichment(ctx, companyId, domain);
        return basicEnrichment;
      } catch (basicError) {
        return {
          success: false,
          message: `Enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  },
});

// Fallback enrichment when full enrichment fails - NO AI FIELD FILLING
async function performBasicEnrichment(ctx: any, companyId: any, domain: string) {
  console.log("🔧 Basic enrichment - AI output velden blijven leeg");
  
  try {
    // NO basic industry guess - AI output velden moeten leeg blijven
    // Alleen marking dat we hebben geprobeerd te enrichen
    await ctx.runMutation(internal.companyEnrichment.updateCompanyEnrichment, {
      companyId,
      enrichmentData: {
        // AI output velden blijven undefined - alleen ChatGPT vult deze in
        industrySlug: undefined,
        industryLabel: undefined,
        subindustryLabel: undefined,
        companyKeywords: undefined,
        companySummary: undefined,
        companyCommonProblems: undefined,
        companyTargetCustomers: undefined,
        companyUniqueQualities: undefined,
      },
    });
    
    console.log("✅ Basic enrichment completed - alle AI velden blijven leeg");
    return {
      success: true,
      message: "Basic enrichment completed - AI fields blijven leeg voor ChatGPT",
      enrichmentData: {},
    };
  } catch (error) {
    console.error("❌ Basic enrichment also failed:", error);
    return {
      success: false,
      message: "Both full and basic enrichment failed",
    };
  }
}

// Simple domain-based industry guessing
function guessIndustryFromDomain(domain: string) {
  const domainLower = domain.toLowerCase();
  
  if (domainLower.includes('tech') || domainLower.includes('software') || domainLower.includes('ai') || domainLower.includes('digital')) {
    return { slug: 'software-saas', label: 'Software & SaaS', sublabel: 'Technology', keywords: ['technology', 'software'] };
  } else if (domainLower.includes('marketing') || domainLower.includes('agency') || domainLower.includes('creative')) {
    return { slug: 'marketing-creatief', label: 'Marketing & Creatief', sublabel: 'Marketing', keywords: ['marketing', 'agency'] };
  } else if (domainLower.includes('consulting') || domainLower.includes('advies')) {
    return { slug: 'consultancy', label: 'Consultancy', sublabel: 'Business Consulting', keywords: ['consulting', 'advisory'] };
  } else if (domainLower.includes('shop') || domainLower.includes('store') || domainLower.includes('retail')) {
    return { slug: 'ecommerce-d2c', label: 'E-commerce & D2C', sublabel: 'Retail', keywords: ['ecommerce', 'retail'] };
  }
  
  // Default fallback
  return { slug: 'consultancy', label: 'Algemeen', sublabel: 'Business', keywords: ['business'] };
}

// Step 1: Firecrawl scraping with retry logic and timeout
async function firecrawlScrape(domain: string): Promise<{success: boolean, markdown?: string, error?: string}> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds
  const TIMEOUT_MS = 30000; // 30 seconds
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const url = domain.startsWith('http') ? domain : `https://${domain}`;
      
      console.log(`🔍 Firecrawl attempt ${attempt}/${MAX_RETRIES} for domain: ${domain}`);
      
      // Create timeout signal
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY || 'fc-44a24082503f41c1b0ad4161dce26e2b'}`,
        },
        body: JSON.stringify({
          url,
          formats: ['markdown'],
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    
      if (!response.ok) {
        // Rate limit or temporary error - retry
        if (response.status === 429 || response.status >= 500) {
          console.log(`⏳ Firecrawl rate limited or server error (${response.status}), retrying in ${RETRY_DELAY}ms...`);
          if (attempt < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt)); // Exponential backoff
            continue;
          }
        }
        
        return {
          success: false, 
          error: `Firecrawl API error: ${response.status} ${response.statusText}`,
        };
      }
      
      const data = await response.json();
      
      if (!data.data?.markdown) {
        return {
          success: false,
          error: 'No markdown content returned from Firecrawl',
        };
      }
      
      // Success - return result
      console.log(`✅ Firecrawl success for ${domain} (${data.data.markdown.length} chars)`);
      return {
        success: true,
        markdown: data.data.markdown.substring(0, 50000), // Limit to 50k chars to avoid OpenAI limits
      };
      
    } catch (error) {
      console.error(`❌ Firecrawl attempt ${attempt} failed:`, error);
      
      // If it's a timeout or network error, retry
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('network'))) {
        if (attempt < MAX_RETRIES) {
          console.log(`⏳ Network error, retrying in ${RETRY_DELAY * attempt}ms...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
          continue;
        }
      }
      
      // Final attempt or non-retryable error
      if (attempt === MAX_RETRIES) {
        return {
          success: false,
          error: `Firecrawl scraping failed after ${MAX_RETRIES} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  }
  
  // Should never reach here, but just in case
  return {
    success: false,
    error: 'Firecrawl scraping failed: Maximum retries exceeded',
  };
}

// Step 2: GPT-5-mini company analysis with robust error handling
async function generateCompanySummary(markdown: string): Promise<{success: boolean, data?: any, error?: string}> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second
  const TIMEOUT_MS = 45000; // 45 seconds for GPT
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🤖 GPT-5-mini attempt ${attempt}/${MAX_RETRIES}`);
    const prompt = `Je bent een intelligente AI-samenvattingsassistent die bedrijven analyseert op basis van hun website of andere bedrijfsinformatie. Je schrijft professioneel, genuanceerd en begrijpelijk Nederlands. Je begrijpt positionering, propositie en doelgroep. De output wordt gebruikt voor AI-gegenereerde cold outreach en moet als JSON worden teruggegeven, zonder foutmeldingen of markdown.
Verwerk onderstaande inputtekst in het volgende JSON-formaat:

{
  "company_summary": "",  
  "company_common_problems": "",  
  "company_target_customers": "",  
  "company_unique_characteristics": "",  
  "main_industry": ""  
}

📌 Toelichting:
- \`company_summary\`: Rijke, goed geschreven profielschets van min. 500 en max. 1000 woorden. Beschrijf wat het bedrijf doet, voor wie, hoe, in welke stijl en met welke visie. Denk als een AI die deze klant écht moet snappen.
- \`company_common_problems\`: Benoem typische groeibelemmeringen of knelpunten voor bedrijven zoals dit bedrijf - we willen dus weten wat hun de bottlenecks zijn van het bedrijf waar we nu onderzoek naar doen
- \`company_target_customers\`: Omschrijf hun doelgroep: sectoren, functies, bedrijfsgroottes of situaties.
- \`company_unique_characteristics\`: Wat maakt dit bedrijf opvallend qua stijl, visie, aanpak of positionering?
- \`main_industry\`: Kies exact **één slug** uit onderstaande lijst (Let op, je moet er altijd 1 kiezen, niet leeg laten):

marketing-creatief
bouw-installatie
consultancy
ecommerce-d2c
energie-duurzaam
financieel
hospitality-events
hr-recruitment
industrie-productie
legal
sales-leadgen
logistiek-transport
onderwijs-opleidingen
overheid-nonprofit
retail-groothandel
software-saas
vastgoed
zorg-ggz

📌 Gebruik deze input:
- Tekst: \`${markdown.substring(0, 8000)}\`

❌ Geen uitleg, markdown of headers.
✅ Alleen geldige JSON-output. Laat lege velden leeg indien nodig.`; // Limit to avoid token limits
    
      // Create timeout signal
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-mini',
          messages: [
            {
              role: 'system',
              content: 'Je bent een intelligente AI-samenvattingsassistent die bedrijven analyseert op basis van hun website of andere bedrijfsinformatie. Je schrijft professioneel, genuanceerd en begrijpelijk Nederlands.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 2000,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    
      if (!response.ok) {
        // Rate limit or server error - retry
        if (response.status === 429 || response.status >= 500) {
          console.log(`⏳ OpenAI rate limited or server error (${response.status}), retrying in ${RETRY_DELAY * attempt}ms...`);
          if (attempt < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
            continue;
          }
        }
        
        return {
          success: false,
          error: `OpenAI API error: ${response.status} ${response.statusText}`,
        };
      }
      
      const data = await response.json();
      const content = data.choices[0]?.message?.content?.trim();
      
      if (!content) {
        return {
          success: false,
          error: 'No content returned from OpenAI',
        };
      }
      
      // Parse JSON response with error handling
      let analysisData;
      try {
        // Clean content - remove markdown formatting if present
        const cleanContent = content.replace(/```json\n?|```\n?/g, '').trim();
        analysisData = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('❌ Failed to parse GPT response as JSON:', content);
        return {
          success: false,
          error: `Invalid JSON response from OpenAI: ${parseError instanceof Error ? parseError.message : 'Parse error'}`,
        };
      }
      
      // Validate required fields
      if (!analysisData.company_summary || !analysisData.main_industry) {
        return {
          success: false,
          error: 'Incomplete data from OpenAI: missing required fields',
        };
      }
      
      console.log(`✅ GPT-5-mini success: ${analysisData.company_summary?.length || 0} char summary`);
      return {
        success: true,
        data: analysisData,
      };
      
    } catch (error) {
      console.error(`❌ GPT attempt ${attempt} failed:`, error);
      
      // Retry on timeout or network errors
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('network'))) {
        if (attempt < MAX_RETRIES) {
          console.log(`⏳ Timeout/network error, retrying in ${RETRY_DELAY * attempt}ms...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
          continue;
        }
      }
      
      // Final attempt or non-retryable error
      if (attempt === MAX_RETRIES) {
        return {
          success: false,
          error: `GPT analysis failed after ${MAX_RETRIES} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  }
  
  // Should never reach here
  return {
    success: false,
    error: 'GPT analysis failed: Maximum retries exceeded',
  };
}

// Step 3: Industry classification (simplified for now)
async function classifyIndustry(analysisData: any): Promise<{industryLabel: string, subindustryLabel: string, keywords: string[]}> {
  // TODO: Implement full industry classification with keywords lookup
  // For now, return basic mapping
  const industryMappings: Record<string, {label: string, subindustry: string, keywords: string[]}> = {
    'marketing-creatief': {
      label: 'Marketing & Creatief',
      subindustry: 'Digital Marketing',
      keywords: ['marketing', 'branding', 'creative', 'digital'],
    },
    'software-saas': {
      label: 'Software & SaaS', 
      subindustry: 'SaaS',
      keywords: ['software', 'saas', 'technology', 'platform'],
    },
    'consultancy': {
      label: 'Consultancy',
      subindustry: 'Business Consulting',
      keywords: ['consulting', 'advisory', 'strategy', 'business'],
    },
    'ecommerce-d2c': {
      label: 'E-commerce & D2C',
      subindustry: 'E-commerce',
      keywords: ['ecommerce', 'retail', 'online', 'shop'],
    },
    // Add more mappings as needed
  };
  
  const mapping = industryMappings[analysisData.main_industry] || {
    label: 'Overig',
    subindustry: 'Algemeen',
    keywords: ['business'],
  };
  
  return {
    industryLabel: mapping.label,
    subindustryLabel: mapping.subindustry,
    keywords: mapping.keywords,
  };
}

// Database update mutation
export const updateCompanyEnrichment = mutation({
  args: {
    companyId: v.id("companies"),
    enrichmentData: v.object({
      companySummary: v.optional(v.string()),
      companyCommonProblems: v.optional(v.string()),
      companyTargetCustomers: v.optional(v.string()),
      companyUniqueQualities: v.optional(v.string()),
      industrySlug: v.optional(v.string()),
      industryLabel: v.optional(v.string()),
      subindustryLabel: v.optional(v.string()),
      companyKeywords: v.optional(v.array(v.string())),
    }),
  },
  returns: v.id("companies"),
  handler: async (ctx, { companyId, enrichmentData }) => {
    // fullEnrichment alleen op true zetten als industryLabel EN companySummary beide waarden hebben
    const hasCompleteEnrichment = !!(enrichmentData.industryLabel && enrichmentData.companySummary);
    
    await ctx.db.patch(companyId, {
      companySummary: enrichmentData.companySummary,
      companyCommonProblems: enrichmentData.companyCommonProblems,
      companyTargetCustomers: enrichmentData.companyTargetCustomers,
      companyUniqueQualities: enrichmentData.companyUniqueQualities,
      industrySlug: enrichmentData.industrySlug,
      industryLabel: enrichmentData.industryLabel,
      subindustryLabel: enrichmentData.subindustryLabel,
      companyKeywords: enrichmentData.companyKeywords,
      fullEnrichment: hasCompleteEnrichment,
      lastUpdatedAt: Date.now(),
    });
    
    console.log(`✅ Updated company ${companyId} with enrichment data (fullEnrichment: ${hasCompleteEnrichment})`);
    return companyId;
  },
});