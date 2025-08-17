import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface NotificationSettingsProps {
  clientId: any;
  currentSettings: any;
}

export function NotificationSettings({ clientId, currentSettings }: NotificationSettingsProps) {
  const [settings, setSettings] = useState(currentSettings.notifications || {});
  const [saving, setSaving] = useState(false);
  
  const updateSettings = useMutation(api.settings.updateClientSettings);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        clientId,
        settings,
        section: "notifications"
      });
      toast.success("Notification settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateEmailSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      email: { ...prev.email, [key]: value }
    }));
  };

  const updateInAppSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      inApp: { ...prev.inApp, [key]: value }
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Configure email notification preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email-enabled">Enable Email Notifications</Label>
              <Switch
                id="email-enabled"
                checked={settings.email?.enabled || false}
                onCheckedChange={(value) => updateEmailSetting('enabled', value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="digest-frequency">Digest Frequency</Label>
              <Select
                value={settings.email?.digestFrequency || "daily"}
                onValueChange={(value) => updateEmailSetting('digestFrequency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {settings.email?.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>New Leads</Label>
                <Switch
                  checked={settings.email?.newLeads || false}
                  onCheckedChange={(value) => updateEmailSetting('newLeads', value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Deal Updates</Label>
                <Switch
                  checked={settings.email?.dealUpdates || false}
                  onCheckedChange={(value) => updateEmailSetting('dealUpdates', value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Campaign Results</Label>
                <Switch
                  checked={settings.email?.campaignResults || false}
                  onCheckedChange={(value) => updateEmailSetting('campaignResults', value)}
                />
              </div>
              <div className="space-y-2">
                <Label>System Alerts</Label>
                <Switch
                  checked={settings.email?.systemAlerts || false}
                  onCheckedChange={(value) => updateEmailSetting('systemAlerts', value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>In-App Notifications</CardTitle>
          <CardDescription>
            Configure in-application notification preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inapp-enabled">Enable In-App Notifications</Label>
            <Switch
              id="inapp-enabled"
              checked={settings.inApp?.enabled || false}
              onCheckedChange={(value) => updateInAppSetting('enabled', value)}
            />
          </div>

          {settings.inApp?.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>New Activities</Label>
                <Switch
                  checked={settings.inApp?.newActivities || false}
                  onCheckedChange={(value) => updateInAppSetting('newActivities', value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Mentions</Label>
                <Switch
                  checked={settings.inApp?.mentions || false}
                  onCheckedChange={(value) => updateInAppSetting('mentions', value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Task Reminders</Label>
                <Switch
                  checked={settings.inApp?.taskReminders || false}
                  onCheckedChange={(value) => updateInAppSetting('taskReminders', value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Deadlines</Label>
                <Switch
                  checked={settings.inApp?.deadlines || false}
                  onCheckedChange={(value) => updateInAppSetting('deadlines', value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end pt-6 border-t">
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}