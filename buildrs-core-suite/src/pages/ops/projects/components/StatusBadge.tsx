import type { ProjectStatus } from '../lib/types'

export function StatusBadge({ value }: { value: ProjectStatus }) {
  const label = value === 'active' ? 'Actief' : value === 'on_hold' ? 'Op pauze' : value === 'completed' ? 'Afgerond' : 'Gearchiveerd'
  const cls = value === 'active'
    ? 'bg-primary/10 text-primary'
    : value === 'on_hold'
    ? 'bg-amber-500/15 text-amber-600'
    : value === 'completed'
    ? 'bg-emerald-500/15 text-emerald-600'
    : 'bg-muted text-muted-foreground'
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${cls}`}>{label}</span>
}

