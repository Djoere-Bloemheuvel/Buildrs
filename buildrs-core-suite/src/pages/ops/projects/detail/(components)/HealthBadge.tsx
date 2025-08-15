import type { Health } from '../lib/types'

export function HealthBadge({ value }: { value: Health }) {
  const label = value === 'excellent' ? 'Uitstekend' : value === 'good' ? 'Goed' : value === 'warn' ? 'Let op' : 'Risico'
  const cls = value === 'excellent'
    ? 'bg-emerald-500/15 text-emerald-500'
    : value === 'good'
    ? 'bg-blue-500/15 text-blue-500'
    : value === 'warn'
    ? 'bg-amber-500/15 text-amber-500'
    : 'bg-red-500/15 text-red-500'
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${cls}`}>{label}</span>
}

