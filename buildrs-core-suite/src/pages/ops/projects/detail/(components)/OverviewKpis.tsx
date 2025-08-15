import { HealthBadge } from './HealthBadge'

export function OverviewKpis({ stats }: { stats: { open: number; overdue: number; pct: number; updatedAt: string; health: 'excellent'|'good'|'warn'|'risk' } }) {
  const items = [
    { label: 'Open taken', value: stats.open },
    { label: 'Overdue', value: stats.overdue },
    { label: '% voltooid', value: `${stats.pct}%` },
    { label: 'Laatst bijgewerkt', value: new Date(stats.updatedAt).toLocaleString() },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {items.map((it) => (
        <div key={it.label} className="rounded-2xl border border-border/40 bg-background/40 p-4">
          <div className="text-xs text-muted-foreground">{it.label}</div>
          <div className="text-2xl font-semibold">{it.value}</div>
        </div>
      ))}
      <div className="rounded-2xl border border-border/40 bg-background/40 p-4">
        <div className="text-xs text-muted-foreground">Gezondheid</div>
        <div className="mt-1"><HealthBadge value={stats.health} /></div>
      </div>
    </div>
  )
}

