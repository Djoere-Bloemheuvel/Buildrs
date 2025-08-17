import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Activity, MessageSquare, Zap, Shield, Gauge, Link, Users, Bell, Palette, Database } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

// Import settings components
import { ActivityLoggingSettings } from "@/components/settings/ActivityLoggingSettings";
import { CommunicationSettings } from "@/components/settings/CommunicationSettings";
import { CampaignSettings } from "@/components/settings/CampaignSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { PerformanceSettings } from "@/components/settings/PerformanceSettings";
import { IntegrationSettings } from "@/components/settings/IntegrationSettings";
import { UserSettings } from "@/components/settings/UserSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { UISettings } from "@/components/settings/UISettings";
import { DataManagementSettings } from "@/components/settings/DataManagementSettings";

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("activity");

  // Get client info - in real implementation, you'd get this from context/auth
  const clientId = "k272m9q2dxvphjyh0kx9w8pvd56zfjrf" as any; // Replace with actual client ID from auth context

  // Load current settings
  const currentSettings = useQuery(api.settings.getClientSettings, { clientId });
  const integrationStatus = useQuery(api.settings.getIntegrationStatus, { clientId });

  if (!currentSettings) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const settingsTabs = [
    {
      id: "activity",
      label: "Activity Logging",
      icon: Activity,
      description: "Configure activity tracking and logging",
      component: ActivityLoggingSettings,
      badge: currentSettings.activityLogging?.enabled ? "Active" : "Disabled"
    },
    {
      id: "communications",
      label: "Communications",
      icon: MessageSquare,
      description: "Email, LinkedIn, and phone settings",
      component: CommunicationSettings,
      badge: Object.values(currentSettings.communications?.email?.providers || {}).some((p: any) => p.enabled) ? "Active" : "Setup Required"
    },
    {
      id: "campaigns",
      label: "Campaign Automation",
      icon: Zap,
      description: "Automation and campaign settings",
      component: CampaignSettings,
      badge: currentSettings.campaigns?.automation?.enableSmartSequencing ? "Active" : "Basic"
    },
    {
      id: "integrations",
      label: "Integrations",
      icon: Link,
      description: "Third-party service connections",
      component: IntegrationSettings,
      badge: integrationStatus ? `${Object.values(integrationStatus).filter((status: any) => status.status === 'active').length}/4 Active` : "Loading"
    },
    {
      id: "security",
      label: "Security & Audit",
      icon: Shield,
      description: "Security monitoring and audit settings",
      component: SecuritySettings,
      badge: currentSettings.security?.enableActivityAuditing ? "Monitoring" : "Basic"
    },
    {
      id: "performance",
      label: "Performance",
      icon: Gauge,
      description: "System performance and optimization",
      component: PerformanceSettings,
      badge: currentSettings.performance?.enableCaching ? "Optimized" : "Standard"
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      description: "Email, in-app, and webhook notifications",
      component: NotificationSettings,
      badge: currentSettings.notifications?.email?.enabled ? "Active" : "Disabled"
    },
    {
      id: "ui",
      label: "UI & Experience",
      icon: Palette,
      description: "Interface and user experience settings",
      component: UISettings,
      badge: currentSettings.ui?.theme || "Light"
    },
    {
      id: "data",
      label: "Data Management",
      icon: Database,
      description: "Data retention and management policies",
      component: DataManagementSettings,
      badge: currentSettings.dataManagement?.autoEnrichment?.enabled ? "Auto-Enrichment" : "Manual"
    },
    {
      id: "users",
      label: "Users & Permissions",
      icon: Users,
      description: "Team member access and permissions",
      component: UserSettings,
      badge: "Team"
    }
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your CRM system configuration</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>Client:</span>
          <Badge variant="outline">{clientId}</Badge>
        </div>
      </div>

      <Separator />

      {/* Settings Navigation and Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {settingsTabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <Card 
                key={tab.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  activeTab === tab.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <IconComponent className={`h-5 w-5 ${activeTab === tab.id ? "text-blue-600" : "text-gray-600"}`} />
                    <Badge variant={activeTab === tab.id ? "default" : "secondary"} className="text-xs">
                      {tab.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-medium">{tab.label}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-gray-600">{tab.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Settings Content */}
        <div className="min-h-[600px]">
          {settingsTabs.map((tab) => {
            const SettingsComponent = tab.component;
            return (
              <div key={tab.id} className={activeTab === tab.id ? "block" : "hidden"}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <tab.icon className="h-6 w-6 text-blue-600" />
                      <div>
                        <CardTitle>{tab.label}</CardTitle>
                        <CardDescription>{tab.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SettingsComponent 
                      clientId={clientId}
                      currentSettings={currentSettings}
                      integrationStatus={integrationStatus}
                    />
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </Tabs>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-sm text-gray-500 pt-6 border-t">
        <div>
          Settings are saved automatically and synchronized across all sessions.
        </div>
        <div>
          Last updated: {currentSettings.updatedAt ? new Date(currentSettings.updatedAt).toLocaleString() : "Never"}
        </div>
      </div>
    </div>
  );
}