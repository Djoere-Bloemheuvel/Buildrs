import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { Mail, Settings, CheckCircle, AlertCircle } from 'lucide-react';

interface EmailAccountSetupProps {
  clientId: string;
  onAccountAdded?: () => void;
}

interface OAuthConfig {
  gmail: {
    clientId: string;
    redirectUri: string;
    scopes: string[];
  };
  outlook: {
    clientId: string;
    redirectUri: string;
    scopes: string[];
  };
}

const OAUTH_CONFIG: OAuthConfig = {
  gmail: {
    clientId: process.env.VITE_GMAIL_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/oauth/gmail/callback`,
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
  },
  outlook: {
    clientId: process.env.VITE_OUTLOOK_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/oauth/outlook/callback`,
    scopes: [
      'https://graph.microsoft.com/Mail.ReadWrite',
      'https://graph.microsoft.com/Mail.Send',
      'https://graph.microsoft.com/User.Read'
    ],
  },
};

export function EmailAccountSetup({ clientId, onAccountAdded }: EmailAccountSetupProps) {
  const [selectedProvider, setSelectedProvider] = useState<'gmail' | 'outlook' | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [settings, setSettings] = useState({
    monitorInbound: true,
    monitorOutbound: true,
    autoMatchContacts: true,
    syncFrequency: 15,
    maxSyncMessages: 100,
  });

  const createEmailAccount = useMutation(api.emailAccounts.createEmailAccount);

  /**
   * Start OAuth flow for Gmail
   */
  const startGmailAuth = () => {
    if (!OAUTH_CONFIG.gmail.clientId) {
      toast.error('Gmail OAuth not configured. Please contact support.');
      return;
    }

    setIsAuthenticating(true);
    setSelectedProvider('gmail');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', OAUTH_CONFIG.gmail.clientId);
    authUrl.searchParams.append('redirect_uri', OAUTH_CONFIG.gmail.redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', OAUTH_CONFIG.gmail.scopes.join(' '));
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');
    authUrl.searchParams.append('state', JSON.stringify({ clientId, provider: 'gmail', settings }));

    // Store settings in localStorage for the callback
    localStorage.setItem('email_oauth_settings', JSON.stringify({ clientId, provider: 'gmail', settings }));

    window.location.href = authUrl.toString();
  };

  /**
   * Start OAuth flow for Outlook
   */
  const startOutlookAuth = () => {
    if (!OAUTH_CONFIG.outlook.clientId) {
      toast.error('Outlook OAuth not configured. Please contact support.');
      return;
    }

    setIsAuthenticating(true);
    setSelectedProvider('outlook');

    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    authUrl.searchParams.append('client_id', OAUTH_CONFIG.outlook.clientId);
    authUrl.searchParams.append('redirect_uri', OAUTH_CONFIG.outlook.redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', OAUTH_CONFIG.outlook.scopes.join(' '));
    authUrl.searchParams.append('response_mode', 'query');
    authUrl.searchParams.append('state', JSON.stringify({ clientId, provider: 'outlook', settings }));

    // Store settings in localStorage for the callback
    localStorage.setItem('email_oauth_settings', JSON.stringify({ clientId, provider: 'outlook', settings }));

    window.location.href = authUrl.toString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Add Email Account
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Connect your Gmail or Outlook account to automatically monitor and log all communications with your contacts.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Choose Email Provider</h3>
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  selectedProvider === 'gmail' ? 'border-primary' : ''
                }`}
                onClick={() => setSelectedProvider('gmail')}
              >
                <CardContent className="p-4 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <Mail className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">Gmail</span>
                    <Badge variant="outline" className="text-xs">Google Workspace</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  selectedProvider === 'outlook' ? 'border-primary' : ''
                }`}
                onClick={() => setSelectedProvider('outlook')}
              >
                <CardContent className="p-4 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Mail className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">Outlook</span>
                    <Badge variant="outline" className="text-xs">Microsoft 365</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Settings Configuration */}
          {selectedProvider && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings className="h-4 w-4" />
                  Email Monitoring Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="monitorInbound"
                      checked={settings.monitorInbound}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, monitorInbound: checked }))
                      }
                    />
                    <Label htmlFor="monitorInbound" className="text-sm">
                      Monitor Incoming Emails
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="monitorOutbound"
                      checked={settings.monitorOutbound}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, monitorOutbound: checked }))
                      }
                    />
                    <Label htmlFor="monitorOutbound" className="text-sm">
                      Monitor Outgoing Emails
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoMatchContacts"
                      checked={settings.autoMatchContacts}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, autoMatchContacts: checked }))
                      }
                    />
                    <Label htmlFor="autoMatchContacts" className="text-sm">
                      Auto-match to Contacts
                    </Label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="syncFrequency" className="text-sm">
                      Sync Frequency (minutes)
                    </Label>
                    <Input
                      id="syncFrequency"
                      type="number"
                      min="5"
                      max="60"
                      value={settings.syncFrequency}
                      onChange={(e) => 
                        setSettings(prev => ({ 
                          ...prev, 
                          syncFrequency: parseInt(e.target.value) || 15 
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxSyncMessages" className="text-sm">
                      Max Messages per Sync
                    </Label>
                    <Input
                      id="maxSyncMessages"
                      type="number"
                      min="10"
                      max="1000"
                      value={settings.maxSyncMessages}
                      onChange={(e) => 
                        setSettings(prev => ({ 
                          ...prev, 
                          maxSyncMessages: parseInt(e.target.value) || 100 
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium mb-1">Privacy & Security:</p>
                      <ul className="space-y-1">
                        <li>• We only access emails to match them with your existing contacts</li>
                        <li>• No email content is stored permanently</li>
                        <li>• You can revoke access at any time from your email provider's settings</li>
                        <li>• All communication is encrypted and secure</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Connect Button */}
          {selectedProvider && (
            <div className="flex flex-col gap-3">
              <Button
                onClick={selectedProvider === 'gmail' ? startGmailAuth : startOutlookAuth}
                disabled={isAuthenticating}
                className="w-full"
                size="lg"
              >
                {isAuthenticating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Connecting to {selectedProvider === 'gmail' ? 'Gmail' : 'Outlook'}...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Connect {selectedProvider === 'gmail' ? 'Gmail' : 'Outlook'} Account
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                You'll be redirected to {selectedProvider === 'gmail' ? 'Google' : 'Microsoft'} to authorize access to your email account.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}