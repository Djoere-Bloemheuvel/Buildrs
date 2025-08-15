
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { TableSkeleton } from './SectionSkeleton'
import { EmptyState } from './EmptyState'
import { getProjects } from '../lib/fetchers'
import type { Project, ProjectFilters } from '../lib/types'
import { ProjectRow } from './ProjectRow'
import { useDensity, useColumnVisibility } from './ProjectsToolbar'

export function ProjectsTable() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const { density } = useDensity()
  const { visible } = useColumnVisibility()
  const [rows, setRows] = useState<Project[] | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const page = Number(params.get('page') ?? '1')
  const pageSize = Number(params.get('pageSize') ?? '25')
  const q = params.get('q') ?? undefined
  const status = (params.get('status') ?? 'all') as ProjectFilters['status']
  const ownerId = (params.get('ownerId') ?? 'all') as string
  const health = (params.get('health') ?? 'all') as ProjectFilters['health']
  const due = (params.get('due') ?? 'all') as ProjectFilters['due']
  const sort = (params.get('sort') ?? 'updated') as NonNullable<ProjectFilters['sort']>
  const group = params.get('group') ?? 'none'

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    setRows(null)
    getProjects({ page, pageSize, q, status, ownerId, health, due, sort })
      .then(({ items, total }) => { if (active) { setRows(items); setTotal(total) } })
      .catch(e => { if (active) setError(e?.message || 'Kon projecten laden') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, pageSize, q, status, ownerId, health, due, sort])

  function openProject(id: string) { nav(`/ops/projects/${id}?tab=overview`) }

  if (loading) return <TableSkeleton />
  if (error) return <div className="p-4 text-destructive">{error}</div>
  if (!rows || rows.length === 0) return <EmptyState />

  return (
    <div className="rounded-2xl border border-border/40 bg-background/40">
      <div className="overflow-auto">
        {/* Grouping header if enabled */}
        {group !== 'none' && (
          <div className="px-3 py-2 text-xs text-muted-foreground">Groeperen op: {group}</div>
        )}
        <table role="table" className="w-full text-sm">
          <thead className="sticky top-0 text-xs text-muted-foreground bg-background">
            <tr className="border-b border-border/40">
              <th scope="col" className="px-3 py-2 text-left">Naam</th>
              <th scope="col" className="px-3 py-2 text-left">Status</th>
              {visible.health && <th scope="col" className="px-3 py-2 text-left">Gezondheid</th>}
              {visible.dueDate && <th scope="col" className="px-3 py-2 text-left">Deadline</th>}
              {visible.owner && <th scope="col" className="px-3 py-2 text-left">Eigenaar</th>}
              {visible.openTasks && <th scope="col" className="px-3 py-2 text-left">Open taken</th>}
              {visible.overdueTasks && <th scope="col" className="px-3 py-2 text-left">Overdue</th>}
              <th scope="col" className="px-3 py-2 text-left">Laatste update</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(p => (
              <ProjectRow key={p.id} p={p} density={density} visible={visible} onOpen={openProject} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
