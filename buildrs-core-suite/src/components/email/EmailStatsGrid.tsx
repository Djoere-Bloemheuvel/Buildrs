
import { Card, CardContent } from '@/components/ui/card'
import { Mail, TrendingUp, MessageSquare, Calendar } from 'lucide-react'

interface EmailStatsGridProps {
  stats: {
    totalSent: number
    replyRate: number
    replies: number
    conversions: number
  }
}

export default function EmailStatsGrid({ stats }: EmailStatsGridProps) {
  const statCards = [
    {
      title: 'Verstuurde E-mails',
      value: stats.totalSent.toLocaleString(),
      icon: Mail,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Reply Rate',
      value: `${stats.replyRate}%`,
      icon: TrendingUp,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      textColor: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      title: 'Reacties',
      value: stats.replies.toLocaleString(),
      icon: MessageSquare,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
      textColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Conversies',
      value: stats.conversions.toLocaleString(),
      icon: Calendar,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
      textColor: 'text-orange-600 dark:text-orange-400'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-200 group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 group-hover:scale-105 transition-transform duration-200">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <div className={`w-2 h-2 rounded-full ${stat.color}`}></div>
                <span>Totaal alle campagnes</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
