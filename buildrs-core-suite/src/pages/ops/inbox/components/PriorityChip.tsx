import type { Priority } from '../lib/types'

export function PriorityChip({ value }: { value: Priority }) {
  const label = value === 1 ? 'Kritiek' : value === 2 ? 'Hoog' : value === 3 ? 'Normaal' : value === 4 ? 'Laag' : 'Info'
  const cls = value === 1
    ? 'bg-red-500/15 text-red-500'
    : value === 2
    ? 'bg-orange-500/15 text-orange-500'
    : value === 3
    ? 'bg-amber-500/15 text-amber-500'
    : value === 4
    ? 'bg-emerald-500/15 text-emerald-500'
    : 'bg-sky-500/15 text-sky-500'
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${cls}`}>{label}</span>
}

