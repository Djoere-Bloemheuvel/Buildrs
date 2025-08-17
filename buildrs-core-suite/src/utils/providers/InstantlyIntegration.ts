import { Id } from "../../../convex/_generated/dataModel";
import { CommunicationLogger, EmailLogParams } from "./CommunicationLogger";

export interface InstantlyCampaignData {
  contactId: Id<"contacts">;
  campaignId?: Id<"campaigns">;
  fromEmail: string;
  toEmail: string;
  subject: string;
  content: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  customVariables?: Record<string, string>;
}

export interface InstantlyWebhookData {
  messageId: string;
  email: string;
  event: "sent" | "delivered" | "opened" | "clicked" | "replied" | "bounced" | "unsubscribed";
  timestamp: number;
  campaignId?: string;
  userAgent?: string;
  ipAddress?: string;
  location?: string;
  replyContent?: string;
}

/**
 * Integration with Instantly.ai for cold email campaigns
 */
export class InstantlyIntegration {
  private baseUrl = "https://api.instantly.ai/api/v1";
  private logger: CommunicationLogger;

  constructor(
    private apiKey: string,
    private clientId: Id<"clients">,
    private userId?: string
  ) {
    // Logger will be initialized when used in React components
    this.logger = new CommunicationLogger(clientId, userId);
  }

  /**
   * Initialize with communication logger (for React components)
   */
  static useIntegration(apiKey: string, clientId: Id<"clients">, userId?: string) {
    const integration = new InstantlyIntegration(apiKey, clientId, userId);
    integration.logger = CommunicationLogger.useLogger(clientId, userId);
    return integration;
  }

  /**
   * Send a single email through Instantly
   */
  async sendEmail(campaignData: InstantlyCampaignData): Promise<any> {
    const response = await fetch(`${this.baseUrl}/lead/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        campaign_id: campaignData.campaignId,
        email: campaignData.toEmail,
        first_name: campaignData.firstName,
        last_name: campaignData.lastName,
        company_name: campaignData.companyName,
        custom_variables: campaignData.customVariables,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Instantly API error: ${result.message || 'Unknown error'}`);
    }

    // Log the communication
    if (this.logger) {
      await this.logger.logEmail({
        contactId: campaignData.contactId,
        campaignId: campaignData.campaignId,
        direction: "outbound",
        subject: campaignData.subject,
        content: campaignData.content,
        fromEmail: campaignData.fromEmail,
        toEmail: campaignData.toEmail,
        provider: "instantly",
        metadata: {
          instantlyMessageId: result.lead_id,
          instantlyCampaignId: campaignData.campaignId,
          customVariables: campaignData.customVariables,
        },
      });
    }

    return result;
  }

  /**
   * Add multiple leads to an Instantly campaign
   */
  async addLeadsToCampaign(campaignId: string, leads: Array<{
    email: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    customVariables?: Record<string, string>;
    contactId?: Id<"contacts">;
  }>): Promise<any> {
    const response = await fetch(`${this.baseUrl}/lead/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        campaign_id: campaignId,
        leads: leads.map(lead => ({
          email: lead.email,
          first_name: lead.firstName,
          last_name: lead.lastName,
          company_name: lead.companyName,
          custom_variables: lead.customVariables,
        })),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Instantly API error: ${result.message || 'Unknown error'}`);
    }

    // Log each lead addition
    if (this.logger && result.leads) {
      for (let i = 0; i < result.leads.length; i++) {
        const lead = leads[i];
        const leadResult = result.leads[i];
        
        if (lead.contactId && leadResult.success) {
          await this.logger.logEmail({
            contactId: lead.contactId,
            campaignId: campaignId as Id<"campaigns">,
            direction: "outbound",
            subject: "Campaign enrollment",
            content: `Added to Instantly campaign: ${campaignId}`,
            toEmail: lead.email,
            provider: "instantly",
            metadata: {
              instantlyLeadId: leadResult.lead_id,
              instantlyCampaignId: campaignId,
              customVariables: lead.customVariables,
            },
          });
        }
      }
    }

    return result;
  }

  /**
   * Get campaign statistics from Instantly
   */
  async getCampaignStats(campaignId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/campaign/${campaignId}/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Instantly API error: ${result.message || 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Get leads from a campaign
   */
  async getCampaignLeads(campaignId: string, status?: string): Promise<any> {
    const url = new URL(`${this.baseUrl}/campaign/${campaignId}/leads`);
    if (status) {
      url.searchParams.append('status', status);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Instantly API error: ${result.message || 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Process webhook data from Instantly
   */
  async processWebhook(webhookData: InstantlyWebhookData): Promise<void> {
    // Find the communication record by message ID
    // This would typically be done in a server-side function
    console.log("Processing Instantly webhook:", webhookData);

    // The actual implementation would involve:
    // 1. Finding the communication by instantlyMessageId in metadata
    // 2. Updating the status based on the event
    // 3. Adding tracking metadata (opens, clicks, etc.)
    
    // For now, we'll just log the webhook data
    // The actual webhook processing should be done in Convex functions
  }

  /**
   * Remove a lead from a campaign
   */
  async removeLeadFromCampaign(campaignId: string, email: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/lead/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        campaign_id: campaignId,
        email: email,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Instantly API error: ${result.message || 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Pause a lead in a campaign
   */
  async pauseLead(campaignId: string, email: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/lead/pause`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        campaign_id: campaignId,
        email: email,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Instantly API error: ${result.message || 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Resume a paused lead in a campaign
   */
  async resumeLead(campaignId: string, email: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/lead/resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        campaign_id: campaignId,
        email: email,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Instantly API error: ${result.message || 'Unknown error'}`);
    }

    return result;
  }
}