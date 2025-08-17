import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, Save, RotateCcw, CheckCircle, XCircle, TestTube } from "lucide-react";
import { toast } from "sonner";

interface IntegrationSettingsProps {
  clientId: any;
  currentSettings: any;
  integrationStatus?: any;
}

export function IntegrationSettings({ clientId, currentSettings, integrationStatus }: IntegrationSettingsProps) {
  const [settings, setSettings] = useState(currentSettings.integrations || {});
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
        section: "integrations"
      });
      toast.success("Integration settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (integration: string) => {
    setTesting(integration);
    try {
      const credentials = settings[integration] || {};
      const result = await testConnection({ clientId, integration, credentials });
      
      if (result.success) {
        toast.success(`${integration} connection successful`);
      } else {
        toast.error(`${integration} connection failed: ${result.message}`);
      }
    } catch (error) {
      toast.error(`Failed to test ${integration} connection`);
    } finally {
      setTesting(null);
    }
  };

  const updateIntegration = (integration: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [integration]: { ...prev[integration], [key]: value }
    }));
  };

  const integrations = [
    {
      key: "apollo",
      name: "Apollo",
      description: "Lead enrichment and data provider",
      fields: [
        { key: "apiKey", label: "API Key", type: "password" },
        { key: "autoEnrich", label: "Auto Enrich", type: "switch" },
        { key: "enrichOnCreate", label: "Enrich on Contact Creation", type: "switch" },
        { key: "creditLimit", label: "Credit Limit", type: "number" }
      ]
    },
    {
      key: "instantly",
      name: "Instantly",
      description: "Email campaign automation",
      fields: [
        { key: "apiKey", label: "API Key", type: "password" },
        { key: "webhookSecret", label: "Webhook Secret", type: "password" },
        { key: "autoSync", label: "Auto Sync", type: "switch" }
      ]
    },
    {
      key: "phantombuster",
      name: "PhantomBuster",
      description: "LinkedIn automation",
      fields: [
        { key: "apiKey", label: "API Key", type: "password" },
        { key: "containerId", label: "Container ID", type: "text" },
        { key: "autoSync", label: "Auto Sync", type: "switch" }
      ]
    },
    {
      key: "aircall",
      name: "AirCall",
      description: "Phone call management",
      fields: [
        { key: "apiKey", label: "API Key", type: "password" },
        { key: "webhookSecret", label: "Webhook Secret", type: "password" },
        { key: "autoLog", label: "Auto Log Calls", type: "switch" }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {integrations.map((integration) => {
        const status = integrationStatus?.[integration.key];
        const isActive = status?.status === "active";
        const isConfigured = status?.configured;

        return (
          <Card key={integration.key}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  {integration.name}
                </div>
                <div className="flex items-center gap-2">
                  {isActive ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <Badge variant={isActive ? "default" : "secondary"}>
                    {isActive ? "Active" : isConfigured ? "Configured" : "Not Configured"}
                  </Badge>
                </div>
              </CardTitle>
              <CardDescription>{integration.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`${integration.key}-enabled`}>Enable {integration.name}</Label>
                <Switch
                  id={`${integration.key}-enabled`}
                  checked={settings[integration.key]?.enabled || false}
                  onCheckedChange={(value) => updateIntegration(integration.key, 'enabled', value)}
                />
              </div>

              {settings[integration.key]?.enabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {integration.fields.map((field) => (
                      <div key={field.key} className="space-y-2">
                        <Label htmlFor={`${integration.key}-${field.key}`}>{field.label}</Label>
                        {field.type === "switch" ? (
                          <Switch
                            id={`${integration.key}-${field.key}`}
                            checked={settings[integration.key]?.[field.key] || false}
                            onCheckedChange={(value) => updateIntegration(integration.key, field.key, value)}
                          />
                        ) : (
                          <Input
                            id={`${integration.key}-${field.key}`}
                            type={field.type}
                            value={settings[integration.key]?.[field.key] || ""}
                            onChange={(e) => updateIntegration(integration.key, field.key, 
                              field.type === "number" ? parseInt(e.target.value) || 0 : e.target.value
                            )}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => handleTest(integration.key)}
                      disabled={testing === integration.key}
                      className="flex items-center gap-2"
                    >
                      <TestTube className="h-4 w-4" />
                      {testing === integration.key ? 'Testing...' : 'Test Connection'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}

      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={() => resetSettings({ clientId, section: "integrations" })}
          className="flex items-center gap-2"
        >
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