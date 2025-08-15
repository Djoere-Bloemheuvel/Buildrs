import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Users, MessageSquare, Calendar, Target, TrendingUp, Activity } from 'lucide-react'

interface LinkedInStatsGridProps {
  stats: {
    connection_requests_sent: number
    new_connections: number
    messages_sent: number
    replies_received: number
    meetings_booked: number
    leads_generated: number
    response_rate: number
    connection_rate: number
  }
}

function LinkedInStatsGrid({ stats }: LinkedInStatsGridProps) {
  const statCards = [
    {
      title: 'Connection Requests',
      value: stats.connection_requests_sent.toLocaleString(),
      subtitle: `${stats.connection_rate}% acceptance rate`,
      icon: UserPlus,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      badge: `${stats.connection_rate}%`
    },
    {
      title: 'New Connections',
      value: stats.new_connections.toLocaleString(),
      subtitle: 'Active connections made',
      icon: Users,
      color: 'bg-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      textColor: 'text-green-600 dark:text-green-400',
      badge: 'This month'
    },
    {
      title: 'Messages & Replies',
      value: `${stats.messages_sent}/${stats.replies_received}`,
      subtitle: `${stats.response_rate}% response rate`,
      icon: MessageSquare,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
      textColor: 'text-purple-600 dark:text-purple-400',
      badge: `${stats.response_rate}%`
    },
    {
      title: 'Meetings & Leads',
      value: `${stats.meetings_booked}/${stats.leads_generated}`,
      subtitle: 'Booked meetings & qualified leads',
      icon: Target,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
      textColor: 'text-orange-600 dark:text-orange-400',
      badge: 'Hot 🔥'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden border-0 bg-gradient-to-br from-white/90 via-white/70 to-white/50 dark:from-slate-900/90 dark:via-slate-900/70 dark:to-slate-900/50 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
          {/* Glass morphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
          
          {/* Gradient border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <CardContent className="relative p-6 z-10">
            <div className="flex items-center justify-between mb-6">
              <div className={`relative p-4 rounded-2xl bg-gradient-to-br ${stat.color.replace('bg-', 'from-')}/20 ${stat.color.replace('bg-', 'to-')}/10 backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                {/* Icon glow effect */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.color.replace('bg-', 'from-')}/30 ${stat.color.replace('bg-', 'to-')}/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <stat.icon className={`relative w-6 h-6 ${stat.textColor} drop-shadow-sm`} />
              </div>
              <Badge variant="secondary" className="text-xs bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-sm">
                {stat.badge}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 tracking-wide">
                {stat.title}
              </h3>
              <p className="text-3xl font-black bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 dark:from-slate-100 dark:via-slate-200 dark:to-slate-300 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300 drop-shadow-sm">
                {stat.value}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {stat.subtitle}
              </p>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gradient-to-r from-transparent via-slate-200/50 dark:via-slate-700/50 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <div className={`w-2.5 h-2.5 rounded-full ${stat.color} shadow-sm animate-pulse`}></div>
                  <span>All campaigns</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Live</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default LinkedInStatsGrid;