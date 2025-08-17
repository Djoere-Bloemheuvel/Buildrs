import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface DataManagementSettingsProps {
  clientId: any;
  currentSettings: any;
}

export function DataManagementSettings({ clientId, currentSettings }: DataManagementSettingsProps) {
  const [settings, setSettings] = useState(currentSettings.dataManagement || {});
  const [saving, setSaving] = useState(false);
  
  const updateSettings = useMutation(api.settings.updateClientSettings);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        clientId,
        settings,
        section: "dataManagement"
      });
      toast.success("Data management settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateEnrichmentSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      autoEnrichment: { ...prev.autoEnrichment, [key]: value }
    }));
  };

  const updateDuplicateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      duplicateDetection: { ...prev.duplicateDetection, [key]: value }
    }));
  };

  const updateRetentionSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      dataRetention: { ...prev.dataRetention, [key]: value }
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Auto Enrichment
          </CardTitle>
          <CardDescription>
            Automatically enrich contact and company data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="auto-enrichment">Enable Auto Enrichment</Label>
            <Switch
              id="auto-enrichment"
              checked={settings.autoEnrichment?.enabled || false}
              onCheckedChange={(value) => updateEnrichmentSetting('enabled', value)}
            />
          </div>

          {settings.autoEnrichment?.enabled && (
            <div className="space-y-2">
              <Label htmlFor="apollo-enrichment">Apollo Provider</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="apollo-enrichment"
                  checked={settings.autoEnrichment?.providers?.apollo?.enabled || false}
                  onCheckedChange={(value) => setSettings(prev => ({
                    ...prev,
                    autoEnrichment: {
                      ...prev.autoEnrichment,
                      providers: {
                        ...prev.autoEnrichment?.providers,
                        apollo: { ...prev.autoEnrichment?.providers?.apollo, enabled: value }
                      }
                    }
                  }))}
                />
                <span className="text-sm text-gray-600">Use Apollo for data enrichment</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Duplicate Detection</CardTitle>
          <CardDescription>
            Automatically detect and manage duplicate contacts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="duplicate-detection">Enable Duplicate Detection</Label>
            <Switch
              id="duplicate-detection"
              checked={settings.duplicateDetection?.enabled || false}
              onCheckedChange={(value) => updateDuplicateSetting('enabled', value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="auto-merge">Auto Merge Duplicates</Label>
            <Switch
              id="auto-merge"
              checked={settings.duplicateDetection?.autoMerge || false}
              onCheckedChange={(value) => updateDuplicateSetting('autoMerge', value)}
            />
            <p className="text-xs text-gray-600">Automatically merge clear duplicates</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Retention</CardTitle>
          <CardDescription>
            Configure how long different types of data are stored.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contacts-retention">Contacts Retention (months)</Label>
              <Input
                id="contacts-retention"
                type="number"
                min="12"
                max="120"
                value={settings.dataRetention?.contactsMonths || 60}
                onChange={(e) => updateRetentionSetting('contactsMonths', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deals-retention">Deals Retention (months)</Label>
              <Input
                id="deals-retention"
                type="number"
                min="12"
                max="120"
                value={settings.dataRetention?.dealsMonths || 84}
                onChange={(e) => updateRetentionSetting('dealsMonths', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="communications-retention">Communications Retention (months)</Label>
              <Input
                id="communications-retention"
                type="number"
                min="6"
                max="60"
                value={settings.dataRetention?.communicationsMonths || 36}
                onChange={(e) => updateRetentionSetting('communicationsMonths', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activities-retention">Activities Retention (months)</Label>
              <Input
                id="activities-retention"
                type="number"
                min="3"
                max="24"
                value={settings.dataRetention?.activitiesMonths || 12}
                onChange={(e) => updateRetentionSetting('activitiesMonths', parseInt(e.target.value))}
              />
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