import { createOpenAI } from '@ai-sdk/openai';

/**
 * Perplexity AI integration for real-time research and insights
 * Provides AI-powered research capabilities for lead generation and company intelligence
 */

const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY || '';

if (!PERPLEXITY_API_KEY) {
  console.warn('VITE_PERPLEXITY_API_KEY not found in environment variables');
}

// Create Perplexity client using OpenAI-compatible API
export const perplexity = createOpenAI({
  apiKey: PERPLEXITY_API_KEY,
  baseURL: 'https://api.perplexity.ai',
});

/**
 * Research company information using Perplexity AI
 */
export async function researchCompany(companyName: string, websiteUrl?: string) {
  try {
    const searchQuery = websiteUrl 
      ? `Research ${companyName} company (${websiteUrl}). Provide: company overview, industry, recent news, key executives, technologies used, competitive position, funding/financial status, and growth trends.`
      : `Research ${companyName} company. Provide: company overview, industry, recent news, key executives, technologies used, competitive position, funding/financial status, and growth trends.`;

    const response = await perplexity.chat.completions.create({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        {
          role: 'system',
          content: 'You are a business research assistant. Provide comprehensive, factual information about companies for lead generation and sales purposes. Format your response in clear sections with bullet points where appropriate.'
        },
        {
          role: 'user',
          content: searchQuery
        }
      ],
      max_tokens: 2000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      return {
        success: false,
        error: 'No research data returned'
      };
    }

    return {
      success: true,
      data: {
        content,
        searchQuery,
        timestamp: Date.now(),
        source: 'perplexity'
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Research contact/person using Perplexity AI
 */
export async function researchContact(contactName: string, companyName?: string, jobTitle?: string) {
  try {
    let searchQuery = `Research ${contactName}`;
    
    if (companyName && jobTitle) {
      searchQuery += ` who is ${jobTitle} at ${companyName}`;
    } else if (companyName) {
      searchQuery += ` at ${companyName}`;
    } else if (jobTitle) {
      searchQuery += ` who is a ${jobTitle}`;
    }
    
    searchQuery += `. Provide: professional background, education, career history, recent achievements, social media presence, and any relevant business insights.`;

    const response = await perplexity.chat.completions.create({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        {
          role: 'system',
          content: 'You are a professional research assistant. Provide factual, publicly available information about business professionals for legitimate business development purposes. Focus on professional achievements and public information only.'
        },
        {
          role: 'user',
          content: searchQuery
        }
      ],
      max_tokens: 1500,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      return {
        success: false,
        error: 'No research data returned'
      };
    }

    return {
      success: true,
      data: {
        content,
        searchQuery,
        timestamp: Date.now(),
        source: 'perplexity'
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Research industry trends and insights
 */
export async function researchIndustry(industry: string, focus?: 'trends' | 'challenges' | 'opportunities' | 'competitors') {
  try {
    let searchQuery = `Research ${industry} industry`;
    
    switch (focus) {
      case 'trends':
        searchQuery += ' latest trends and developments in 2024-2025';
        break;
      case 'challenges':
        searchQuery += ' current challenges and pain points';
        break;
      case 'opportunities':
        searchQuery += ' business opportunities and growth areas';
        break;
      case 'competitors':
        searchQuery += ' key players and competitive landscape';
        break;
      default:
        searchQuery += ' overview, trends, challenges, and opportunities';
    }

    const response = await perplexity.chat.completions.create({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        {
          role: 'system',
          content: 'You are an industry research analyst. Provide comprehensive, up-to-date information about industry sectors, including market trends, key players, challenges, and opportunities.'
        },
        {
          role: 'user',
          content: searchQuery
        }
      ],
      max_tokens: 2000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      return {
        success: false,
        error: 'No research data returned'
      };
    }

    return {
      success: true,
      data: {
        content,
        searchQuery,
        industry,
        focus: focus || 'general',
        timestamp: Date.now(),
        source: 'perplexity'
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate meeting talking points based on research
 */
export async function generateMeetingTalkingPoints(
  contactName: string,
  companyName: string,
  meetingContext?: string
) {
  try {
    let searchQuery = `Generate meeting talking points for a business meeting with ${contactName} from ${companyName}`;
    
    if (meetingContext) {
      searchQuery += `. Meeting context: ${meetingContext}`;
    }
    
    searchQuery += `. Research recent company news, industry trends, and provide 5-7 specific talking points that would be relevant for a productive business conversation.`;

    const response = await perplexity.chat.completions.create({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        {
          role: 'system',
          content: 'You are a business development assistant. Generate relevant, timely talking points for business meetings based on current information about the contact and their company. Focus on recent developments, industry trends, and mutual opportunities.'
        },
        {
          role: 'user',
          content: searchQuery
        }
      ],
      max_tokens: 1500,
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      return {
        success: false,
        error: 'No talking points generated'
      };
    }

    return {
      success: true,
      data: {
        content,
        contactName,
        companyName,
        meetingContext,
        timestamp: Date.now(),
        source: 'perplexity'
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Research market intelligence for specific topics
 */
export async function researchMarketIntelligence(
  topic: string,
  region?: string,
  timeframe?: 'recent' | 'this-year' | 'this-quarter'
) {
  try {
    let searchQuery = `Research market intelligence on ${topic}`;
    
    if (region) {
      searchQuery += ` in ${region}`;
    }
    
    switch (timeframe) {
      case 'recent':
        searchQuery += ' with latest developments and recent news';
        break;
      case 'this-year':
        searchQuery += ' with 2024-2025 trends and data';
        break;
      case 'this-quarter':
        searchQuery += ' with current quarter insights';
        break;
      default:
        searchQuery += ' with current market insights';
    }

    const response = await perplexity.chat.completions.create({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        {
          role: 'system',
          content: 'You are a market intelligence researcher. Provide comprehensive, data-driven insights about market topics including trends, key players, market size, growth projections, and competitive dynamics.'
        },
        {
          role: 'user',
          content: searchQuery
        }
      ],
      max_tokens: 2000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      return {
        success: false,
        error: 'No market intelligence found'
      };
    }

    return {
      success: true,
      data: {
        content,
        topic,
        region,
        timeframe: timeframe || 'current',
        timestamp: Date.now(),
        source: 'perplexity'
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get technology stack insights for a company
 */
export async function researchTechStack(companyName: string, websiteUrl?: string) {
  try {
    const searchQuery = websiteUrl 
      ? `Research the technology stack and technical infrastructure used by ${companyName} (${websiteUrl}). Include: programming languages, frameworks, cloud providers, databases, development tools, and any recent technology adoptions or migrations.`
      : `Research the technology stack and technical infrastructure used by ${companyName}. Include: programming languages, frameworks, cloud providers, databases, development tools, and any recent technology adoptions or migrations.`;

    const response = await perplexity.chat.completions.create({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        {
          role: 'system',
          content: 'You are a technology research specialist. Provide detailed information about companies\' technology stacks, infrastructure, and technical decisions based on publicly available information.'
        },
        {
          role: 'user',
          content: searchQuery
        }
      ],
      max_tokens: 1500,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      return {
        success: false,
        error: 'No technology information found'
      };
    }

    return {
      success: true,
      data: {
        content,
        companyName,
        websiteUrl,
        timestamp: Date.now(),
        source: 'perplexity'
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}