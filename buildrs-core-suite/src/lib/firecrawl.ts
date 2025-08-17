import FireCrawl from '@mendable/firecrawl-js';

/**
 * FireCrawl integration for web scraping and content extraction
 * This can be used to enrich contacts and companies with public web data
 */

const FIRECRAWL_API_KEY = import.meta.env.VITE_FIRECRAWL_API_KEY || '';

if (!FIRECRAWL_API_KEY) {
  console.warn('VITE_FIRECRAWL_API_KEY not found in environment variables');
}

export const firecrawl = new FireCrawl({ 
  apiKey: FIRECRAWL_API_KEY 
});

/**
 * Scrape a single URL and extract structured data
 */
export async function scrapeUrl(url: string, options?: {
  onlyMainContent?: boolean;
  includeHtml?: boolean;
  includeTags?: string[];
  excludeTags?: string[];
}) {
  try {
    const result = await firecrawl.scrapeUrl(url, {
      formats: ['markdown', 'html'],
      onlyMainContent: options?.onlyMainContent ?? true,
      includeTags: options?.includeTags,
      excludeTags: options?.excludeTags,
    });

    if (result.success) {
      return {
        success: true,
        data: {
          markdown: result.data.markdown,
          html: options?.includeHtml ? result.data.html : undefined,
          metadata: result.data.metadata,
          links: result.data.links,
          screenshot: result.data.screenshot,
        }
      };
    } else {
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Map a website to discover all pages (useful for company research)
 */
export async function mapWebsite(url: string, options?: {
  limit?: number;
  includeSubdomains?: boolean;
}) {
  try {
    const result = await firecrawl.mapUrl(url, {
      limit: options?.limit ?? 10,
      includeSubdomains: options?.includeSubdomains ?? false,
    });

    if (result.success) {
      return {
        success: true,
        data: result.data.map(page => ({
          url: page.url,
          title: page.title,
          description: page.description,
        }))
      };
    } else {
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Crawl a website and extract content from multiple pages
 * Useful for comprehensive company research
 */
export async function crawlWebsite(url: string, options?: {
  limit?: number;
  excludePaths?: string[];
  onlyMainContent?: boolean;
}) {
  try {
    const result = await firecrawl.crawlUrl(url, {
      limit: options?.limit ?? 5,
      excludePaths: options?.excludePaths,
      scrapeOptions: {
        formats: ['markdown'],
        onlyMainContent: options?.onlyMainContent ?? true,
      }
    });

    if (result.success) {
      // For crawl, we need to wait for completion
      const crawlId = result.id;
      
      // Poll for completion (in a real app, you'd want better handling)
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max
      
      while (attempts < maxAttempts) {
        const status = await firecrawl.checkCrawlStatus(crawlId);
        
        if (status.success && status.status === 'completed') {
          return {
            success: true,
            data: status.data?.map(page => ({
              url: page.metadata?.sourceURL || '',
              title: page.metadata?.title || '',
              content: page.markdown || '',
              metadata: page.metadata,
            })) || []
          };
        }
        
        if (status.status === 'failed') {
          return {
            success: false,
            error: 'Crawl failed'
          };
        }
        
        // Wait 10 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;
      }
      
      return {
        success: false,
        error: 'Crawl timed out'
      };
    } else {
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Extract company information from a website
 * This is a specialized function for lead enrichment
 */
export async function extractCompanyInfo(websiteUrl: string) {
  try {
    // First, scrape the main page
    const scrapeResult = await scrapeUrl(websiteUrl, {
      onlyMainContent: true,
      excludeTags: ['nav', 'footer', 'aside', 'script', 'style']
    });

    if (!scrapeResult.success) {
      return scrapeResult;
    }

    const content = scrapeResult.data.markdown || '';
    const metadata = scrapeResult.data.metadata || {};

    // Extract key company information
    const companyInfo = {
      name: metadata.title?.replace(/\s*\|\s*.*$/, '') || '', // Remove taglines
      description: metadata.description || '',
      website: websiteUrl,
      industry: extractIndustry(content),
      size: extractCompanySize(content),
      location: extractLocation(content),
      technologies: extractTechnologies(content),
      socialMedia: extractSocialLinks(scrapeResult.data.links || []),
      contactInfo: extractContactInfo(content),
      keyFeatures: extractKeyFeatures(content),
    };

    return {
      success: true,
      data: companyInfo
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Helper functions for data extraction
function extractIndustry(content: string): string[] {
  const industries = [
    'software', 'technology', 'saas', 'fintech', 'healthcare', 'education',
    'e-commerce', 'marketing', 'consulting', 'manufacturing', 'retail',
    'logistics', 'transportation', 'energy', 'real estate', 'media'
  ];
  
  const found = industries.filter(industry => 
    content.toLowerCase().includes(industry)
  );
  
  return Array.from(new Set(found));
}

function extractCompanySize(content: string): string {
  const sizeIndicators = [
    { pattern: /(\d+)\+?\s*employees?/i, type: 'employees' },
    { pattern: /team\s+of\s+(\d+)/i, type: 'team' },
    { pattern: /(startup|small|medium|large|enterprise)/i, type: 'size' }
  ];

  for (const indicator of sizeIndicators) {
    const match = content.match(indicator.pattern);
    if (match) {
      return match[0];
    }
  }

  return '';
}

function extractLocation(content: string): string[] {
  // Simple location extraction - in a real app, you'd use a more sophisticated approach
  const locationPattern = /(?:based in|located in|headquarters in|office in)\s+([^.]+)/gi;
  const matches = content.match(locationPattern) || [];
  
  return matches.map(match => 
    match.replace(/^(based in|located in|headquarters in|office in)\s+/i, '').trim()
  );
}

function extractTechnologies(content: string): string[] {
  const techKeywords = [
    'react', 'vue', 'angular', 'node', 'python', 'java', 'php', 'ruby',
    'aws', 'azure', 'gcp', 'kubernetes', 'docker', 'mongodb', 'postgresql',
    'mysql', 'redis', 'elasticsearch', 'graphql', 'rest api', 'microservices'
  ];

  const found = techKeywords.filter(tech => 
    content.toLowerCase().includes(tech)
  );

  return Array.from(new Set(found));
}

function extractSocialLinks(links: any[]): Record<string, string> {
  const socialMedia: Record<string, string> = {};
  
  links.forEach(link => {
    const url = link.url || link;
    if (url.includes('linkedin.com')) socialMedia.linkedin = url;
    if (url.includes('twitter.com') || url.includes('x.com')) socialMedia.twitter = url;
    if (url.includes('facebook.com')) socialMedia.facebook = url;
    if (url.includes('instagram.com')) socialMedia.instagram = url;
    if (url.includes('github.com')) socialMedia.github = url;
  });

  return socialMedia;
}

function extractContactInfo(content: string): Record<string, string> {
  const contactInfo: Record<string, string> = {};
  
  // Email extraction
  const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    contactInfo.email = emailMatch[0];
  }
  
  // Phone extraction
  const phoneMatch = content.match(/[\+]?[\d\s\-\(\)]{10,}/);
  if (phoneMatch) {
    contactInfo.phone = phoneMatch[0].trim();
  }
  
  return contactInfo;
}

function extractKeyFeatures(content: string): string[] {
  // Extract bullet points and key features
  const features = [];
  
  // Look for common feature indicators
  const featurePatterns = [
    /^[•\-\*]\s*(.+)$/gm,
    /^\d+\.\s*(.+)$/gm,
    /(?:features?|benefits?|capabilities):\s*(.+)/gi
  ];
  
  featurePatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      features.push(...matches.map(match => match.replace(/^[•\-\*\d\.]\s*/, '').trim()));
    }
  });
  
  return features.slice(0, 10); // Limit to top 10 features
}