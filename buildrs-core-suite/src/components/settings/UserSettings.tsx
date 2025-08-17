import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface UserSettingsProps {
  clientId: any;
  currentSettings: any;
}

export function UserSettings({ clientId, currentSettings }: UserSettingsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Team member access and permissions coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">User management features will be available in a future update.</p>
        </CardContent>
      </Card>
    </div>
  );
}