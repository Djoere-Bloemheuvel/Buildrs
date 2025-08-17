import { Id } from "../../../convex/_generated/dataModel";
import { CommunicationLogger } from "./CommunicationLogger";

export interface PhantomBusterLinkedInData {
  contactId: Id<"contacts">;
  campaignId?: Id<"campaigns">;
  profileUrl: string;
  message: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  jobTitle?: string;
  sendConnectionRequest?: boolean;
  noteForConnection?: string;
}

export interface PhantomBusterWebhookData {
  sessionId: string;
  agentId: string;
  status: "running" | "finished" | "error";
  progress: number;
  result?: {
    profileUrl: string;
    connectionSent: boolean;
    messageSent: boolean;
    error?: string;
  };
  timestamp: number;
}

export interface PhantomBusterAgentConfig {
  agentId: string;
  name: string;
  script: string;
  arguments: Record<string, any>;
}

/**
 * Integration with PhantomBuster for LinkedIn automation
 */
export class PhantomBusterIntegration {
  private baseUrl = "https://api.phantombuster.com/api/v2";
  private logger: CommunicationLogger;

  constructor(
    private apiKey: string,
    private clientId: Id<"clients">,
    private userId?: string
  ) {
    this.logger = new CommunicationLogger(clientId, userId);
  }

  /**
   * Initialize with communication logger (for React components)
   */
  static useIntegration(apiKey: string, clientId: Id<"clients">, userId?: string) {
    const integration = new PhantomBusterIntegration(apiKey, clientId, userId);
    integration.logger = CommunicationLogger.useLogger(clientId, userId);
    return integration;
  }

