import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface UISettingsProps {
  clientId: any;
  currentSettings: any;
}

export function UISettings({ clientId, currentSettings }: UISettingsProps) {
  const [settings, setSettings] = useState(currentSettings.ui || {});
  const [saving, setSaving] = useState(false);
  
  const updateSettings = useMutation(api.settings.updateClientSettings);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        clientId,
        settings,
        section: "ui"
      });
      toast.success("UI settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            User Interface
          </CardTitle>
          <CardDescription>
            Customize your CRM interface appearance and behavior.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={settings.theme || "light"}
                onValueChange={(value) => updateSetting('theme', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="auto">Auto (System)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-page-size">Default Page Size</Label>
              <Select
                value={String(settings.defaultPageSize || 50)}
                onValueChange={(value) => updateSetting('defaultPageSize', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 items</SelectItem>
                  <SelectItem value="50">50 items</SelectItem>
                  <SelectItem value="100">100 items</SelectItem>
                  <SelectItem value="200">200 items</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-dashboard">Default Dashboard View</Label>
              <Select
                value={settings.defaultDashboardView || "overview"}
                onValueChange={(value) => updateSetting('defaultDashboardView', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="contacts">Contacts</SelectItem>
                  <SelectItem value="deals">Deals</SelectItem>
                  <SelectItem value="campaigns">Campaigns</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Real-time Notifications</Label>
              <Switch
                checked={settings.enableRealTimeNotifications || false}
                onCheckedChange={(value) => updateSetting('enableRealTimeNotifications', value)}
              />
              <p className="text-xs text-gray-600">Show notifications as they happen</p>
            </div>

            <div className="space-y-2">
              <Label>Desktop Notifications</Label>
              <Switch
                checked={settings.enableDesktopNotifications || false}
                onCheckedChange={(value) => updateSetting('enableDesktopNotifications', value)}
              />
              <p className="text-xs text-gray-600">Browser desktop notifications</p>
            </div>

            <div className="space-y-2">
              <Label>Advanced Filters</Label>
              <Switch
                checked={settings.enableAdvancedFilters || false}
                onCheckedChange={(value) => updateSetting('enableAdvancedFilters', value)}
              />
              <p className="text-xs text-gray-600">Show advanced filtering options</p>
            </div>

            <div className="space-y-2">
              <Label>Quick Actions</Label>
              <Switch
                checked={settings.enableQuickActions || false}
                onCheckedChange={(value) => updateSetting('enableQuickActions', value)}
              />
              <p className="text-xs text-gray-600">Enable keyboard shortcuts</p>
            </div>
          </div>
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