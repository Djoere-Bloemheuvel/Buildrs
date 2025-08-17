import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { CheckCircle, AlertCircle, Mail, Loader2 } from 'lucide-react';

interface OAuthCallbackProps {
  provider: 'gmail' | 'outlook';
}

export function OAuthCallback({ provider }: OAuthCallbackProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);

  const createEmailAccount = useMutation(api.emailAccounts.createEmailAccount);

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      // Get authorization code from URL params
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (!code) {
        throw new Error('No authorization code received');
      }

      // Parse state to get client info and settings
      let stateData;
      try {
        stateData = state ? JSON.parse(state) : null;
      } catch {
        // Fallback to localStorage if state parsing fails
        const stored = localStorage.getItem('email_oauth_settings');
        stateData = stored ? JSON.parse(stored) : null;
      }

      if (!stateData || !stateData.clientId) {
        throw new Error('Missing client information');
      }

      // Exchange authorization code for access token
      const tokenData = await exchangeCodeForTokens(code, stateData.provider);
      
      if (!tokenData) {
        throw new Error('Failed to exchange code for tokens');
      }

      // Get user email address
      const userInfo = await getUserInfo(tokenData.access_token, stateData.provider);
      
      if (!userInfo?.email) {
        throw new Error('Failed to get user email address');
      }

      setAccountEmail(userInfo.email);

      // Create email account in database
      await createEmailAccount({
        clientId: stateData.clientId,
        email: userInfo.email,
        provider: stateData.provider,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: Date.now() + (tokenData.expires_in * 1000),
        settings: stateData.settings,
      });

      // Clean up localStorage
      localStorage.removeItem('email_oauth_settings');

      setStatus('success');
      toast.success(`${provider === 'gmail' ? 'Gmail' : 'Outlook'} account connected successfully!`);

      // Redirect back to communications page after 3 seconds
      setTimeout(() => {
        navigate('/communications');
      }, 3000);

    } catch (error) {
      console.error('OAuth callback error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setStatus('error');
      toast.error('Failed to connect email account');
    }
  };

  /**
   * Exchange authorization code for access/refresh tokens
   */
  const exchangeCodeForTokens = async (code: string, provider: 'gmail' | 'outlook') => {
    const clientId = provider === 'gmail' 
      ? process.env.VITE_GMAIL_CLIENT_ID 
      : process.env.VITE_OUTLOOK_CLIENT_ID;

    const redirectUri = `${window.location.origin}/oauth/${provider}/callback`;

    if (provider === 'gmail') {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: process.env.VITE_GMAIL_CLIENT_SECRET!, // In production, this should be done server-side
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gmail token exchange failed: ${errorData.error_description || errorData.error}`);
      }

      return await response.json();
    } else {
      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: process.env.VITE_OUTLOOK_CLIENT_SECRET!, // In production, this should be done server-side
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          scope: 'https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Outlook token exchange failed: ${errorData.error_description || errorData.error}`);
      }

      return await response.json();
    }
  };

  /**
   * Get user information from the provider
   */
  const getUserInfo = async (accessToken: string, provider: 'gmail' | 'outlook') => {
    if (provider === 'gmail') {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get Gmail user info');
      }

      return await response.json();
    } else {
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get Outlook user info');
      }

      const userData = await response.json();
      return { email: userData.mail || userData.userPrincipalName };
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'processing':
        return `Connecting your ${provider === 'gmail' ? 'Gmail' : 'Outlook'} account...`;
      case 'success':
        return `Successfully connected ${accountEmail}!`;
      case 'error':
        return 'Connection failed';
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'processing':
        return 'Please wait while we set up your email monitoring.';
      case 'success':
        return 'Your email account has been connected and email monitoring is now active. You\'ll be redirected shortly.';
      case 'error':
        return error || 'An unexpected error occurred while connecting your email account.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Mail className="h-5 w-5" />
              Email Account Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                {getStatusIcon()}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">{getStatusMessage()}</h3>
                <p className="text-sm text-muted-foreground">
                  {getStatusDescription()}
                </p>
              </div>

              {status === 'success' && accountEmail && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-700 font-medium">
                      Email monitoring is now active for {accountEmail}
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    We'll start monitoring your emails and automatically match them to your contacts.
                  </p>
                </div>
              )}

              {status === 'error' && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      <div className="text-sm">
                        <p className="text-red-700 font-medium">Connection Failed</p>
                        <p className="text-red-600 text-xs mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => navigate('/communications')} 
                    variant="outline" 
                    className="w-full"
                  >
                    Return to Communications
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {status === 'processing' && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              This may take a few moments. Please don't close this window.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}