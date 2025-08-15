import type { InboxItem } from '../lib/types'
import { StatusChip } from './StatusChip'
import { SourceChip } from './SourceChip'
import { PriorityChip } from './PriorityChip'

export function InboxRow({ item, density, onOpen }: { item: InboxItem; density: 'compact'|'roomy'; onOpen: (it: InboxItem) => void }) {
  const pad = density === 'compact' ? 'py-2' : 'py-3'
  const age = item.ageMinutes < 60 ? `${item.ageMinutes}m` : `${Math.floor(item.ageMinutes/60)}u${item.ageMinutes%60||''}`
  return (
    <tr className={`border-b border-border/20 hover:bg-muted/50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`} onClick={() => onOpen(item)} tabIndex={0}>
      <td className={`px-3 ${pad}`}><StatusChip type={item.type} /></td>
      <td className={`px-3 ${pad} truncate`}>{item.title}</td>
      <td className={`px-3 ${pad}`}><SourceChip source={item.source} /></td>
      <td className={`px-3 ${pad}`}><PriorityChip value={item.priority} /></td>
      <td className={`px-3 ${pad}`}>{age}</td>
      <td className={`px-3 ${pad}`}>
        <span className="inline-flex items-center gap-1 text-xs text-primary/80 underline">Acties</span>
      </td>
    </tr>
  )
}

