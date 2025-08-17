// Communication System Provider Integrations
export { CommunicationLogger, ServerCommunicationLogger } from './CommunicationLogger';
export type { 
  EmailLogParams, 
  LinkedInLogParams, 
  PhoneLogParams, 
  MeetingLogParams, 
  NoteLogParams 
} from './CommunicationLogger';

// Instantly.ai Integration
export { InstantlyIntegration } from './InstantlyIntegration';
export type { 
  InstantlyCampaignData, 
  InstantlyWebhookData 
} from './InstantlyIntegration';

// PhantomBuster Integration
export { PhantomBusterIntegration } from './PhantomBusterIntegration';
export type { 
  PhantomBusterLinkedInData, 
  PhantomBusterWebhookData, 
  PhantomBusterAgentConfig 
} from './PhantomBusterIntegration';

// AirCall Integration
export { AirCallIntegration } from './AirCallIntegration';
export type { 
  AirCallCallData, 
  AirCallWebhookData 
} from './AirCallIntegration';

// Gmail Integration
export { GmailIntegration } from './GmailIntegration';
export type { 
  GmailMessage, 
  ParsedEmail 
} from './GmailIntegration';

// Outlook Integration
export { OutlookIntegration } from './OutlookIntegration';
export type { 
  OutlookMessage, 
  ParsedOutlookEmail 
} from './OutlookIntegration';

// Utility function to create all provider integrations at once
export function createProviderIntegrations(config: {
  clientId: string;
  userId?: string;
  instantly?: {
    apiKey: string;
  };
  phantombuster?: {
    apiKey: string;
  };
  aircall?: {
    apiId: string;
    apiToken: string;
  };
}) {
  const integrations: any = {};

  if (config.instantly) {
    integrations.instantly = InstantlyIntegration.useIntegration(
      config.instantly.apiKey,
      config.clientId as any,
      config.userId
    );
  }

  if (config.phantombuster) {
    integrations.phantombuster = PhantomBusterIntegration.useIntegration(
      config.phantombuster.apiKey,
      config.clientId as any,
      config.userId
    );
  }

  if (config.aircall) {
    integrations.aircall = AirCallIntegration.useIntegration(
      config.aircall.apiId,
      config.aircall.apiToken,
      config.clientId as any,
      config.userId
    );
  }

  integrations.logger = CommunicationLogger.useLogger(
    config.clientId as any,
    config.userId
  );

  return integrations;
}

// Type for the complete provider integration suite
export type ProviderIntegrations = {
  instantly?: InstantlyIntegration;
  phantombuster?: PhantomBusterIntegration;
  aircall?: AirCallIntegration;
  logger: CommunicationLogger;
};