  /**
   * Send a LinkedIn connection request and/or message
   */
  async sendLinkedInMessage(data: PhantomBusterLinkedInData): Promise<any> {
    try {
      // Get the appropriate agent ID based on the action type
      const agentId = data.sendConnectionRequest 
        ? this.getLinkedInConnectionAgentId()
        : this.getLinkedInMessagingAgentId();

      // PhantomBuster requires launching an agent with specific arguments
      const agentArguments = {
        profileUrls: [data.profileUrl], // Most agents expect an array
        message: data.message,
        sendConnectionRequest: data.sendConnectionRequest || false,
        noteForConnection: data.noteForConnection || "",
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.companyName,
        // Add session cookie for LinkedIn authentication
        sessionCookie: process.env.PHANTOMBUSTER_LINKEDIN_SESSION_COOKIE,
      };

      console.log(`Launching PhantomBuster agent ${agentId} for ${data.profileUrl}`);

      const response = await fetch(`${this.baseUrl}/agents/${agentId}/launch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Phantombuster-Key': this.apiKey,
        },
        body: JSON.stringify({
          arguments: agentArguments,
          // Add webhook URL for status updates
          webhookUrl: `${process.env.VITE_APP_URL}/api/webhooks/phantombuster`,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PhantomBuster API error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      const containerId = result.containerId;

      // Log the communication immediately with "sending" status
      let sessionId = null;
      if (this.logger) {
        sessionId = await this.logger.logLinkedIn({
          contactId: data.contactId,
          direction: "outbound",
          status: "sending",
          message: data.message,
          linkedinUrl: data.profileUrl,
          campaignId: data.campaignId,
          metadata: {
            phantomBusterMethod: data.sendConnectionRequest ? "connection" : "message",
            phantomBusterAgentId: agentId,
            phantomBusterContainerId: containerId,
            connectionRequestSent: data.sendConnectionRequest,
            launchedAt: Date.now(),
            arguments: agentArguments,
          },
        });
      }

      console.log(`PhantomBuster agent launched. Container ID: ${containerId}, Session ID: ${sessionId}`);

      // Start monitoring the execution
      this.monitorAgentExecution(containerId, sessionId);

      return {
        success: true,
        containerId,
        sessionId,
        agentId,
        status: 'launched',
      };
    } catch (error) {
      console.error('PhantomBuster LinkedIn message failed:', error);

      // Log the failed attempt
      if (this.logger) {
        await this.logger.logLinkedIn({
          contactId: data.contactId,
          direction: "outbound",
          status: "failed",
          message: data.message,
          linkedinUrl: data.profileUrl,
          campaignId: data.campaignId,
          metadata: {
            phantomBusterMethod: data.sendConnectionRequest ? "connection" : "message",
            error: error.message,
            failedAt: Date.now(),
          },
        });
      }

      throw error;
    }
  }

  /**
   * Launch a batch LinkedIn outreach campaign
   */
  async launchLinkedInCampaign(contacts: PhantomBusterLinkedInData[]): Promise<any[]> {
    const results = [];

    for (const contact of contacts) {
      try {
        const result = await this.sendLinkedInMessage(contact);
        results.push({ ...result, contactId: contact.contactId, success: true });
        
        // Add delay between requests to avoid rate limiting
        await this.delay(2000); // 2 second delay
      } catch (error) {
        console.error(`Failed to send LinkedIn message to ${contact.profileUrl}:`, error);
        results.push({ 
          contactId: contact.contactId, 
          success: false, 
          error: error.message 
        });
      }
    }

    return results;
  }

  /**
   * Get agent status and results
   */
  async getAgentStatus(sessionId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/agents/output`, {
      method: 'GET',
      headers: {
        'X-Phantombuster-Key': this.apiKey,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`PhantomBuster API error: ${result.message || 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Get available agents
   */
  async getAgents(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/agents/fetch-all`, {
      method: 'GET',
      headers: {
        'X-Phantombuster-Key': this.apiKey,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`PhantomBuster API error: ${result.message || 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Launch a LinkedIn profile scraping agent
   */
  async scrapeLinkedInProfile(profileUrl: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/agents/launch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Phantombuster-Key': this.apiKey,
      },
      body: JSON.stringify({
        id: process.env.PHANTOMBUSTER_SCRAPER_AGENT_ID, // Different agent for scraping
        argument: {
          profileUrl: profileUrl,
        },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`PhantomBuster API error: ${result.message || 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Launch LinkedIn connection request campaign
   */
  async sendConnectionRequests(profiles: Array<{
    profileUrl: string;
    note?: string;
    contactId?: Id<"contacts">;
    campaignId?: Id<"campaigns">;
  }>): Promise<any[]> {
    const results = [];

    for (const profile of profiles) {
      try {
        const response = await fetch(`${this.baseUrl}/agents/launch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Phantombuster-Key': this.apiKey,
          },
          body: JSON.stringify({
            id: process.env.PHANTOMBUSTER_CONNECTION_AGENT_ID,
            argument: {
              profileUrl: profile.profileUrl,
              note: profile.note || "",
            },
          }),
        });

        const result = await response.json();

        if (response.ok && this.logger && profile.contactId) {
          await this.logger.logLinkedInMessage({
            contactId: profile.contactId,
            campaignId: profile.campaignId,
            content: `Connection request sent${profile.note ? `: ${profile.note}` : ''}`,
            linkedinProfileUrl: profile.profileUrl,
            phantomBusterSessionId: result.data.sessionId,
            connectionRequestSent: true,
            metadata: {
              agentId: result.data.agentId,
              note: profile.note,
            },
          });
        }

        results.push({ 
          ...result, 
          contactId: profile.contactId, 
          success: response.ok 
        });

        // Delay between requests
        await this.delay(3000); // 3 second delay for connection requests
      } catch (error) {
        console.error(`Failed to send connection request to ${profile.profileUrl}:`, error);
        results.push({ 
          contactId: profile.contactId, 
          success: false, 
          error: error.message 
        });
      }
    }

    return results;
  }

  /**
   * Process webhook data from PhantomBuster
   */
  async processWebhook(webhookData: PhantomBusterWebhookData): Promise<void> {
    console.log("Processing PhantomBuster webhook:", webhookData);

    // Find the communication record by session ID
    // This would typically be done in a server-side function
    // The actual implementation would involve:
    // 1. Finding the communication by phantomBusterSessionId in metadata
    // 2. Updating the status based on the webhook data
    // 3. Adding result metadata
  }

  /**
   * Get LinkedIn profile data from PhantomBuster results
   */
  async getLinkedInProfileData(sessionId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/agents/fetch-output?id=${sessionId}`, {
      method: 'GET',
      headers: {
        'X-Phantombuster-Key': this.apiKey,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`PhantomBuster API error: ${result.message || 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Stop a running agent session
   */
  async stopAgent(sessionId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/agents/abort`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Phantombuster-Key': this.apiKey,
      },
      body: JSON.stringify({
        id: sessionId,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`PhantomBuster API error: ${result.message || 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Get account usage statistics
   */
  async getUsageStats(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/agents/fetch-all`, {
      method: 'GET',
      headers: {
        'X-Phantombuster-Key': this.apiKey,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`PhantomBuster API error: ${result.message || 'Unknown error'}`);
    }

    // Calculate usage from agent data
    let totalExecutions = 0;
    let monthlyExecutions = 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    if (result.data) {
      for (const agent of result.data) {
        totalExecutions += agent.nbLaunched || 0;
        
        // This is a simplified calculation - you'd need more detailed data for accurate monthly stats
        if (agent.lastLaunch && new Date(agent.lastLaunch) >= startOfMonth) {
          monthlyExecutions += 1;
        }
      }
    }

    return {
      totalExecutions,
      monthlyExecutions,
      agents: result.data?.length || 0,
    };
  }

  /**
   * Get the appropriate LinkedIn messaging agent ID
   */
  private getLinkedInMessagingAgentId(): string {
    return process.env.PHANTOMBUSTER_LINKEDIN_MESSAGE_AGENT_ID || 
           process.env.PHANTOMBUSTER_LINKEDIN_AGENT_ID || 
           'default-linkedin-message-agent';
  }

  /**
   * Get the appropriate LinkedIn connection agent ID
   */
  private getLinkedInConnectionAgentId(): string {
    return process.env.PHANTOMBUSTER_LINKEDIN_CONNECTION_AGENT_ID || 
           process.env.PHANTOMBUSTER_CONNECTION_AGENT_ID ||
           'default-linkedin-connection-agent';
  }

  /**
   * Monitor PhantomBuster agent execution and update communication status
   */
  private async monitorAgentExecution(containerId: string, sessionId?: string): Promise<void> {
    if (!sessionId) return;

    try {
      // Poll the agent status every 30 seconds
      const pollInterval = 30000; // 30 seconds
      const maxPolls = 20; // Max 10 minutes of polling
      let polls = 0;

      const checkStatus = async () => {
        try {
          const response = await fetch(`${this.baseUrl}/agents/fetch-output`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Phantombuster-Key': this.apiKey,
            },
            body: JSON.stringify({
              id: containerId,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            
            if (result.status === 'finished' || result.status === 'error') {
              // Agent execution completed - update the communication status
              console.log(`PhantomBuster agent ${containerId} completed with status: ${result.status}`);
              
              // This would need to be done via a server-side function in production
              // For now, we'll just log it
              console.log(`Would update session ${sessionId} with result:`, result);
              return; // Stop polling
            }
          }

          polls++;
          if (polls < maxPolls) {
            setTimeout(checkStatus, pollInterval);
          } else {
            console.log(`Stopped polling PhantomBuster agent ${containerId} after ${maxPolls} attempts`);
          }
        } catch (error) {
          console.error(`Error checking PhantomBuster agent status:`, error);
        }
      };

      // Start polling after initial delay
      setTimeout(checkStatus, pollInterval);
    } catch (error) {
      console.error('Error setting up PhantomBuster monitoring:', error);
    }
  }

  /**
   * Get container status directly
   */
  async getContainerStatus(containerId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/agents/fetch-output`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Phantombuster-Key': this.apiKey,
        },
        body: JSON.stringify({
          id: containerId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PhantomBuster API error: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching container status:', error);
      throw error;
    }
  }

  /**
   * Utility function to add delay between requests
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}