import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export interface EmailLogParams {
  contactId?: Id<"contacts">;
  companyId?: Id<"companies">;
  campaignId?: Id<"campaigns">;
  direction: "inbound" | "outbound";
  subject?: string;
  content: string;
  fromEmail?: string;
  toEmail?: string;
  ccEmails?: string[];
  bccEmails?: string[];
  messageId?: string;
  threadId?: string;
  provider: "instantly" | "gmail" | "outlook" | "manual";
  metadata?: any;
}

export interface LinkedInLogParams {
  contactId?: Id<"contacts">;
  campaignId?: Id<"campaigns">;
  content: string;
  linkedinProfileUrl?: string;
  phantomBusterSessionId?: string;
  connectionRequestSent?: boolean;
  metadata?: any;
}

export interface PhoneLogParams {
  contactId?: Id<"contacts">;
  direction: "inbound" | "outbound";
  phoneNumber: string;
  duration?: number;
  status: "answered" | "voicemail" | "missed" | "failed";
  aircallCallId?: string;
  recordingUrl?: string;
  metadata?: any;
}

export interface MeetingLogParams {
  contactId?: Id<"contacts">;
  companyId?: Id<"companies">;
  subject: string;
  content: string;
  meetingUrl?: string;
  meetingPlatform?: string;
  duration?: number;
  metadata?: any;
}

export interface NoteLogParams {
  contactId?: Id<"contacts">;
  companyId?: Id<"companies">;
  campaignId?: Id<"campaigns">;
  content: string;
  metadata?: any;
}

/**
 * Unified communication logger for all types of communications
 * Automatically logs to the communications table with proper attribution
 */
export class CommunicationLogger {
  private logCommunication: any;
  
  constructor(private clientId: Id<"clients">, private userId?: string) {
    // Note: This will be used in React components where useMutation is available
    // For server-side usage, we'll need a different approach
  }

  /**
   * Initialize the logger with Convex mutation (for React components)
   */
  static useLogger(clientId: Id<"clients">, userId?: string) {
    const logCommunication = useMutation(api.communications.logCommunication);
    return new CommunicationLogger(clientId, userId).withMutation(logCommunication);
  }

  private withMutation(mutation: any) {
    this.logCommunication = mutation;
    return this;
  }

  async logEmail(params: EmailLogParams) {
    if (!this.logCommunication) {
      throw new Error("Logger not properly initialized. Use CommunicationLogger.useLogger() in React components.");
    }

    return await this.logCommunication({
      clientId: this.clientId,
      contactId: params.contactId,
      companyId: params.companyId,
      campaignId: params.campaignId,
      type: "email",
      direction: params.direction,
      status: "sent",
      subject: params.subject,
      content: params.content,
      provider: params.provider,
      fromEmail: params.fromEmail,
      toEmail: params.toEmail,
      ccEmails: params.ccEmails,
      bccEmails: params.bccEmails,
      metadata: {
        messageId: params.messageId,
        threadId: params.threadId,
        ...params.metadata,
      },
      userId: this.userId,
    });
  }

  async logLinkedInMessage(params: LinkedInLogParams) {
    if (!this.logCommunication) {
      throw new Error("Logger not properly initialized. Use CommunicationLogger.useLogger() in React components.");
    }

    return await this.logCommunication({
      clientId: this.clientId,
      contactId: params.contactId,
      campaignId: params.campaignId,
      type: "linkedin",
      direction: "outbound",
      status: "sent",
      content: params.content,
      provider: "phantombuster",
      metadata: {
        linkedinProfileUrl: params.linkedinProfileUrl,
        phantomBusterSessionId: params.phantomBusterSessionId,
        connectionRequestSent: params.connectionRequestSent,
        ...params.metadata,
      },
      userId: this.userId,
    });
  }

