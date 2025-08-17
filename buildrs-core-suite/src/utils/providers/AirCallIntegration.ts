import { Id } from "../../../convex/_generated/dataModel";
import { CommunicationLogger } from "./CommunicationLogger";

export interface AirCallCallData {
  id: string;
  direction: "inbound" | "outbound";
  status: "initial" | "answered" | "hangup" | "voicemail" | "missed";
  started_at: string;
  answered_at?: string;
  ended_at?: string;
  duration?: number;
  recording?: {
    id: string;
    url: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
  contact?: {
    id: string;
    phone_number: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    email?: string;
  };
  number?: {
    id: string;
    name: string;
    country: string;
    digits: string;
  };
  tags?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export interface AirCallWebhookData {
  webhook_id: string;
  call: AirCallCallData;
  event: "call.created" | "call.answered" | "call.ended" | "call.archived" | "call.unarchived";
  timestamp: number;
}

/**
 * Integration with AirCall for phone call tracking and management
 */
export class AirCallIntegration {
  private baseUrl = "https://api.aircall.io/v1";
  private logger: CommunicationLogger;

  constructor(
    private apiId: string,
    private apiToken: string,
    private clientId: Id<"clients">,
    private userId?: string
  ) {
    this.logger = new CommunicationLogger(clientId, userId);
  }

  /**
   * Initialize with communication logger (for React components)
   */
  static useIntegration(
    apiId: string, 
    apiToken: string, 
    clientId: Id<"clients">, 
    userId?: string
  ) {
    const integration = new AirCallIntegration(apiId, apiToken, clientId, userId);
    integration.logger = CommunicationLogger.useLogger(clientId, userId);
    return integration;
  }

  /**
   * Get authorization header for AirCall API
   */
  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.apiId}:${this.apiToken}`).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * Get call details from AirCall
   */
  async getCall(callId: string): Promise<AirCallCallData> {
    const response = await fetch(`${this.baseUrl}/calls/${callId}`, {
      method: 'GET',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`AirCall API error: ${result.message || 'Unknown error'}`);
    }

    return result.call;
  }

  /**
   * Get list of calls with filtering options
   */
  async getCalls(options?: {
    direction?: "inbound" | "outbound";
    status?: string;
    from?: string; // ISO date
    to?: string; // ISO date
    per_page?: number;
    page?: number;
  }): Promise<{ calls: AirCallCallData[]; meta: any }> {
    const url = new URL(`${this.baseUrl}/calls`);
    
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`AirCall API error: ${result.message || 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Make an outbound call
   */
  async makeCall(phoneNumber: string, contactId?: Id<"contacts">): Promise<AirCallCallData> {
    const response = await fetch(`${this.baseUrl}/calls`, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phoneNumber,
        from: process.env.AIRCALL_NUMBER_ID, // Set in environment
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`AirCall API error: ${result.message || 'Unknown error'}`);
    }

    // Log the outbound call
    if (this.logger && contactId) {
      await this.logger.logPhoneCall({
        contactId,
        direction: "outbound",
        phoneNumber,
        status: "sent", // Initial status, will be updated via webhook
        aircallCallId: result.call.id,
        metadata: {
          aircallUserId: this.userId,
          callInitiated: true,
        },
      });
    }

    return result.call;
  }

  /**
   * Add comment/note to a call
   */
  async addCallComment(callId: string, content: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/calls/${callId}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: content,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`AirCall API error: ${result.message || 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Add tags to a call
   */
  async tagCall(callId: string, tagIds: string[]): Promise<any> {
    const response = await fetch(`${this.baseUrl}/calls/${callId}/tags`, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tag_ids: tagIds,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`AirCall API error: ${result.message || 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Get call recording URL
   */
  async getCallRecording(callId: string): Promise<string | null> {
    try {
      const call = await this.getCall(callId);
      return call.recording?.url || null;
    } catch (error) {
      console.error(`Failed to get recording for call ${callId}:`, error);
      return null;
    }
  }

  /**
   * Process webhook data from AirCall
   */
  async processWebhook(webhookData: AirCallWebhookData): Promise<void> {
    const { call, event } = webhookData;
    
    // Find contact by phone number
    const phoneNumber = call.contact?.phone_number || call.number?.digits;
    if (!phoneNumber) {
      console.log("No phone number found in webhook data");
      return;
    }

    // This would typically be done in a server-side function
    // For now, we'll just log the processing
    console.log("Processing AirCall webhook:", { event, callId: call.id, phoneNumber });

    // The actual implementation would involve:
    // 1. Finding contact by phone number
    // 2. Logging or updating the communication record
    // 3. Handling different event types (created, answered, ended, etc.)
  }

  /**
   * Server-side webhook processing (for use in Convex functions)
   */
  static async processWebhookServer(
    ctx: any, 
    webhookData: AirCallWebhookData, 
    clientId: Id<"clients">
  ): Promise<void> {
    const { call, event } = webhookData;
    
    // Find contact by phone number
    const phoneNumber = call.contact?.phone_number || call.number?.digits;
    if (!phoneNumber) return;

    // Find contact in database
    const contact = await ctx.runQuery("contacts:findByPhone", {
      phoneNumber,
      clientId,
    });

    if (!contact) {
      console.log(`No contact found for phone number: ${phoneNumber}`);
      return;
    }

    // Map AirCall status to our communication status
    let status = "sent";
    switch (call.status) {
      case "answered":
        status = "answered";
        break;
      case "hangup":
        status = call.direction === "inbound" ? "answered" : "missed";
        break;
      case "voicemail":
        status = "voicemail";
        break;
      case "missed":
        status = "missed";
        break;
    }

    // Calculate duration if available
    let duration = call.duration;
    if (!duration && call.started_at && call.ended_at) {
      const startTime = new Date(call.started_at).getTime();
      const endTime = new Date(call.ended_at).getTime();
      duration = Math.floor((endTime - startTime) / 1000);
    }

    // Check if communication already exists
    const existingComm = await ctx.runQuery("communications:findByAircallId", {
      aircallCallId: call.id,
    });

    if (existingComm) {
      // Update existing communication
      await ctx.runMutation("communications:updateCommunicationStatus", {
        communicationId: existingComm._id,
        status,
        metadata: {
          ...existingComm.metadata,
          duration,
          recordingUrl: call.recording?.url,
          answeredAt: call.answered_at ? new Date(call.answered_at).getTime() : undefined,
          endedAt: call.ended_at ? new Date(call.ended_at).getTime() : undefined,
          tags: call.tags,
          aircallUser: call.user,
        },
      });
    } else {
      // Create new communication record
      await ctx.runMutation("communications:logCommunication", {
        clientId,
        contactId: contact._id,
        type: "phone",
        direction: call.direction,
        status,
        content: `Phone call ${status}${duration ? ` - Duration: ${duration}s` : ''}`,
        provider: "aircall",
        timestamp: new Date(call.started_at).getTime(),
        metadata: {
          aircallCallId: call.id,
          phoneNumber,
          duration,
          recordingUrl: call.recording?.url,
          startedAt: call.started_at,
          answeredAt: call.answered_at,
          endedAt: call.ended_at,
          tags: call.tags,
          aircallUser: call.user,
          aircallContact: call.contact,
        },
      });
    }
  }

  /**
   * Get available phone numbers
   */
  async getNumbers(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/numbers`, {
      method: 'GET',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`AirCall API error: ${result.message || 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Get users in the AirCall account
   */
  async getUsers(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/users`, {
      method: 'GET',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`AirCall API error: ${result.message || 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Get call statistics
   */
  async getCallStats(options?: {
    from?: string; // ISO date
    to?: string; // ISO date
    user_id?: string;
  }): Promise<any> {
    const url = new URL(`${this.baseUrl}/calls/insights`);
    
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, value);
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`AirCall API error: ${result.message || 'Unknown error'}`);
    }

    return result;
  }
}