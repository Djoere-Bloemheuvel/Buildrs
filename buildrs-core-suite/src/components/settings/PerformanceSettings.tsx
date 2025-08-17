import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface PerformanceSettingsProps {
  clientId: any;
  currentSettings: any;
}

export function PerformanceSettings({ clientId, currentSettings }: PerformanceSettingsProps) {
  const [settings, setSettings] = useState(currentSettings.performance || {});
  const [saving, setSaving] = useState(false);
  
  const updateSettings = useMutation(api.settings.updateClientSettings);
  const resetSettings = useMutation(api.settings.resetClientSettings);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        clientId,
        settings,
        section: "performance"
      });
      toast.success("Performance settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetSettings({ clientId, section: "performance" });
      setSettings(currentSettings.performance);
      toast.success("Settings reset to defaults");
    } catch (error) {
      toast.error("Failed to reset settings");
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
            <Gauge className="h-5 w-5" />
            Performance Optimization
          </CardTitle>
          <CardDescription>
            Configure system performance and optimization features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="caching">Enable Caching</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="caching"
                  checked={settings.enableCaching || false}
                  onCheckedChange={(value) => updateSetting('enableCaching', value)}
                />
                <span className="text-sm text-gray-600">Cache frequently accessed data</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="archiving">Enable Archiving</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="archiving"
                  checked={settings.enableArchiving || false}
                  onCheckedChange={(value) => updateSetting('enableArchiving', value)}
                />
                <span className="text-sm text-gray-600">Archive old data automatically</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="realtime-sync">Real-time Sync</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="realtime-sync"
                  checked={settings.enableRealTimeSync || false}
                  onCheckedChange={(value) => updateSetting('enableRealTimeSync', value)}
                />
                <span className="text-sm text-gray-600">Sync data in real-time</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="background-tasks">Background Tasks</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="background-tasks"
                  checked={settings.enableBackgroundTasks || false}
                  onCheckedChange={(value) => updateSetting('enableBackgroundTasks', value)}
                />
                <span className="text-sm text-gray-600">Process tasks in background</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="max-query-results">Max Query Results</Label>
              <Input
                id="max-query-results"
                type="number"
                min="100"
                max="10000"
                value={settings.maxQueryResults || 1000}
                onChange={(e) => updateSetting('maxQueryResults', parseInt(e.target.value))}
              />
              <p className="text-xs text-gray-600">Maximum records per query</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch-size">Batch Processing Size</Label>
              <Input
                id="batch-size"
                type="number"
                min="10"
                max="1000"
                value={settings.batchProcessingSize || 100}
                onChange={(e) => updateSetting('batchProcessingSize', parseInt(e.target.value))}
              />
              <p className="text-xs text-gray-600">Records processed per batch</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pt-6 border-t">
        <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
        
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}