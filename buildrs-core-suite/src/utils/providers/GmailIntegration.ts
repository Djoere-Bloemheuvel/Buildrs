import { Id } from "../../../convex/_generated/dataModel";

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{
      mimeType: string;
      body: { data?: string };
      headers: Array<{ name: string; value: string }>;
    }>;
  };
  sizeEstimate: number;
}

export interface ParsedEmail {
  id: string;
  threadId: string;
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
  labels: string[];
}

/**
 * Gmail API integration for email monitoring and synchronization
 */
export class GmailIntegration {
  private baseUrl = "https://gmail.googleapis.com/gmail/v1";

  constructor(private accessToken: string) {}

  /**
   * Get user's Gmail profile information
   */
  async getProfile(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/users/me/profile`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get messages since a specific timestamp
   */
  async getMessagesSince(timestamp: number, maxResults: number = 100): Promise<GmailMessage[]> {
    const query = `after:${Math.floor(timestamp / 1000)}`;
    
    const response = await fetch(
      `${this.baseUrl}/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.statusText}`);
    }

    const data = await response.json();
    const messages: GmailMessage[] = [];

    // Get full message details for each message
    if (data.messages) {
      for (const messageRef of data.messages) {
        try {
          const message = await this.getMessage(messageRef.id);
          messages.push(message);
          
          // Add small delay to avoid rate limiting
          await this.delay(100);
        } catch (error) {
          console.error(`Failed to fetch message ${messageRef.id}:`, error);
        }
      }
    }

    return messages;
  }

  /**
   * Get a specific message by ID
   */
  async getMessage(messageId: string): Promise<GmailMessage> {
    const response = await fetch(`${this.baseUrl}/users/me/messages/${messageId}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Parse Gmail message into our standardized format
   */
  parseMessage(message: GmailMessage, userEmail: string): ParsedEmail {
    const headers: Record<string, string> = {};
    message.payload.headers.forEach(header => {
      headers[header.name.toLowerCase()] = header.value;
    });

    const from = headers['from'] || '';
    const to = this.parseEmailAddresses(headers['to'] || '');
    const cc = this.parseEmailAddresses(headers['cc'] || '');
    const bcc = this.parseEmailAddresses(headers['bcc'] || '');
    const subject = headers['subject'] || '';
    const date = new Date(parseInt(message.internalDate));

    // Determine direction based on sender
    const fromEmail = this.extractEmailFromAddress(from);
    const direction: "inbound" | "outbound" = fromEmail === userEmail ? "outbound" : "inbound";

    // Extract email body
    const { body, isHtml } = this.extractBody(message.payload);

    // Extract attachments
    const attachments = this.extractAttachments(message.payload);

    return {
      id: message.id,
      threadId: message.threadId,
      from: fromEmail,
      to,
      cc: cc.length > 0 ? cc : undefined,
      bcc: bcc.length > 0 ? bcc : undefined,
      subject,
      body,
      isHtml,
      date,
      attachments,
      headers,
      direction,
      labels: message.labelIds || [],
    };
  }

