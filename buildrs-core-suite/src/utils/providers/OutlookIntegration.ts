import { Id } from "../../../convex/_generated/dataModel";

export interface OutlookMessage {
  id: string;
  conversationId: string;
  subject: string;
  body: {
    contentType: "text" | "html";
    content: string;
  };
  from: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  toRecipients: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  ccRecipients?: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  bccRecipients?: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  receivedDateTime: string;
  sentDateTime: string;
  hasAttachments: boolean;
  attachments?: Array<{
    id: string;
    name: string;
    contentType: string;
    size: number;
  }>;
  internetMessageHeaders?: Array<{
    name: string;
    value: string;
  }>;
  isRead: boolean;
  isDraft: boolean;
  flag: {
    flagStatus: string;
  };
}

export interface ParsedOutlookEmail {
  id: string;
  conversationId: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHtml: boolean;
  date: Date;
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
  }>;
  headers: Record<string, string>;
  direction: "inbound" | "outbound";
  isRead: boolean;
}

/**
 * Microsoft Outlook/Graph API integration for email monitoring
 */
export class OutlookIntegration {
  private baseUrl = "https://graph.microsoft.com/v1.0";

  constructor(private accessToken: string) {}

  /**
   * Get user's Outlook profile information
   */
  async getProfile(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/me`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Outlook API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get messages since a specific timestamp
   */
  async getMessagesSince(timestamp: number, maxResults: number = 100): Promise<OutlookMessage[]> {
    const date = new Date(timestamp).toISOString();
    const filter = `receivedDateTime ge ${date}`;
    
    const response = await fetch(
      `${this.baseUrl}/me/messages?$filter=${encodeURIComponent(filter)}&$top=${maxResults}&$orderby=receivedDateTime desc`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Outlook API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value || [];
  }

  /**
   * Get a specific message by ID
   */
  async getMessage(messageId: string): Promise<OutlookMessage> {
    const response = await fetch(`${this.baseUrl}/me/messages/${messageId}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Outlook API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get messages from a specific folder
   */
  async getMessagesFromFolder(folderId: string, maxResults: number = 100): Promise<OutlookMessage[]> {
    const response = await fetch(
      `${this.baseUrl}/me/mailFolders/${folderId}/messages?$top=${maxResults}&$orderby=receivedDateTime desc`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Outlook API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value || [];
  }

  /**
   * Parse Outlook message into our standardized format
   */
  parseMessage(message: OutlookMessage, userEmail: string): ParsedOutlookEmail {
    const headers: Record<string, string> = {};
    
    if (message.internetMessageHeaders) {
      message.internetMessageHeaders.forEach(header => {
        headers[header.name.toLowerCase()] = header.value;
      });
    }

    const from = message.from.emailAddress.address;
    const to = message.toRecipients.map(r => r.emailAddress.address);
    const cc = message.ccRecipients?.map(r => r.emailAddress.address) || [];
    const bcc = message.bccRecipients?.map(r => r.emailAddress.address) || [];

    // Determine direction based on sender
    const direction: "inbound" | "outbound" = from === userEmail ? "outbound" : "inbound";

    // Parse attachments
    const attachments = message.attachments?.map(att => ({
      filename: att.name,
      mimeType: att.contentType,
      size: att.size,
    })) || [];

    return {
      id: message.id,
      conversationId: message.conversationId,
      from,
      to,
      cc: cc.length > 0 ? cc : undefined,
      bcc: bcc.length > 0 ? bcc : undefined,
      subject: message.subject,
      body: message.body.content,
      isHtml: message.body.contentType === 'html',
      date: new Date(message.receivedDateTime || message.sentDateTime),
      attachments,
      headers,
      direction,
      isRead: message.isRead,
    };
  }

  /**
   * Send an email through Outlook API
   */
  async sendEmail(options: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    isHtml?: boolean;
    replyToMessageId?: string;
  }): Promise<any> {
    const emailData = {
      message: {
        subject: options.subject,
        body: {
          contentType: options.isHtml ? 'html' : 'text',
          content: options.body,
        },
        toRecipients: options.to.map(email => ({
          emailAddress: { address: email },
        })),
        ccRecipients: options.cc?.map(email => ({
          emailAddress: { address: email },
        })),
        bccRecipients: options.bcc?.map(email => ({
          emailAddress: { address: email },
        })),
      },
    };

    let endpoint = `${this.baseUrl}/me/sendMail`;
    
    // If replying to a message, use the reply endpoint
    if (options.replyToMessageId) {
      endpoint = `${this.baseUrl}/me/messages/${options.replyToMessageId}/reply`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      throw new Error(`Outlook API error: ${response.statusText}`);
    }

    return response.status === 202 ? { success: true } : await response.json();
  }

  /**
   * Create a draft email
   */
  async createDraft(options: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    isHtml?: boolean;
  }): Promise<OutlookMessage> {
    const draftData = {
      subject: options.subject,
      body: {
        contentType: options.isHtml ? 'html' : 'text',
        content: options.body,
      },
      toRecipients: options.to.map(email => ({
        emailAddress: { address: email },
      })),
      ccRecipients: options.cc?.map(email => ({
        emailAddress: { address: email },
      })),
      bccRecipients: options.bcc?.map(email => ({
        emailAddress: { address: email },
      })),
    };

    const response = await fetch(`${this.baseUrl}/me/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(draftData),
    });

    if (!response.ok) {
      throw new Error(`Outlook API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Search for messages with a specific query
   */
  async searchMessages(query: string, maxResults: number = 50): Promise<OutlookMessage[]> {
    const response = await fetch(
      `${this.baseUrl}/me/messages?$search="${encodeURIComponent(query)}"&$top=${maxResults}&$orderby=receivedDateTime desc`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Outlook API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value || [];
  }

  /**
   * Get all mail folders
   */
  async getMailFolders(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/me/mailFolders`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Outlook API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value || [];
  }

  /**
   * Mark message as read/unread
   */
  async markAsRead(messageId: string, isRead: boolean = true): Promise<void> {
    const response = await fetch(`${this.baseUrl}/me/messages/${messageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isRead,
      }),
    });

    if (!response.ok) {
      throw new Error(`Outlook API error: ${response.statusText}`);
    }
  }

