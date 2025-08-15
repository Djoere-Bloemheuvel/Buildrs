import type { Project, ProjectFilters, PagedResult, ProjectStats } from './types'
import { supabase } from '@/integrations/supabase/client'

function toInitials(name: string | null | undefined): string {
  if (!name) return '—'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export async function getProjects(
  filters: Required<Pick<ProjectFilters, 'page' | 'pageSize'>> & ProjectFilters
): Promise<PagedResult<Project>> {
  const from = Math.max(0, (filters.page - 1) * filters.pageSize)
  const to = from + filters.pageSize - 1

  // Build the basic query
  // Use a widened type to avoid TS2589 deep instantiation issues with supabase-js generics
  let queryBuilder: any = supabase
    .from('projects')
    .select(
      'id, name, status, owner_id, due_date, updated_at, pinned, labels, priority',
      { count: 'exact' }
    ) as any

  // Apply filters
  if (filters.q && filters.q.trim()) {
    queryBuilder = queryBuilder.ilike('name', `%${filters.q.trim()}%`)
  }

  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'active' || filters.status === 'archived') {
      queryBuilder = queryBuilder.eq('status', filters.status)
    }
  }

  if (filters.priority && filters.priority !== 'all') {
    queryBuilder = queryBuilder.eq('priority', filters.priority)
  }

  if (filters.ownerId && filters.ownerId !== 'all') {
    queryBuilder = queryBuilder.eq('owner_id', filters.ownerId)
  }

  if (typeof filters.pinned === 'boolean') {
    queryBuilder = queryBuilder.eq('pinned', filters.pinned)
  }

  // Apply sorting
  if (filters.sort === 'name') {
    queryBuilder = queryBuilder.order('name', { ascending: true })
  } else if (filters.sort === 'due') {
    queryBuilder = queryBuilder.order('due_date', { ascending: true, nullsFirst: true })
  } else {
    queryBuilder = queryBuilder.order('updated_at', { ascending: false })
  }

  // Apply pagination
  queryBuilder = queryBuilder.range(from, to)

  const { data, error, count } = await queryBuilder

  if (error) throw error

  // Map the data with proper type handling
  const items: Project[] = (data || []).map((row: any) => {
    const ownerName = null as string | null
    return {
      id: row.id,
      name: row.name,
      status: row.status as Project['status'],
      owner: {
        id: row.owner_id || '',
        initials: toInitials(ownerName || row.name),
        name: ownerName || 'Onbekend',
      },
      dueDate: row.due_date ? new Date(row.due_date).toISOString() : undefined,
      health: 'good' as const,
      openTasks: 0,
      overdueTasks: 0,
      favorite: !!row.pinned,
      updatedAt: row.updated_at || new Date().toISOString(),
    }
  })

  return {
    items,
    page: filters.page,
    pageSize: filters.pageSize,
    total: count || items.length,
  }
}

export async function getProjectStats(): Promise<ProjectStats> {
  // Compute minimal real stats to avoid mocks
  const { data: activeRows, error: activeErr, count } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')

  if (activeErr) throw activeErr

  // Other stats require dedicated fields we do not store yet
  return {
    active: count || 0,
    onHold: 0,
    completed: 0,
    risk: 0,
  }
}
