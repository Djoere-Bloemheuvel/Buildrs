
type CalEvent = {
  id: string
  title: string
  start: string
  end: string
  startReadable: string
  endReadable: string
  source: string
}

type MiniAgendaProps = {
  events: CalEvent[]
}

export function MiniAgenda({ events }: MiniAgendaProps) {
  if (events.length === 0) {
    return <p className="text-muted-foreground">Geen afspraken in de komende 48 uur.</p>;
  }

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
  );
}
