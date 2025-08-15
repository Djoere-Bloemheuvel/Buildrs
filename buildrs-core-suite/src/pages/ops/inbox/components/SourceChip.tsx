import type { InboxItem } from '../lib/types'

export function SourceChip({ source }: { source: InboxItem['source'] }) {
  const cls = source === 'lead'
    ? 'bg-sky-500/15 text-sky-500'
    : source === 'sales'
    ? 'bg-emerald-500/15 text-emerald-500'
    : source === 'marketing'
    ? 'bg-pink-500/15 text-pink-500'
    : 'bg-indigo-500/15 text-indigo-500'
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs capitalize ${cls}`}>{source}</span>
}

