import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { CheckCircle, AlertCircle, Mail, Loader2 } from 'lucide-react';

interface OAuthCallbackProps {
  provider: 'gmail' | 'outlook';
}

export function OAuthCallbackSecure({ provider }: OAuthCallbackProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);

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

      // SECURE: Exchange authorization code via server-side endpoint
      const result = await exchangeCodeSecurely(code, provider, stateData);
      
      if (!result.success) {
        throw new Error(result.details || 'Failed to exchange authorization code');
      }

      setAccountEmail(result.email);

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
   * SECURE: Exchange authorization code via server-side Convex endpoint
   * This protects OAuth client secrets from being exposed in the browser
   */
  const exchangeCodeSecurely = async (code: string, provider: 'gmail' | 'outlook', stateData: any) => {
    const clientId = provider === 'gmail' 
      ? process.env.VITE_GMAIL_CLIENT_ID 
      : process.env.VITE_OUTLOOK_CLIENT_ID;

    const redirectUri = `${window.location.origin}/oauth/${provider}/callback`;

    // Call secure server-side OAuth endpoint
    const endpoint = provider === 'gmail' 
      ? '/oauth/exchangeGmailToken'
      : '/oauth/exchangeOutlookToken';

    const convexSiteUrl = process.env.VITE_CONVEX_SITE_URL || process.env.VITE_CONVEX_URL?.replace('/api', '');
    
    if (!convexSiteUrl) {
      throw new Error('Convex site URL not configured');
    }

    const response = await fetch(`${convexSiteUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        clientId,
        redirectUri,
        state: JSON.stringify(stateData),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
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
        return `Securely connecting your ${provider === 'gmail' ? 'Gmail' : 'Outlook'} account...`;
      case 'success':
        return `Successfully connected ${accountEmail}!`;
      case 'error':
        return 'Connection failed';
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'processing':
        return 'Please wait while we securely set up your email monitoring using server-side authentication.';
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
              Secure Email Account Setup
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
                  <div className="mt-2 text-xs text-green-600 bg-green-100 p-2 rounded">
                    🔒 Your OAuth credentials were processed securely on our servers - no sensitive data was exposed in your browser.
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      <div className="text-sm">
                        <p className="text-red-700 font-medium">Secure Connection Failed</p>
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
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              This may take a few moments. Please don't close this window.
            </p>
            <div className="text-xs text-green-600 bg-green-50 p-2 rounded border">
              🔒 Using secure server-side OAuth for maximum security
            </div>
          </div>
        )}
      </div>
    </div>
  );
}