import type { ProjectMember } from '../lib/types'

export function OverviewTeam({ members }: { members: ProjectMember[] }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-background/40 p-4">
      <div className="text-sm font-medium mb-3">Team</div>
      <div className="flex flex-wrap gap-3">
        {members.map(m => (
          <div key={m.id} className="flex items-center gap-2">
            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-muted text-xs font-semibold">{m.initials}</div>
            <div className="text-sm">{m.name} <span className="text-muted-foreground">· {m.role}</span></div>
          </div>
        ))}
        {members.length === 0 && <div className="text-sm text-muted-foreground">Nog geen leden.</div>}
      </div>
    </div>
  )
}

