import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { EmailAccountSetup } from './EmailAccountSetup';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';
import { 
  Mail, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Trash2, 
  RefreshCw,
  Activity,
  TrendingUp,
  Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CommunicationsOverviewProps {
  clientId: string;
}

export function CommunicationsOverview({ clientId }: CommunicationsOverviewProps) {
  const [showSetup, setShowSetup] = useState(false);
  
  // Fetch email accounts for this client
  const emailAccounts = useQuery(api.emailAccounts.getClientEmailAccounts, { clientId });
  const emailStats = useQuery(api.emailAccounts.getClientEmailStats, { clientId, days: 30 });
  
  // Mutations
  const updateEmailAccount = useMutation(api.emailAccounts.updateEmailAccount);
  const deleteEmailAccount = useMutation(api.emailAccounts.deleteEmailAccount);
  const triggerManualSync = useMutation(api.emailSync.triggerManualSync);

  const handleToggleAccount = async (accountId: string, isActive: boolean) => {
    try {
      await updateEmailAccount({
        emailAccountId: accountId,
        isActive: !isActive,
      });
      toast.success(`Email account ${!isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update account status');
    }
  };

  const handleDeleteAccount = async (accountId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove the email account ${email}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteEmailAccount({ emailAccountId: accountId });
      toast.success('Email account removed successfully');
    } catch (error) {
      toast.error('Failed to remove email account');
    }
  };

  const handleManualSync = async (accountId: string, email: string) => {
    try {
      toast.loading(`Starting sync for ${email}...`);
      const result = await triggerManualSync({ emailAccountId: accountId });
      
      if (result.success) {
        toast.success(`Sync completed for ${email}`);
      } else {
        toast.error(`Sync failed: ${result.error}`);
      }
    } catch (error) {
      toast.error('Failed to trigger sync');
    }
  };

  const getStatusIcon = (account: any) => {
    if (!account.isActive) {
      return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
    if (!account.isValid) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (account.lastSyncStatus === 'success') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (account.lastSyncStatus === 'failed') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = (account: any) => {
    if (!account.isActive) return 'Inactive';
    if (!account.isValid) return 'Invalid Token';
    if (account.lastSyncStatus === 'success') return 'Active';
    if (account.lastSyncStatus === 'failed') return 'Sync Failed';
    return 'Pending';
  };

  const getProviderBadgeColor = (provider: string) => {
    return provider === 'gmail' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
  };

  if (showSetup) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Add Email Account</h2>
          <Button variant="outline" onClick={() => setShowSetup(false)}>
            Back to Overview
          </Button>
        </div>
        
        <EmailAccountSetup
          clientId={clientId}
          onAccountAdded={() => {
            setShowSetup(false);
            toast.success('Email account added successfully!');
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Communications Monitoring</h2>
          <p className="text-muted-foreground">
            Monitor and track all email communications with your contacts
          </p>
        </div>
        <Button onClick={() => setShowSetup(true)}>
          <Mail className="h-4 w-4 mr-2" />
          Add Email Account
        </Button>
      </div>

      {/* Stats Overview */}
      {emailStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Email Accounts</span>
              </div>
              <p className="text-2xl font-bold">{emailStats.totalAccounts}</p>
              <p className="text-xs text-muted-foreground">
                {emailStats.activeAccounts} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Messages (30d)</span>
              </div>
              <p className="text-2xl font-bold">{emailStats.totalMessages}</p>
              <p className="text-xs text-muted-foreground">
                {emailStats.avgMessagesPerDay}/day avg
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Synced</span>
              </div>
              <p className="text-2xl font-bold">{emailStats.totalSynced}</p>
              <p className="text-xs text-muted-foreground">
                {emailStats.totalMatched} matched to contacts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Inbound/Outbound</span>
              </div>
              <p className="text-2xl font-bold">
                {emailStats.totalInbound}/{emailStats.totalOutbound}
              </p>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Email Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Email Accounts</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage your connected email accounts and their monitoring settings
          </p>
        </CardHeader>
        <CardContent>
          {!emailAccounts || emailAccounts.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No email accounts connected</h3>
              <p className="text-muted-foreground mb-4">
                Connect your Gmail or Outlook account to start monitoring communications
              </p>
              <Button onClick={() => setShowSetup(true)}>
                <Mail className="h-4 w-4 mr-2" />
                Add Email Account
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {emailAccounts.map((account) => (
                <Card key={account._id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(account)}
                          <div>
                            <p className="font-medium">{account.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant="outline" 
                                className={getProviderBadgeColor(account.provider)}
                              >
                                {account.provider === 'gmail' ? 'Gmail' : 'Outlook'}
                              </Badge>
                              <Badge variant="outline">
                                {getStatusText(account)}
                              </Badge>
                              {account.lastSyncTimestamp && (
                                <span className="text-xs text-muted-foreground">
                                  Last sync: {formatDistanceToNow(account.lastSyncTimestamp)} ago
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={account.isActive}
                          onCheckedChange={() => handleToggleAccount(account._id, account.isActive)}
                        />
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManualSync(account._id, account.email)}
                          disabled={!account.isActive || !account.isValid}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAccount(account._id, account.email)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Account Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Messages Synced</p>
                        <p className="font-medium">{account.totalMessagesSynced || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Contacts Matched</p>
                        <p className="font-medium">{account.totalContactsMatched || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Sync Frequency</p>
                        <p className="font-medium">{account.settings.syncFrequency || 15}min</p>
                      </div>
                    </div>

                    {/* Error Message */}
                    {account.lastSyncStatus === 'failed' && account.lastSyncError && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-700">Sync Error</p>
                            <p className="text-xs text-red-600 mt-1">{account.lastSyncError}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}