  /**
   * Move message to folder
   */
  async moveMessage(messageId: string, destinationFolderId: string): Promise<OutlookMessage> {
    const response = await fetch(`${this.baseUrl}/me/messages/${messageId}/move`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destinationId: destinationFolderId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Outlook API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/me/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Outlook API error: ${response.statusText}`);
    }
  }

  /**
   * Set up webhook subscription for real-time notifications
   */
  async createSubscription(notificationUrl: string, changeTypes: string[] = ['created', 'updated']): Promise<any> {
    const subscriptionData = {
      changeType: changeTypes.join(','),
      notificationUrl,
      resource: '/me/messages',
      expirationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
    };

    const response = await fetch(`${this.baseUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData),
    });

    if (!response.ok) {
      throw new Error(`Outlook API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update webhook subscription
   */
  async updateSubscription(subscriptionId: string, expirationDateTime: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expirationDateTime,
      }),
    });

    if (!response.ok) {
      throw new Error(`Outlook API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete webhook subscription
   */
  async deleteSubscription(subscriptionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Outlook API error: ${response.statusText}`);
    }
  }

  /**
   * Get message attachments
   */
  async getAttachments(messageId: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/me/messages/${messageId}/attachments`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Outlook API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value || [];
  }

  /**
   * Get delta changes (for incremental sync)
   */
  async getDeltaChanges(deltaLink?: string): Promise<{
    messages: OutlookMessage[];
    deltaLink: string;
  }> {
    const url = deltaLink || `${this.baseUrl}/me/messages/delta?$top=100`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Outlook API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      messages: data.value || [],
      deltaLink: data['@odata.deltaLink'] || data['@odata.nextLink'],
    };
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(
    refreshToken: string, 
    clientId: string, 
    clientSecret: string,
    tenantId: string = 'common'
  ): Promise<{
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  }> {
    const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send',
      }),
    });

    if (!response.ok) {
      throw new Error(`OAuth error: ${response.statusText}`);
    }

    return await response.json();
  }
}