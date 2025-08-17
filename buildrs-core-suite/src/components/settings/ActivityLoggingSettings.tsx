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
import { Activity, Clock, Shield, Zap, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ActivityLoggingSettingsProps {
  clientId: any;
  currentSettings: any;
}

export function ActivityLoggingSettings({ clientId, currentSettings }: ActivityLoggingSettingsProps) {
  const [settings, setSettings] = useState(currentSettings.activityLogging || {});
  const [saving, setSaving] = useState(false);
  
  const updateSettings = useMutation(api.settings.updateClientSettings);
  const resetSettings = useMutation(api.settings.resetClientSettings);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        clientId,
        settings,
        section: "activityLogging"
      });
      toast.success("Activity logging settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetSettings({ clientId, section: "activityLogging" });
      setSettings(currentSettings.activityLogging);
      toast.success("Settings reset to defaults");
    } catch (error) {
      toast.error("Failed to reset settings");
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updatePriority = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      priorities: { ...prev.priorities, [key]: value }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Main Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Logging
          </CardTitle>
          <CardDescription>
            Track all CRM activities including contact interactions, deal changes, and campaign actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="activity-enabled">Enable Activity Logging</Label>
              <p className="text-sm text-gray-600">Log all user and system activities</p>
            </div>
            <Switch
              id="activity-enabled"
              checked={settings.enabled}
              onCheckedChange={(value) => updateSetting('enabled', value)}
            />
          </div>

          {settings.enabled && (
            <>
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="system-activities">Log System Activities</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="system-activities"
                      checked={settings.logSystemActivities}
                      onCheckedChange={(value) => updateSetting('logSystemActivities', value)}
                    />
                    <span className="text-sm text-gray-600">Automated system actions</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-activities">Log User Activities</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="user-activities"
                      checked={settings.logUserActivities}
                      onCheckedChange={(value) => updateSetting('logUserActivities', value)}
                    />
                    <span className="text-sm text-gray-600">Manual user actions</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Data Retention
          </CardTitle>
          <CardDescription>
            Configure how long activity data is stored and when it gets archived.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="retention-months">Retention Period (months)</Label>
              <Input
                id="retention-months"
                type="number"
                min="1"
                max="60"
                value={settings.retentionMonths || 12}
                onChange={(e) => updateSetting('retentionMonths', parseInt(e.target.value))}
              />
              <p className="text-xs text-gray-600">Activities older than this will be deleted</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="archive-months">Auto-Archive After (months)</Label>
              <Input
                id="archive-months"
                type="number"
                min="1"
                max="24"
                value={settings.autoArchiveAfterMonths || 6}
                onChange={(e) => updateSetting('autoArchiveAfterMonths', parseInt(e.target.value))}
              />
              <p className="text-xs text-gray-600">Move old activities to archive for performance</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Performance
          </CardTitle>
          <CardDescription>
            Enable advanced monitoring and optimization features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="security-auditing">Security Auditing</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="security-auditing"
                  checked={settings.enableSecurityAuditing}
                  onCheckedChange={(value) => updateSetting('enableSecurityAuditing', value)}
                />
                <span className="text-sm text-gray-600">Detect suspicious patterns</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="performance-optimization">Performance Optimization</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="performance-optimization"
                  checked={settings.enablePerformanceOptimization}
                  onCheckedChange={(value) => updateSetting('enablePerformanceOptimization', value)}
                />
                <span className="text-sm text-gray-600">Enable caching and archiving</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Priorities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Activity Priorities
          </CardTitle>
          <CardDescription>
            Set priority levels for different types of activities to organize your timeline better.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'contactActions', label: 'Contact Actions', description: 'Contact creation, updates, status changes' },
              { key: 'dealActions', label: 'Deal Actions', description: 'Deal creation, stage changes, value updates' },
              { key: 'campaignActions', label: 'Campaign Actions', description: 'Campaign creation, contact assignments' },
              { key: 'communicationActions', label: 'Communication Actions', description: 'Emails sent, LinkedIn messages, calls' },
              { key: 'systemActions', label: 'System Actions', description: 'Automated system activities' }
            ].map((item) => (
              <div key={item.key} className="space-y-2">
                <Label htmlFor={item.key}>{item.label}</Label>
                <Select
                  value={settings.priorities?.[item.key] || 'medium'}
                  onValueChange={(value) => updatePriority(item.key, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Low</Badge>
                        <span>Background importance</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Medium</Badge>
                        <span>Standard importance</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <Badge variant="default">High</Badge>
                        <span>Important for tracking</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600">{item.description}</p>
              </div>
            ))}
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