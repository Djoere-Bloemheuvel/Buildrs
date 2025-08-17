import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, MessageSquare, Phone, Save, RotateCcw, TestTube, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface CommunicationSettingsProps {
  clientId: any;
  currentSettings: any;
  integrationStatus?: any;
}

export function CommunicationSettings({ clientId, currentSettings, integrationStatus }: CommunicationSettingsProps) {
  const [settings, setSettings] = useState(currentSettings.communications || {});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  
  const updateSettings = useMutation(api.settings.updateClientSettings);
  const resetSettings = useMutation(api.settings.resetClientSettings);
  const testConnection = useMutation(api.settings.testIntegrationConnection);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        clientId,
        settings,
        section: "communications"
      });
      toast.success("Communication settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetSettings({ clientId, section: "communications" });
      setSettings(currentSettings.communications);
      toast.success("Settings reset to defaults");
    } catch (error) {
      toast.error("Failed to reset settings");
    }
  };

  const handleTestConnection = async (provider: string) => {
    setTesting(provider);
    try {
      const credentials = provider === "instantly" ? 
        { apiKey: settings.email?.providers?.instantly?.apiKey } :
        provider === "phantombuster" ?
        { apiKey: settings.linkedin?.providers?.phantombuster?.apiKey, containerId: settings.linkedin?.providers?.phantombuster?.containerId } :
        provider === "aircall" ?
        { apiKey: settings.phone?.providers?.aircall?.apiKey } :
        {};

      const result = await testConnection({ clientId, integration: provider, credentials });
      
      if (result.success) {
        toast.success(`${provider} connection successful`);
      } else {
        toast.error(`${provider} connection failed: ${result.message}`);
      }
    } catch (error) {
      toast.error(`Failed to test ${provider} connection`);
    } finally {
      setTesting(null);
    }
  };

  const updateEmailSetting = (provider: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      email: {
        ...prev.email,
        providers: {
          ...prev.email?.providers,
          [provider]: {
            ...prev.email?.providers?.[provider],
            [key]: value
          }
        }
      }
    }));
  };

  const updateLinkedInSetting = (provider: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      linkedin: {
        ...prev.linkedin,
        providers: {
          ...prev.linkedin?.providers,
          [provider]: {
            ...prev.linkedin?.providers?.[provider],
            [key]: value
          }
        }
      }
    }));
  };

  const updatePhoneSetting = (provider: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      phone: {
        ...prev.phone,
        providers: {
          ...prev.phone?.providers,
          [provider]: {
            ...prev.phone?.providers?.[provider],
            [key]: value
          }
        }
      }
    }));
  };

  const getProviderStatus = (provider: string) => {
    const status = integrationStatus?.[provider];
    if (!status) return { icon: AlertCircle, color: "text-gray-400", text: "Unknown" };
    
    if (status.status === "active") return { icon: CheckCircle, color: "text-green-600", text: "Active" };
    if (status.configured) return { icon: AlertCircle, color: "text-yellow-600", text: "Configured" };
    return { icon: XCircle, color: "text-red-600", text: "Not Configured" };
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="email" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="linkedin" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            LinkedIn
          </TabsTrigger>
          <TabsTrigger value="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Phone
          </TabsTrigger>
        </TabsList>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          {/* Default Email Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure email tracking and default provider settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default-provider">Default Email Provider</Label>
                  <Select
                    value={settings.email?.defaultProvider || "instantly"}
                    onValueChange={(value) => setSettings(prev => ({
                      ...prev,
                      email: { ...prev.email, defaultProvider: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instantly">Instantly</SelectItem>
                      <SelectItem value="gmail">Gmail</SelectItem>
                      <SelectItem value="outlook">Outlook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Email Tracking</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.email?.trackOpens || false}
                        onCheckedChange={(value) => setSettings(prev => ({
                          ...prev,
                          email: { ...prev.email, trackOpens: value }
                        }))}
                      />
                      <span className="text-sm">Track email opens</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.email?.trackClicks || false}
                        onCheckedChange={(value) => setSettings(prev => ({
                          ...prev,
                          email: { ...prev.email, trackClicks: value }
                        }))}
                      />
                      <span className="text-sm">Track link clicks</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.email?.autoReplyDetection || false}
                        onCheckedChange={(value) => setSettings(prev => ({
                          ...prev,
                          email: { ...prev.email, autoReplyDetection: value }
                        }))}
                      />
                      <span className="text-sm">Auto-reply detection</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instantly Provider */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Instantly Integration</span>
                <div className="flex items-center gap-2">
                  {(() => {
                    const status = getProviderStatus('instantly');
                    const Icon = status.icon;
                    return (
                      <>
                        <Icon className={`h-4 w-4 ${status.color}`} />
                        <Badge variant={status.text === 'Active' ? 'default' : 'secondary'}>
                          {status.text}
                        </Badge>
                      </>
                    );
                  })()}
                </div>
              </CardTitle>
              <CardDescription>
                Configure Instantly for automated email campaigns.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instantly-enabled">Enable Instantly</Label>
                <Switch
                  id="instantly-enabled"
                  checked={settings.email?.providers?.instantly?.enabled || false}
                  onCheckedChange={(value) => updateEmailSetting('instantly', 'enabled', value)}
                />
              </div>

              {settings.email?.providers?.instantly?.enabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instantly-api-key">API Key</Label>
                      <Input
                        id="instantly-api-key"
                        type="password"
                        value={settings.email?.providers?.instantly?.apiKey || ""}
                        onChange={(e) => updateEmailSetting('instantly', 'apiKey', e.target.value)}
                        placeholder="Enter Instantly API key"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instantly-webhook">Webhook URL</Label>
                      <Input
                        id="instantly-webhook"
                        value={settings.email?.providers?.instantly?.webhookUrl || ""}
                        onChange={(e) => updateEmailSetting('instantly', 'webhookUrl', e.target.value)}
                        placeholder="Webhook URL for status updates"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instantly-campaign">Default Campaign ID</Label>
                      <Input
                        id="instantly-campaign"
                        value={settings.email?.providers?.instantly?.defaultCampaignId || ""}
                        onChange={(e) => updateEmailSetting('instantly', 'defaultCampaignId', e.target.value)}
                        placeholder="Default campaign ID"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instantly-rate-limit">Daily Rate Limit</Label>
                      <Input
                        id="instantly-rate-limit"
                        type="number"
                        value={settings.email?.providers?.instantly?.rateLimitPerDay || 100}
                        onChange={(e) => updateEmailSetting('instantly', 'rateLimitPerDay', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => handleTestConnection('instantly')}
                      disabled={testing === 'instantly'}
                      className="flex items-center gap-2"
                    >
                      <TestTube className="h-4 w-4" />
                      {testing === 'instantly' ? 'Testing...' : 'Test Connection'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LinkedIn Settings */}
        <TabsContent value="linkedin" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>LinkedIn Configuration</CardTitle>
              <CardDescription>
                Configure LinkedIn automation and connection settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Auto Accept Connections</Label>
                  <Switch
                    checked={settings.linkedin?.autoAcceptConnections || false}
                    onCheckedChange={(value) => setSettings(prev => ({
                      ...prev,
                      linkedin: { ...prev.linkedin, autoAcceptConnections: value }
                    }))}
                  />
                  <p className="text-xs text-gray-600">Automatically accept incoming connection requests</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="connection-template">Connection Request Template</Label>
                  <Input
                    id="connection-template"
                    value={settings.linkedin?.connectionRequestTemplate || ""}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      linkedin: { ...prev.linkedin, connectionRequestTemplate: e.target.value }
                    }))}
                    placeholder="Hi {firstName}, I'd love to connect!"
                  />
                  <p className="text-xs text-gray-600">Use {firstName} and {lastName} for personalization</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PhantomBuster Provider */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>PhantomBuster Integration</span>
                <div className="flex items-center gap-2">
                  {(() => {
                    const status = getProviderStatus('phantombuster');
                    const Icon = status.icon;
                    return (
                      <>
                        <Icon className={`h-4 w-4 ${status.color}`} />
                        <Badge variant={status.text === 'Active' ? 'default' : 'secondary'}>
                          {status.text}
                        </Badge>
                      </>
                    );
                  })()}
                </div>
              </CardTitle>
              <CardDescription>
                Configure PhantomBuster for LinkedIn automation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phantombuster-enabled">Enable PhantomBuster</Label>
                <Switch
                  id="phantombuster-enabled"
                  checked={settings.linkedin?.providers?.phantombuster?.enabled || false}
                  onCheckedChange={(value) => updateLinkedInSetting('phantombuster', 'enabled', value)}
                />
              </div>

              {settings.linkedin?.providers?.phantombuster?.enabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phantombuster-api-key">API Key</Label>
                      <Input
                        id="phantombuster-api-key"
                        type="password"
                        value={settings.linkedin?.providers?.phantombuster?.apiKey || ""}
                        onChange={(e) => updateLinkedInSetting('phantombuster', 'apiKey', e.target.value)}
                        placeholder="Enter PhantomBuster API key"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phantombuster-container">Container ID</Label>
                      <Input
                        id="phantombuster-container"
                        value={settings.linkedin?.providers?.phantombuster?.containerId || ""}
                        onChange={(e) => updateLinkedInSetting('phantombuster', 'containerId', e.target.value)}
                        placeholder="PhantomBuster container ID"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phantombuster-rate-limit">Daily Rate Limit</Label>
                      <Input
                        id="phantombuster-rate-limit"
                        type="number"
                        value={settings.linkedin?.providers?.phantombuster?.rateLimitPerDay || 50}
                        onChange={(e) => updateLinkedInSetting('phantombuster', 'rateLimitPerDay', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => handleTestConnection('phantombuster')}
                      disabled={testing === 'phantombuster'}
                      className="flex items-center gap-2"
                    >
                      <TestTube className="h-4 w-4" />
                      {testing === 'phantombuster' ? 'Testing...' : 'Test Connection'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Phone Settings */}
        <TabsContent value="phone" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Phone Configuration</CardTitle>
              <CardDescription>
                Configure phone call tracking and recording settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Record Calls</Label>
                  <Switch
                    checked={settings.phone?.recordCalls || false}
                    onCheckedChange={(value) => setSettings(prev => ({
                      ...prev,
                      phone: { ...prev.phone, recordCalls: value }
                    }))}
                  />
                  <p className="text-xs text-gray-600">Automatically record all calls</p>
                </div>

                <div className="space-y-2">
                  <Label>Auto-Log Calls</Label>
                  <Switch
                    checked={settings.phone?.autoLogCalls || false}
                    onCheckedChange={(value) => setSettings(prev => ({
                      ...prev,
                      phone: { ...prev.phone, autoLogCalls: value }
                    }))}
                  />
                  <p className="text-xs text-gray-600">Automatically log calls to contact timeline</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AirCall Provider */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>AirCall Integration</span>
                <div className="flex items-center gap-2">
                  {(() => {
                    const status = getProviderStatus('aircall');
                    const Icon = status.icon;
                    return (
                      <>
                        <Icon className={`h-4 w-4 ${status.color}`} />
                        <Badge variant={status.text === 'Active' ? 'default' : 'secondary'}>
                          {status.text}
                        </Badge>
                      </>
                    );
                  })()}
                </div>
              </CardTitle>
              <CardDescription>
                Configure AirCall for phone call management.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aircall-enabled">Enable AirCall</Label>
                <Switch
                  id="aircall-enabled"
                  checked={settings.phone?.providers?.aircall?.enabled || false}
                  onCheckedChange={(value) => updatePhoneSetting('aircall', 'enabled', value)}
                />
              </div>

              {settings.phone?.providers?.aircall?.enabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="aircall-api-key">API Key</Label>
                      <Input
                        id="aircall-api-key"
                        type="password"
                        value={settings.phone?.providers?.aircall?.apiKey || ""}
                        onChange={(e) => updatePhoneSetting('aircall', 'apiKey', e.target.value)}
                        placeholder="Enter AirCall API key"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="aircall-webhook">Webhook URL</Label>
                      <Input
                        id="aircall-webhook"
                        value={settings.phone?.providers?.aircall?.webhookUrl || ""}
                        onChange={(e) => updatePhoneSetting('aircall', 'webhookUrl', e.target.value)}
                        placeholder="Webhook URL for call events"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => handleTestConnection('aircall')}
                      disabled={testing === 'aircall'}
                      className="flex items-center gap-2"
                    >
                      <TestTube className="h-4 w-4" />
                      {testing === 'aircall' ? 'Testing...' : 'Test Connection'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={handleReset}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
        
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}