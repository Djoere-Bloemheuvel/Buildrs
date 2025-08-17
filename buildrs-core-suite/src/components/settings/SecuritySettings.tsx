import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface SecuritySettingsProps {
  clientId: any;
  currentSettings: any;
}

export function SecuritySettings({ clientId, currentSettings }: SecuritySettingsProps) {
  const [settings, setSettings] = useState(currentSettings.security || {});
  const [saving, setSaving] = useState(false);
  
  const updateSettings = useMutation(api.settings.updateClientSettings);
  const resetSettings = useMutation(api.settings.resetClientSettings);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        clientId,
        settings,
        section: "security"
      });
      toast.success("Security settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetSettings({ clientId, section: "security" });
      setSettings(currentSettings.security);
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
            <Shield className="h-5 w-5" />
            Security & Monitoring
          </CardTitle>
          <CardDescription>
            Configure security monitoring and access controls.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="activity-auditing">Activity Auditing</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="activity-auditing"
                  checked={settings.enableActivityAuditing || false}
                  onCheckedChange={(value) => updateSetting('enableActivityAuditing', value)}
                />
                <span className="text-sm text-gray-600">Monitor all user activities</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pattern-detection">Suspicious Pattern Detection</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="pattern-detection"
                  checked={settings.enableSuspiciousPatternDetection || false}
                  onCheckedChange={(value) => updateSetting('enableSuspiciousPatternDetection', value)}
                />
                <span className="text-sm text-gray-600">Detect unusual activity patterns</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-rate-limit">API Rate Limiting</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="api-rate-limit"
                  checked={settings.enableApiRateLimit || false}
                  onCheckedChange={(value) => updateSetting('enableApiRateLimit', value)}
                />
                <span className="text-sm text-gray-600">Limit API request frequency</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="two-factor">Two-Factor Authentication</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="two-factor"
                  checked={settings.enableTwoFactorAuth || false}
                  onCheckedChange={(value) => updateSetting('enableTwoFactorAuth', value)}
                />
                <span className="text-sm text-gray-600">Require 2FA for all users</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="login-attempts">Max Login Attempts/Minute</Label>
              <Input
                id="login-attempts"
                type="number"
                min="1"
                max="20"
                value={settings.maxLoginAttemptsPerMinute || 5}
                onChange={(e) => updateSetting('maxLoginAttemptsPerMinute', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input
                id="session-timeout"
                type="number"
                min="30"
                max="1440"
                value={settings.sessionTimeoutMinutes || 480}
                onChange={(e) => updateSetting('sessionTimeoutMinutes', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audit-retention">Audit Log Retention (days)</Label>
              <Input
                id="audit-retention"
                type="number"
                min="30"
                max="365"
                value={settings.auditLogRetentionDays || 90}
                onChange={(e) => updateSetting('auditLogRetentionDays', parseInt(e.target.value))}
              />
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