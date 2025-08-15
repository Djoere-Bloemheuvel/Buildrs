import { useEffect, useMemo, useState } from 'react'
import { CardSection } from './ops/components/CardSection'
import { SectionSkeleton } from './ops/components/SectionSkeleton'
import FocusTimer from './ops/components/FocusTimer'
import { getCalendar48h, getInboxPreview, getNextActions, getTasksToday } from './ops/lib/fetchers'
import type { Task, CalendarEvent, InboxItem, NextAction } from './ops/lib/types'
import { cn } from '@/lib/utils'

export default function OpsPage() {
  const [tasks, setTasks] = useState<{ today: Task[]; overdue: Task[] } | null>(null)
  const [events, setEvents] = useState<CalendarEvent[] | null>(null)
  const [inbox, setInbox] = useState<InboxItem[] | null>(null)
  const [nextActions, setNextActions] = useState<NextAction[] | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [t, e, i, n] = await Promise.all([
          getTasksToday(),
          getCalendar48h(),
          getInboxPreview(5),
          getNextActions(),
        ])
        if (!active) return
        setTasks(t)
        setEvents(e)
        setInbox(i)
        setNextActions(n)
      } catch (e: any) {
        if (!active) return
        setErr(e?.message || 'Er ging iets mis bij laden van dashboard')
      }
    })()
    return () => { active = false }
  }, [])

  const taskOptions = useMemo(() => {
    const list = tasks ? [...tasks.today, ...tasks.overdue] : []
    return list.slice(0, 10).map(t => ({ id: t.id, label: t.title }))
  }, [tasks])

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-12 gap-4">
        {/* Row 1 */}
        <div className="col-span-12 xl:col-span-7">
          <CardSection title="Mijn Taken (vandaag & achterstallig)" icon="ListChecks">
            {!tasks && !err && <SectionSkeleton variant="tasks" />}
            {err && <p className="text-destructive">{err}</p>}
            {tasks && <TasksBlock today={tasks.today} overdue={tasks.overdue} />}
          </CardSection>
        </div>
        <div className="col-span-12 xl:col-span-5">
          <CardSection title="Mini-agenda (48 uur)" icon="CalendarRange">
            {!events && !err && <SectionSkeleton variant="agenda" />}
            {err && <p className="text-destructive">{err}</p>}
            {events && <AgendaBlock events={events} />}
          </CardSection>
        </div>

        {/* Row 2 */}
        <div className="col-span-12 xl:col-span-7">
          <CardSection title="Inbox-voorvertoning" icon="Inbox">
            {!inbox && !err && <SectionSkeleton variant="inbox" />}
            {err && <p className="text-destructive">{err}</p>}
            {inbox && <InboxBlock items={inbox} />}
          </CardSection>
        </div>
        <div className="col-span-12 xl:col-span-5">
          <CardSection title="Focustimer" icon="Timer">
            <FocusTimer tasks={taskOptions} />
          </CardSection>
        </div>

        {/* Row 3 */}
        <div className="col-span-12">
          <CardSection title="Next Best Actions (AI)" icon="Sparkles">
            {!nextActions && !err && <SectionSkeleton variant="next" />}
            {err && <p className="text-destructive">{err}</p>}
            {nextActions && <NextBlock list={nextActions} />}
          </CardSection>
        </div>
      </div>
    </main>
  )
}

function TasksBlock({ today, overdue }: { today: Task[]; overdue: Task[] }) {
  if (today.length === 0 && overdue.length === 0) return <p className="text-muted-foreground">Geen taken voor vandaag.</p>
  return (
    <div className="grid gap-4">
      <TaskGroup title="Vandaag" tasks={today.slice(0, 5)} />
      <TaskGroup title="Achterstallig" tasks={overdue.slice(0, 5)} />
    </div>
  )
}

function TaskGroup({ title, tasks }: { title: string; tasks: Task[] }) {
  if (!tasks.length) return null
  return (
    <section aria-label={title} className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="space-y-2">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{t.title}</span>
                <span className="text-[11px] text-muted-foreground">· {t.project}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                  {t.priority}
                </span>
                <span>{t.dueReadable}</span>
              </div>
            </div>
            <div className="ml-3 flex shrink-0 items-center gap-2">
              <AvatarInitials name={t.assigneeName} />
              <StatusChip status={t.status} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function AvatarInitials({ name }: { name: string }) {
  const initials = name.split(' ').map(s => s[0]?.toUpperCase()).slice(0, 2).join('')
  return <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">{initials || 'U'}</div>
}

function StatusChip({ status }: { status: Task['status'] }) {
  const cls = status === 'Klaar' ? 'bg-emerald-600/20 text-emerald-300' : status === 'In behandeling' ? 'bg-amber-600/20 text-amber-300' : 'bg-muted text-muted-foreground'
  return <span className={cn('rounded-full px-2 py-0.5 text-[11px]', cls)}>{status}</span>
}

function AgendaBlock({ events }: { events: CalendarEvent[] }) {
  if (events.length === 0) return <p className="text-muted-foreground">Geen afspraken in de komende 48 uur.</p>
  return (
    <ul className="space-y-2" aria-label="Afspraken komende 48 uur">
      {events.map(ev => (
        <li key={ev.id} className="rounded-lg border border-border/40 bg-background/40 p-3">
          <div className="flex items-center justify-between">
            <div className="truncate font-medium">{ev.title}</div>
            <span className="text-[11px] text-muted-foreground">{ev.source}</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{ev.startReadable} – {ev.endReadable}</div>
          <div className="mt-2">
            <a href="/ops/calendar" className="text-xs text-primary underline" aria-label="Open kalender">Open kalender</a>
          </div>
        </li>
      ))}
    </ul>
  )
}

function InboxBlock({ items }: { items: InboxItem[] }) {
  if (items.length === 0) return <p className="text-muted-foreground">Alles onder controle 🎉</p>
  return (
    <div className="space-y-2">
      <table className="w-full text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr className="border-b border-border/40">
            <th className="px-2 py-2 text-left">Titel</th>
            <th className="px-2 py-2 text-left">Bron</th>
            <th className="px-2 py-2 text-left">Prioriteit</th>
            <th className="px-2 py-2 text-left">Leeftijd</th>
          </tr>
        </thead>
        <tbody>
          {items.map(row => (
            <tr key={row.id} className="border-b border-border/20">
              <td className="px-2 py-2">{row.title}</td>
              <td className="px-2 py-2">{row.source}</td>
              <td className="px-2 py-2">{row.priority}</td>
              <td className="px-2 py-2">{row.ageReadable}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pt-1">
        <a href="/ops/inbox" className="text-xs text-primary underline" aria-label="Open Inbox">Open Inbox</a>
      </div>
    </div>
  )
}

function NextBlock({ list }: { list: NextAction[] }) {
  if (list.length === 0) return <p className="text-muted-foreground">Geen suggesties beschikbaar.</p>
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {list.slice(0, 3).map(x => (
        <div key={x.id} className="rounded-xl border border-border/40 bg-background/40 p-4">
          <div className="font-medium">{x.title}</div>
          <p className="mt-1 text-sm text-muted-foreground">{x.summary}</p>
          <div className="mt-2 text-xs text-primary/80">{x.impact}</div>
          <div className="mt-3">
            <button className="text-xs text-primary underline" aria-label="Bekijk suggestie">Bekijk suggestie</button>
          </div>
        </div>
      ))}
    </div>
  )
}

