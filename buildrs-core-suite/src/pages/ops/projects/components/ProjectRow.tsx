import type { Project } from '../lib/types'
import { StatusBadge } from './StatusBadge'
import { ProjectHealthBadge } from './ProjectHealthBadge'

export function ProjectRow({ p, density, visible, onOpen }: {
  p: Project
  density: 'compact'|'roomy'
  visible: Record<'owner'|'openTasks'|'overdueTasks'|'dueDate'|'health', boolean>
  onOpen: (id: string) => void
}) {
  const pad = density === 'compact' ? 'py-2' : 'py-3'
  const due = p.dueDate ? new Date(p.dueDate).toLocaleDateString() : '—'
  const upd = new Date(p.updatedAt).toLocaleDateString()
  return (
    <tr className={`border-b border-border/20 hover:bg-muted/50 cursor-pointer`} onClick={() => onOpen(p.id)} aria-label={`Open project ${p.name}`}>
      <td className={`px-3 ${pad} truncate`}>
        <div className="flex items-center gap-2">
          <button className="text-amber-500" aria-label="Favoriet (todo)">★</button>
          <span className="font-medium truncate">{p.name}</span>
        </div>
      </td>
      <td className={`px-3 ${pad}`}><StatusBadge value={p.status} /></td>
      {visible.health && <td className={`px-3 ${pad}`}><ProjectHealthBadge value={p.health} /></td>}
      {visible.dueDate && <td className={`px-3 ${pad}`}>{due}</td>}
      {visible.owner && <td className={`px-3 ${pad}`}><OwnerCell name={p.owner.name} initials={p.owner.initials} /></td>}
      {visible.openTasks && <td className={`px-3 ${pad}`}>{p.openTasks}</td>}
      {visible.overdueTasks && <td className={`px-3 ${pad}`}>{p.overdueTasks}</td>}
      <td className={`px-3 ${pad}`}>{upd}</td>
    </tr>
  )
}

function OwnerCell({ initials, name }: { initials: string; name: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-6 w-6 flex items-center justify-center rounded-full bg-muted text-[11px]">{initials}</div>
      <span className="truncate">{name}</span>
    </div>
  )
}

