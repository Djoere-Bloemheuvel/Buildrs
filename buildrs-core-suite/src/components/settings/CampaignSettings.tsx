import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Zap, Mail, MessageSquare, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface CampaignSettingsProps {
  clientId: any;
  currentSettings: any;
}

export function CampaignSettings({ clientId, currentSettings }: CampaignSettingsProps) {
  const [settings, setSettings] = useState(currentSettings.campaigns || {});
  const [saving, setSaving] = useState(false);
  
  const updateSettings = useMutation(api.settings.updateClientSettings);
  const resetSettings = useMutation(api.settings.resetClientSettings);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        clientId,
        settings,
        section: "campaigns"
      });
      toast.success("Campaign settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetSettings({ clientId, section: "campaigns" });
      setSettings(currentSettings.campaigns);
      toast.success("Settings reset to defaults");
    } catch (error) {
      toast.error("Failed to reset settings");
    }
  };

  const updateAutomationSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      automation: { ...prev.automation, [key]: value }
    }));
  };

  const updateEmailSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      emailSettings: { ...prev.emailSettings, [key]: value }
    }));
  };

  const updateLinkedInSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      linkedinSettings: { ...prev.linkedinSettings, [key]: value }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Automation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Campaign Automation
          </CardTitle>
          <CardDescription>
            Configure advanced automation features for your campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smart-sequencing">Smart Sequencing</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="smart-sequencing"
                  checked={settings.automation?.enableSmartSequencing || false}
                  onCheckedChange={(value) => updateAutomationSetting('enableSmartSequencing', value)}
                />
                <span className="text-sm text-gray-600">AI-powered step optimization</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="personalization">Personalization</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="personalization"
                  checked={settings.automation?.enablePersonalization || false}
                  onCheckedChange={(value) => updateAutomationSetting('enablePersonalization', value)}
                />
                <span className="text-sm text-gray-600">Auto-personalize messages</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ab-testing">A/B Testing</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="ab-testing"
                  checked={settings.automation?.enableABTesting || false}
                  onCheckedChange={(value) => updateAutomationSetting('enableABTesting', value)}
                />
                <span className="text-sm text-gray-600">Test different message variants</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pause-high-bounce">Pause on High Bounce Rate</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="pause-high-bounce"
                  checked={settings.automation?.pauseOnHighBounceRate || false}
                  onCheckedChange={(value) => updateAutomationSetting('pauseOnHighBounceRate', value)}
                />
                <span className="text-sm text-gray-600">Auto-pause if bounce rate too high</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default-delay">Default Step Delay (days)</Label>
              <Input
                id="default-delay"
                type="number"
                min="1"
                max="30"
                value={settings.automation?.defaultDelayBetweenSteps || 2}
                onChange={(e) => updateAutomationSetting('defaultDelayBetweenSteps', parseInt(e.target.value))}
              />
              <p className="text-xs text-gray-600">Time between campaign steps</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-contacts">Max Contacts per Campaign</Label>
              <Input
                id="max-contacts"
                type="number"
                min="10"
                max="10000"
                value={settings.automation?.maxContactsPerCampaign || 1000}
                onChange={(e) => updateAutomationSetting('maxContactsPerCampaign', parseInt(e.target.value))}
              />
              <p className="text-xs text-gray-600">Campaign size limit</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bounce-threshold">Bounce Rate Threshold (%)</Label>
              <Input
                id="bounce-threshold"
                type="number"
                min="1"
                max="50"
                value={settings.automation?.bounceRateThreshold || 5}
                onChange={(e) => updateAutomationSetting('bounceRateThreshold', parseInt(e.target.value))}
              />
              <p className="text-xs text-gray-600">Pause campaign above this rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Campaign Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Campaign Settings
          </CardTitle>
          <CardDescription>
            Configure default settings for email campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default-from-name">Default From Name</Label>
              <Input
                id="default-from-name"
                value={settings.emailSettings?.defaultFromName || ""}
                onChange={(e) => updateEmailSetting('defaultFromName', e.target.value)}
                placeholder="Your Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-from-email">Default From Email</Label>
              <Input
                id="default-from-email"
                type="email"
                value={settings.emailSettings?.defaultFromEmail || ""}
                onChange={(e) => updateEmailSetting('defaultFromEmail', e.target.value)}
                placeholder="your.email@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-reply-to">Default Reply-To Email</Label>
              <Input
                id="default-reply-to"
                type="email"
                value={settings.emailSettings?.defaultReplyTo || ""}
                onChange={(e) => updateEmailSetting('defaultReplyTo', e.target.value)}
                placeholder="replies@company.com"
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="spam-check">Spam Check</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="spam-check"
                  checked={settings.emailSettings?.enableSpamCheck || false}
                  onCheckedChange={(value) => updateEmailSetting('enableSpamCheck', value)}
                />
                <span className="text-sm text-gray-600">Check emails before sending</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="link-tracking">Link Tracking</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="link-tracking"
                  checked={settings.emailSettings?.enableLinkTracking || false}
                  onCheckedChange={(value) => updateEmailSetting('enableLinkTracking', value)}
                />
                <span className="text-sm text-gray-600">Track link clicks</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unsubscribe-link">Unsubscribe Link</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="unsubscribe-link"
                  checked={settings.emailSettings?.enableUnsubscribeLink || false}
                  onCheckedChange={(value) => updateEmailSetting('enableUnsubscribeLink', value)}
                />
                <span className="text-sm text-gray-600">Include unsubscribe link</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LinkedIn Campaign Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            LinkedIn Campaign Settings
          </CardTitle>
          <CardDescription>
            Configure automation settings for LinkedIn campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="connection-first">Connection Request First</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="connection-first"
                  checked={settings.linkedinSettings?.enableConnectionFirst || false}
                  onCheckedChange={(value) => updateLinkedInSetting('enableConnectionFirst', value)}
                />
                <span className="text-sm text-gray-600">Send connection before message</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="connection-delay">Days Between Connection & Message</Label>
              <Input
                id="connection-delay"
                type="number"
                min="0"
                max="14"
                value={settings.linkedinSettings?.daysBetweenConnectionAndMessage || 3}
                onChange={(e) => updateLinkedInSetting('daysBetweenConnectionAndMessage', parseInt(e.target.value))}
              />
              <p className="text-xs text-gray-600">Wait time after connection accepted</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-connections">Max Connections per Day</Label>
              <Input
                id="max-connections"
                type="number"
                min="1"
                max="100"
                value={settings.linkedinSettings?.maxConnectionsPerDay || 20}
                onChange={(e) => updateLinkedInSetting('maxConnectionsPerDay', parseInt(e.target.value))}
              />
              <p className="text-xs text-gray-600">Daily connection request limit</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-messages">Max Messages per Day</Label>
              <Input
                id="max-messages"
                type="number"
                min="1"
                max="100"
                value={settings.linkedinSettings?.maxMessagesPerDay || 30}
                onChange={(e) => updateLinkedInSetting('maxMessagesPerDay', parseInt(e.target.value))}
              />
              <p className="text-xs text-gray-600">Daily message limit</p>
            </div>
          </div>
        </CardContent>
      </Card>

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