  async logPhoneCall(params: PhoneLogParams) {
    if (!this.logCommunication) {
      throw new Error("Logger not properly initialized. Use CommunicationLogger.useLogger() in React components.");
    }

    return await this.logCommunication({
      clientId: this.clientId,
      contactId: params.contactId,
      type: "phone",
      direction: params.direction,
      status: params.status,
      content: `Phone call ${params.status}${params.duration ? ` - Duration: ${params.duration}s` : ''}`,
      provider: "aircall",
      metadata: {
        phoneNumber: params.phoneNumber,
        duration: params.duration,
        aircallCallId: params.aircallCallId,
        recordingUrl: params.recordingUrl,
        ...params.metadata,
      },
      userId: this.userId,
    });
  }

  async logMeeting(params: MeetingLogParams) {
    if (!this.logCommunication) {
      throw new Error("Logger not properly initialized. Use CommunicationLogger.useLogger() in React components.");
    }

    return await this.logCommunication({
      clientId: this.clientId,
      contactId: params.contactId,
      companyId: params.companyId,
      type: "meeting",
      direction: "outbound", // Meetings are typically initiated by us
      status: "sent", // Could be "completed" after the meeting
      subject: params.subject,
      content: params.content,
      provider: "manual",
      metadata: {
        meetingUrl: params.meetingUrl,
        meetingPlatform: params.meetingPlatform,
        duration: params.duration,
        ...params.metadata,
      },
      userId: this.userId,
    });
  }

  async logNote(params: NoteLogParams) {
    if (!this.logCommunication) {
      throw new Error("Logger not properly initialized. Use CommunicationLogger.useLogger() in React components.");
    }

    return await this.logCommunication({
      clientId: this.clientId,
      contactId: params.contactId,
      companyId: params.companyId,
      campaignId: params.campaignId,
      type: "note",
      direction: "outbound",
      status: "sent",
      content: params.content,
      provider: "manual",
      metadata: params.metadata,
      userId: this.userId,
    });
  }

  /**
   * Update the status of an existing communication
   */
  async updateCommunicationStatus(
    communicationId: Id<"communications">, 
    status: string, 
    metadata?: any
  ) {
    // This would need to be implemented with a separate mutation
    // For now, we'll leave this as a placeholder
    console.log("updateCommunicationStatus not implemented yet", { communicationId, status, metadata });
  }
}

/**
 * Server-side communication logger for use in Convex functions
 */
export class ServerCommunicationLogger {
  constructor(private ctx: any, private clientId: Id<"clients">, private userId?: string) {}

  async logEmail(params: EmailLogParams) {
    return await this.ctx.runMutation("communications:logCommunication", {
      clientId: this.clientId,
      contactId: params.contactId,
      companyId: params.companyId,
      campaignId: params.campaignId,
      type: "email",
      direction: params.direction,
      status: "sent",
      subject: params.subject,
      content: params.content,
      provider: params.provider,
      fromEmail: params.fromEmail,
      toEmail: params.toEmail,
      ccEmails: params.ccEmails,
      bccEmails: params.bccEmails,
      metadata: {
        messageId: params.messageId,
        threadId: params.threadId,
        ...params.metadata,
      },
      userId: this.userId,
    });
  }

  async logLinkedInMessage(params: LinkedInLogParams) {
    return await this.ctx.runMutation("communications:logCommunication", {
      clientId: this.clientId,
      contactId: params.contactId,
      campaignId: params.campaignId,
      type: "linkedin",
      direction: "outbound",
      status: "sent",
      content: params.content,
      provider: "phantombuster",
      metadata: {
        linkedinProfileUrl: params.linkedinProfileUrl,
        phantomBusterSessionId: params.phantomBusterSessionId,
        connectionRequestSent: params.connectionRequestSent,
        ...params.metadata,
      },
      userId: this.userId,
    });
  }

  async logPhoneCall(params: PhoneLogParams) {
    return await this.ctx.runMutation("communications:logCommunication", {
      clientId: this.clientId,
      contactId: params.contactId,
      type: "phone",
      direction: params.direction,
      status: params.status,
      content: `Phone call ${params.status}${params.duration ? ` - Duration: ${params.duration}s` : ''}`,
      provider: "aircall",
      metadata: {
        phoneNumber: params.phoneNumber,
        duration: params.duration,
        aircallCallId: params.aircallCallId,
        recordingUrl: params.recordingUrl,
        ...params.metadata,
      },
      userId: this.userId,
    });
  }
}