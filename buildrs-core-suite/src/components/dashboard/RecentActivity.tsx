
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Calendar, 
  Target,
  FileText,
  Clock,
  User,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const iconBgByKey = {
  blue: { 
    dark: 'bg-blue-500/30 shadow-lg shadow-blue-500/40', 
    light: 'bg-blue-500/20',
    premiumBlack: 'bg-blue-500/25 shadow-lg shadow-blue-500/30'
  },
  emerald: { 
    dark: 'bg-emerald-500/30 shadow-lg shadow-emerald-500/40', 
    light: 'bg-emerald-500/20',
    premiumBlack: 'bg-emerald-500/25 shadow-lg shadow-emerald-500/30'
  },
  purple: { 
    dark: 'bg-purple-500/30 shadow-lg shadow-purple-500/40', 
    light: 'bg-purple-500/20',
    premiumBlack: 'bg-purple-500/25 shadow-lg shadow-purple-500/30'
  },
  amber: { 
    dark: 'bg-amber-500/30 shadow-lg shadow-amber-500/40', 
    light: 'bg-amber-500/20',
    premiumBlack: 'bg-amber-500/25 shadow-lg shadow-amber-500/30'
  },
  rose: { 
    dark: 'bg-rose-500/30 shadow-lg shadow-rose-500/40', 
    light: 'bg-rose-500/20',
    premiumBlack: 'bg-rose-500/25 shadow-lg shadow-rose-500/30'
  },
} as const;

const iconColors = {
  blue: {
    dark: 'text-blue-300',
    light: 'text-blue-600',
    premiumBlack: 'text-blue-300'
  },
  emerald: {
    dark: 'text-emerald-300',
    light: 'text-emerald-600',
    premiumBlack: 'text-emerald-300'
  },
  purple: {
    dark: 'text-purple-300',
    light: 'text-purple-600',
    premiumBlack: 'text-purple-300'
  },
  amber: {
    dark: 'text-amber-300',
    light: 'text-amber-600',
    premiumBlack: 'text-amber-300'
  },
  rose: {
    dark: 'text-rose-300',
    light: 'text-rose-600',
    premiumBlack: 'text-rose-300'
  }
} as const;

const activities = [
  {
    id: 1,
    type: "communication",
    icon: MessageCircle,
    iconColorKey: "blue" as const,
    iconBgKey: "blue" as const,
    title: "Nieuwe email ontvangen",
    description: "Van Sarah van TechStart BV",
    time: "2 min geleden",
    user: {
      name: "Sarah",
      initials: "SV"
    }
  },
  {
    id: 2,
    type: "meeting",
    icon: Calendar,
    iconColorKey: "emerald" as const,
    iconBgKey: "emerald" as const,
    title: "Meeting gepland",
    description: "Demo call met InnovateCorp volgende week",
    time: "15 min geleden",
    user: {
      name: "Mark",
      initials: "MJ"
    }
  },
  {
    id: 3,
    type: "campaign",
    icon: Target,
    iconColorKey: "purple" as const,
    iconBgKey: "purple" as const,
    title: "Campagne gestart",
    description: "LinkedIn outreach campagne 'Q1 2024' is live",
    time: "1 uur geleden",
    user: {
      name: "Lisa",
      initials: "LK"
    }
  },
  {
    id: 4,
    type: "task",
    icon: FileText,
    iconColorKey: "amber" as const, 
    iconBgKey: "amber" as const,
    title: "Taak voltooid",
    description: "Proposal voor BuildCorp afgerond",
    time: "3 uur geleden",
    user: {
      name: "Tom",
      initials: "TD"
    }
  },
  {
    id: 5,
    type: "contact",
    icon: User,
    iconColorKey: "rose" as const,
    iconBgKey: "rose" as const,
    title: "Contact toegevoegd",
    description: "Nieuwe lead van website formulier",
    time: "5 uur geleden",
    user: {
      name: "Anna",
      initials: "AB"
    }
  }
];

// Simple avatar component fallback to avoid Radix UI issues
const SimpleAvatar = ({ initials, theme }: { initials: string; theme: string }) => (
  <div className={`w-8 h-8 border rounded-full flex items-center justify-center ${
    theme === 'premium-white' 
      ? 'border-gray-200 bg-gray-50' 
      : 'border-white/[0.1] bg-white/[0.05]'
  }`}>
    <span className={`text-xs font-medium ${
      theme === 'premium-white' ? 'text-gray-700' : 'text-white'
    }`}>{initials}</span>
  </div>
);

export const RecentActivity = React.memo(function RecentActivity() {
  const { theme } = useTheme();
  
  const getIconBg = (bgKey: keyof typeof iconBgByKey) => {
    if (theme === 'premium-white') return iconBgByKey[bgKey].light;
    if (theme === 'premium-black') return iconBgByKey[bgKey].premiumBlack;
    return iconBgByKey[bgKey].dark;
  };

  const getIconColor = (colorKey: keyof typeof iconColors) => {
    if (theme === 'premium-white') return iconColors[colorKey].light;
    if (theme === 'premium-black') return iconColors[colorKey].premiumBlack;
    return iconColors[colorKey].dark;
  };
  
  return (
    <Card role="region" aria-label="Recente activiteit" className={`backdrop-blur-xl rounded-2xl overflow-hidden soft-press border-0 ${
      theme === 'premium-white' 
        ? 'bg-white' 
        : 'bg-[#0C0F14]'
    }`}>
      <CardHeader className="pb-8 pt-8 px-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <CardTitle className={`text-xl font-semibold ${
              theme === 'premium-white' ? 'text-gray-900' : 'text-white'
            }`}>
              Recente Activiteit
            </CardTitle>
            <CardDescription className={`text-sm mt-1 ${
              theme === 'premium-white' ? 'text-gray-500' : 'text-[#9CA3AF]'
            }`}>
              Laatste updates en gebeurtenissen
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-8 pb-8" role="list">
        {activities.map((activity, index) => (
          <div 
            key={activity.id}
            role="listitem"
            className={`flex items-center gap-5 p-5 rounded-xl transition-all duration-200 group cursor-pointer ${
              theme === 'premium-white' 
                ? 'hover:bg-gray-50' 
                : 'hover:bg-white/[0.03]'
            } ${
              index < activities.length - 1 
                ? (theme === 'premium-white' 
                    ? 'border-b border-gray-100' 
                    : 'border-b border-white/[0.03]'
                  )
                : ''
            }`}
          >
            {/* Activity Icon with Glow */}
            <div className={`w-12 h-12 rounded-full ${getIconBg(activity.iconBgKey)} flex items-center justify-center flex-shrink-0 transition-all duration-300`}>
              <activity.icon className={`w-6 h-6 ${getIconColor(activity.iconColorKey)} drop-shadow-sm`} strokeWidth={1.5} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className={`font-medium text-sm transition-colors ${
                    theme === 'premium-white' 
                      ? 'text-gray-900 group-hover:text-blue-600' 
                      : 'text-white group-hover:text-blue-300'
                  }`}>
                    {activity.title}
                  </p>
                  <p className={`text-sm truncate mt-1.5 ${
                    theme === 'premium-white' ? 'text-gray-500' : 'text-[#9CA3AF]'
                  }`}>
                    {activity.description}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs ${
                    theme === 'premium-white' ? 'text-gray-400' : 'text-[#9CA3AF]'
                  }`}>
                    {activity.time}
                  </span>
                </div>
              </div>
            </div>

            {/* User Avatar */}
            <SimpleAvatar initials={activity.user.initials} theme={theme} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
});
