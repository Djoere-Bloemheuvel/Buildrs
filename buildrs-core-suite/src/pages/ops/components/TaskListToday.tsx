
import type { Task } from '../lib/types';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

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

type TaskListTodayProps = {
  tasks: TodayTask[]
  overdueItems: TodayTask[]
}

export function TaskListToday({ tasks, overdueItems }: TaskListTodayProps) {
  const empty = tasks.length === 0 && overdueItems.length === 0;

  if (empty) {
    return <p className="text-muted-foreground">Geen taken voor vandaag.</p>;
  }

  return (
    <div className="grid gap-4">
      <TaskGroup title="Vandaag" tasks={tasks.slice(0, 5)} />
      <TaskGroup title="Achterstallig" tasks={overdueItems.slice(0, 5)} />
    </div>
  );
}

function TaskGroup({ title, tasks }: { title: string; tasks: TodayTask[] }) {
  if (!tasks.length) return null;
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
              <TaskClientActions id={t.id} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AvatarInitials({ name }: { name: string }) {
  const initials = name.split(' ').map(s => s[0]?.toUpperCase()).slice(0, 2).join('');
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
      {initials || 'U'}
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const cls = status === 'Klaar'
    ? 'bg-emerald-600/20 text-emerald-300'
    : status === 'In behandeling'
      ? 'bg-amber-600/20 text-amber-300'
      : 'bg-muted text-muted-foreground';
  return <span className={`rounded-full px-2 py-0.5 text-[11px] ${cls}`}>{status}</span>;
}

function TaskClientActions({ id }: { id: string }) {
  const [done, setDone] = useState(false);
  const [snoozed, setSnoozed] = useState(false);
  return (
    <div className="flex items-center gap-1">
      <Button size="sm" variant={done ? 'secondary' : 'outline'} onClick={() => setDone(v => !v)} aria-label={done ? 'Markeer als niet klaar' : 'Markeer als klaar'}>
        {done ? 'Gereed' : 'Klaar'}
      </Button>
      <Button size="sm" variant={snoozed ? 'secondary' : 'outline'} onClick={() => setSnoozed(v => !v)} aria-label="Snooze">
        Snooze
      </Button>
    </div>
  );
}
