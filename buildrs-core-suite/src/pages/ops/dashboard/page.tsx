
import { CardSection } from '../components/CardSection'
import { TaskListToday } from '../components/TaskListToday'
import { MiniAgenda } from '../components/MiniAgenda'
import { InboxPreview } from '../components/InboxPreview'
import { NextBestActions } from '../components/NextBestActions'
import FocusTimer from '../components/FocusTimer'

// Mock data types to match expected interfaces
type TodayTask = {
  id: string
  title: string
  project: string
  priority: string
  due: string
  dueReadable: string
  assigneeName: string
  status: string
}

type CalEvent = {
  id: string
  title: string
  start: string
  end: string
  startReadable: string
  endReadable: string
  source: string
}

type AutomationStats = {
  success_count: number
  error_count: number
  pending_count: number
}

export default function OpsDashboardPage() {
  // Mock data for now
  const todayTasks: TodayTask[] = []
  const overdueItems: TodayTask[] = []
  const calendar: CalEvent[] = []
  const automationStats: AutomationStats = {
    success_count: 0,
    error_count: 0,
    pending_count: 0
  }

  return (
    <main className="container mx-auto px-4 py-6 space-y-6 max-w-screen-xl">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold">Operations Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overzicht van dagelijkse taken, agenda en belangrijke acties.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Tasks */}
        <div className="space-y-4">
          <CardSection title="Vandaag" icon="ListChecks">
            <TaskListToday tasks={todayTasks} overdueItems={overdueItems} />
          </CardSection>
          
          <CardSection title="Automatisering" icon="ListChecks">
            <div className="text-sm text-muted-foreground p-4">
              {automationStats.success_count} succesvol, {automationStats.error_count} fouten, {automationStats.pending_count} lopend
            </div>
          </CardSection>
        </div>

        {/* Middle column - Calendar */}
        <div className="space-y-4">
          <CardSection title="Agenda" icon="CalendarRange">
            <MiniAgenda events={calendar} />
          </CardSection>
          
          <CardSection title="Focus Timer" icon="Timer">
            <FocusTimer tasks={[]} />
          </CardSection>
        </div>

        {/* Right column - Inbox & Actions */}
        <div className="space-y-4">
          <CardSection title="Inbox Preview" icon="Inbox">
            <InboxPreview />
          </CardSection>
          
          <CardSection title="Volgende Acties" icon="Sparkles">
            <NextBestActions />
          </CardSection>
        </div>
      </div>
    </main>
  )
}
