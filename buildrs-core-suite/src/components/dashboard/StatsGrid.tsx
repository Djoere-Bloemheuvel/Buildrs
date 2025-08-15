
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Target, 
  Calendar, 
  TrendingUp,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const glowBg = {
  blue: "bg-blue-500/10",
  emerald: "bg-emerald-500/10",
  amber: "bg-amber-500/10",
  rose: "bg-rose-500/10",
} as const;

const stats = [
  {
    name: "Totaal Contacten",
    value: "2,847",
    change: "+12.5%",
    changeType: "positive",
    icon: Users,
    gradient: "from-blue-500 to-purple-600",
    glowKey: "blue" as const,
  },
  {
    name: "Actieve Campagnes", 
    value: "23",
    change: "+3 deze week",
    changeType: "positive",
    icon: Target,
    gradient: "from-emerald-500 to-teal-600",
    glowKey: "emerald" as const,
  },
  {
    name: "Geplande Meetings",
    value: "16",
    change: "Deze week",
    changeType: "neutral",
    icon: Calendar,
    gradient: "from-amber-500 to-orange-600",
    glowKey: "amber" as const,
  },
  {
    name: "Response Rate",
    value: "73%", 
    change: "+5.2%",
    changeType: "positive",
    icon: TrendingUp,
    gradient: "from-pink-500 to-rose-600",
    glowKey: "rose" as const,
  }
];

export const StatsGrid = React.memo(function StatsGrid() {
  const { theme } = useTheme();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {stats.map((stat) => (
        <div key={stat.name} className="relative supports-[backdrop-filter]:backdrop-blur-xl motion-reduce:transition-none motion-reduce:transform-none">
          {/* Subtle glow backdrop */}
          <div className={`absolute inset-0 rounded-2xl ${glowBg[stat.glowKey]} blur-xl scale-105 opacity-60`} />
          
          <Card 
            className={`relative overflow-hidden rounded-2xl hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 supports-[backdrop-filter]:backdrop-blur-xl soft-press border-0 ${
              theme === 'premium-white' 
                ? 'bg-white hover:shadow-gray-200/40' 
                : 'bg-white/[0.02] hover:shadow-black/20'
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6 px-6">
              <CardTitle className={`text-sm font-medium tracking-wide uppercase ${
                theme === 'premium-white' ? 'text-gray-500' : 'text-[#9CA3AF]'
              }`}>
                {stat.name}
              </CardTitle>
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-7 h-7 text-white" strokeWidth={1.5} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6">
              <div className={`text-4xl font-bold tracking-tight ${
                theme === 'premium-white' ? 'text-gray-900' : 'text-white'
              }`}>
                {stat.value}
              </div>
              <Badge 
                variant={stat.changeType === 'positive' ? 'default' : 'secondary'}
                className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                  stat.changeType === 'positive' 
                    ? (theme === 'premium-white' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      )
                    : (theme === 'premium-white'
                        ? 'bg-gray-50 text-gray-600 border-gray-200'
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      )
                }`}
              >
                {stat.change}
              </Badge>
            </CardContent>
            
            {/* Subtle gradient overlay */}
            <div className={`absolute inset-0 pointer-events-none ${
              theme === 'premium-white' 
                ? 'bg-gradient-to-br from-transparent via-transparent to-gray-50/20' 
                : 'bg-gradient-to-br from-transparent via-transparent to-white/[0.01]'
            }`} />
          </Card>
        </div>
      ))}
    </div>
  );
});