  /**
   * Extract email body from Gmail message payload
   */
  private extractBody(payload: any): { body: string; isHtml: boolean } {
    let body = '';
    let isHtml = false;

    // Check if the message has a direct body
    if (payload.body && payload.body.data) {
      body = this.decodeBase64Url(payload.body.data);
      isHtml = payload.mimeType === 'text/html';
    }
    // Check parts for multipart messages
    else if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && !isHtml) {
          body = this.decodeBase64Url(part.body.data || '');
        } else if (part.mimeType === 'text/html') {
          body = this.decodeBase64Url(part.body.data || '');
          isHtml = true;
        }
        // Handle nested parts
        else if (part.parts) {
          const nestedResult = this.extractBody(part);
          if (nestedResult.body && (nestedResult.isHtml || !isHtml)) {
            body = nestedResult.body;
            isHtml = nestedResult.isHtml;
          }
        }
      }
    }

    return { body: body || '', isHtml };
  }

  /**
   * Extract attachments from Gmail message payload
   */
  private extractAttachments(payload: any): Array<{ filename: string; mimeType: string; size: number }> {
    const attachments: Array<{ filename: string; mimeType: string; size: number }> = [];

    const extractFromParts = (parts: any[]) => {
      for (const part of parts) {
        if (part.filename && part.filename.length > 0) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size || 0,
          });
        }
        if (part.parts) {
          extractFromParts(part.parts);
        }
      }
    };

    if (payload.parts) {
      extractFromParts(payload.parts);
    }

    return attachments;
  }

  /**
   * Parse email addresses from a header value
   */
  private parseEmailAddresses(addressString: string): string[] {
    if (!addressString) return [];
    
    // Simple regex to extract email addresses
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const matches = addressString.match(emailRegex);
    
    return matches || [];
  }

  /**
   * Extract just the email address from a "Name <email>" format
   */
  private extractEmailFromAddress(address: string): string {
    const emailMatch = address.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return emailMatch ? emailMatch[1] : address;
  }

  /**
   * Decode base64url encoded data
   */
  private decodeBase64Url(data: string): string {
    try {
      // Convert base64url to base64
      const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
      // Add padding if needed
      const padded = base64 + '=='.substring(0, (4 - base64.length % 4) % 4);
      // Decode
      return atob(padded);
    } catch (error) {
      console.error('Failed to decode base64url data:', error);
      return '';
    }
  }

  /**
   * Set up Gmail push notifications for real-time email monitoring
   */
  async setupPushNotifications(topicName: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/users/me/watch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topicName: topicName,
        labelIds: ['INBOX'], // Monitor inbox only
        labelFilterAction: 'include',
      }),
    });

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Stop Gmail push notifications
   */
  async stopPushNotifications(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/users/me/stop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.statusText}`);
    }
  }

  /**
   * Get history since a specific history ID (for incremental sync)
   */
  async getHistory(startHistoryId: string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/users/me/history?startHistoryId=${startHistoryId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Search for messages with a specific query
   */
  async searchMessages(query: string, maxResults: number = 50): Promise<GmailMessage[]> {
    const response = await fetch(
      `${this.baseUrl}/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.statusText}`);
    }

    const data = await response.json();
    const messages: GmailMessage[] = [];

    if (data.messages) {
      for (const messageRef of data.messages) {
        try {
          const message = await this.getMessage(messageRef.id);
          messages.push(message);
          await this.delay(100);
        } catch (error) {
          console.error(`Failed to fetch message ${messageRef.id}:`, error);
        }
      }
    }

    return messages;
  }

  /**
   * Send an email through Gmail API
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
    const email = this.createEmailMessage(options);
    
    const response = await fetch(`${this.baseUrl}/users/me/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: this.encodeBase64Url(email),
      }),
    });

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create email message in RFC 2822 format
   */
  private createEmailMessage(options: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    isHtml?: boolean;
    replyToMessageId?: string;
  }): string {
    const lines: string[] = [];
    
    lines.push(`To: ${options.to.join(', ')}`);
    if (options.cc?.length) lines.push(`Cc: ${options.cc.join(', ')}`);
    if (options.bcc?.length) lines.push(`Bcc: ${options.bcc.join(', ')}`);
    lines.push(`Subject: ${options.subject}`);
    
    if (options.replyToMessageId) {
      lines.push(`In-Reply-To: ${options.replyToMessageId}`);
    }
    
    lines.push(`Content-Type: ${options.isHtml ? 'text/html' : 'text/plain'}; charset=utf-8`);
    lines.push('');
    lines.push(options.body);
    
    return lines.join('\r\n');
  }

  /**
   * Encode string to base64url
   */
  private encodeBase64Url(data: string): string {
    const base64 = btoa(unescape(encodeURIComponent(data)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Add delay for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`OAuth error: ${response.statusText}`);
    }

    return await response.json();
  }
}