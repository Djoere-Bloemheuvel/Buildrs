import type { InboxType } from '../lib/types'

export function StatusChip({ type }: { type: InboxType }) {
  const label = type === 'needs_approval' ? 'Needs Approval' : 'Workflow Issue'
  const cls = type === 'needs_approval' ? 'bg-primary/10 text-primary' : 'bg-purple-500/15 text-purple-500'
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${cls}`}>{label}</span>
}

